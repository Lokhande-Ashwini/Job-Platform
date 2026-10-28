const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  askedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question:  { type: String, required: true },
  answer:    { type: String },
  answeredBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  askedAt:   { type: Date, default: Date.now },
  answeredAt:{ type: Date },
});

const quoteSchema = new mongoose.Schema({
  booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Pricing
  baseRate:        { type: Number },
  estimatedAmount: { type: Number },   // original booking amount
  quotedAmount:    { type: Number, required: true },
  finalAmount:     { type: Number },   // agreed amount after negotiation
  counterAmount:   { type: Number },

  // Details
  notes:              { type: String },  // worker's quote notes
  estimatedHours:     { type: Number },
  estimatedStartDate: { type: Date },
  validUntil:         { type: Date },    // quote expiry

  // Status
  status: {
    type: String,
    enum: ['new', 'viewed', 'negotiating', 'accepted', 'rejected', 'expired', 'admin-review'],
    default: 'new'
  },
  viewedAt:    { type: Date },
  viewedByCustomer: { type: Boolean, default: false },

  // Admin review
  adminReviewRequired: { type: Boolean, default: false },
  adminDecision:       { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
  adminNote:           { type: String },
  flagReason:          { type: String },

  // Q&A
  questions: [questionSchema],

  // Negotiation history
  history: [{
    action:  String,
    by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byRole:  String,
    amount:  Number,
    note:    String,
    at:      { type: Date, default: Date.now }
  }],

  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-expire quotes past validUntil
quoteSchema.pre('save', function(next) {
  if (this.validUntil && new Date() > this.validUntil && this.status === 'new') {
    this.status = 'expired';
  }
  this.updatedAt = new Date();
  next();
});

quoteSchema.index({ customer: 1, status: 1 });
quoteSchema.index({ worker: 1, status: 1 });

module.exports = mongoose.model('Quote', quoteSchema);
