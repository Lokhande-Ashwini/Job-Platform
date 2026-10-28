const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'booking', 'payment', 'review', 'message', 'system',
      'dispute', 'quote', 'ticket', 'verification',
      'announcement', 'payout', 'change-request',
    ],
    default: 'system',
  },
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedModel: {
    type: String,
    enum: ['Booking', 'Dispute', 'Quote', 'SupportTicket', 'User', 'WorkerChangeRequest', 'WorkerPayout'],
  },
  actionUrl: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
