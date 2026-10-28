const express = require('express');
const {
  createBooking, getBookings, getBookingById, updateBookingStatus,
  addReview, replyToReview, getWorkerReviews,
  updatePaymentDemo, getWorkerAnalytics, getServiceHistory,
  updateWorkerLocation,
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/analytics/worker/:workerId?', protect, getWorkerAnalytics);
router.get('/history',                     protect, getServiceHistory);
router.get('/reviews/:workerId',           getWorkerReviews); // public

router.post('/',                    protect, createBooking);
router.get('/',                     protect, getBookings);
router.get('/:id',                  protect, getBookingById);
router.patch('/:id/status',         protect, updateBookingStatus);
router.patch('/:id/location',       protect, updateWorkerLocation);  // live location tracking
router.post('/:id/review',          protect, addReview);
router.patch('/:id/review/reply',   protect, replyToReview);
router.patch('/:id/payment-demo',   protect, updatePaymentDemo);

module.exports = router;
