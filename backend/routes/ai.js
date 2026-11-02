const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { calculateRiskScore } = require('../services/aiEngine');

// @POST /api/ai/predict - Run AI risk prediction
router.post('/predict', protect, async (req, res) => {
  try {
    const { casesCount, waterQuality, isMonsoon, village, location } = req.body;
    const result = await calculateRiskScore({ casesCount, waterQuality, isMonsoon, village, location });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
