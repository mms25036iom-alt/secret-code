require('dotenv').config();
const twilio = require('twilio');

console.log('🔍 Testing Twilio Configuration...\n');

// Check environment variables
console.log('📋 Configuration:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '❌ Missing');
console.log('TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? '✅ Set' : '❌ Missing');
console.log('');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.error('❌ Twilio credentials are missing in .env file');
    process.exit(1);
}

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Test 1: Verify credentials
console.log('🧪 Test 1: Verifying Twilio credentials...');
client.api.accounts(process.env.TWILIO_ACCOUNT_SID)
    .fetch()
    .then(account => {
        console.log('✅ Credentials valid!');
        console.log('   Account Status:', account.status);
        console.log('   Account Type:', account.type);
        console.log('');
        
        // Test 2: Check Verify Service
        if (process.env.TWILIO_VERIFY_SERVICE_SID) {
            console.log('🧪 Test 2: Checking Verify Service...');
            return client.verify.v2
                .services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .fetch();
        } else {
            console.log('⚠️  TWILIO_VERIFY_SERVICE_SID not configured');
            return null;
        }
    })
    .then(service => {
        if (service) {
            console.log('✅ Verify Service is active!');
            console.log('   Service Name:', service.friendlyName);
            console.log('   Service SID:', service.sid);
            console.log('');
        }
        
        // Test 3: Send test SMS (commented out - uncomment to test)
        console.log('📝 To test SMS sending:');
        console.log('   1. Verify your phone number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        console.log('   2. Uncomment the test SMS code below');
        console.log('   3. Replace +91XXXXXXXXXX with your verified number');
        console.log('');
        
        /*
        // UNCOMMENT THIS TO TEST SMS
        const testPhone = '+91XXXXXXXXXX'; // Replace with your verified number
        
        console.log('🧪 Test 3: Sending test SMS...');
        return client.messages.create({
            body: 'Test message from Cureon - Your Twilio is working! 🎉',
            to: testPhone,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        */
    })
    .then(message => {
        if (message) {
            console.log('✅ Test SMS sent successfully!');
            console.log('   Message SID:', message.sid);
            console.log('   Status:', message.status);
            console.log('   To:', message.to);
            console.log('');
        }
        
        console.log('🎉 All tests completed!');
        console.log('');
        console.log('📌 Next Steps:');
        console.log('   1. Verify phone numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        console.log('   2. Check SMS logs at: https://console.twilio.com/us1/monitor/logs/sms');
        console.log('   3. Restart your backend server');
        console.log('');
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
        console.error('   Error Code:', error.code);
        console.error('');
        
        if (error.code === 20003) {
            console.log('💡 Solution: Check your Twilio credentials in .env file');
        } else if (error.code === 21608) {
            console.log('💡 Solution: Verify the phone number at Twilio console');
        } else if (error.code === 21211) {
            console.log('💡 Solution: Invalid phone number format. Use +91XXXXXXXXXX');
        }
        
        console.log('');
        console.log('📚 Twilio Error Codes: https://www.twilio.com/docs/api/errors');
    });
