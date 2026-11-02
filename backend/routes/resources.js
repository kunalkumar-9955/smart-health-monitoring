const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Resource = require('../models/Resource');

// @GET /api/resources
router.get('/', protect, async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 }).limit(100);
    res.json({ resources, total: resources.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/resources - Assign resource
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const resource = await Resource.create({ 
      ...req.body, 
      assignedBy: req.user._id || req.user.id,
      timestamp: new Date()
    });

    const io = req.app.get('io');
    if (io) io.emit('resource_assigned', resource);

    return res.status(201).json({ resource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/resources/:id/status
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    
    const io = req.app.get('io');
    if (io) io.emit('resource_status_updated', resource);

    res.json({ resource });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/resources/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
