from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

from app.config import MODELS_DIR, PROCESSED_REVIEWS_CSV


def train_tfidf_lr() -> dict:
    df = pd.read_csv(PROCESSED_REVIEWS_CSV)
    df = df[df["sentiment_label"].isin(["negative", "neutral", "positive"])].copy()

    X_train, X_test, y_train_raw, y_test_raw = train_test_split(
        df["clean_text"],
        df["sentiment_label"],
        test_size=0.2,
        random_state=42,
        stratify=df["sentiment_label"],
    )

    encoder = LabelEncoder()
    y_train = encoder.fit_transform(y_train_raw)
    y_test = encoder.transform(y_test_raw)

    pipeline = Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=45000, min_df=2)),
            ("clf", LogisticRegression(max_iter=200, class_weight="balanced")),
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    metrics = {
        "model": "tfidf_lr",
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "report": classification_report(y_test, y_pred, output_dict=True),
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODELS_DIR / "tfidf_lr.joblib")

    label_map = {int(i): label for i, label in enumerate(encoder.classes_)}
    with open(MODELS_DIR / "label_map.json", "w", encoding="utf-8") as fp:
        json.dump(label_map, fp, indent=2)

    with open(MODELS_DIR / "tfidf_metrics.json", "w", encoding="utf-8") as fp:
        json.dump(metrics, fp, indent=2)

    print("TF-IDF + Logistic Regression training completed.")
    print(json.dumps(metrics, indent=2)[:2000])
    return metrics


if __name__ == "__main__":
    train_tfidf_lr()
