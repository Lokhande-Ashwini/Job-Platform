require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const testAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hyperlocal-jobs';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin user found!');
      console.log('Run: node createAdmin.js');
      process.exit(1);
    }

    console.log('✅ Admin found:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    
    // Test password
    const testPassword = 'admin123';
    const isValid = await admin.comparePassword(testPassword);
    
    console.log('');
    console.log('Password Test:');
    console.log('   Testing password:', testPassword);
    console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      console.log('');
      console.log('⚠️  Password is incorrect!');
      console.log('Fixing password...');
      
      admin.password = testPassword; // This will trigger the pre-save hook to hash it
      await admin.save();
      
      console.log('✅ Password updated to: admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testAdmin();
