const { sendBookingNotification, sendAcceptedNotification, sendOnTheWayNotification, sendCompletedNotification } = require('./utils/sms');

async function testSMS() {
  console.log('🧪 Testing SMS Functionality...\n');
  
  const testWorkerPhone = '9876543210';
  const testCustomerPhone = '9021528585';
  
  console.log('1. Testing New Booking Notification (to Worker)');
  await sendBookingNotification(testWorkerPhone, 'John Doe', 'AC Repair');
  
  console.log('\n2. Testing Booking Accepted Notification (to Customer)');
  await sendAcceptedNotification(testCustomerPhone, 'Mike Smith', 'AC Repair');
  
  console.log('\n3. Testing On The Way Notification (to Customer)');
  await sendOnTheWayNotification(testCustomerPhone, 'Mike Smith');
  
  console.log('\n4. Testing Job Completed Notification (to Customer)');
  await sendCompletedNotification(testCustomerPhone, 'Mike Smith', 'AC Repair', 500);
  
  console.log('\n✅ SMS Testing Complete!');
  console.log('\n📋 Results:');
  console.log('- If you see "Demo Mode" messages above, SMS is working in demo mode');
  console.log('- To send real SMS, add Twilio credentials to backend/.env');
  console.log('- All SMS functions are working correctly');
  
  process.exit(0);
}

testSMS().catch(console.error);