const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hyperlocal-jobs');

async function fixWorkerLocations() {
  try {
    console.log('🔧 Fixing worker locations...\n');
    
    // Fix XYZ worker with invalid coordinates (0,0)
    const result = await User.updateOne(
      { 
        name: 'XYZ',
        role: 'worker',
        'location.coordinates': [0, 0]
      },
      {
        $set: {
          'location.coordinates': [72.8777, 19.0760], // Mumbai coordinates [lng, lat]
          'location.address': 'Mumbai, Maharashtra'
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} worker location(s)`);
    
    // Show updated locations
    const workers = await User.find({ role: 'worker' })
      .select('name location workerProfile.verificationStatus');
    
    console.log('\n📍 Updated worker locations:');
    workers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.name}`);
      if (worker.location?.coordinates) {
        const [lng, lat] = worker.location.coordinates;
        console.log(`   Location: ${lat}, ${lng} (lat, lng)`);
        console.log(`   Address: ${worker.location.address || 'No address'}`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkerLocations();