from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
ML_DIR = ROOT_DIR / "ml-service"
MODELS_DIR = ML_DIR / "models"
REVIEWS_CSV = ROOT_DIR / "reviews_master.csv"
SMARTPHONES_CSV = ROOT_DIR / "smartphones.csv"
PROCESSED_REVIEWS_CSV = ROOT_DIR / "data" / "processed_reviews.csv"
PROCESSED_PRODUCTS_CSV = ROOT_DIR / "data" / "processed_products.csv"
