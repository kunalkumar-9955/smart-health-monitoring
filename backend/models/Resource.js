const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  village: { type: String, required: true },
  type: { type: String, enum: ['doctor', 'medical_kit', 'water_treatment'], required: true },
  quantity: { type: Number, default: 1 },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  notes: { type: String },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
