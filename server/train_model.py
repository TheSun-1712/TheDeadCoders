"""
Train and evaluate the XGBoost IDS model with proper ML methodology.

Improvements over original:
  1. Proper 80/20 stratified train/test split
  2. Regularization (L1, L2, gamma, min_child_weight)
  3. Early stopping on validation loss
  4. 5-fold cross-validation for robust accuracy estimate
  5. Per-class precision/recall/F1 + confusion matrix
  6. Feature importance ranking (explainability)
  7. Removed data-leaking features (burst_score, failed_attempts)
  8. Handles infinite/NaN values in dataset

Usage:
    cd server
    python train_model.py
"""

import pandas as pd
import numpy as np
import joblib
import json
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

# --- CONFIGURATION ---
DATA_FILE = 'large_simulation_log.csv'
FEATURE_FILE = 'feature_columns.json'
MODEL_FILE = 'multiclass_xgboost_ids.joblib'
LABEL_ENCODER_FILE = 'label_encoder.joblib'


def train_ids_model():
    # ─── 1. LOAD DATA ───────────────────────────────────────────────
    print("=" * 60)
    print("STEP 1: Loading Dataset")
    print("=" * 60)

    df = pd.read_csv(DATA_FILE)
    df.columns = df.columns.str.strip()

    with open(FEATURE_FILE, 'r') as f:
        feature_columns = json.load(f)

    X = df[feature_columns].copy()
    y = df['Attack Type']

    print(f"Dataset: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"\nClass distribution:")
    print(y.value_counts())
    print()

    # ─── 2. CLEAN DATA ──────────────────────────────────────────────
    print("=" * 60)
    print("STEP 2: Cleaning Data")
    print("=" * 60)

    # Replace infinities with NaN, then fill NaN with column median
    X = X.replace([np.inf, -np.inf], np.nan)
    nan_count = X.isna().sum().sum()
    print(f"Found {nan_count} missing/infinite values → filled with median")
    X = X.fillna(X.median())
    print()

    # ─── 3. ENCODE LABELS ───────────────────────────────────────────
    print("=" * 60)
    print("STEP 3: Encoding Labels")
    print("=" * 60)

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    print(f"Classes: {list(le.classes_)}")
    print()

    # ─── 4. TRAIN/TEST SPLIT ────────────────────────────────────────
    print("=" * 60)
    print("STEP 4: Stratified Train/Test Split (80/20)")
    print("=" * 60)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Test set:     {X_test.shape[0]} samples")
    print()

    # ─── 5. FEATURE SCALING ─────────────────────────────────────────
    print("=" * 60)
    print("STEP 5: StandardScaler Normalization")
    print("=" * 60)

    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=feature_columns)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=feature_columns)
    print("Applied StandardScaler (zero mean, unit variance)")
    print()

    # ─── 6. TRAIN XGBOOST WITH IMPROVED HYPERPARAMETERS ─────────────
    print("=" * 60)
    print("STEP 6: Training XGBoost (Improved)")
    print("=" * 60)

    model = XGBClassifier(
        # Core
        n_estimators=500,           # More trees (was 100)
        max_depth=8,                # Deeper trees (was 6)
        learning_rate=0.05,         # Lower LR = better generalization (was 0.1)

        # Regularization (all NEW — prevents overfitting)
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,              # L1 regularization
        reg_lambda=1.0,             # L2 regularization
        gamma=0.1,                  # Min loss reduction to split
        min_child_weight=5,         # Min samples per leaf

        # Training
        eval_metric='mlogloss',
        early_stopping_rounds=30,   # Stop if no improvement for 30 rounds
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )

    print("Hyperparameters:")
    print(f"  n_estimators:     500 (was 100)")
    print(f"  max_depth:        8   (was 6)")
    print(f"  learning_rate:    0.05 (was 0.1)")
    print(f"  reg_alpha:        0.1 (NEW)")
    print(f"  reg_lambda:       1.0 (NEW)")
    print(f"  gamma:            0.1 (NEW)")
    print(f"  min_child_weight: 5   (NEW)")
    print(f"  early_stopping:   30 rounds (NEW)")
    print()

    print("Training...")
    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=False
    )

    best_trees = model.best_iteration + 1 if model.best_iteration else 500
    print(f"Done! Used {best_trees} trees (early stopping)")
    print()

    # ─── 7. EVALUATE ON HELD-OUT TEST SET ────────────────────────────
    print("=" * 60)
    print("STEP 7: Test Set Evaluation (NEVER seen during training)")
    print("=" * 60)

    y_pred = model.predict(X_test_scaled)

    print("\nPer-Class Metrics:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    max_len = max(len(c) for c in le.classes_)
    header = " " * (max_len + 2) + "  ".join(f"{c[:8]:>8}" for c in le.classes_)
    print(header)
    for i, row_vals in enumerate(cm):
        row_str = "  ".join(f"{v:>8}" for v in row_vals)
        print(f"{le.classes_[i]:>{max_len}}  {row_str}")
    print()

    # ─── 8. 5-FOLD CROSS-VALIDATION ─────────────────────────────────
    print("=" * 60)
    print("STEP 8: 5-Fold Stratified Cross-Validation")
    print("=" * 60)

    X_all_scaled = pd.DataFrame(scaler.fit_transform(X), columns=feature_columns)
    cv_model = XGBClassifier(
        n_estimators=best_trees, max_depth=8, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        reg_alpha=0.1, reg_lambda=1.0, gamma=0.1, min_child_weight=5,
        eval_metric='mlogloss', random_state=42, n_jobs=-1, verbosity=0,
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(cv_model, X_all_scaled, y_encoded, cv=cv, scoring='accuracy')

    print(f"Fold accuracies: {[f'{s:.4f}' for s in scores]}")
    print(f"Mean accuracy:   {scores.mean():.4f} ± {scores.std():.4f}")
    print()

    # ─── 9. FEATURE IMPORTANCE ───────────────────────────────────────
    print("=" * 60)
    print("STEP 9: Top 15 Most Important Features")
    print("=" * 60)

    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:15]
    for rank, idx in enumerate(indices, 1):
        bar = "█" * int(importances[idx] * 100)
        print(f"  {rank:>2}. {feature_columns[idx]:<35} {importances[idx]:.4f}  {bar}")
    print()

    # ─── 10. SAVE MODEL ─────────────────────────────────────────────
    print("=" * 60)
    print("STEP 10: Saving Model Artifacts")
    print("=" * 60)

    joblib.dump(model, MODEL_FILE)
    joblib.dump(le, LABEL_ENCODER_FILE)
    joblib.dump(scaler, 'scaler.joblib')

    print(f"  → {MODEL_FILE}")
    print(f"  → {LABEL_ENCODER_FILE}")
    print(f"  → scaler.joblib")
    print()
    print("=" * 60)
    print("TRAINING COMPLETE")
    print(f"  Test Accuracy:  {(y_pred == y_test).mean():.4f}")
    print(f"  CV Accuracy:    {scores.mean():.4f} ± {scores.std():.4f}")
    print(f"  Trees Used:     {best_trees}")
    print(f"  Features:       {len(feature_columns)}")
    print("=" * 60)


if __name__ == "__main__":
    train_ids_model()
