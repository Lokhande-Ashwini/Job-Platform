const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hyperlocal-jobs');

async function fixPaymentStatus() {
  try {
    // Update all completed bookings to have paid status
    const result = await Booking.updateMany(
      { 
        status: 'completed',
        paymentStatus: 'pending'
      },
      { 
        paymentStatus: 'paid' 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} bookings to paid status`);
    
    // Show current bookings
    const bookings = await Booking.find({ status: 'completed' })
      .select('service status paymentStatus amount');
    
    console.log('\n📋 Current completed bookings:');
    bookings.forEach(booking => {
      console.log(`- ${booking.service} | Status: ${booking.status} | Payment: ${booking.paymentStatus} | Amount: ₹${booking.amount}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPaymentStatus();