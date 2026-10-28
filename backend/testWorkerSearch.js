const axios = require('axios');

async function testWorkerSearch() {
  try {
    console.log('🧪 Testing worker search API...\n');
    
    // Test 1: Search without location
    console.log('1. Testing search without location:');
    const response1 = await axios.get('http://localhost:5000/api/workers/search');
    console.log(`   Found ${response1.data.length} workers`);
    
    if (response1.data.length > 0) {
      console.log('   First worker:', response1.data[0].name);
    }
    
    // Test 2: Search with location (Mumbai coordinates)
    console.log('\n2. Testing search with location (Mumbai):');
    const response2 = await axios.get('http://localhost:5000/api/workers/search?lat=19.0760&lng=72.8777&radius=50000');
    console.log(`   Found ${response2.data.length} workers`);
    
    if (response2.data.length > 0) {
      console.log('   First worker:', response2.data[0].name);
      console.log('   Recommendation score:', response2.data[0].recommendationScore);
    }
    
    // Test 3: Search with skill filter
    console.log('\n3. Testing search with skill filter (Electrician):');
    const response3 = await axios.get('http://localhost:5000/api/workers/search?skill=Electrician');
    console.log(`   Found ${response3.data.length} workers`);
    
    if (response3.data.length > 0) {
      console.log('   First worker:', response3.data[0].name);
    }
    
    console.log('\n✅ API tests completed!');
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testWorkerSearch();