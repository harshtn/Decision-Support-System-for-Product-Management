const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  companyId: { type: String }, // Can be just a string identifier or objectId if users are implemented
  targetModel: { type: String, required: true },
  competitorModel: { type: String },
  insights: { type: String, required: true }, // The GenAI generated text
  aspectImprovements: [{ aspect: String, suggestion: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analysis', analysisSchema);
