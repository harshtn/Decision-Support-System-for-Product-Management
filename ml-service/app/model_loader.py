import json
from pathlib import Path

from .config import MODELS_DIR
from .preprocess import normalize_text


LABEL_MAP = {0: "negative", 1: "neutral", 2: "positive"}


class ModelRegistry:
    def __init__(self) -> None:
        self.tfidf_model = None
        self.bert_model = None
        self.bert_tokenizer = None
        self.bert_device = "cpu"
        self._label_map = LABEL_MAP
        self._torch = None

    @staticmethod
    def _lexicon_predict(text: str) -> tuple[str, float]:
        positive_words = {
            "good", "great", "excellent", "amazing", "awesome", "smooth", "best", "value", "nice", "love",
            "fast", "clear", "sharp", "premium", "stable", "super"
        }
        negative_words = {
            "bad", "worst", "poor", "lag", "laggy", "slow", "heat", "overheat", "problem", "issue",
            "broken", "waste", "drain", "weak", "bug", "stutter", "awful"
        }
        tokens = set(normalize_text(text).split())
        pos = len(tokens & positive_words)
        neg = len(tokens & negative_words)
        if pos > neg:
            return "positive", min(0.55 + (pos - neg) * 0.08, 0.95)
        if neg > pos:
            return "negative", min(0.55 + (neg - pos) * 0.08, 0.95)
        return "neutral", 0.6

    def load_tfidf(self) -> None:
        try:
            import joblib  # type: ignore
        except Exception:
            return
        path = MODELS_DIR / "tfidf_lr.joblib"
        if self.tfidf_model is None and path.exists():
            self.tfidf_model = joblib.load(path)

    def load_bert(self) -> None:
        try:
            import torch  # type: ignore
            from transformers import AutoModelForSequenceClassification, AutoTokenizer  # type: ignore
        except Exception:
            return

        model_dir = MODELS_DIR / "bert"
        if self.bert_model is None and model_dir.exists():
            self._torch = torch
            self.bert_device = "cuda" if torch.cuda.is_available() else "cpu"
            self.bert_tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
            self.bert_model = AutoModelForSequenceClassification.from_pretrained(str(model_dir))
            self.bert_model.to(self.bert_device)
            self.bert_model.eval()

    def load_label_map(self) -> None:
        map_path = MODELS_DIR / "label_map.json"
        if map_path.exists():
            with open(map_path, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            self._label_map = {int(k): v for k, v in data.items()}

    def predict_tfidf(self, text: str) -> tuple[str, float]:
        self.load_label_map()
        self.load_tfidf()
        if self.tfidf_model is None:
            return self._lexicon_predict(text)
        processed = normalize_text(text)
        probs = self.tfidf_model.predict_proba([processed])[0]
        cls_idx = int(probs.argmax())
        return self._label_map[cls_idx], float(probs[cls_idx])

    def predict_bert(self, text: str) -> tuple[str, float]:
        self.load_label_map()
        self.load_bert()
        if self.bert_model is None or self.bert_tokenizer is None or self._torch is None:
            return self.predict_tfidf(text)
        inputs = self.bert_tokenizer(
            text,
            truncation=True,
            padding=True,
            max_length=256,
            return_tensors="pt",
        )
        inputs = {k: v.to(self.bert_device) for k, v in inputs.items()}
        with self._torch.no_grad():
            logits = self.bert_model(**inputs).logits
            probs = self._torch.softmax(logits, dim=-1).squeeze(0)
        cls_idx = int(self._torch.argmax(probs).item())
        confidence = float(probs[cls_idx].item())
        return self._label_map[cls_idx], confidence


registry = ModelRegistry()
