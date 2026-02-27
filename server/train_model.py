"""
Train and evaluate IDS models with stronger production methodology.

Implemented upgrades:
1) Train/validation/test split with no test leakage.
2) Imbalance-aware sample weighting.
3) Optional benchmark against baseline models.
4) Probability calibration for trustworthy thresholds.
5) Engineered features persisted to feature_columns.json.
6) Drift baseline artifact export.
7) Model metadata/version artifact export.
8) Cross-validation on macro-F1.
"""

from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.utils.class_weight import compute_class_weight
from xgboost import XGBClassifier

# --- CONFIGURATION ---
DATA_FILE = "large_simulation_log.csv"
FEATURE_FILE = "feature_columns.json"
MODEL_FILE = "multiclass_xgboost_ids.joblib"
EXPLAIN_MODEL_FILE = "xgboost_explainer.joblib"
LABEL_ENCODER_FILE = "label_encoder.joblib"
SCALER_FILE = "scaler.joblib"
MODEL_METADATA_FILE = "model_metadata.json"
FEATURE_BASELINE_FILE = "feature_baseline.json"
BENCHMARK_FILE = "model_benchmark.json"


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add deterministic engineered features available in both train and inference."""
    out = df.copy()
    eps = 1e-6

    if "Flow Bytes/s" in out.columns and "Flow Packets/s" in out.columns:
        out["feat_bytes_per_packet"] = out["Flow Bytes/s"] / (out["Flow Packets/s"] + eps)
    else:
        out["feat_bytes_per_packet"] = 0.0

    if "Fwd Packets/s" in out.columns and "Bwd Packets/s" in out.columns:
        out["feat_fwd_bwd_rate_ratio"] = out["Fwd Packets/s"] / (out["Bwd Packets/s"] + eps)
    else:
        out["feat_fwd_bwd_rate_ratio"] = 0.0

    if "Flow IAT Max" in out.columns and "Flow IAT Min" in out.columns:
        out["feat_flow_iat_range"] = out["Flow IAT Max"] - out["Flow IAT Min"]
    else:
        out["feat_flow_iat_range"] = 0.0

    if "Max Packet Length" in out.columns and "Min Packet Length" in out.columns:
        out["feat_packet_len_range"] = out["Max Packet Length"] - out["Min Packet Length"]
    else:
        out["feat_packet_len_range"] = 0.0

    if "Packet Length Mean" in out.columns and "Packet Length Std" in out.columns:
        out["feat_packet_length_cv"] = out["Packet Length Std"] / (out["Packet Length Mean"] + eps)
    else:
        out["feat_packet_length_cv"] = 0.0

    return out


def build_model() -> XGBClassifier:
    return XGBClassifier(
        objective="multi:softprob",
        n_estimators=500,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        gamma=0.1,
        min_child_weight=5,
        eval_metric="mlogloss",
        early_stopping_rounds=30,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )


def train_ids_model() -> None:
    started = time.time()
    print("=" * 72)
    print("STEP 1: Load Dataset")
    print("=" * 72)
    df = pd.read_csv(DATA_FILE)
    df.columns = df.columns.str.strip()
    with open(FEATURE_FILE, "r", encoding="utf-8") as f:
        base_features = json.load(f)

    df = add_engineered_features(df)
    engineered_features = [c for c in df.columns if c.startswith("feat_")]
    feature_columns = base_features + engineered_features

    X = df[feature_columns].copy()
    y = df["Attack Type"].copy()
    X = X.replace([np.inf, -np.inf], np.nan).fillna(X.median(numeric_only=True)).fillna(0.0)
    print(f"Dataset: {len(X)} rows | Features: {len(feature_columns)}")
    print(f"Engineered features: {engineered_features}")

    print("=" * 72)
    print("STEP 2: Encode Labels + Split")
    print("=" * 72)
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_full, y_train_full, test_size=0.2, random_state=42, stratify=y_train_full
    )

    print(f"Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
    print(f"Classes: {list(le.classes_)}")

    print("=" * 72)
    print("STEP 3: Imbalance-Aware Weights + Scaling")
    print("=" * 72)
    scaler = StandardScaler()
    X_train_s = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_columns)
    X_val_s = pd.DataFrame(scaler.transform(X_val), columns=feature_columns)
    X_test_s = pd.DataFrame(scaler.transform(X_test), columns=feature_columns)

    class_weights = compute_class_weight(
        class_weight="balanced", classes=np.unique(y_train), y=y_train
    )
    weight_map = {cls: w for cls, w in zip(np.unique(y_train), class_weights)}
    sample_weight = np.array([weight_map[label] for label in y_train])

    print("Class weights:", {int(k): round(float(v), 3) for k, v in weight_map.items()})

    print("=" * 72)
    print("STEP 4: Train XGBoost + Calibrate Probabilities")
    print("=" * 72)
    base_model = build_model()
    base_model.fit(
        X_train_s,
        y_train,
        sample_weight=sample_weight,
        eval_set=[(X_val_s, y_val)],
        verbose=False,
    )
    best_trees = (base_model.best_iteration + 1) if base_model.best_iteration is not None else 500
    print(f"Best trees from early stopping: {best_trees}")

    calibrator = CalibratedClassifierCV(base_model, method="sigmoid", cv="prefit")
    calibrator.fit(X_val_s, y_val)

    print("=" * 72)
    print("STEP 5: Evaluate Test Set")
    print("=" * 72)
    y_pred = calibrator.predict(X_test_s)
    y_prob = calibrator.predict_proba(X_test_s)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")
    accuracy = float((y_pred == y_test).mean())

    print(classification_report(y_test, y_pred, target_names=le.classes_))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print(f"Accuracy: {accuracy:.4f} | Macro-F1: {macro_f1:.4f} | Weighted-F1: {weighted_f1:.4f}")
    print(f"Avg confidence: {np.max(y_prob, axis=1).mean():.4f}")

    print("=" * 72)
    print("STEP 6: CV (Macro-F1)")
    print("=" * 72)
    cv_pipe = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "model",
                XGBClassifier(
                    objective="multi:softprob",
                    n_estimators=best_trees,
                    max_depth=8,
                    learning_rate=0.05,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    reg_alpha=0.1,
                    reg_lambda=1.0,
                    gamma=0.1,
                    min_child_weight=5,
                    eval_metric="mlogloss",
                    random_state=42,
                    n_jobs=-1,
                    verbosity=0,
                ),
            ),
        ]
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(cv_pipe, X, y_encoded, cv=cv, scoring="f1_macro")
    print("Folds:", [f"{s:.4f}" for s in cv_scores])
    print(f"Mean macro-F1: {cv_scores.mean():.4f} +- {cv_scores.std():.4f}")

    print("=" * 72)
    print("STEP 7: Benchmark Baselines")
    print("=" * 72)
    rf_pipe = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("model", RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1, class_weight="balanced")),
        ]
    )
    lr_pipe = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=800, n_jobs=-1, class_weight="balanced")),
        ]
    )

    rf_pipe.fit(X_train, y_train)
    lr_pipe.fit(X_train, y_train)
    rf_f1 = f1_score(y_test, rf_pipe.predict(X_test), average="macro")
    lr_f1 = f1_score(y_test, lr_pipe.predict(X_test), average="macro")
    benchmark = {
        "xgboost_calibrated_macro_f1": round(float(macro_f1), 6),
        "random_forest_macro_f1": round(float(rf_f1), 6),
        "logistic_regression_macro_f1": round(float(lr_f1), 6),
    }
    print("Benchmark:", benchmark)

    print("=" * 72)
    print("STEP 8: Export Artifacts (Model, Baseline, Metadata)")
    print("=" * 72)
    with open(FEATURE_FILE, "w", encoding="utf-8") as f:
        json.dump(feature_columns, f, indent=2)
    joblib.dump(calibrator, MODEL_FILE)
    joblib.dump(base_model, EXPLAIN_MODEL_FILE)
    joblib.dump(le, LABEL_ENCODER_FILE)
    joblib.dump(scaler, SCALER_FILE)

    feature_baseline = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "features": feature_columns,
        "mean": {c: float(X[c].mean()) for c in feature_columns},
        "std": {c: float(X[c].std(ddof=0) + 1e-9) for c in feature_columns},
    }
    with open(FEATURE_BASELINE_FILE, "w", encoding="utf-8") as f:
        json.dump(feature_baseline, f, indent=2)

    feature_hash = hashlib.sha256(json.dumps(feature_columns, sort_keys=True).encode("utf-8")).hexdigest()[:16]
    model_metadata = {
        "version": f"ids-xgb-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "data_file": DATA_FILE,
        "num_samples": int(len(X)),
        "num_features": int(len(feature_columns)),
        "feature_hash": feature_hash,
        "classes": list(le.classes_),
        "metrics": {
            "accuracy": round(accuracy, 6),
            "macro_f1": round(float(macro_f1), 6),
            "weighted_f1": round(float(weighted_f1), 6),
            "cv_macro_f1_mean": round(float(cv_scores.mean()), 6),
            "cv_macro_f1_std": round(float(cv_scores.std()), 6),
        },
        "benchmark": benchmark,
        "best_trees": int(best_trees),
        "engineered_features": engineered_features,
    }
    with open(MODEL_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    with open(BENCHMARK_FILE, "w", encoding="utf-8") as f:
        json.dump(benchmark, f, indent=2)

    print(f"Saved: {MODEL_FILE}")
    print(f"Saved: {EXPLAIN_MODEL_FILE}")
    print(f"Saved: {SCALER_FILE}")
    print(f"Saved: {LABEL_ENCODER_FILE}")
    print(f"Saved: {FEATURE_FILE}")
    print(f"Saved: {FEATURE_BASELINE_FILE}")
    print(f"Saved: {MODEL_METADATA_FILE}")
    print(f"Saved: {BENCHMARK_FILE}")

    elapsed = time.time() - started
    print("=" * 72)
    print(f"TRAINING COMPLETE in {elapsed:.1f}s")
    print("=" * 72)


if __name__ == "__main__":
    train_ids_model()
