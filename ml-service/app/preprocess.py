import re
from typing import Iterable, List

STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "to", "is", "it", "this", "that",
    "for", "on", "with", "was", "are", "be", "as", "at", "by", "from", "i", "you",
    "we", "they", "he", "she", "my", "our", "your", "their", "very", "so", "but",
}


def normalize_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    cleaned = text.lower().strip()
    cleaned = re.sub(r"http\S+", " ", cleaned)
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    tokens = [tok for tok in cleaned.split() if tok not in STOPWORDS and len(tok) > 1]
    return " ".join(tokens)


def normalize_batch(texts: Iterable[str]) -> List[str]:
    return [normalize_text(t) for t in texts]
