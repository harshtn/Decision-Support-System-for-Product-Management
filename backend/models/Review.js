const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  smartphoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Smartphone', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
  userName: { type: String },
  reviewText: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5 },
  ratingRaw: { type: String },
  sentimentLabel: { type: String, enum: ['negative', 'neutral', 'positive'], default: 'neutral' },
  sentimentScore: { type: Number, default: 0 }, // Optional: pre-computed overall sentiment (-1 to 1)
  aspectSentiments: {
    battery: { type: String, enum: ['positive', 'neutral', 'negative', 'N/A'], default: 'N/A' },
    camera: { type: String, enum: ['positive', 'neutral', 'negative', 'N/A'], default: 'N/A' },
    performance: { type: String, enum: ['positive', 'neutral', 'negative', 'N/A'], default: 'N/A' },
    display: { type: String, enum: ['positive', 'neutral', 'negative', 'N/A'], default: 'N/A' }
  },
  metadata: {
    source: String,
    asin: String,
    reviewId: String,
    verifiedPurchase: Boolean,
    reviewCountry: String,
    helpfulVotes: String
  }
}, { timestamps: true });

reviewSchema.pre('validate', function preValidate() {
  if (!this.productId && this.smartphoneId) {
    this.productId = this.smartphoneId;
  }
  if (!this.smartphoneId && this.productId) {
    this.smartphoneId = this.productId;
  }
});

module.exports = mongoose.model('Review', reviewSchema);
