const express = require('express');
const { reviewSentiment, priceFairness, workerTrustScore, suspiciousFlags, pricesuggestion, reviewAnalytics } = require('../controllers/aiController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/sentiment', protect, reviewSentiment);
router.get('/price-fairness', protect, priceFairness);
router.get('/trust-score/:workerId', protect, workerTrustScore);
router.get('/price-suggestion', protect, pricesuggestion);
router.get('/suspicious-flags', protect, adminOnly, suspiciousFlags);
router.get('/review-analytics', protect, adminOnly, reviewAnalytics);

module.exports = router;
