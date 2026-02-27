"""
Backtest auto-block thresholds on offline data using the trained calibrated model.

Usage:
    cd server
    python backtest_thresholds.py
"""

import json

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score

DATA_FILE = "large_simulation_log.csv"
FEATURE_FILE = "feature_columns.json"
MODEL_FILE = "multiclass_xgboost_ids.joblib"
LABEL_ENCODER_FILE = "label_encoder.joblib"
SCALER_FILE = "scaler.joblib"


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    eps = 1e-6
    out = df.copy()
    out["feat_bytes_per_packet"] = out.get("Flow Bytes/s", 0.0) / (out.get("Flow Packets/s", 0.0) + eps)
    out["feat_fwd_bwd_rate_ratio"] = out.get("Fwd Packets/s", 0.0) / (out.get("Bwd Packets/s", 0.0) + eps)
    out["feat_flow_iat_range"] = out.get("Flow IAT Max", 0.0) - out.get("Flow IAT Min", 0.0)
    out["feat_packet_len_range"] = out.get("Max Packet Length", 0.0) - out.get("Min Packet Length", 0.0)
    out["feat_packet_length_cv"] = out.get("Packet Length Std", 0.0) / (out.get("Packet Length Mean", 0.0) + eps)
    return out


def main() -> None:
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    le = joblib.load(LABEL_ENCODER_FILE)
    with open(FEATURE_FILE, "r", encoding="utf-8") as f:
        feature_columns = json.load(f)

    df = pd.read_csv(DATA_FILE)
    df.columns = df.columns.str.strip()
    df = add_engineered_features(df)
    X = df[feature_columns].replace([np.inf, -np.inf], np.nan).fillna(0.0)
    y_text = df["Attack Type"].astype(str).values
    y_true = (y_text != "Normal Traffic").astype(int)

    Xs = pd.DataFrame(scaler.transform(X), columns=feature_columns)
    probs = model.predict_proba(Xs)
    pred_idx = np.argmax(probs, axis=1)
    pred_conf = np.max(probs, axis=1)
    pred_text = le.inverse_transform(pred_idx)
    is_threat_pred = (pred_text != "Normal Traffic").astype(int)

    print("Threshold backtest (auto-block only on threat predictions)")
    print("-" * 78)
    print(f"{'thr':>5} | {'block_rate':>10} | {'precision':>9} | {'recall':>7} | {'f1':>7}")
    print("-" * 78)
    for thr in np.arange(0.60, 1.00, 0.05):
        auto_block = ((is_threat_pred == 1) & (pred_conf >= thr)).astype(int)
        block_rate = float(auto_block.mean())
        p = precision_score(y_true, auto_block, zero_division=0)
        r = recall_score(y_true, auto_block, zero_division=0)
        f1 = f1_score(y_true, auto_block, zero_division=0)
        print(f"{thr:>5.2f} | {block_rate:>10.4f} | {p:>9.4f} | {r:>7.4f} | {f1:>7.4f}")


if __name__ == "__main__":
    main()
