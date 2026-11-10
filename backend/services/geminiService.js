const { GoogleGenerativeAI } = require('@google/generative-ai');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenerativeAI(apiKey);
}

function normalizeLabel(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value.includes('pos')) return 'positive';
  if (value.includes('neg')) return 'negative';
  return 'neutral';
}

function clampConfidence(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0.5;
  return Math.max(0, Math.min(1, parsed));
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = String(text).trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

async function analyzeReviewSentiment(reviewText) {
  const text = String(reviewText || '').trim();
  if (!text) {
    throw new Error('Review text is required for sentiment analysis.');
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const prompt = [
    'Classify the sentiment of this review as Positive, Negative, or Neutral. Also give a confidence score.',
    'Return ONLY JSON in this exact format:',
    '{"sentiment":"Positive|Negative|Neutral","confidence":0.0,"reason":"short explanation"}',
    `Review: ${text}`
  ].join('\n');

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const raw = response.text();
  const parsed = extractJson(raw) || {};

  return {
    label: normalizeLabel(parsed.sentiment),
    confidence: clampConfidence(parsed.confidence),
    reason: String(parsed.reason || '').trim()
  };
}

function compactProductForPrompt(product = {}) {
  return {
    name: product.productTitle || `${product.brand || ''} ${product.model || ''}`.trim(),
    brand: product.brand || null,
    model: product.model || null,
    price: product.price ?? null,
    releaseYear: product.releaseYear ?? null,
    operatingSystem: product.operatingSystem || null,
    screenSize: product.screenSize ?? null,
    specs: {
      ram: product?.rawSpecs?.ram ?? null,
      storage: product?.rawSpecs?.storage ?? null,
      batteryCapacity: product?.rawSpecs?.batteryCapacity ?? null,
      cameraMp: product?.rawSpecs?.cameraMp ?? null,
      frontCameraMp: product?.rawSpecs?.frontCameraMp ?? null,
      refreshRate: product?.rawSpecs?.refreshRate ?? null,
      chipset: product?.rawSpecs?.chipset || null,
      fastCharging: product?.rawSpecs?.fastCharging ?? null
    }
  };
}

async function compareProductsWithAI(leftProduct, rightProduct) {
  if (!leftProduct || !rightProduct) {
    throw new Error('Two products are required for AI comparison.');
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const left = compactProductForPrompt(leftProduct);
  const right = compactProductForPrompt(rightProduct);

  const prompt = [
    'You are a smartphone product analyst. Compare two smartphones and return ONLY JSON.',
    'Use this exact format:',
    '{"summary":"...","winner":"left|right|tie","bestFor":"...","leftStrengths":["..."],"rightStrengths":["..."],"tradeoffs":["..."]}',
    'Comparison goal: help users choose based on specs and value.',
    `Left product: ${JSON.stringify(left)}`,
    `Right product: ${JSON.stringify(right)}`
  ].join('\n');

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const raw = response.text();
  const parsed = extractJson(raw) || {};

  return {
    summary: String(parsed.summary || '').trim(),
    winner: ['left', 'right', 'tie'].includes(String(parsed.winner || '').toLowerCase())
      ? String(parsed.winner).toLowerCase()
      : 'tie',
    bestFor: String(parsed.bestFor || '').trim(),
    leftStrengths: Array.isArray(parsed.leftStrengths) ? parsed.leftStrengths.map((v) => String(v)) : [],
    rightStrengths: Array.isArray(parsed.rightStrengths) ? parsed.rightStrengths.map((v) => String(v)) : [],
    tradeoffs: Array.isArray(parsed.tradeoffs) ? parsed.tradeoffs.map((v) => String(v)) : []
  };
}

module.exports = {
  analyzeReviewSentiment,
  compareProductsWithAI
};