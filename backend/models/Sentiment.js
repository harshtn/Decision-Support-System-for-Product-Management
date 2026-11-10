const mongoose = require('mongoose');

const sentimentSchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    modelType: { type: String, enum: ['gemini', 'tfidf', 'bert'], default: 'gemini' },
    label: { type: String, enum: ['negative', 'neutral', 'positive'], required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    reason: { type: String, default: '' },
    analyzedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

sentimentSchema.index({ reviewId: 1, modelType: 1 }, { unique: true });

module.exports = mongoose.model('Sentiment', sentimentSchema);
