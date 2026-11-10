from __future__ import annotations

import json

import pandas as pd

from app.config import MODELS_DIR, ROOT_DIR


def load_metrics(path):
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as fp:
        return json.load(fp)


def evaluate_models() -> pd.DataFrame:
    tfidf = load_metrics(MODELS_DIR / "tfidf_metrics.json")
    bert = load_metrics(MODELS_DIR / "bert_metrics.json")

    if tfidf is None and bert is None:
        raise FileNotFoundError("No metrics files found. Run training first.")

    rows = []
    for entry in [tfidf, bert]:
        if entry is None:
            continue
        rows.append(
            {
                "model": entry["model"],
                "accuracy": entry["accuracy"],
                "precision": entry["precision"],
                "recall": entry["recall"],
                "f1": entry["f1"],
            }
        )

    df = pd.DataFrame(rows)
    out_csv = ROOT_DIR / "data" / "model_comparison.csv"
    out_json = MODELS_DIR / "model_comparison.json"
    df.to_csv(out_csv, index=False)
    out_json.write_text(df.to_json(orient="records", indent=2), encoding="utf-8")

    print(df)
    print(f"Saved comparison to: {out_csv}")
    return df


if __name__ == "__main__":
    evaluate_models()
