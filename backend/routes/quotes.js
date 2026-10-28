const express = require('express');
const {
  createQuote, getIncomingQuotes, getMyQuotes, getQuotesByBooking,
  counterQuote, workerCounter, approveQuote, rejectQuote,
  markQuoteSeen, markViewed, askQuestion, answerQuestion,
  getAdminReviewQuotes, adminDecideQuote, expireQuotes
} = require('../controllers/quoteController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// User routes
router.post('/',                    createQuote);
router.get('/incoming',             getIncomingQuotes);       // customer
router.get('/my',                   getMyQuotes);             // worker
router.get('/booking/:bookingId',   getQuotesByBooking);
router.patch('/:id/viewed',         markViewed);
router.patch('/:id/seen',           markQuoteSeen);
router.patch('/:id/counter',        counterQuote);            // customer counter
router.patch('/:id/worker-counter', workerCounter);           // worker counter back
router.patch('/:id/approve',        approveQuote);
router.patch('/:id/reject',         rejectQuote);
router.post('/:id/questions',       askQuestion);
router.patch('/:id/questions/:questionId/answer', answerQuestion);

// Admin routes
router.get('/admin/review',         adminOnly, getAdminReviewQuotes);
router.patch('/admin/:id/decide',   adminOnly, adminDecideQuote);
router.post('/admin/expire',        adminOnly, expireQuotes);

module.exports = router;
