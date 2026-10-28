const mongoose = require('mongoose');

const adminMessageSchema = new mongoose.Schema({
  threadType: {
    type: String,
    enum: ['admin-worker', 'admin-customer', 'dispute', 'general'],
    required: true
  },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subject: { type: String, required: true },
  relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  relatedDispute: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute' },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  isOpen: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now }
});

adminMessageSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('AdminMessage', adminMessageSchema);
