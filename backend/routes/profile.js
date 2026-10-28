const express = require('express');
const {
  updateProfile, updateLocation, updateOnlineStatus, getWorkerStats, removeAvatar,
  submitVerification, adminVerifyWorker, setTrustedCustomer, dismissNewUser,
  getCompletion, calculateCustomerTrust, getTrustScore
} = require('../controllers/profileController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

const router = express.Router();

router.patch('/', protect, upload.single('avatar'), updateProfile);
router.patch('/location', protect, updateLocation);
router.patch('/online-status', protect, updateOnlineStatus);
router.patch('/dismiss-new-user', protect, dismissNewUser);
router.get('/completion', protect, getCompletion);
router.get('/trust-score/:id?', protect, getTrustScore);
router.delete('/avatar', protect, removeAvatar);
router.get('/stats/:id?', protect, getWorkerStats);

// Verification
router.post('/verify/submit', protect, submitVerification);
router.patch('/verify/:id/admin', protect, adminOnly, adminVerifyWorker);
router.patch('/trusted/:id', protect, adminOnly, setTrustedCustomer);
router.post('/customer-trust/:id?', protect, calculateCustomerTrust);

module.exports = router;
