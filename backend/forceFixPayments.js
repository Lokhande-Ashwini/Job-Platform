const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hyperlocal-jobs');

async function forceFixPayments() {
  try {
    console.log('🔧 Force fixing all payment statuses...\n');
    
    // Get all bookings
    const allBookings = await Booking.find({});
    console.log(`📋 Found ${allBookings.length} total bookings`);
    
    // Update completed bookings to paid
    const completedResult = await Booking.updateMany(
      { status: 'completed' },
      { paymentStatus: 'paid' }
    );
    console.log(`✅ Updated ${completedResult.modifiedCount} completed bookings to 'paid'`);
    
    // Update non-completed bookings to pending (if they were somehow marked as paid)
    const pendingResult = await Booking.updateMany(
      { 
        status: { $ne: 'completed' },
        paymentStatus: 'paid'
      },
      { paymentStatus: 'pending' }
    );
    console.log(`🔄 Updated ${pendingResult.modifiedCount} non-completed bookings to 'pending'`);
    
    // Show current status
    const statusCounts = await Booking.aggregate([
      {
        $group: {
          _id: { status: '$status', paymentStatus: '$paymentStatus' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.status': 1, '_id.paymentStatus': 1 } }
    ]);
    
    console.log('\n📊 Current booking status summary:');
    statusCounts.forEach(item => {
      console.log(`   ${item._id.status} + ${item._id.paymentStatus}: ${item.count} bookings`);
    });
    
    // Show specific completed bookings
    const completedBookings = await Booking.find({ status: 'completed' })
      .select('service status paymentStatus amount createdAt')
      .sort('-createdAt');
    
    console.log('\n📋 Completed bookings:');
    completedBookings.forEach(booking => {
      console.log(`   ${booking.service} | ${booking.status} | ${booking.paymentStatus} | ₹${booking.amount}`);
    });
    
    console.log('\n✅ Payment status fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

forceFixPayments();