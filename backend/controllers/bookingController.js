const Booking  = require('../models/Booking');
const User      = require('../models/User');
const Notification = require('../models/Notification');
const { sendBookingNotification, sendAcceptedNotification, sendOnTheWayNotification, sendCompletedNotification } = require('../utils/sms');
const { analyzeSentiment } = require('../utils/aiEngine');
const { createFinancialRecords } = require('./financeController');

const notify = async (userId, title, message, relatedId) => {
  await Notification.create({ user: userId, title, message, type: 'booking', relatedId }).catch(() => {});
};

const addTimeline = (booking, status, note, userId, role) => {
  booking.timeline.push({ status, note, by: userId, byRole: role, at: new Date() });
};

const calcEstimatedCost = (hourlyRate, isEmergency) => ({
  min: Math.round(hourlyRate * 1 * (isEmergency ? 1.5 : 1)),
  max: Math.round(hourlyRate * 3 * (isEmergency ? 1.5 : 1)),
  estimatedTime: isEmergency ? 30 : 60,
});

const calcLoyaltyPoints = (amount) => Math.floor(amount / 10);

/* ── Create booking ─────────────────────────────────────────────────────── */
exports.createBooking = async (req, res) => {
  try {
    const worker = await User.findById(req.body.worker);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const isEmergency    = req.body.isEmergency || false;
    const emergencyCharge = isEmergency ? 100 : 0;
    const estimatedCost  = calcEstimatedCost(worker.workerProfile?.hourlyRate || 0, isEmergency);

    const booking = await Booking.create({
      ...req.body,
      customer:      req.user.id,
      status:        'requested',
      emergencyCharge,
      estimatedCost,
      amount:        req.body.amount || estimatedCost.min,
      timeline:      [{ status: 'requested', note: 'Booking created by customer', byRole: 'customer', by: req.user.id, at: new Date() }],
    });

    await notify(worker._id, '🔔 New Booking Request',
      `${req.user.name} requested ${req.body.service}. Accept or reject.`, booking._id);
    await sendBookingNotification(worker.phone, req.user.name, req.body.service).catch(() => {});

    res.status(201).json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Get bookings ───────────────────────────────────────────────────────── */
exports.getBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') query = { customer: req.user.id };
    else if (req.user.role === 'worker') query = { worker: req.user.id };
    // admin gets all bookings (no filter)
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0; // 0 = no limit
    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone avatar')
      .populate('worker',   'name email phone avatar rating')  // removed heavy workerProfile
      .sort('-createdAt')
      .limit(limit);
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Get single booking by ID ───────────────────────────────────────────── */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone avatar')
      .populate('worker',   'name email phone avatar workerProfile');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // Only allow customer, worker, or admin
    const uid = req.user.id;
    if (req.user.role !== 'admin' && booking.customer._id.toString() !== uid && booking.worker._id.toString() !== uid)
      return res.status(403).json({ message: 'Not authorized' });
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Update booking status ──────────────────────────────────────────────── */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, workerLocation, note, rejectionReason, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('customer worker');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const role = req.user.role;
    const uid  = req.user.id;

    // Role-based permission checks
    const workerStatuses   = ['accepted','rejected','scheduled','on-the-way','arrived','in-progress','waiting-for-payment','completed'];
    const customerStatuses = ['cancelled','disputed'];
    const adminStatuses    = ['cancelled','disputed','completed','requested','accepted','rejected','scheduled','on-the-way','arrived','in-progress','waiting-for-payment'];

    if (role === 'worker'   && !workerStatuses.includes(status))   return res.status(403).json({ message: 'Not allowed' });
    if (role === 'customer' && !customerStatuses.includes(status)) return res.status(403).json({ message: 'Not allowed' });

    // Validate status transitions
    const validTransitions = {
      requested:            ['accepted','rejected','cancelled'],
      accepted:             ['scheduled','on-the-way','cancelled','disputed'],
      scheduled:            ['on-the-way','cancelled','disputed'],
      'on-the-way':         ['arrived','cancelled'],
      arrived:              ['in-progress','cancelled'],
      'in-progress':        ['waiting-for-payment','completed','disputed'],
      'waiting-for-payment':['completed','disputed'],
      completed:            ['disputed'],
      cancelled:            [],
      rejected:             [],
      disputed:             [],
      pending:              ['accepted','rejected','cancelled'],
    };
    const allowed = validTransitions[booking.status] || [];
    if (role !== 'admin' && !allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from '${booking.status}' to '${status}'` });
    }

    const prevStatus = booking.status;
    booking.status = status;

    // Track timeline
    addTimeline(booking, status, note || getDefaultNote(status, booking), uid, role);

    // Handle specific transitions
    if (status === 'accepted') {
      booking.acceptedAt = new Date();
      await notify(booking.customer._id, '✅ Booking Accepted',
        `${booking.worker.name} accepted your ${booking.service} booking.`, booking._id);
      await sendAcceptedNotification(booking.customer.phone, booking.worker.name, booking.service).catch(() => {});
    }

    if (status === 'rejected') {
      booking.rejectionReason = rejectionReason || '';
      await notify(booking.customer._id, '❌ Booking Rejected',
        `${booking.worker.name} rejected your ${booking.service} booking. ${rejectionReason || ''}`, booking._id);
    }

    if (status === 'on-the-way') {
      if (workerLocation) {
        booking.workerLocation = { type: 'Point', coordinates: workerLocation.coordinates, lastUpdated: new Date() };
      }
      await notify(booking.customer._id, '🚗 Worker On The Way',
        `${booking.worker.name} is heading to your location.`, booking._id);
      await sendOnTheWayNotification(booking.customer.phone, booking.worker.name).catch(() => {});
    }

    if (status === 'arrived') {
      await notify(booking.customer._id, '📍 Worker Arrived',
        `${booking.worker.name} has arrived at your location.`, booking._id);
    }

    if (status === 'in-progress') {
      booking.startedAt = new Date();
      await notify(booking.customer._id, '🔧 Work Started',
        `${booking.worker.name} has started the ${booking.service} job.`, booking._id);
    }

    if (status === 'waiting-for-payment') {
      await notify(booking.customer._id, '💳 Payment Required',
        `${booking.worker.name} has completed the work. Please pay ₹${booking.amount}.`, booking._id);
    }

    if (status === 'completed') {
      booking.completedAt = new Date();
      if (booking.paymentMethod === 'cash') {
        booking.paymentStatus = 'paid';
        booking.paidAt = new Date();
      }

      const loyaltyPoints = calcLoyaltyPoints(booking.amount);
      booking.loyaltyPointsEarned = loyaltyPoints;

      await User.findByIdAndUpdate(booking.customer._id, {
        $inc: { loyaltyPoints, totalSpent: booking.amount },
      });

      const workerBookings = await Booking.countDocuments({ worker: booking.worker._id, status: 'completed' });
      await User.findByIdAndUpdate(booking.worker._id, {
        $inc: { 'workerProfile.totalJobs': 1 },
        'workerProfile.completionRate': Math.round((workerBookings / (workerBookings + 1)) * 100),
      });

      await notify(booking.customer._id, '✅ Job Completed',
        `${booking.worker.name} completed your ${booking.service}. Please leave a review.`, booking._id);
      await sendCompletedNotification(booking.customer.phone, booking.worker.name, booking.service, booking.amount).catch(() => {});

      // Create financial records for cash payments
      if (booking.paymentMethod === 'cash') {
        await createFinancialRecords(booking._id, 'cash_' + Date.now(), 'cash').catch(() => {});
      }
    }

    if (status === 'cancelled') {
      booking.cancellationReason = cancellationReason || '';
      booking.cancelledBy = role;
      const notifyTarget = role === 'customer' ? booking.worker._id : booking.customer._id;
      const cancellerName = role === 'customer' ? booking.customer.name : booking.worker.name;
      await notify(notifyTarget, '❌ Booking Cancelled',
        `${cancellerName} cancelled the ${booking.service} booking. ${cancellationReason || ''}`, booking._id);
    }

    if (status === 'disputed') {
      booking.hasDispute = true;
      await notify(booking.worker._id, '⚠️ Dispute Raised',
        `A dispute has been raised for your ${booking.service} booking.`, booking._id);
    }

    await booking.save();
    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name email phone avatar')
      .populate('worker',   'name email phone avatar workerProfile');
    res.json(populated);
  } catch (err) {
    console.error('updateBookingStatus error:', err);
    res.status(500).json({ message: err.message });
  }
};

const getDefaultNote = (status, booking) => {
  const notes = {
    accepted:             'Worker accepted the booking',
    rejected:             'Worker rejected the booking',
    scheduled:            'Booking confirmed and scheduled',
    'on-the-way':         'Worker is on the way',
    arrived:              'Worker arrived at location',
    'in-progress':        'Work in progress',
    'waiting-for-payment':'Work completed, awaiting payment',
    completed:            'Job completed successfully',
    cancelled:            'Booking cancelled',
    disputed:             'Dispute raised',
  };
  return notes[status] || status;
};

/* ── Add review (customer only, completed bookings only) ────────────────── */
exports.addReview = async (req, res) => {
  try {
    const { rating, comment, categories } = req.body;
    // Validate overall rating
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const booking = await Booking.findById(req.params.id).populate('worker');
    if (!booking)
      return res.status(404).json({ message: 'Booking not found' });
    if (booking.customer.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the customer can review this booking' });
    if (booking.status !== 'completed')
      return res.status(400).json({ message: 'Can only review completed bookings' });
    if (booking.review?.rating)
      return res.status(400).json({ message: 'You have already reviewed this booking' });

    // Validate category ratings if provided
    const cats = {};
    const catKeys = ['quality', 'behavior', 'punctuality', 'priceFairness'];
    catKeys.forEach(k => {
      if (categories?.[k] !== undefined) {
        const v = Number(categories[k]);
        if (v >= 1 && v <= 5) cats[k] = v;
      }
    });

    booking.review = {
      rating,
      categories: cats,
      comment: comment?.trim() || '',
      createdAt: new Date(),
      sentiment: analyzeSentiment(comment || ''),
    };
    await booking.save();

    // Recalculate worker's average ratings from all reviewed bookings
    const reviewedBookings = await Booking.find({
      worker: booking.worker._id,
      'review.rating': { $exists: true, $ne: null },
    });

    const count = reviewedBookings.length;
    const avgRating = reviewedBookings.reduce((s, b) => s + b.review.rating, 0) / count;

    // Category averages
    const breakdown = { quality: 0, behavior: 0, punctuality: 0, priceFairness: 0 };
    const catCounts = { quality: 0, behavior: 0, punctuality: 0, priceFairness: 0 };
    reviewedBookings.forEach(b => {
      catKeys.forEach(k => {
        if (b.review.categories?.[k]) {
          breakdown[k] += b.review.categories[k];
          catCounts[k]++;
        }
      });
    });
    catKeys.forEach(k => {
      if (catCounts[k] > 0) breakdown[k] = Math.round((breakdown[k] / catCounts[k]) * 10) / 10;
    });

    await User.findByIdAndUpdate(booking.worker._id, {
      'workerProfile.rating':            Math.round(avgRating * 10) / 10,
      'workerProfile.totalReviews':      count,
      'workerProfile.ratingBreakdown':   breakdown,
    });

    // Notify worker
    await notify(booking.worker._id, '⭐ New Review',
      `${req.user.name} rated you ${rating} stars for "${booking.service}".`, booking._id);

    // Alert admin if rating is low (≤ 2)
    if (rating <= 2) {
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const a of admins) {
        await notify(a._id, '⚠️ Low Rating Alert',
          `Worker ${booking.worker.name} received a ${rating}★ review for "${booking.service}". Review may need attention.`,
          booking._id);
      }
    }

    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name avatar')
      .populate('worker',   'name avatar');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Worker reply to review ─────────────────────────────────────────────── */
exports.replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ message: 'Reply text required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.worker.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the worker can reply to this review' });
    if (!booking.review?.rating)
      return res.status(400).json({ message: 'No review to reply to' });

    booking.review.workerReply     = reply.trim();
    booking.review.workerRepliedAt = new Date();
    await booking.save();

    // Notify customer
    await notify(booking.customer, '💬 Worker Replied to Your Review',
      `${req.user.name} replied to your review for "${booking.service}".`, booking._id);

    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Get worker reviews (public) ────────────────────────────────────────── */
exports.getWorkerReviews = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const bookings = await Booking.find({
      worker: workerId,
      'review.rating': { $exists: true, $ne: null },
      status: 'completed',
    })
      .populate('customer', 'name avatar')
      .sort('-review.createdAt')
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Booking.countDocuments({
      worker: workerId,
      'review.rating': { $exists: true, $ne: null },
      status: 'completed',
    });

    // Summary stats
    const all = await Booking.find({
      worker: workerId,
      'review.rating': { $exists: true, $ne: null },
      status: 'completed',
    });

    const count = all.length;
    const dist  = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach(b => { dist[Math.round(b.review.rating)] = (dist[Math.round(b.review.rating)] || 0) + 1; });
    const avg = count ? all.reduce((s, b) => s + b.review.rating, 0) / count : 0;

    res.json({
      reviews: bookings.map(b => ({
        _id:           b._id,
        service:       b.service,
        scheduledDate: b.scheduledDate,
        customer:      b.customer,
        review:        b.review,
      })),
      total,
      summary: {
        average:      Math.round(avg * 10) / 10,
        count,
        distribution: dist,
      },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Payment confirm ────────────────────────────────────────────────────── */
exports.updatePaymentDemo = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.paymentStatus        = 'paid';
    booking.paymentId            = req.body.paymentId || ('demo_' + Date.now());
    booking.paidAt               = new Date();
    booking.paymentMethod_detail = req.body.paymentMethod_detail || booking.paymentMethod;

    // Auto-complete if waiting for payment
    if (booking.status === 'waiting-for-payment') {
      booking.status      = 'completed';
      booking.completedAt = new Date();
      addTimeline(booking, 'completed', 'Payment received — job completed', req.user.id, req.user.role);

      const loyaltyPoints = calcLoyaltyPoints(booking.amount);
      booking.loyaltyPointsEarned = loyaltyPoints;
      await User.findByIdAndUpdate(booking.customer, { $inc: { loyaltyPoints, totalSpent: booking.amount } });
      const workerBookings = await Booking.countDocuments({ worker: booking.worker, status: 'completed' });
      await User.findByIdAndUpdate(booking.worker, {
        $inc: { 'workerProfile.totalJobs': 1 },
        'workerProfile.completionRate': Math.round((workerBookings / (workerBookings + 1)) * 100),
      });
    }

    await booking.save();
    await notify(booking.worker, '💰 Payment Confirmed',
      `Payment of ₹${booking.amount} confirmed for ${booking.service}.`, booking._id);
    // Also notify customer
    await Notification.create({ user: booking.customer, title: '✅ Payment Successful', message: `Your payment of ₹${booking.amount} for ${booking.service} was confirmed.`, type: 'payment', relatedId: booking._id }).catch(() => {});

    // Create financial records (PaymentTransaction + WorkerPayout)
    try {
      await createFinancialRecords(booking._id, booking.paymentId, booking.paymentMethod);
    } catch (finErr) {
      console.error('Financial records creation failed:', finErr.message);
    }

    res.json({ message: 'Payment confirmed', booking });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Live worker location update (called by worker app during active job) ── */
exports.updateWorkerLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ message: 'latitude and longitude required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.worker.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (!['on-the-way','arrived','in-progress'].includes(booking.status))
      return res.status(400).json({ message: 'Location updates only allowed for active bookings' });

    booking.workerLocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      lastUpdated: new Date(),
    };
    await booking.save();

    // Also update worker's global location
    await User.findByIdAndUpdate(req.user.id, {
      'location.coordinates': [parseFloat(longitude), parseFloat(latitude)],
      'workerProfile.isOnline': true,
      'workerProfile.lastSeen': new Date(),
    });

    res.json({ ok: true, workerLocation: booking.workerLocation });
  } catch (err) { res.status(500).json({ message: err.message }); }
};


exports.getWorkerAnalytics = async (req, res) => {
  try {
    const workerId = req.user.role === 'worker' ? req.user.id : req.params.workerId;
    const mongoose = require('mongoose');
    const wid = new mongoose.Types.ObjectId(workerId);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [monthlyEarnings, serviceStats, totalEarnings] = await Promise.all([
      Booking.aggregate([
        { $match: { worker: wid, status: 'completed', $or: [{ completedAt: { $gte: sixMonthsAgo } }, { createdAt: { $gte: sixMonthsAgo } }] } },
        { $group: { _id: { year: { $year: { $ifNull: ['$completedAt', '$createdAt'] } }, month: { $month: { $ifNull: ['$completedAt', '$createdAt'] } } }, earnings: { $sum: '$amount' }, jobs: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Booking.aggregate([
        { $match: { worker: wid, status: 'completed' } },
        { $group: { _id: '$service', count: { $sum: 1 }, earnings: { $sum: '$amount' } } },
        { $sort: { count: -1 } },
      ]),
      Booking.aggregate([
        { $match: { worker: wid, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, jobs: { $sum: 1 } } },
      ]),
    ]);

    res.json({ monthlyEarnings, serviceStats, totalEarnings: totalEarnings[0] || { total: 0, jobs: 0 } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Service history ────────────────────────────────────────────────────── */
exports.getServiceHistory = async (req, res) => {
  try {
    const query = req.user.role === 'customer' ? { customer: req.user.id } : { worker: req.user.id };
    const history = await Booking.find(query)
      .populate('customer', 'name avatar')
      .populate('worker',   'name avatar workerProfile')
      .sort('-completedAt -createdAt')
      .limit(50);
    res.json(history);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
