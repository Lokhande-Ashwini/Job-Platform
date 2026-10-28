const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (amount, currency = 'INR') => {
  try {
    const options = {
      amount: amount * 100, // amount in paise
      currency,
      receipt: `receipt_${Date.now()}`
    };
    return await razorpay.orders.create(options);
  } catch (error) {
    throw new Error('Payment order creation failed');
  }
};

const verifyPayment = (orderId, paymentId, signature) => {
  const crypto = require('crypto');
  const text = orderId + '|' + paymentId;
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');
  return generated_signature === signature;
};

module.exports = { createOrder, verifyPayment };
