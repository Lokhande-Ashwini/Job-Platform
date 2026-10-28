const mongoose = require('mongoose');

const workerPayoutSchema = new mongoose.Schema({
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',            required: true },
  worker:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',               required: true },
  transaction:{ type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTransaction' },

  grossAmount:        { type: Number, required: true },  // booking service amount
  commissionDeduction:{ type: Number, default: 0 },      // platform commission cut
  taxDeduction:       { type: Number, default: 0 },      // TDS or applicable tax
  penaltyDeduction:   { type: Number, default: 0 },      // dispute penalty if any
  netPayout:          { type: Number, required: true },  // what worker actually gets

  commissionRate: { type: Number, default: 0 },
  taxRate:        { type: Number, default: 0 },

  payoutStatus: {
    type: String,
    enum: ['pending','processing','credited','failed','on-hold'],
    default: 'pending',
  },
  payoutDate:      { type: Date },
  payoutReference: { type: String },
  payoutMethod:    { type: String, default: 'wallet' }, // wallet / bank / upi

  createdAt: { type: Date, default: Date.now },
});

workerPayoutSchema.index({ booking: 1 }, { unique: true });
workerPayoutSchema.index({ worker: 1, createdAt: -1 });
workerPayoutSchema.index({ payoutStatus: 1 });

module.exports = mongoose.model('WorkerPayout', workerPayoutSchema);
