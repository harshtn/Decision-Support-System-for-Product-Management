const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const Product = require('../models/Product');
const Review = require('../models/Review');
const Sentiment = require('../models/Sentiment');
const { compareProductsWithAI } = require('../services/geminiService');
const { loadIndicBertModel, predictSentimentWithIndicBert } = require('../services/indicbert_model');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../uploads') });

const DEFAULT_REVIEWS_CSV = path.resolve(__dirname, '../../reviews_master.csv');
const DEFAULT_PRODUCTS_CSV = path.resolve(__dirname, '../../smartphones.csv');

function modelKey(brand, model) {
  return `${String(brand || '').trim().toLowerCase()} ${String(model || '').trim().toLowerCase()}`.trim();
}

function normalizeLabel(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value.includes('neg')) return 'negative';
  if (value.includes('pos')) return 'positive';
  return 'neutral';
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sentimentToRating(sentiment) {
  if (sentiment === 'positive') return Number(randomBetween(4.0, 5.0).toFixed(1));
  if (sentiment === 'negative') return Number(randomBetween(1.8, 2.9).toFixed(1));
  return Number(randomBetween(3.0, 3.9).toFixed(1));
}

function generateReviewTextFromProduct(product, sentiment) {
  const title = product.productTitle || `${product.brand || ''} ${product.model || ''}`.trim();
  const specs = product.rawSpecs || {};
  const battery = specs.batteryCapacity || 4500;
  const camera = specs.cameraMp || 50;
  const chipset = specs.chipset || 'current chipset';
  const refresh = specs.refreshRate || 120;

  const positive = [
    `${title} feels very smooth with ${refresh}Hz display, and app loading is fast on ${chipset}.`,
    `Battery backup is strong (${battery}mAh) and charging routine has been very reliable for daily use.`,
    `Camera quality around ${camera}MP class performs well in daylight and social media content looks great.`
  ];
  const neutral = [
    `${title} is balanced overall. Performance is fine, though thermals during long sessions are average.`,
    `Display and camera are decent, but low-light results can be inconsistent depending on conditions.`,
    `Battery life is acceptable for one day, but power users may still need a top-up by evening.`
  ];
  const negative = [
    `I noticed frame drops and heat after extended gaming, and software polish still needs improvement.`,
    `Camera in low light is underwhelming and battery drain feels faster than expected for this segment.`,
    `At this price, the overall experience is not fully convincing due to thermal and optimization issues.`
  ];

  if (sentiment === 'positive') return pickRandom(positive);
  if (sentiment === 'negative') return pickRandom(negative);
  return pickRandom(neutral);
}

async function generateSyntheticReviewsForProduct(product, count) {
  const volume = Math.max(1, Math.min(Number(count || 20), 100));
  const users = [
    'Aarav K.', 'Diya P.', 'Rohan M.', 'Sana V.', 'Priyansh T.',
    'Nisha R.', 'Kartik S.', 'Meera G.', 'Kabir D.', 'Anaya J.'
  ];

  const docs = [];
  for (let i = 0; i < volume; i += 1) {
    const sentiment = i % 10 < 6 ? 'positive' : i % 10 < 8 ? 'neutral' : 'negative';
    docs.push({
      productId: product._id,
      smartphoneId: product._id,
      userName: `${pickRandom(users)} ${Date.now().toString().slice(-4)}`,
      reviewText: generateReviewTextFromProduct(product, sentiment),
      rating: sentimentToRating(sentiment),
      sentimentLabel: sentiment,
      metadata: {
        source: 'company-dss-generated',
        reviewCountry: 'IN'
      }
    });
  }

  return Review.insertMany(docs, { ordered: false });
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function extractIssuesFromTexts(texts) {
  const patterns = {
    battery: ['battery', 'drain', 'charging', 'charge', 'backup'],
    camera: ['camera', 'photo', 'picture', 'video', 'selfie'],
    performance: ['lag', 'slow', 'performance', 'heat', 'heating', 'stutter'],
    display: ['display', 'screen', 'brightness', 'refresh'],
    software: ['bug', 'software', 'update', 'ui', 'app crash'],
    price: ['price', 'cost', 'expensive', 'value']
  };

  const counts = Object.fromEntries(Object.keys(patterns).map((k) => [k, 0]));
  for (const rawText of texts) {
    const text = String(rawText || '').toLowerCase();
    for (const [issue, terms] of Object.entries(patterns)) {
      if (terms.some((term) => text.includes(term))) {
        counts[issue] += 1;
      }
    }
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, mentions: count }));
}

function recommendationsFromIssues(topIssues) {
  const recommendationMap = {
    battery: 'Improve battery optimization and charging speed profile in upcoming OTA releases.',
    camera: 'Tune camera pipeline for low-light and stabilization, and refine image processing defaults.',
    performance: 'Optimize thermal throttling and improve memory management for sustained performance.',
    display: 'Enhance outdoor brightness and touch responsiveness through panel calibration.',
    software: 'Prioritize bug-fix release cadence and improve QA coverage for frequent app crash scenarios.',
    price: 'Revisit pricing strategy or add bundled offers to strengthen perceived value for money.'
  };

  return topIssues.map((entry) => ({
    issue: entry.issue,
    recommendation: recommendationMap[entry.issue] || 'Investigate this issue and run focused remediation sprints.'
  }));
}

async function analyzeReviewsWithGemini(reviews, maxCount) {
  const limit = Math.max(0, Math.min(Number(maxCount || 0), reviews.length));
  if (limit === 0) return { analyzed: 0, failed: 0 };

  let analyzed = 0;
  let failed = 0;
  const chunkSize = 4;

  for (let i = 0; i < limit; i += chunkSize) {
    const chunk = reviews.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(async (review) => {
      try {
        const prediction = await predictSentimentWithIndicBert(review.reviewText);
        return {
          ok: true,
          row: {
            reviewId: review._id,
            productId: review.productId,
            modelType: 'gemini',
            label: normalizeLabel(prediction.sentiment),
            confidence: prediction.confidence,
            reason: prediction.reason
          }
        };
      } catch (_) {
        return { ok: false };
      }
    }));

    const successRows = results.filter((r) => r.ok).map((r) => r.row);
    failed += results.length - successRows.length;
    analyzed += successRows.length;

    if (successRows.length) {
      await Sentiment.bulkWrite(
        successRows.map((row) => ({
          updateOne: {
            filter: { reviewId: row.reviewId, modelType: 'gemini' },
            update: { $set: row },
            upsert: true
          }
        })),
        { ordered: false }
      );
    }
  }

  return { analyzed, failed };
}

async function loadChartsData() {
  const sentimentDistribution = await Sentiment.aggregate([
    { $match: { modelType: 'gemini' } },
    { $group: { _id: '$label', count: { $sum: 1 } } },
    { $project: { _id: 0, label: '$_id', count: 1 } }
  ]);

  const productLabelRows = await Sentiment.aggregate([
    { $match: { modelType: 'gemini' } },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: {
          productId: '$productId',
          label: '$label',
          productTitle: '$product.productTitle'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const groupedProduct = new Map();
  for (const row of productLabelRows) {
    const key = String(row._id.productId);
    if (!groupedProduct.has(key)) {
      groupedProduct.set(key, {
        productId: key,
        product: row._id.productTitle || 'Unknown Product',
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0
      });
    }
    const current = groupedProduct.get(key);
    const label = normalizeLabel(row._id.label);
    current[label] += Number(row.count || 0);
    current.total += Number(row.count || 0);
  }

  const productWiseSentiment = Array.from(groupedProduct.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const ratingSentimentRows = await Sentiment.aggregate([
    { $match: { modelType: 'gemini' } },
    {
      $lookup: {
        from: 'reviews',
        localField: 'reviewId',
        foreignField: '_id',
        as: 'review'
      }
    },
    { $unwind: '$review' },
    { $match: { 'review.rating': { $ne: null } } },
    {
      $group: {
        _id: {
          rating: { $round: ['$review.rating', 0] },
          label: '$label'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.rating': 1 } }
  ]);

  const groupedRating = new Map();
  for (const row of ratingSentimentRows) {
    const ratingKey = String(row._id.rating);
    if (!groupedRating.has(ratingKey)) {
      groupedRating.set(ratingKey, {
        rating: Number(row._id.rating),
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0
      });
    }
    const current = groupedRating.get(ratingKey);
    const label = normalizeLabel(row._id.label);
    current[label] += Number(row.count || 0);
    current.total += Number(row.count || 0);
  }

  const ratingVsSentiment = Array.from(groupedRating.values()).sort((a, b) => a.rating - b.rating);

  return {
    sentimentDistribution,
    productWiseSentiment,
    ratingVsSentiment
  };
}

async function computeDssInsights(threshold) {
  const charts = await loadChartsData();

  const negativeAlerts = charts.productWiseSentiment
    .map((item) => ({
      ...item,
      negativeRate: item.total ? item.negative / item.total : 0
    }))
    .filter((item) => item.negativeRate >= threshold)
    .sort((a, b) => b.negativeRate - a.negativeRate)
    .slice(0, 5)
    .map((item) => ({
      productId: item.productId,
      product: item.product,
      negativeRate: Number(item.negativeRate.toFixed(2)),
      negativeCount: item.negative,
      totalReviews: item.total
    }));

  const negativeReviewRows = await Sentiment.aggregate([
    { $match: { modelType: 'gemini', label: 'negative' } },
    {
      $lookup: {
        from: 'reviews',
        localField: 'reviewId',
        foreignField: '_id',
        as: 'review'
      }
    },
    { $unwind: '$review' },
    { $project: { _id: 0, text: '$review.reviewText' } },
    { $limit: 500 }
  ]);

  const topIssues = extractIssuesFromTexts(negativeReviewRows.map((row) => row.text));
  const recommendations = recommendationsFromIssues(topIssues);

  return {
    threshold,
    negativeAlerts,
    topIssues,
    recommendations
  };
}

async function ingestFromCsv({ reviewsPath, productsPath, analyzeLimit }) {
  const [parsedProducts, parsedReviews] = await Promise.all([
    readCsv(productsPath),
    readCsv(reviewsPath)
  ]);

  const productsPayload = parsedProducts.map((row) => ({
    sourceId: Number(row.id),
    brand: row.brand_name,
    model: row.model,
    modelKey: modelKey(row.brand_name, row.model),
    productTitle: `${row.brand_name} ${row.model}`,
    screenSize: toNumber(row.screen_size),
    price: toNumber(row.price),
    releaseYear: toNumber(row.release_year),
    operatingSystem: row.operating_system,
    rawSpecs: {
      ram: toNumber(row.ram),
      storage: toNumber(row.storage),
      batteryCapacity: toNumber(row.battery_capacity),
      cameraMp: toNumber(row.camera_mp),
      frontCameraMp: toNumber(row.front_camera_mp),
      refreshRate: toNumber(row.refresh_rate),
      weight: toNumber(row.weight),
      thickness: toNumber(row.thickness),
      bodyMaterial: row.body_material,
      chipset: row.chipset,
      gpu: row.gpu,
      dualSim: row.dual_sim,
      networkSupport: row.network_support,
      bluetoothVersion: row.bluetooth_version,
      wifiVersion: row.wifi_version,
      usbType: row.usb_type,
      fastCharging: toNumber(row.fast_charging),
      fingerprintSensor: row.fingerprint_sensor
    }
  }));

  await Promise.all([
    Sentiment.deleteMany({}),
    Review.deleteMany({}),
    Product.deleteMany({})
  ]);

  const insertedProducts = await Product.insertMany(productsPayload, { ordered: false });
  const productMap = new Map(insertedProducts.map((p) => [modelKey(p.brand, p.model), p._id]));

  const brandMap = new Map();
  for (const product of insertedProducts) {
    const brand = String(product.brand || '').trim().toLowerCase();
    if (!brandMap.has(brand)) brandMap.set(brand, []);
    brandMap.get(brand).push(product._id);
  }
  const defaultProductId = insertedProducts[0]?._id;

  const reviewPayload = parsedReviews
    .map((row) => {
      const key = modelKey(row.brand, row.model_query);
      const brand = String(row.brand || '').trim().toLowerCase();
      const productId = productMap.get(key) || brandMap.get(brand)?.[0] || defaultProductId;
      return {
        productId,
        smartphoneId: productId,
        userName: row.reviewer,
        reviewText: row.review_text_clean || row.review_text,
        rating: toNumber(row.rating_numeric),
        ratingRaw: row.rating_raw,
        sentimentLabel: normalizeLabel(row.sentiment_label),
        metadata: {
          source: row.source,
          asin: row.asin,
          reviewId: row.review_id,
          verifiedPurchase: String(row.verified_purchase).toLowerCase() === 'true',
          reviewCountry: row.review_country,
          helpfulVotes: row.helpful_votes
        }
      };
    })
    .filter((item) => item.productId && item.reviewText);

  const insertedReviews = await Review.insertMany(reviewPayload, { ordered: false });
  const analysisResult = await analyzeReviewsWithGemini(insertedReviews, analyzeLimit);

  return {
    products: insertedProducts.length,
    reviews: insertedReviews.length,
    analyzed: analysisResult.analyzed,
    failedAnalyses: analysisResult.failed
  };
}

router.get('/products', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { model: { $regex: String(search), $options: 'i' } },
            { brand: { $regex: String(search), $options: 'i' } },
            { productTitle: { $regex: String(search), $options: 'i' } }
          ]
        }
      : {};

    const products = await Product.find(query)
      .sort({ releaseYear: -1, price: 1 })
      .limit(200)
      .lean();

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/compare-products', async (req, res) => {
  try {
    const { leftProductId, rightProductId } = req.body || {};

    if (!leftProductId || !rightProductId) {
      return res.status(400).json({ message: 'leftProductId and rightProductId are required' });
    }

    if (String(leftProductId) === String(rightProductId)) {
      return res.status(400).json({ message: 'Please select two different products for comparison' });
    }

    const [leftProduct, rightProduct] = await Promise.all([
      Product.findById(leftProductId).lean(),
      Product.findById(rightProductId).lean()
    ]);

    if (!leftProduct || !rightProduct) {
      return res.status(404).json({ message: 'One or both selected products were not found' });
    }

    const ai = await compareProductsWithAI(leftProduct, rightProduct);

    res.json({
      leftProduct,
      rightProduct,
      ai
    });
  } catch (error) {
    res.status(500).json({ message: 'AI comparison failed', detail: error.message });
  }
});

router.get('/reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/model/indicbert-info', async (req, res) => {
  try {
    const model = await loadIndicBertModel();
    res.json({
      model: model.name,
      status: model.status,
      task: model.task,
      explanation: 'Model abstraction allows switching between local IndicBERT and cloud LLM',
      multilingualSupport: 'The pipeline detects language and handles multilingual review text before inference.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function handleAnalyzeReview(req, res) {
  try {
    const { reviewId, reviewText, productId, userName = 'anonymous' } = req.body;

    let review;
    if (reviewId) {
      review = await Review.findById(reviewId);
      if (!review) return res.status(404).json({ message: 'Review not found' });
    } else {
      if (!reviewText || !productId) {
        return res.status(400).json({ message: 'reviewText and productId are required when reviewId is not provided' });
      }
      review = await Review.create({
        reviewText,
        productId,
        smartphoneId: productId,
        userName,
        rating: toNumber(req.body.rating)
      });
    }

    const prediction = await predictSentimentWithIndicBert(review.reviewText);

    const sentiment = await Sentiment.findOneAndUpdate(
      { reviewId: review._id, modelType: 'gemini' },
      {
        reviewId: review._id,
        productId: review.productId,
        modelType: 'gemini',
        label: normalizeLabel(prediction.sentiment),
        confidence: prediction.confidence,
        reason: prediction.reason
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      reviewId: review._id,
      productId: review.productId,
      sentiment: prediction.sentiment,
      label: sentiment.label,
      confidence: sentiment.confidence,
      model: prediction.model,
      language: prediction.language,
      reason: sentiment.reason,
      tokenization: prediction.tokenization,
      explanation: prediction.explanation,
      multilingualSupport: prediction.multilingualSupport,
      analyzedAt: sentiment.analyzedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'AI analysis failed', detail: error.message });
  }
}

router.post('/analyze-review', handleAnalyzeReview);

router.post('/analyze', async (req, res) => {
  return handleAnalyzeReview(req, res);
});

router.post('/analyze-product/:productId', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.body.limit || 40), 200));
    const generateReviews = String(req.body.generateReviews ?? 'true').toLowerCase() !== 'false';
    const generateCount = Math.max(1, Math.min(Number(req.body.generateCount || 20), 100));

    let generated = 0;

    if (generateReviews) {
      const product = await Product.findById(req.params.productId).lean();
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const inserted = await generateSyntheticReviewsForProduct(product, generateCount);
      generated = inserted.length;
    }

    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const result = await analyzeReviewsWithGemini(reviews, reviews.length);

    const [
      totalReviews,
      positiveCount,
      neutralCount,
      negativeCount,
      reviewPositive,
      reviewNeutral,
      reviewNegative
    ] = await Promise.all([
      Review.countDocuments({ productId: req.params.productId }),
      Sentiment.countDocuments({ productId: req.params.productId, modelType: 'gemini', label: 'positive' }),
      Sentiment.countDocuments({ productId: req.params.productId, modelType: 'gemini', label: 'neutral' }),
      Sentiment.countDocuments({ productId: req.params.productId, modelType: 'gemini', label: 'negative' }),
      Review.countDocuments({ productId: req.params.productId, sentimentLabel: 'positive' }),
      Review.countDocuments({ productId: req.params.productId, sentimentLabel: 'neutral' }),
      Review.countDocuments({ productId: req.params.productId, sentimentLabel: 'negative' })
    ]);

    const sentimentTotal = Number(positiveCount || 0) + Number(neutralCount || 0) + Number(negativeCount || 0);
    const sentimentSummary = {
      positive: sentimentTotal ? Number(positiveCount || 0) : Number(reviewPositive || 0),
      neutral: sentimentTotal ? Number(neutralCount || 0) : Number(reviewNeutral || 0),
      negative: sentimentTotal ? Number(negativeCount || 0) : Number(reviewNegative || 0)
    };

    res.json({
      productId: req.params.productId,
      generatedReviews: generated,
      totalReviews,
      sentimentSummary,
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/upload', upload.fields([{ name: 'reviews' }, { name: 'products' }]), async (req, res) => {
  const uploadedReviewPath = req.files?.reviews?.[0]?.path;
  const uploadedProductPath = req.files?.products?.[0]?.path;
  const reviewsPath = uploadedReviewPath || DEFAULT_REVIEWS_CSV;
  const productsPath = uploadedProductPath || DEFAULT_PRODUCTS_CSV;
  const analyzeOnUpload = String(req.body?.analyzeOnUpload ?? 'true').toLowerCase() !== 'false';
  const analyzeLimit = analyzeOnUpload
    ? Math.max(1, Math.min(Number(req.body?.analyzeLimit || process.env.GEMINI_ANALYZE_LIMIT || 120), 500))
    : 0;

  const cleanup = () => {
    for (const tempPath of [uploadedReviewPath, uploadedProductPath]) {
      if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  };

  try {
    if (!fs.existsSync(reviewsPath)) {
      return res.status(400).json({ message: 'reviews CSV not found. Upload file or add reviews_master.csv at project root.' });
    }
    if (!fs.existsSync(productsPath)) {
      return res.status(400).json({ message: 'products CSV not found. Upload file or add smartphones.csv at project root.' });
    }

    const ingestion = await ingestFromCsv({ reviewsPath, productsPath, analyzeLimit });
    cleanup();

    res.json({
      message: 'Data ingestion completed successfully',
      source: uploadedReviewPath || uploadedProductPath ? 'uploaded-files' : 'workspace-default-csv',
      ...ingestion
    });
  } catch (error) {
    cleanup();
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics/charts', async (req, res) => {
  try {
    const charts = await loadChartsData();
    res.json(charts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics/overview', async (req, res) => {
  try {
    const [productCount, reviewCount, sentimentCount, charts] = await Promise.all([
      Product.countDocuments(),
      Review.countDocuments(),
      Sentiment.countDocuments({ modelType: 'gemini' }),
      loadChartsData()
    ]);

    const threshold = Number(process.env.NEGATIVE_ALERT_THRESHOLD || 0.35);
    const dss = await computeDssInsights(threshold);

    res.json({
      productCount,
      reviewCount,
      sentimentCount,
      sentimentDist: charts.sentimentDistribution,
      productWiseSentiment: charts.productWiseSentiment,
      ratingVsSentiment: charts.ratingVsSentiment,
      dss
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dss/insights', async (req, res) => {
  try {
    const threshold = Number(req.query.threshold || process.env.NEGATIVE_ALERT_THRESHOLD || 0.35);
    const dss = await computeDssInsights(threshold);
    res.json(dss);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
