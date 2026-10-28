const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',  required: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  worker:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },

  // What customer paid
  serviceAmount:   { type: Number, required: true },  // base booking amount
  platformFee:     { type: Number, default: 0 },      // platform service fee
  supportFee:      { type: Number, default: 0 },      // safety/support fee
  urgentFee:       { type: Number, default: 0 },       // emergency surcharge
  taxAmount:       { type: Number, default: 0 },       // GST/tax on platform fees
  discountAmount:  { type: Number, default: 0 },       // loyalty/promo discount
  totalPaid:       { type: Number, required: true },   // final amount customer paid

  // Rates used at time of transaction
  platformFeeRate: { type: Number, default: 0 },      // % used
  taxRate:         { type: Number, default: 0 },       // % used
  commissionRate:  { type: Number, default: 0 },       // % used

  paymentMethod:   { type: String, enum: ['cash','upi','card','online'], default: 'cash' },
  paymentStatus:   { type: String, enum: ['pending','paid','refunded','failed'], default: 'pending' },
  transactionRef:  { type: String },                   // Razorpay/UPI ref
  invoiceNumber:   { type: String },

  createdAt: { type: Date, default: Date.now },
  paidAt:    { type: Date },
});

paymentTransactionSchema.index({ booking: 1 }, { unique: true });
paymentTransactionSchema.index({ customer: 1, createdAt: -1 });
paymentTransactionSchema.index({ worker:   1, createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
