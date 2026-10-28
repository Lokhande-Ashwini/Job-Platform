const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  label: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
