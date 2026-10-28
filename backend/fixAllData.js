/**
 * fixAllData.js
 * 
 * Full clean + rebuild of all financial and stats data:
 * 1. Wipes stale PaymentTransaction and WorkerPayout records
 * 2. Rebuilds them from actual completed+paid bookings only
 * 3. Recalculates worker stats (totalJobs, completionRate, rating, totalReviews)
 * 4. Recalculates customer stats (totalSpent, loyaltyPoints)
 * 5. Fixes booking timestamps
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User               = require('./models/User');
const Booking            = require('./models/Booking');
const PaymentTransaction = require('./models/PaymentTransaction');
const WorkerPayout       = require('./models/WorkerPayout');

const SETTINGS = {
  platformFeeValue: 5,    // 5% platform fee
  supportFee:       20,   // flat ₹20
  urgentFeeFixed:   100,  // flat ₹100 if emergency
  commissionRate:   10,   // 10% commission from worker
  taxRate:          18,   // 18% GST on platform fees
};

function calcBreakdown(serviceAmount, isEmergency) {
  const platformFee = Math.round(serviceAmount * SETTINGS.platformFeeValue / 100);
  const supportFee  = SETTINGS.supportFee;
  const urgentFee   = isEmergency ? SETTINGS.urgentFeeFixed : 0;
  const taxable     = platformFee + supportFee + urgentFee;
  const taxAmount   = Math.round(taxable * SETTINGS.taxRate / 100);
  const totalPaid   = serviceAmount + platformFee + supportFee + urgentFee + taxAmount;
  const commission  = Math.round(serviceAmount * SETTINGS.commissionRate / 100);
  const netPayout   = serviceAmount - commission;
  return { serviceAmount, platformFee, supportFee, urgentFee, taxAmount, totalPaid, commission, netPayout };
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal-jobs';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 0: Wipe stale financial records and rebuild cleanly
  // ─────────────────────────────────────────────────────────────────────────
  console.log('━━━ STEP 0: Clearing stale PaymentTransaction & WorkerPayout records ━━━');
  await PaymentTransaction.deleteMany({});
  await WorkerPayout.deleteMany({});
  console.log('  ✅ All old financial records cleared\n');

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Build financial records for all completed+paid bookings
  // ─────────────────────────────────────────────────────────────────────────
  console.log('━━━ STEP 1: Creating PaymentTransaction & WorkerPayout records ━━━');

  const paidBookings = await Booking.find({
    status:        'completed',
    paymentStatus: 'paid',
  }).populate('customer', 'name').populate('worker', 'name');

  console.log(`  Found ${paidBookings.length} completed+paid bookings\n`);

  for (const booking of paidBookings) {
    const bd          = calcBreakdown(booking.amount, booking.isEmergency || false);
    const invoiceNum  = `INV-${booking._id.toString().slice(-8).toUpperCase()}`;
    const paidAt      = booking.paidAt || booking.completedAt || booking.createdAt;
    const payMethod   = booking.paymentMethod || 'cash';
    const txnRef      = booking.paymentId || `seed_${booking._id.toString().slice(-6)}`;

    // Create PaymentTransaction
    const txn = await PaymentTransaction.create({
      booking:         booking._id,
      customer:        booking.customer._id,
      worker:          booking.worker._id,
      serviceAmount:   bd.serviceAmount,
      platformFee:     bd.platformFee,
      supportFee:      bd.supportFee,
      urgentFee:       bd.urgentFee,
      taxAmount:       bd.taxAmount,
      discountAmount:  0,
      totalPaid:       bd.totalPaid,
      platformFeeRate: SETTINGS.platformFeeValue,
      taxRate:         SETTINGS.taxRate,
      commissionRate:  SETTINGS.commissionRate,
      paymentMethod:   payMethod,
      paymentStatus:   'paid',
      transactionRef:  txnRef,
      invoiceNumber:   invoiceNum,
      paidAt:          paidAt,
      createdAt:       paidAt,
    });

    // Create WorkerPayout
    await WorkerPayout.create({
      booking:             booking._id,
      worker:              booking.worker._id,
      transaction:         txn._id,
      grossAmount:         bd.serviceAmount,
      commissionDeduction: bd.commission,
      taxDeduction:        0,
      penaltyDeduction:    0,
      netPayout:           bd.netPayout,
      commissionRate:      SETTINGS.commissionRate,
      taxRate:             0,
      payoutStatus:        'credited',
      payoutDate:          paidAt,
      payoutReference:     `PAY-${booking._id.toString().slice(-8).toUpperCase()}`,
      createdAt:           paidAt,
    });

    console.log(`  ✅ ${booking.worker.name.padEnd(22)} | ${booking.service.padEnd(14)} | ₹${booking.amount} → net ₹${bd.netPayout} | customer paid ₹${bd.totalPaid}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Fix worker stats from real booking data
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n━━━ STEP 2: Recalculating worker stats ━━━');

  const workers = await User.find({ role: 'worker' });

  for (const worker of workers) {
    const allBookings        = await Booking.find({ worker: worker._id });
    const completedBookings  = allBookings.filter(b => b.status === 'completed');
    const activeBookings     = allBookings.filter(b => !['cancelled','rejected'].includes(b.status));
    const reviewedBookings   = completedBookings.filter(b => b.review?.rating);

    const totalJobs      = completedBookings.length;
    const completionRate = activeBookings.length > 0
      ? Math.round((totalJobs / activeBookings.length) * 100)
      : 0;

    // Preserve seed ratings for workers with no actual reviews yet
    let avgRating    = worker.workerProfile.rating || 0;
    let totalReviews = reviewedBookings.length;
    if (totalReviews > 0) {
      avgRating = reviewedBookings.reduce((s, b) => s + b.review.rating, 0) / totalReviews;
      avgRating = Math.round(avgRating * 10) / 10;
    }

    // Category rating breakdown
    const breakdown = { quality: 0, behavior: 0, punctuality: 0, priceFairness: 0 };
    const catCounts = { quality: 0, behavior: 0, punctuality: 0, priceFairness: 0 };
    reviewedBookings.forEach(b => {
      ['quality','behavior','punctuality','priceFairness'].forEach(k => {
        if (b.review.categories?.[k]) {
          breakdown[k] += b.review.categories[k];
          catCounts[k] += 1;
        }
      });
    });
    ['quality','behavior','punctuality','priceFairness'].forEach(k => {
      breakdown[k] = catCounts[k] > 0
        ? Math.round((breakdown[k] / catCounts[k]) * 10) / 10
        : 0;
    });

    const payouts     = await WorkerPayout.find({ worker: worker._id });
    const totalEarned = payouts.reduce((s, p) => s + p.netPayout, 0);

    await User.findByIdAndUpdate(worker._id, {
      'workerProfile.totalJobs':       totalJobs,
      'workerProfile.totalReviews':    totalReviews,
      'workerProfile.completionRate':  completionRate,
      'workerProfile.rating':          avgRating,
      'workerProfile.ratingBreakdown': breakdown,
    });

    console.log(`  ✅ ${worker.name.padEnd(22)} | jobs=${String(totalJobs).padStart(2)} | rating=${avgRating} | completion=${completionRate}% | earned=₹${totalEarned}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Fix customer stats from real booking data
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n━━━ STEP 3: Recalculating customer stats ━━━');

  const customers = await User.find({ role: 'customer' });

  for (const customer of customers) {
    const completedPaid = await Booking.find({
      customer:      customer._id,
      status:        'completed',
      paymentStatus: 'paid',
    });

    const totalSpent    = completedPaid.reduce((s, b) => s + b.amount, 0);
    const loyaltyPoints = completedPaid.reduce((s, b) => s + Math.floor(b.amount / 10), 0);

    await User.findByIdAndUpdate(customer._id, { totalSpent, loyaltyPoints });

    console.log(`  ✅ ${customer.name.padEnd(20)} | totalSpent=₹${totalSpent} | loyaltyPoints=${loyaltyPoints}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Ensure all completed bookings have consistent timestamps
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n━━━ STEP 4: Fixing booking timestamps ━━━');

  const allCompleted = await Booking.find({ status: 'completed' });
  for (const b of allCompleted) {
    const update = {};
    if (!b.completedAt)          update.completedAt  = b.createdAt;
    if (!b.paidAt)               update.paidAt       = b.completedAt || b.createdAt;
    if (b.paymentStatus !== 'paid') update.paymentStatus = 'paid';
    if (Object.keys(update).length > 0) {
      await Booking.findByIdAndUpdate(b._id, update);
      console.log(`  ✅ Fixed: ${b.service} (${b._id})`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FINAL SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  FINAL DATA SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const bookingStats = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log('\n📋 Bookings by status:');
  bookingStats.forEach(s => console.log(`   ${s._id.padEnd(25)}: ${s.count}`));

  const txnTotal  = await PaymentTransaction.aggregate([{ $group: { _id: null, total: { $sum: '$totalPaid' }, count: { $sum: 1 } } }]);
  const payTotal  = await WorkerPayout.aggregate([{ $group: { _id: null, total: { $sum: '$netPayout' }, count: { $sum: 1 } } }]);
  const commTotal = await WorkerPayout.aggregate([{ $group: { _id: null, total: { $sum: '$commissionDeduction' } } }]);

  console.log(`\n💳 PaymentTransactions: ${txnTotal[0]?.count || 0}`);
  console.log(`   Total customer paid : ₹${txnTotal[0]?.total || 0}`);
  console.log(`\n💰 WorkerPayouts       : ${payTotal[0]?.count || 0}`);
  console.log(`   Total worker earned : ₹${payTotal[0]?.total || 0}`);
  console.log(`   Total commission    : ₹${commTotal[0]?.total || 0}`);

  console.log('\n✅ All data is now consistent and accurate!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
