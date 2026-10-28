const { createOrder, verifyPayment } = require('../utils/razorpay');
const Booking            = require('../models/Booking');
const Notification       = require('../models/Notification');
const { createFinancialRecords } = require('./financeController');

exports.createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.customer.toString() !== req.user.id)
      return res.status(404).json({ message: 'Booking not found' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ message: 'Already paid' });
    const order = await createOrder(booking.amount);
    booking.paymentId = order.id;
    await booking.save();
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.verifyPaymentSignature = async (req, res) => {
  try {
    const { orderId, paymentId, signature, bookingId } = req.body;
    const isValid = verifyPayment(orderId, paymentId, signature);
    if (!isValid) return res.status(400).json({ message: 'Invalid payment signature' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.paymentStatus        = 'paid';
    booking.paymentId            = paymentId;
    booking.paidAt               = new Date();
    booking.paymentMethod_detail = 'Razorpay';

    // Auto-complete booking if it was waiting for payment
    if (booking.status === 'waiting-for-payment') {
      booking.status      = 'completed';
      booking.completedAt = new Date();
      booking.timeline.push({ status: 'completed', note: 'Payment received via Razorpay — job completed', byRole: 'system', at: new Date() });

      // Loyalty points
      const loyaltyPoints = Math.floor(booking.amount / 10);
      booking.loyaltyPointsEarned = loyaltyPoints;
      const User = require('../models/User');
      await User.findByIdAndUpdate(booking.customer, { $inc: { loyaltyPoints, totalSpent: booking.amount } });
      const completedCount = await Booking.countDocuments({ worker: booking.worker, status: 'completed' });
      await User.findByIdAndUpdate(booking.worker, {
        $inc: { 'workerProfile.totalJobs': 1 },
        'workerProfile.completionRate': Math.round((completedCount / (completedCount + 1)) * 100),
      });
    }

    await booking.save();

    await Notification.create({
      user: booking.worker, title: '💰 Payment Received',
      message: `Payment of ₹${booking.amount} received for ${booking.service}`,
      type: 'payment', relatedId: booking._id,
    });
    await Notification.create({
      user: booking.customer, title: '✅ Payment Successful',
      message: `Your payment of ₹${booking.amount} for ${booking.service} was confirmed.`,
      type: 'payment', relatedId: booking._id,
    }).catch(() => {});

    // Create financial records
    await createFinancialRecords(bookingId, paymentId, 'online').catch(() => {});

    res.json({ message: 'Payment verified successfully', booking });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
