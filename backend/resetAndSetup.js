require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Message = require('./models/Message');

const reset = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal-jobs';
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    console.log('🗑️  Clearing all collections...');
    await Promise.all([
      User.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Message.deleteMany({}),
    ]);
    console.log('✅ All data cleared\n');

    console.log('👤 Creating fresh admin account...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      phone: '9999999999',
      role: 'admin',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: 'India'
      }
    });

    console.log('✅ Done!\n');
    console.log('═══════════════════════════════════');
    console.log('  Admin Login Credentials');
    console.log('═══════════════════════════════════');
    console.log('  📧 Email    : admin@test.com');
    console.log('  🔑 Password : admin123');
    console.log('  🌐 URL      : http://localhost:3001/login');
    console.log('═══════════════════════════════════\n');
    console.log('Database is clean. You can now register new users and add data.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

reset();
