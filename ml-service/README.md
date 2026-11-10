# ML Service (FastAPI + Classical ML + BERT)

## Setup

```bash
cd ml-service
python -m venv .venv
# Windows
.\.venv\Scripts\activate
pip install -r requirements.txt
```

For full training (TF-IDF and BERT) in Colab or Python 3.10-3.12, use:

```bash
pip install -r requirements-train-colab.txt
```

## Data Engineering

```bash
python -m scripts.data_engineering
```

## Train TF-IDF + Logistic Regression

```bash
python -m scripts.train_tfidf_lr
```

## Fine-tune BERT (Colab/GPU ready)

```bash
python -m scripts.train_bert
```

## Compare Models + Generate Visuals

```bash
python -m scripts.evaluate_models
python -m scripts.visualize
```

## Run API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health`
- `POST /predict`
- `POST /batch-predict`
