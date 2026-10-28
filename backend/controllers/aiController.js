const { analyzeSentiment, analyzePriceFairness, calculateTrustScore, detectSuspiciousActivity, suggestBookingPrice } = require('../utils/aiEngine');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Analyze sentiment of a review text
exports.reviewSentiment = (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Text is required' });
  res.json(analyzeSentiment(text));
};

// Price fairness check for a worker's rate
exports.priceFairness = (req, res) => {
  const { skill, hourlyRate } = req.query;
  if (!skill || !hourlyRate) return res.status(400).json({ message: 'skill and hourlyRate required' });
  res.json(analyzePriceFairness(skill, parseFloat(hourlyRate)));
};

// Trust score for a worker
exports.workerTrustScore = async (req, res) => {
  try {
    const worker = await User.findById(req.params.workerId).select('-password');
    if (!worker || worker.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });
    res.json(calculateTrustScore(worker));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Suspicious activity flags for admin
exports.suspiciousFlags = async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-password');
    const results = [];
    for (const worker of workers) {
      const bookings = await Booking.find({ worker: worker._id }).lean();
      const flags = detectSuspiciousActivity(worker, bookings);
      if (flags.length > 0) {
        results.push({ worker: { _id: worker._id, name: worker.name, email: worker.email, workerProfile: worker.workerProfile }, flags });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Price suggestion for a booking
exports.pricesuggestion = (req, res) => {
  const { skill, workerRate, estimatedHours } = req.query;
  if (!skill || !workerRate) return res.status(400).json({ message: 'skill and workerRate required' });
  res.json(suggestBookingPrice(skill, parseFloat(workerRate), parseFloat(estimatedHours) || 2));
};

// Bulk sentiment analysis of all reviews (admin analytics)
exports.reviewAnalytics = async (req, res) => {
  try {
    const bookings = await Booking.find({ 'review.comment': { $exists: true, $ne: '' } })
      .select('review service worker')
      .populate('worker', 'name');
    const analyzed = bookings.map(b => ({
      service: b.service,
      worker: b.worker?.name,
      rating: b.review.rating,
      comment: b.review.comment,
      sentiment: analyzeSentiment(b.review.comment)
    }));
    const summary = {
      total: analyzed.length,
      positive: analyzed.filter(a => a.sentiment.label === 'positive').length,
      neutral: analyzed.filter(a => a.sentiment.label === 'neutral').length,
      negative: analyzed.filter(a => a.sentiment.label === 'negative').length,
      reviews: analyzed
    };
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
