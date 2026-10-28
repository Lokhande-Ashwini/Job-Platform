require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hyperlocal-jobs';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoUri);
    console.log('');

    // Check if ANY admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('-----------------------------------');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('-----------------------------------');
      console.log('Only ONE admin is allowed per platform.');
      console.log('');
      console.log('To create a new admin:');
      console.log('1. Delete existing admin from MongoDB');
      console.log('2. Run this script again');
      console.log('');
      console.log('Or login with existing admin credentials.');
      process.exit(0);
    }

    console.log('Creating admin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      phone: '9999999999',
      role: 'admin',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: 'Bangalore, India'
      },
      loyaltyPoints: 0,
      totalSpent: 0
    });

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('═══════════════════════════════════');
    console.log('📧 Email:    admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('═══════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT: Only ONE admin can exist.');
    console.log('');
    console.log('🌐 Login at: http://localhost:3001/login');
    console.log('');
    console.log('👨‍💼 Admin can:');
    console.log('   ✓ View platform statistics');
    console.log('   ✓ Verify/reject worker registrations');
    console.log('   ✓ View service demand analytics');
    console.log('   ✓ See top workers leaderboard');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error creating admin:', error.message);
    console.error('');
    if (error.message.includes('uri')) {
      console.error('💡 Tip: Make sure MongoDB is running');
      console.error('   Start MongoDB: mongod');
    }
    console.error('');
    process.exit(1);
  }
};

createAdmin();
