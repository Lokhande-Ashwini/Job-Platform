const express = require('express');
const {
  createDispute, getMyDisputes, getAllDisputes,
  updateDisputeStatus, resolveDispute, markDisputesSeen,
  addEvidence, assignDispute, setPriority, addAdminNote, suspendUser,
} = require('../controllers/disputeController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// User routes
router.post('/',              createDispute);
router.get('/my',             getMyDisputes);
router.patch('/seen',         markDisputesSeen);
router.patch('/:id/evidence', addEvidence);

// Admin routes
router.get('/',                    adminOnly, getAllDisputes);
router.patch('/:id/status',        adminOnly, updateDisputeStatus);
router.patch('/:id/assign',        adminOnly, assignDispute);
router.patch('/:id/priority',      adminOnly, setPriority);
router.post('/:id/note',           adminOnly, addAdminNote);
router.post('/:id/suspend',        adminOnly, suspendUser);
router.patch('/:id/resolve',       adminOnly, resolveDispute); // legacy

module.exports = router;
