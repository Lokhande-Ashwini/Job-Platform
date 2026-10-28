/**
 * Trust Score Engine — Hyperlocal Jobs
 * Calculates realistic trust scores for workers and customers
 * using live booking data and profile factors.
 *
 * Worker: 10 factors, max 100 pts
 * Customer: 8 factors, max 100 pts
 */

const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');

// ── WORKER TRUST SCORE ────────────────────────────────────────────────────────
// Factors and their max points:
//  1. Profile completion        10 pts
//  2. Verified badge            15 pts
//  3. ID document uploaded       5 pts
//  4. Jobs completed            15 pts  (scales with volume)
//  5. Average rating            15 pts
//  6. Complaint / dispute rate  10 pts  (penalty-based)
//  7. Cancellation rate         10 pts  (penalty-based)
//  8. Quote fairness             5 pts  (price vs market)
//  9. Experience                 8 pts
// 10. Review count               7 pts
// Total: 100 pts

const MARKET_RATES = {
  'Electrician': 350, 'Plumber': 300, 'Carpenter': 450, 'Mechanic': 500,
  'Tutor': 400, 'Painter': 250, 'Cleaner': 200, 'Gardener': 300,
  'AC Technician': 450, 'Appliance Repair': 350,
};

/**
 * Calculate worker trust score using live booking data.
 * @param {Object} worker  — Mongoose User document (worker)
 * @param {Array}  bookings — Array of booking documents for this worker
 * @returns {Object} { score, level, levelColor, breakdown, factors }
 */
const calculateWorkerTrustScore = (worker, bookings = []) => {
  const p = worker.workerProfile || {};
  const breakdown = [];
  let total = 0;

  const add = (key, label, icon, pts, max, tip, detail = '') => {
    const capped = Math.min(max, Math.max(0, Math.round(pts)));
    total += capped;
    breakdown.push({ key, label, icon, pts: capped, max, tip, detail, pct: Math.round((capped / max) * 100) });
  };

  // ── 1. Profile completion (10 pts) ──────────────────────────────────────
  const { getWorkerCompletion } = require('./profileCompletion');
  const completion = getWorkerCompletion(worker);
  const completionPts = Math.round((completion.percentage / 100) * 10);
  add('profile', 'Profile Completion', '📋', completionPts, 10,
    'Complete all profile fields to earn full points',
    `${completion.percentage}% complete`);

  // ── 2. Verified badge (15 pts) ───────────────────────────────────────────
  const verPts = p.verificationStatus === 'verified' ? 15
    : p.verificationStatus === 'submitted' ? 5 : 0;
  add('verified', 'Identity Verified', '✅', verPts, 15,
    'Submit ID and selfie, get approved by admin',
    p.verificationStatus === 'verified' ? 'Verified by admin' :
    p.verificationStatus === 'submitted' ? 'Under review (+5 pts)' : 'Not submitted');

  // ── 3. ID document uploaded (5 pts) ─────────────────────────────────────
  const idPts = p.idDocument ? (p.photoVerification ? 5 : 3) : 0;
  add('id_doc', 'ID Document', '🪪', idPts, 5,
    'Upload government ID (Aadhaar, PAN, etc.)',
    p.idDocument ? (p.photoVerification ? 'ID + selfie uploaded' : 'ID uploaded, selfie missing') : 'Not uploaded');

  // ── 4. Jobs completed (15 pts) ───────────────────────────────────────────
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  // Logarithmic scale: 50 jobs = 15 pts, 10 jobs = 10 pts, 1 job = 4 pts
  const jobPts = completedCount === 0 ? 0
    : completedCount >= 50 ? 15
    : completedCount >= 20 ? 12
    : completedCount >= 10 ? 10
    : completedCount >= 5  ? 7
    : completedCount >= 1  ? 4 : 0;
  add('jobs', 'Jobs Completed', '📋', jobPts, 15,
    'Complete more jobs to earn up to 15 pts',
    `${completedCount} completed jobs`);

  // ── 5. Average rating (15 pts) ───────────────────────────────────────────
  const rating = p.rating || 0;
  const ratingPts = Math.round((rating / 5) * 15);
  add('rating', 'Average Rating', '⭐', ratingPts, 15,
    'Maintain high ratings from customers',
    rating > 0 ? `${rating.toFixed(1)}/5 stars` : 'No ratings yet');

  // ── 6. Dispute / complaint rate (10 pts — penalty) ───────────────────────
  const disputeBookings = bookings.filter(b => b.hasDispute).length;
  const totalBookings = bookings.length;
  let disputePts = 10;
  if (totalBookings >= 3) {
    const disputeRate = disputeBookings / totalBookings;
    if (disputeRate > 0.3) disputePts = 0;
    else if (disputeRate > 0.2) disputePts = 3;
    else if (disputeRate > 0.1) disputePts = 6;
    else if (disputeRate > 0.05) disputePts = 8;
    else disputePts = 10;
  }
  const disputeRatePct = totalBookings > 0 ? Math.round((disputeBookings / totalBookings) * 100) : 0;
  add('disputes', 'Low Complaint Rate', '🕊️', disputePts, 10,
    'Avoid disputes and complaints from customers',
    totalBookings >= 3 ? `${disputeRatePct}% dispute rate` : 'Not enough data yet');

  // ── 7. Cancellation rate (10 pts — penalty) ──────────────────────────────
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
  let cancelPts = 10;
  if (totalBookings >= 3) {
    const cancelRate = cancelledCount / totalBookings;
    if (cancelRate > 0.4) cancelPts = 0;
    else if (cancelRate > 0.3) cancelPts = 2;
    else if (cancelRate > 0.2) cancelPts = 5;
    else if (cancelRate > 0.1) cancelPts = 7;
    else cancelPts = 10;
  }
  const cancelRatePct = totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0;
  add('cancellation', 'Low Cancellation Rate', '✓', cancelPts, 10,
    "Don't cancel accepted bookings",
    totalBookings >= 3 ? `${cancelRatePct}% cancellation rate` : 'Not enough data yet');

  // ── 8. Quote fairness (5 pts) ────────────────────────────────────────────
  const skill = p.skills?.[0];
  const marketAvg = MARKET_RATES[skill] || 350;
  const rate = p.hourlyRate || 0;
  let quotePts = 0;
  let quoteDetail = 'Set your hourly rate';
  if (rate > 0) {
    const ratio = rate / marketAvg;
    if (ratio >= 0.5 && ratio <= 1.5) { quotePts = 5; quoteDetail = 'Fair pricing vs market'; }
    else if (ratio > 1.5 && ratio <= 2.0) { quotePts = 3; quoteDetail = 'Slightly above market'; }
    else if (ratio < 0.5) { quotePts = 3; quoteDetail = 'Very low — consider raising'; }
    else { quotePts = 1; quoteDetail = 'Significantly above market'; }
  }
  add('quote_fairness', 'Quote Fairness', '💰', quotePts, 5,
    'Keep pricing within market range for your skill',
    quoteDetail);

  // ── 9. Experience (8 pts) ────────────────────────────────────────────────
  const exp = p.experience || 0;
  const expPts = exp >= 10 ? 8 : exp >= 7 ? 7 : exp >= 5 ? 6 : exp >= 3 ? 4 : exp >= 1 ? 2 : 0;
  add('experience', 'Years of Experience', '🏆', expPts, 8,
    'More years of experience = more trust points',
    exp > 0 ? `${exp} year${exp !== 1 ? 's' : ''} experience` : 'Not set');

  // ── 10. Review count (7 pts) ─────────────────────────────────────────────
  const reviews = p.totalReviews || 0;
  const revPts = reviews >= 20 ? 7 : reviews >= 10 ? 6 : reviews >= 5 ? 4 : reviews >= 2 ? 2 : reviews >= 1 ? 1 : 0;
  add('reviews', 'Customer Reviews', '💬', revPts, 7,
    'Encourage customers to leave reviews after each job',
    reviews > 0 ? `${reviews} review${reviews !== 1 ? 's' : ''}` : 'No reviews yet');

  const score = Math.min(100, total);
  const { level, levelColor, levelBg, levelEmoji } = _getLevel(score);

  return {
    score,
    level,
    levelColor,
    levelBg,
    levelEmoji,
    breakdown,
    totalBookings,
    completedCount,
    cancelledCount,
    disputeBookings,
  };
};

// ── CUSTOMER TRUST SCORE ──────────────────────────────────────────────────────
// Factors and their max points:
//  1. Profile completion        15 pts
//  2. Phone number verified     15 pts
//  3. Email address set         10 pts
//  4. Successful payments       20 pts  (paid bookings)
//  5. Low dispute rate          15 pts  (penalty-based)
//  6. Booking reliability       10 pts  (no-show / cancellation)
//  7. Positive review behavior   8 pts  (left reviews)
//  8. Account age                7 pts
// Total: 100 pts

/**
 * Calculate customer trust score using live booking data.
 * @param {Object} customer  — Mongoose User document (customer)
 * @param {Array}  bookings  — Array of booking documents for this customer
 * @returns {Object} { score, level, levelColor, breakdown, factors }
 */
const calculateCustomerTrustScore = (customer, bookings = []) => {
  const breakdown = [];
  let total = 0;

  const add = (key, label, icon, pts, max, tip, detail = '') => {
    const capped = Math.min(max, Math.max(0, Math.round(pts)));
    total += capped;
    breakdown.push({ key, label, icon, pts: capped, max, tip, detail, pct: Math.round((capped / max) * 100) });
  };

  // ── 1. Profile completion (15 pts) ──────────────────────────────────────
  const { getCustomerCompletion } = require('./profileCompletion');
  const completion = getCustomerCompletion(customer);
  const completionPts = Math.round((completion.percentage / 100) * 15);
  add('profile', 'Profile Completion', '📋', completionPts, 15,
    'Complete all profile fields',
    `${completion.percentage}% complete`);

  // ── 2. Phone number verified (15 pts) ───────────────────────────────────
  const hasPhone = !!(customer.phone && customer.phone.replace(/\D/g, '').length >= 10);
  add('phone', 'Phone Number', '📞', hasPhone ? 15 : 0, 15,
    'Add a valid 10-digit phone number',
    hasPhone ? 'Phone number added' : 'Phone number missing');

  // ── 3. Email address set (10 pts) ───────────────────────────────────────
  add('email', 'Email Address', '✉️', customer.email ? 10 : 0, 10,
    'Add and verify your email address',
    customer.email ? 'Email address set' : 'Email missing');

  // ── 4. Successful payments (20 pts) ─────────────────────────────────────
  const paidBookings = bookings.filter(b => b.paymentStatus === 'paid').length;
  const totalBookings = bookings.length;
  const payPts = paidBookings >= 10 ? 20
    : paidBookings >= 5 ? 16
    : paidBookings >= 3 ? 12
    : paidBookings >= 1 ? 7 : 0;
  add('payments', 'Successful Payments', '💳', payPts, 20,
    'Pay on time after each completed booking',
    paidBookings > 0 ? `${paidBookings} paid booking${paidBookings !== 1 ? 's' : ''}` : 'No payments yet');

  // ── 5. Low dispute rate (15 pts — penalty) ───────────────────────────────
  const disputeBookings = bookings.filter(b => b.hasDispute).length;
  let disputePts = 15;
  if (totalBookings >= 2) {
    const disputeRate = disputeBookings / totalBookings;
    if (disputeRate > 0.3) disputePts = 0;
    else if (disputeRate > 0.2) disputePts = 5;
    else if (disputeRate > 0.1) disputePts = 10;
    else disputePts = 15;
  }
  const disputeRatePct = totalBookings > 0 ? Math.round((disputeBookings / totalBookings) * 100) : 0;
  add('disputes', 'Low Dispute Rate', '🕊️', disputePts, 15,
    'Avoid raising unnecessary disputes',
    totalBookings >= 2 ? `${disputeRatePct}% dispute rate` : 'Not enough data yet');

  // ── 6. Booking reliability (10 pts) ─────────────────────────────────────
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
  let reliabilityPts = 10;
  if (totalBookings >= 2) {
    const cancelRate = cancelledCount / totalBookings;
    if (cancelRate > 0.5) reliabilityPts = 0;
    else if (cancelRate > 0.3) reliabilityPts = 3;
    else if (cancelRate > 0.2) reliabilityPts = 6;
    else reliabilityPts = 10;
  }
  const cancelRatePct = totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0;
  add('reliability', 'Booking Reliability', '📅', reliabilityPts, 10,
    "Don't cancel bookings after they're accepted",
    totalBookings >= 2 ? `${cancelRatePct}% cancellation rate` : 'Not enough data yet');

  // ── 7. Positive review behavior (8 pts) ─────────────────────────────────
  const reviewsLeft = bookings.filter(b => b.review?.rating).length;
  const reviewPts = reviewsLeft >= 5 ? 8 : reviewsLeft >= 3 ? 6 : reviewsLeft >= 1 ? 3 : 0;
  add('reviews', 'Leaves Reviews', '⭐', reviewPts, 8,
    'Leave honest reviews after completed bookings',
    reviewsLeft > 0 ? `${reviewsLeft} review${reviewsLeft !== 1 ? 's' : ''} left` : 'No reviews left yet');

  // ── 8. Account age (7 pts) ───────────────────────────────────────────────
  const ageMs = Date.now() - new Date(customer.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const agePts = ageDays >= 365 ? 7 : ageDays >= 180 ? 5 : ageDays >= 90 ? 3 : ageDays >= 30 ? 1 : 0;
  const ageLabel = ageDays >= 365 ? `${Math.floor(ageDays/365)}yr+`
    : ageDays >= 30 ? `${Math.floor(ageDays/30)}mo`
    : `${Math.floor(ageDays)}d`;
  add('account_age', 'Account Age', '📅', agePts, 7,
    'Older accounts with good history earn more trust',
    `Account age: ${ageLabel}`);

  const score = Math.min(100, total);
  const { level, levelColor, levelBg, levelEmoji } = _getLevel(score);

  return {
    score,
    level,
    levelColor,
    levelBg,
    levelEmoji,
    breakdown,
    totalBookings,
    paidBookings,
    cancelledCount,
    disputeBookings,
  };
};

// ── Level helper ──────────────────────────────────────────────────────────────
const _getLevel = (score) => {
  if (score >= 85) return { level: 'Platinum', levelColor: '#6366f1', levelBg: '#ede9fe', levelEmoji: '💎' };
  if (score >= 70) return { level: 'Gold',     levelColor: '#f59e0b', levelBg: '#fef3c7', levelEmoji: '🥇' };
  if (score >= 50) return { level: 'Silver',   levelColor: '#6b7280', levelBg: '#f3f4f6', levelEmoji: '🥈' };
  if (score >= 30) return { level: 'Bronze',   levelColor: '#b45309', levelBg: '#fef3c7', levelEmoji: '🥉' };
  return              { level: 'New',       levelColor: '#9ca3af', levelBg: '#f9fafb', levelEmoji: '🌱' };
};

// ── Fetch bookings and compute score ─────────────────────────────────────────
const computeWorkerTrustScore = async (worker) => {
  const bookings = await Booking.find({ worker: worker._id }).lean();
  return calculateWorkerTrustScore(worker, bookings);
};

const computeCustomerTrustScore = async (customer) => {
  const bookings = await Booking.find({ customer: customer._id }).lean();
  return calculateCustomerTrustScore(customer, bookings);
};

module.exports = {
  calculateWorkerTrustScore,
  calculateCustomerTrustScore,
  computeWorkerTrustScore,
  computeCustomerTrustScore,
  _getLevel,
};
