const express = require('express');
const router = express.Router();
const Smartphone = require('../models/Smartphone');
const Review = require('../models/Review');

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get all smartphones (or search by name)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 60, 1), 200);
    let query = {};
    if (search) {
      const safeSearch = escapeRegex(search.trim());
      query = {
        $or: [
          { modelName: { $regex: safeSearch, $options: 'i' } },
          { brand: { $regex: safeSearch, $options: 'i' } }
        ]
      };
    }
    const smartphones = await Smartphone.find(query)
      .sort({ releaseYear: -1, price: 1, modelName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json(smartphones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Compare multiple smartphones
router.get('/compare', async (req, res) => {
  try {
    const ids = req.query.ids; // comma separated ids
    if (!ids) return res.status(400).json({ message: 'No IDs provided' });
    const idArray = ids.split(',');
    const smartphones = await Smartphone.find({ _id: { $in: idArray } }).lean();
    res.json(smartphones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single smartphone by ID
router.get('/:id', async (req, res) => {
  try {
    const smartphone = await Smartphone.findById(req.params.id).lean();
    if (!smartphone) return res.status(404).json({ message: 'Not found' });
    res.json(smartphone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get reviews for a smartphone
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ smartphoneId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
