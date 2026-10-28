const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer', 'worker', 'admin'], required: true },
  text:       { type: String, required: true },
  isRead:     { type: Boolean, default: false },
  isInternal: { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now }
});

const supportTicketSchema = new mongoose.Schema({
  raisedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  raisedByRole: { type: String, enum: ['customer', 'worker'], required: true },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // backward compat
  booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookingRef:   { type: String }, // manual booking reference text

  subject:     { type: String, required: true },
  category: {
    type: String,
    enum: [
      'payment-issue', 'booking-issue', 'refund-issue', 'profile-account-issue',
      'technical-issue', 'quote-issue', 'verification-issue', 'dispute-issue',
      'worker-issue', 'customer-issue', 'other'
    ],
    required: true
  },
  description:   { type: String, required: true },
  screenshotUrl: { type: String },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: [
      'open', 'in-progress', 'waiting-for-user', 'waiting-for-admin',
      'resolved', 'closed', 'escalated'
    ],
    default: 'open'
  },

  assignedAdmin:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolutionNote: { type: String },
  convertedTo:    { type: String, enum: ['dispute', 'refund-review', null], default: null },
  convertedRef:   { type: mongoose.Schema.Types.ObjectId },

  messages:   [ticketMessageSchema],
  adminNotes: [{
    note:      String,
    admin:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],

  firstResponseAt: Date,
  resolvedAt:      Date,
  reopenedAt:      Date,
  createdAt:       { type: Date, default: Date.now },
  updatedAt:       { type: Date, default: Date.now }
});

supportTicketSchema.index({ raisedBy: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
