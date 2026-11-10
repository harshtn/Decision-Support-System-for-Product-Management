from fastapi import FastAPI, HTTPException

from .model_loader import registry
from .schemas import BatchPredictRequest, PredictRequest, PredictResponse

app = FastAPI(title="DSS Sentiment ML Service", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    try:
        if payload.model_type == "bert":
            sentiment, confidence = registry.predict_bert(payload.text)
        else:
            sentiment, confidence = registry.predict_tfidf(payload.text)
        return PredictResponse(sentiment=sentiment, confidence=confidence, model_type=payload.model_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/batch-predict")
def batch_predict(payload: BatchPredictRequest) -> dict:
    outputs = []
    for text in payload.texts:
        if payload.model_type == "bert":
            sentiment, confidence = registry.predict_bert(text)
        else:
            sentiment, confidence = registry.predict_tfidf(text)
        outputs.append({"text": text, "sentiment": sentiment, "confidence": confidence})
    return {"model_type": payload.model_type, "predictions": outputs}
