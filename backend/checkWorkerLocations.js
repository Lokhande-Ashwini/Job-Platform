const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hyperlocal-jobs');

async function checkWorkerLocations() {
  try {
    console.log('📍 Checking worker locations...\n');
    
    const workers = await User.find({ role: 'worker' })
      .select('name location workerProfile.verificationStatus');
    
    workers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.name}`);
      console.log(`   Status: ${worker.workerProfile?.verificationStatus}`);
      
      if (worker.location?.coordinates) {
        const [lng, lat] = worker.location.coordinates;
        console.log(`   Location: ${lat}, ${lng} (lat, lng)`);
        console.log(`   Address: ${worker.location.address || 'No address'}`);
      } else {
        console.log(`   Location: ❌ No location data`);
      }
      console.log('');
    });
    
    // Test distance calculation from Mumbai
    const mumbaiLat = 19.0760;
    const mumbaiLng = 72.8777;
    
    console.log(`🏙️ Distance from Mumbai (${mumbaiLat}, ${mumbaiLng}):`);
    workers.forEach(worker => {
      if (worker.location?.coordinates) {
        const [lng, lat] = worker.location.coordinates;
        const distance = calculateDistance(mumbaiLat, mumbaiLng, lat, lng);
        console.log(`   ${worker.name}: ${distance.toFixed(1)} km`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

checkWorkerLocations();