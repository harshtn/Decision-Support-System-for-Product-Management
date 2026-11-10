from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    text: str = Field(min_length=2)
    model_type: str = Field(default="tfidf", pattern="^(tfidf|bert)$")


class PredictResponse(BaseModel):
    sentiment: str
    confidence: float
    model_type: str


class BatchPredictRequest(BaseModel):
    texts: list[str] = Field(min_length=1)
    model_type: str = Field(default="tfidf", pattern="^(tfidf|bert)$")
