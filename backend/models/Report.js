const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: { type: String, default: 'Anonymous' },
  village: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
  },
  symptoms: {
    fever: { type: Boolean, default: false },
    diarrhea: { type: Boolean, default: false },
    vomiting: { type: Boolean, default: false },
    dehydration: { type: Boolean, default: false },
    other: { type: String },
  },
  casesCount: { type: Number, default: 1, min: 1 },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
  waterQuality: {
    ph: { type: Number },
    turbidity: { type: Number },
    bacterialPresence: { type: Boolean, default: false },
    status: { type: String, enum: ['safe', 'moderate', 'contaminated'], default: 'safe' },
  },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'], default: 'LOW' },
  isMonsoon: { type: Boolean, default: false },
  source: { type: String, enum: ['form', 'sms', 'voice', 'simulated'], default: 'form' },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
