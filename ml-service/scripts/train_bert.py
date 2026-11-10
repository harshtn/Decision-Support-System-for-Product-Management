from __future__ import annotations

import json

import numpy as np
import pandas as pd
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)

from app.config import MODELS_DIR, PROCESSED_REVIEWS_CSV

MODEL_NAME = "distilbert-base-uncased"


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)

    accuracy = float((preds == labels).mean())
    tp = np.sum((preds == labels) & (labels == 2))
    fp = np.sum((preds == 2) & (labels != 2))
    fn = np.sum((preds != 2) & (labels == 2))
    precision = float(tp / (tp + fp + 1e-9))
    recall = float(tp / (tp + fn + 1e-9))
    f1 = float(2 * precision * recall / (precision + recall + 1e-9))

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def train_bert() -> dict:
    df = pd.read_csv(PROCESSED_REVIEWS_CSV)
    df = df[df["sentiment_label"].isin(["negative", "neutral", "positive"])].copy()

    encoder = LabelEncoder()
    df["label"] = encoder.fit_transform(df["sentiment_label"])

    train_df, test_df = train_test_split(df[["clean_text", "label"]], test_size=0.2, random_state=42, stratify=df["label"])

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    train_ds = Dataset.from_pandas(train_df.rename(columns={"clean_text": "text"}))
    test_ds = Dataset.from_pandas(test_df.rename(columns={"clean_text": "text"}))

    def tokenize_batch(batch):
        return tokenizer(batch["text"], truncation=True, max_length=256)

    train_ds = train_ds.map(tokenize_batch, batched=True)
    test_ds = test_ds.map(tokenize_batch, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3)

    args = TrainingArguments(
        output_dir=str(MODELS_DIR / "bert-runs"),
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        num_train_epochs=2,
        weight_decay=0.01,
        load_best_model_at_end=True,
        logging_steps=50,
        fp16=False,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=test_ds,
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        compute_metrics=compute_metrics,
    )

    trainer.train()
    eval_result = trainer.evaluate()

    bert_dir = MODELS_DIR / "bert"
    trainer.save_model(str(bert_dir))
    tokenizer.save_pretrained(str(bert_dir))

    metrics = {
        "model": "bert",
        "accuracy": float(eval_result.get("eval_accuracy", 0.0)),
        "precision": float(eval_result.get("eval_precision", 0.0)),
        "recall": float(eval_result.get("eval_recall", 0.0)),
        "f1": float(eval_result.get("eval_f1", 0.0)),
    }

    with open(MODELS_DIR / "bert_metrics.json", "w", encoding="utf-8") as fp:
        json.dump(metrics, fp, indent=2)

    label_map = {int(i): label for i, label in enumerate(encoder.classes_)}
    with open(MODELS_DIR / "label_map.json", "w", encoding="utf-8") as fp:
        json.dump(label_map, fp, indent=2)

    print("BERT fine-tuning complete.")
    print(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    train_bert()
