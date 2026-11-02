const mongoose = require('mongoose');

const waterSchema = new mongoose.Schema({
  village: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  ph: { type: Number, min: 0, max: 14 },
  turbidity: { type: Number, min: 0 },
  bacterialPresence: { type: Boolean, default: false },
  dissolvedOxygen: { type: Number },
  temperature: { type: Number },
  status: { type: String, enum: ['safe', 'moderate', 'contaminated'], default: 'safe' },
  source: { type: String, enum: ['manual', 'iot_simulated'], default: 'manual' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Water', waterSchema);
