"""
Convert analyst feedback rows to a trainable tabular dataset.

Input:
  training_feedback.csv (created by resolve endpoint)

Output:
  feedback_training_rows.csv
"""

import json
import os
import pandas as pd

FEEDBACK_FILE = "training_feedback.csv"
OUT_FILE = "feedback_training_rows.csv"


def main() -> None:
    if not os.path.exists(FEEDBACK_FILE):
        print("No feedback file found.")
        return

    df = pd.read_csv(FEEDBACK_FILE)
    if "feature_snapshot" not in df.columns:
        print("Feedback file missing feature_snapshot column.")
        return

    records = []
    for _, row in df.iterrows():
        try:
            snap = json.loads(row["feature_snapshot"]) if isinstance(row["feature_snapshot"], str) else {}
        except Exception:
            continue
        snap["Attack Type"] = row.get("corrected_type", row.get("predicted_type", "Normal Traffic"))
        snap["model_version"] = row.get("model_version", "unknown")
        records.append(snap)

    if not records:
        print("No valid feedback snapshots to export.")
        return

    out = pd.DataFrame(records)
    out.to_csv(OUT_FILE, index=False)
    print(f"Saved {len(out)} feedback rows to {OUT_FILE}")


if __name__ == "__main__":
    main()
