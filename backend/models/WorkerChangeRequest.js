const mongoose = require('mongoose');

const workerChangeRequestSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fieldName: { type: String, required: true },
  oldValue: { type: String },
  suggestedValue: { type: String, required: true },
  reason: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'resubmitted', 'completed'],
    default: 'pending'
  },
  workerResponse: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkerChangeRequest', workerChangeRequestSchema);
