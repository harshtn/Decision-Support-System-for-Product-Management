from __future__ import annotations

from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix, roc_curve, auc
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, label_binarize

from app.config import MODELS_DIR, PROCESSED_REVIEWS_CSV, ROOT_DIR


def ensure_chart_dir() -> Path:
    chart_dir = ROOT_DIR / "data" / "charts"
    chart_dir.mkdir(parents=True, exist_ok=True)
    return chart_dir


def plot_sentiment_distribution(df: pd.DataFrame, chart_dir: Path) -> None:
    counts = df["sentiment_label"].value_counts().reindex(["negative", "neutral", "positive"]).fillna(0)
    plt.figure(figsize=(8, 5))
    sns.barplot(x=counts.index, y=counts.values, palette=["#ef4444", "#f59e0b", "#10b981"])
    plt.title("Sentiment Distribution")
    plt.xlabel("Sentiment")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(chart_dir / "sentiment_distribution.png", dpi=300)
    plt.close()


def plot_confusion_and_roc(df: pd.DataFrame, chart_dir: Path) -> None:
    pipeline = joblib.load(MODELS_DIR / "tfidf_lr.joblib")
    encoder = LabelEncoder()
    y = encoder.fit_transform(df["sentiment_label"])

    X_train, X_test, y_train, y_test = train_test_split(
        df["clean_text"], y, test_size=0.2, random_state=42, stratify=y
    )

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)

    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=encoder.classes_)
    disp.plot(cmap="Blues", values_format="d")
    plt.title("Confusion Matrix (TF-IDF + LR)")
    plt.tight_layout()
    plt.savefig(chart_dir / "confusion_matrix.png", dpi=300)
    plt.close()

    y_test_bin = label_binarize(y_test, classes=[0, 1, 2])
    plt.figure(figsize=(8, 6))
    for i, label in enumerate(encoder.classes_):
        fpr, tpr, _ = roc_curve(y_test_bin[:, i], y_prob[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f"{label} (AUC={roc_auc:.3f})")

    plt.plot([0, 1], [0, 1], "k--")
    plt.title("ROC Curve (One-vs-Rest)")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.legend()
    plt.tight_layout()
    plt.savefig(chart_dir / "roc_curve.png", dpi=300)
    plt.close()


def plot_model_comparison(chart_dir: Path) -> None:
    comparison_csv = ROOT_DIR / "data" / "model_comparison.csv"
    if not comparison_csv.exists():
        return

    cmp_df = pd.read_csv(comparison_csv)
    metric_cols = ["accuracy", "precision", "recall", "f1"]

    plt.figure(figsize=(10, 6))
    x = np.arange(len(metric_cols))
    width = 0.35

    for idx, row in cmp_df.iterrows():
        plt.bar(x + idx * width, [row[m] for m in metric_cols], width, label=row["model"])

    plt.xticks(x + width / 2, [m.upper() for m in metric_cols])
    plt.ylim(0, 1)
    plt.ylabel("Score")
    plt.title("Model Comparison")
    plt.legend()
    plt.tight_layout()
    plt.savefig(chart_dir / "model_comparison.png", dpi=300)
    plt.close()


def main() -> None:
    df = pd.read_csv(PROCESSED_REVIEWS_CSV)
    df = df[df["sentiment_label"].isin(["negative", "neutral", "positive"])].copy()
    chart_dir = ensure_chart_dir()
    plot_sentiment_distribution(df, chart_dir)
    plot_confusion_and_roc(df, chart_dir)
    plot_model_comparison(chart_dir)
    print(f"Charts saved to: {chart_dir}")


if __name__ == "__main__":
    main()
