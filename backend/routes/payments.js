const express = require('express');
const { createPaymentOrder, verifyPaymentSignature } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPaymentSignature);
router.get('/summary', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const mongoose = require('mongoose');
    const isAdmin = req.user.role === 'admin';
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const match = isAdmin ? { paymentStatus: 'paid' } : {
      $or: [{ customer: uid }, { worker: uid }],
      paymentStatus: 'paid'
    };
    const summary = await Booking.aggregate([
      { $match: match },
      { $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);
    const pendingMatch = isAdmin
      ? { paymentStatus: 'pending', status: 'completed' }
      : { $or: [{ customer: uid }, { worker: uid }], paymentStatus: 'pending', status: 'completed' };
    const pending = await Booking.countDocuments(pendingMatch);
    res.json({ summary, pendingCount: pending });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
