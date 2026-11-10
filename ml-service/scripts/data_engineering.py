from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.config import PROCESSED_PRODUCTS_CSV, PROCESSED_REVIEWS_CSV, REVIEWS_CSV, SMARTPHONES_CSV
from app.preprocess import normalize_batch


def build_product_map(products_df: pd.DataFrame) -> pd.DataFrame:
    products_df = products_df.copy()
    products_df["model"] = products_df["model"].astype(str).str.strip()
    products_df["brand_name"] = products_df["brand_name"].astype(str).str.strip()
    products_df["product_key"] = (
        products_df["brand_name"].str.lower().str.strip() + " " + products_df["model"].str.lower().str.strip()
    )
    return products_df


def preprocess_data() -> tuple[Path, Path]:
    reviews = pd.read_csv(REVIEWS_CSV)
    products = pd.read_csv(SMARTPHONES_CSV)

    reviews = reviews.drop_duplicates(subset=["review_id"]).copy()
    products = products.drop_duplicates(subset=["id"]).copy()

    reviews["review_text"] = reviews["review_text"].fillna("")
    reviews["review_text_clean"] = reviews["review_text_clean"].fillna(reviews["review_text"])
    reviews["rating_numeric"] = pd.to_numeric(reviews["rating_numeric"], errors="coerce")

    valid_labels = {"negative", "neutral", "positive"}
    reviews["sentiment_label"] = reviews["sentiment_label"].str.lower().str.strip()
    reviews.loc[~reviews["sentiment_label"].isin(valid_labels), "sentiment_label"] = "neutral"

    # Infer missing labels from ratings if needed.
    inferred = reviews["rating_numeric"].fillna(3)
    inferred_label = pd.cut(
        inferred,
        bins=[-1, 2.49, 3.49, 5.1],
        labels=["negative", "neutral", "positive"],
    ).astype(str)
    reviews["sentiment_label"] = reviews["sentiment_label"].where(
        reviews["sentiment_label"].isin(valid_labels), inferred_label
    )

    reviews["brand"] = reviews["brand"].fillna("").astype(str).str.strip()
    reviews["model_query"] = reviews["model_query"].fillna("").astype(str).str.strip()
    reviews["product_key"] = reviews["brand"].str.lower() + " " + reviews["model_query"].str.lower()

    products = build_product_map(products)

    merged = reviews.merge(
        products[["id", "brand_name", "model", "price", "release_year", "product_key"]],
        on="product_key",
        how="left",
    )

    merged["product_id"] = merged["id"].fillna(-1).astype(int)
    merged["clean_text"] = normalize_batch(merged["review_text_clean"].tolist())
    merged = merged[merged["clean_text"].str.len() > 2].copy()

    merged.to_csv(PROCESSED_REVIEWS_CSV, index=False)
    products.to_csv(PROCESSED_PRODUCTS_CSV, index=False)

    print(f"Saved processed reviews: {PROCESSED_REVIEWS_CSV}")
    print(f"Saved processed products: {PROCESSED_PRODUCTS_CSV}")
    return PROCESSED_REVIEWS_CSV, PROCESSED_PRODUCTS_CSV


if __name__ == "__main__":
    preprocess_data()
