require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Fix admin
  const admin = await User.findOne({ role: 'admin' });
  if (admin) {
    admin.password = 'admin123';
    await admin.save();
    console.log('✅ Fixed admin:', admin.email, '→ password: admin123');
  }

  // Fix all customers and workers
  const users = await User.find({ role: { $in: ['customer', 'worker'] } });
  for (const u of users) {
    u.password = 'password123';
    await u.save();
    console.log('✅ Fixed', u.role + ':', u.email, '→ password: password123');
  }

  console.log('\nAll passwords fixed!');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
