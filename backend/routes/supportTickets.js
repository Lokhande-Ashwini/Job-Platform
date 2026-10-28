const express = require('express');
const {
  createTicket, getMyTickets, sendMessage, getAllTickets,
  getTicket, updateTicket, getTicketStats, markTicketRead,
  assignToSelf, addInternalNote, escalateTicket, reopenTicket,
  convertToDispute, convertToRefund
} = require('../controllers/supportTicketController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// User routes
router.post('/',          createTicket);
router.get('/my',         getMyTickets);
router.get('/stats',      adminOnly, getTicketStats);
router.get('/',           adminOnly, getAllTickets);
router.get('/:id',        getTicket);
router.post('/:id/messages',      sendMessage);
router.patch('/:id/read',         markTicketRead);

// Admin-only actions
router.patch('/:id',              adminOnly, updateTicket);
router.patch('/:id/assign',       adminOnly, assignToSelf);
router.post('/:id/internal-note', adminOnly, addInternalNote);
router.patch('/:id/escalate',     adminOnly, escalateTicket);
router.patch('/:id/reopen',       adminOnly, reopenTicket);
router.patch('/:id/convert-dispute', adminOnly, convertToDispute);
router.patch('/:id/convert-refund',  adminOnly, convertToRefund);

module.exports = router;
