const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  district: { type: String },
  state: { type: String, default: 'Maharashtra' },
  population: { type: Number, default: 0 },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'], default: 'LOW' },
  riskScore: { type: Number, default: 0 },
  totalCases: { type: Number, default: 0 },
  waterStatus: { type: String, enum: ['safe', 'moderate', 'contaminated'], default: 'safe' },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Village', villageSchema);
