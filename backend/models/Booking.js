const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  status:    { type: String, required: true },
  note:      { type: String },
  by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  byRole:    { type: String, enum: ['customer', 'worker', 'admin', 'system'] },
  at:        { type: Date, default: Date.now },
});

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service:  { type: String, required: true },
  description: String,

  location: {
    type:        { type: String, default: 'Point' },
    coordinates: [Number],
    address:     String,
  },

  scheduledDate: { type: Date, required: true },

  status: {
    type: String,
    enum: [
      'requested',      // customer created booking
      'accepted',       // worker accepted
      'rejected',       // worker rejected
      'scheduled',      // confirmed + date set
      'on-the-way',     // worker en route
      'arrived',        // worker at location
      'in-progress',    // work started
      'waiting-for-payment', // work done, awaiting payment
      'completed',      // paid + done
      'cancelled',      // cancelled by either party
      'disputed',       // dispute raised
      // Legacy support
      'pending',
    ],
    default: 'requested',
  },

  // Timeline of all status changes
  timeline: [timelineEventSchema],

  amount:    { type: Number, required: true },
  estimatedCost: { min: Number, max: Number, estimatedTime: Number },

  isEmergency:    { type: Boolean, default: false },
  emergencyCharge:{ type: Number,  default: 0 },

  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'online'],
    default: 'cash',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  paymentId:            String,
  paymentMethod_detail: String,
  paidAt:               Date,

  // Rejection / cancellation
  rejectionReason:      String,
  cancellationReason:   String,
  cancelledBy:          { type: String, enum: ['customer', 'worker', 'admin'] },

  // Dispute / escalation
  hasDispute:   { type: Boolean, default: false },
  disputeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute' },
  isEscalated:  { type: Boolean, default: false },

  // Review
  review: {
    rating:    Number,
    // Category ratings (1-5 each)
    categories: {
      quality:      Number,
      behavior:     Number,
      punctuality:  Number,
      priceFairness:Number,
    },
    comment:   String,
    sentiment: {
      label: { type: String, enum: ['positive', 'neutral', 'negative'] },
      score: Number,
      emoji: String,
    },
    // Worker reply
    workerReply:     String,
    workerRepliedAt: Date,
    createdAt: Date,
  },

  loyaltyPointsEarned: { type: Number, default: 0 },

  workerLocation: {
    type:        { type: String, default: 'Point' },
    coordinates: [Number],
    lastUpdated: Date,
  },

  // Admin notes
  adminNote: String,

  createdAt:   { type: Date, default: Date.now },
  completedAt: Date,
  acceptedAt:  Date,
  startedAt:   Date,
});

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ worker:   1, createdAt: -1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
