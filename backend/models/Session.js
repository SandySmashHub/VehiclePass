const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String, required: [true, 'Vehicle number is required'], uppercase: true, trim: true, index: true,
      match: [/^[A-Z0-9-]{4,12}$/, 'Vehicle number must be 4-12 letters/digits (e.g. MH01AB1234)'],
    },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: [true, 'Parking zone is required'] },
    entryTime: { type: Date, required: [true, 'Entry time is required'], default: Date.now },
    exitTime: { type: Date },
    permittedMinutes: { type: Number, required: [true, 'Permitted duration is required'], min: [1, 'Permitted minutes must be at least 1'], max: [1440, 'Permitted minutes must be at most 1440'] },
    status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
