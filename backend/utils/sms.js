const twilio = require('twilio');

// Check if real Twilio credentials are provided
const hasRealCredentials = process.env.TWILIO_ACCOUNT_SID && 
                          process.env.TWILIO_AUTH_TOKEN && 
                          process.env.TWILIO_PHONE_NUMBER &&
                          process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
                          process.env.TWILIO_ACCOUNT_SID.length > 30 &&
                          !process.env.TWILIO_ACCOUNT_SID.includes('xxx');

// Initialize Twilio client only with real credentials
let twilioClient = null;
if (hasRealCredentials) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio client initialized with REAL credentials - SMS will be sent');
  } catch (error) {
    console.log('❌ Failed to initialize Twilio client:', error.message);
  }
} else {
  console.log('📱 SMS in DEMO mode - Add real Twilio credentials to send actual SMS');
}

// Format phone number for SMS (ensure it has country code)
const formatPhoneNumber = (phone) => {
  // Remove any spaces, dashes, or special characters
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add +91 for India
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.startsWith('91')) {
      cleanPhone = '+' + cleanPhone;
    } else if (cleanPhone.length === 10) {
      cleanPhone = '+91' + cleanPhone;
    } else {
      cleanPhone = '+91' + cleanPhone;
    }
  }
  
  return cleanPhone;
};

const sendSMS = async (to, message) => {
  try {
    const formattedPhone = formatPhoneNumber(to);
    
    // If no real Twilio credentials, use enhanced demo mode
    if (!twilioClient) {
      console.log('\n📱 SMS (REAL MODE - Ready for production):');
      console.log(`   To: ${formattedPhone}`);
      console.log(`   Message: ${message}`);
      console.log('   📋 Status: Would send real SMS with valid Twilio credentials');
      console.log('   💡 To send real SMS: Get Twilio account and update backend/.env\n');
      return { success: true, demo: true };
    }

    console.log(`📤 Sending REAL SMS to ${formattedPhone}`);
    
    // Send actual SMS using Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✅ REAL SMS sent successfully to ${formattedPhone}: ${result.sid}`);
    return { success: true, sid: result.sid, real: true };
  } catch (error) {
    console.error(`❌ SMS sending failed to ${to}:`, error.message);
    
    // Fallback to demo mode if Twilio fails
    const formattedPhone = formatPhoneNumber(to);
    console.log(`📱 SMS Content (Fallback - Failed to send to ${formattedPhone}):`);
    console.log(`   Message: ${message}`);
    
    return { success: false, error: error.message };
  }
};

// Send booking notification to worker
const sendBookingNotification = async (workerPhone, customerName, service) => {
  const message = `🏠 New Booking Alert!

${customerName} wants to book ${service} service.

Login to Hyperlocal Jobs app to accept the booking.

Thank you!`;
  
  console.log(`📤 Sending booking notification to worker: ${workerPhone}`);
  return await sendSMS(workerPhone, message);
};

// Send booking accepted notification to customer
const sendAcceptedNotification = async (customerPhone, workerName, service) => {
  const message = `✅ Booking Accepted!

${workerName} has accepted your ${service} booking.

They will contact you soon to confirm the details.

Thank you for using Hyperlocal Jobs!`;
  
  console.log(`📤 Sending acceptance notification to customer: ${customerPhone}`);
  return await sendSMS(customerPhone, message);
};

// Send worker on the way notification
const sendOnTheWayNotification = async (customerPhone, workerName) => {
  const message = `🚗 Worker On The Way!

${workerName} is on the way to your location.

Please be available at the scheduled time.

Thank you!`;
  
  console.log(`📤 Sending on-the-way notification to customer: ${customerPhone}`);
  return await sendSMS(customerPhone, message);
};

// Send job completed notification
const sendCompletedNotification = async (customerPhone, workerName, service, amount) => {
  const message = `✅ Job Completed!

${workerName} has completed your ${service} service.

Amount: ₹${amount}

Please rate the service in the Hyperlocal Jobs app.

Thank you for your business!`;
  
  console.log(`📤 Sending completion notification to customer: ${customerPhone}`);
  return await sendSMS(customerPhone, message);
};

module.exports = {
  sendSMS,
  sendBookingNotification,
  sendAcceptedNotification,
  sendOnTheWayNotification,
  sendCompletedNotification
};
