const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Water = require('../models/Water');

const computeWaterStatus = (data) => {
  if (data.bacterialPresence) return 'contaminated';
  if (data.ph < 6.0 || data.ph > 8.0 || data.turbidity > 4) return 'moderate';
  return 'safe';
};

// @GET /api/water
router.get('/', protect, async (req, res) => {
  try {
    const query = req.query.village ? { village: req.query.village } : {};
    const data = await Water.find(query).sort({ timestamp: -1 }).limit(100);
    res.json({ data, total: data.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/water
router.post('/', protect, async (req, res) => {
  try {
    const { village, ph, turbidity, bacterialPresence, dissolvedOxygen, temperature, source, location } = req.body;
    const status = computeWaterStatus({ bacterialPresence, ph, turbidity });

    const saved = await Water.create({
      village, 
      ph, 
      turbidity, 
      bacterialPresence, 
      dissolvedOxygen, 
      temperature,
      status, 
      source: source || 'manual', 
      location: location || {},
      recordedBy: req.user._id || req.user.id,
      timestamp: new Date(),
    });

    const io = req.app.get('io');
    if (io) io.emit('new_water_data', saved);

    return res.status(201).json({ data: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/water/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const statusCount = await Water.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byVillage = await Water.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$village', latestStatus: { $first: '$status' }, latestPh: { $first: '$ph' }, latestTurbidity: { $first: '$turbidity' } } }
    ]);
    res.json({ statusCount, byVillage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
