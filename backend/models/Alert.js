const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  village: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'], default: 'LOW' },
  riskScore: { type: Number, default: 0 },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  isActive: { type: Boolean, default: true },
  isRead: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
