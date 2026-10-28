const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  action:  { type: String, required: true },
  by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  byRole:  { type: String },
  note:    { type: String },
  isInternal: { type: Boolean, default: false }, // admin-only notes
  at:      { type: Date, default: Date.now },
});

const disputeSchema = new mongoose.Schema({
  booking:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',      required: true },
  raisedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  against:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },

  reason:      { type: String, required: true },
  description: { type: String, required: true },
  issueType: {
    type: String,
    enum: [
      'service-not-completed', 'poor-quality-work', 'overcharging',
      'worker-no-show', 'property-damage', 'unprofessional-behavior',
      'payment-dispute', 'refund-request', 'fraud', 'other',
    ],
    default: 'other',
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },

  status: {
    type: String,
    enum: [
      'open',
      'under-review',
      'waiting-for-customer',
      'waiting-for-worker',
      'evidence-requested',
      'mediation-in-progress',
      'resolved-customer',
      'resolved-worker',
      'partial-settlement',
      'closed',
      'escalated',
      // legacy
      'mediation', 'refund-review',
      'warning-issued', 'penalty-applied', 'reopened',
    ],
    default: 'open',
  },

  // Admin assignment
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Evidence
  evidenceNote:     { type: String },
  evidenceByWorker: { type: String },

  // Resolution
  resolutionNote:   { type: String },
  resolvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  refundAmount:     { type: Number, default: 0 },
  penaltyAmount:    { type: Number, default: 0 },
  settlementAmount: { type: Number, default: 0 },
  warningNote:      { type: String },

  // Linked records
  linkedTicket:  { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
  linkedThread:  { type: mongoose.Schema.Types.ObjectId, ref: 'AdminMessage' },

  // Suspension
  suspendedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  suspensionNote:{ type: String },

  activity: [activitySchema],
  seenBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt:  { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  reopenedAt: { type: Date },
  updatedAt:  { type: Date, default: Date.now },
});

disputeSchema.index({ raisedBy: 1, createdAt: -1 });
disputeSchema.index({ against:  1, createdAt: -1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ priority: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
