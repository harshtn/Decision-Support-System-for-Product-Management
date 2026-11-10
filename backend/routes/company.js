const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Smartphone = require('../models/Smartphone');
const Review = require('../models/Review');
const Analysis = require('../models/Analysis');

// Setup multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_now');

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Clean up uploaded temp file
      fs.unlinkSync(req.file.path);
      // Data would normally be inserted into DB here
      // For this step, we just acknowledge receipt
      res.json({ message: 'File successfully processed', records: results.length });
    });
});

router.post('/analyze', async (req, res) => {
  const { targetModel, competitorModel, records } = req.body;
  if (!targetModel) return res.status(400).json({ message: 'Target model required' });

  try {
    // Generate prompt for GenAI based on review data
    const prompt = `
      Analyze these reviews for ${targetModel} compared to ${competitorModel || 'competitors'}.
      Based on the following sample review data, provide structured sentiment analysis on specific aspects
      (battery, camera, performance, display) and actionable recommendations for improvement.

      Reviews Sample (limit to a few for prompt size):
      ${JSON.stringify(records?.slice(0, 10))}

      Respond with an overall insight paragraph and a specific list of aspect improvements.
    `;

    // Assuming we use gemini-pro
    // Note: This won't work without a valid API key, so we handle failures gracefully
    let insightsText = "";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        const genResult = await model.generateContent(prompt);
        const response = await genResult.response;
        insightsText = response.text();
    } catch (apiErr) {
        console.error("GenAI API Error:", apiErr);
        insightsText = "Mock Insights: Wait for API integration. Improve battery life and reduce stutter in heavy applications.";
    }

    // Save Mock Analysis Outcome
    const analysisInfo = new Analysis({
      targetModel,
      competitorModel,
      insights: insightsText,
      aspectImprovements: [
        { aspect: "Battery", suggestion: "Increase capacity by 500mAh to match competitor." },
        { aspect: "Performance", suggestion: "Optimize thermal throttling during gaming." }
      ]
    });
    
    await analysisInfo.save();
    
    res.json(analysisInfo);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch historical analyses
router.get('/analyses', async (req, res) => {
  try {
    const list = await Analysis.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
