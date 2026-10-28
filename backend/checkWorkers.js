const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hyperlocal-jobs');

async function checkWorkers() {
  try {
    console.log('🔍 Checking workers in database...\n');
    
    // Get all workers
    const allWorkers = await User.find({ role: 'worker' })
      .select('name email workerProfile.verificationStatus workerProfile.skills workerProfile.availability location');
    
    console.log(`📊 Total workers: ${allWorkers.length}`);
    
    if (allWorkers.length === 0) {
      console.log('❌ No workers found in database!');
      console.log('💡 You need to register some workers first.');
      process.exit(0);
    }
    
    // Check verification status
    const verifiedWorkers = allWorkers.filter(w => w.workerProfile?.verificationStatus === 'verified');
    const pendingWorkers = allWorkers.filter(w => w.workerProfile?.verificationStatus === 'pending');
    const rejectedWorkers = allWorkers.filter(w => w.workerProfile?.verificationStatus === 'rejected');
    
    console.log(`✅ Verified workers: ${verifiedWorkers.length}`);
    console.log(`⏳ Pending workers: ${pendingWorkers.length}`);
    console.log(`❌ Rejected workers: ${rejectedWorkers.length}\n`);
    
    // Show all workers
    console.log('📋 All workers:');
    allWorkers.forEach((worker, index) => {
      const status = worker.workerProfile?.verificationStatus || 'unknown';
      const skills = worker.workerProfile?.skills?.join(', ') || 'No skills';
      const availability = worker.workerProfile?.availability ? 'Available' : 'Not Available';
      const hasLocation = worker.location?.coordinates ? 'Has Location' : 'No Location';
      
      console.log(`${index + 1}. ${worker.name} (${worker.email})`);
      console.log(`   Status: ${status} | ${availability} | ${hasLocation}`);
      console.log(`   Skills: ${skills}\n`);
    });
    
    if (verifiedWorkers.length === 0) {
      console.log('⚠️  No verified workers found!');
      console.log('💡 Workers need to be verified by admin to appear in search.');
      console.log('🔧 Go to admin panel to verify workers.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkWorkers();