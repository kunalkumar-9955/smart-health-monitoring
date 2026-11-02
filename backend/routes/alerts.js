const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Alert = require('../models/Alert');

// @GET /api/alerts
router.get('/', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ isActive: true }).sort({ timestamp: -1 }).limit(50);
    res.json({ alerts, total: alerts.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/alerts
router.post('/', protect, authorize('admin', 'field_worker'), async (req, res) => {
  try {
    const alert = await Alert.create({
      ...req.body,
      timestamp: new Date()
    });
    return res.status(201).json({ alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/alerts/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json({ alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/alerts/count
router.get('/count', protect, async (req, res) => {
  try {
    const count = await Alert.countDocuments({ isActive: true, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
