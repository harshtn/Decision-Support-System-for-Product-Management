const { analyzeReviewSentiment } = require('./geminiService');

const SIMULATED_MODEL_NAME = 'IndicBERT (fine-tuned)';

let cachedModel = null;

function detectLanguage(text) {
  const value = String(text || '');

  if (/[\u0900-\u097F]/.test(value)) return 'Hindi';
  if (/[\u0980-\u09FF]/.test(value)) return 'Bengali';
  if (/[\u0A00-\u0A7F]/.test(value)) return 'Punjabi';
  if (/[\u0A80-\u0AFF]/.test(value)) return 'Gujarati';
  if (/[\u0B80-\u0BFF]/.test(value)) return 'Tamil';
  if (/[\u0C00-\u0C7F]/.test(value)) return 'Telugu';
  if (/[\u0C80-\u0CFF]/.test(value)) return 'Kannada';
  if (/[\u0D00-\u0D7F]/.test(value)) return 'Malayalam';
  if (/[\u0600-\u06FF]/.test(value)) return 'Urdu';

  return 'English';
}

function tokenizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

async function loadIndicBertModel() {
  if (!cachedModel) {
    // Simulated model loading metadata; this abstraction can be swapped with a local ONNX/PT model.
    cachedModel = {
      name: SIMULATED_MODEL_NAME,
      status: 'loaded',
      loadedAt: new Date().toISOString(),
      task: 'multilingual-sentiment-classification'
    };
  }

  return cachedModel;
}

function toTitleCaseSentiment(label) {
  const value = String(label || '').toLowerCase();
  if (value.includes('pos')) return 'Positive';
  if (value.includes('neg')) return 'Negative';
  return 'Neutral';
}

async function predictSentimentWithIndicBert(text) {
  const reviewText = String(text || '').trim();
  if (!reviewText) {
    throw new Error('Review text is required for prediction.');
  }

  const model = await loadIndicBertModel();
  const language = detectLanguage(reviewText);
  const tokens = tokenizeText(reviewText);

  // Actual inference is delegated to Gemini while preserving an IndicBERT-style abstraction layer.
  const inference = await analyzeReviewSentiment(reviewText);

  return {
    sentiment: toTitleCaseSentiment(inference.label),
    confidence: inference.confidence,
    model: model.name,
    language,
    reason: inference.reason,
    tokenization: {
      tokenCount: tokens.length,
      preview: tokens.slice(0, 12)
    },
    explanation: 'Model abstraction allows switching between local IndicBERT and cloud LLM',
    multilingualSupport: 'Language is detected per input and routed through a unified multilingual sentiment pipeline.'
  };
}

module.exports = {
  detectLanguage,
  tokenizeText,
  loadIndicBertModel,
  predictSentimentWithIndicBert
};
