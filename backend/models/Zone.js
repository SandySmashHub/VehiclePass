const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Zone name is required'], trim: true, maxlength: [60, 'Zone name is too long'] },
    code: { type: String, required: [true, 'Zone code is required'], trim: true, uppercase: true, unique: true, maxlength: [12, 'Zone code is too long'] },
    latitude: { type: Number, required: [true, 'Latitude is required'], min: [-90, 'Latitude must be -90 to 90'], max: [90, 'Latitude must be -90 to 90'] },
    longitude: { type: Number, required: [true, 'Longitude is required'], min: [-180, 'Longitude must be -180 to 180'], max: [180, 'Longitude must be -180 to 180'] },
    radius: { type: Number, default: 60, min: [10, 'Radius must be at least 10 m'], max: [2000, 'Radius must be at most 2000 m'] },
    capacity: { type: Number, default: 20, min: [1, 'Capacity must be at least 1'], max: [1000, 'Capacity must be at most 1000'] },
    permittedMinutes: { type: Number, default: 120, min: [1, 'Permitted minutes must be at least 1'], max: [1440, 'Permitted minutes must be at most 1440'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Zone', zoneSchema);
