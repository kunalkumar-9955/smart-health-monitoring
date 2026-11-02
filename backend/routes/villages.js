const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Village = require('../models/Village');

// @GET /api/villages
router.get('/', protect, async (req, res) => {
  try {
    const villages = await Village.find().sort({ riskScore: -1 });
    res.json({ villages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/villages
router.post('/', protect, async (req, res) => {
  try {
    const village = await Village.create(req.body);
    return res.status(201).json({ village });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/villages/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const village = await Village.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!village) return res.status(404).json({ message: 'Village not found' });
    res.json({ village });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
