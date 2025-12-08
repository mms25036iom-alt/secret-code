require('dotenv').config();
const { sendOTP, verifyOTP } = require('./utils/twilioVerify');

console.log('🧪 Testing Twilio Verify Service Integration\n');

// Configuration check
console.log('📋 Configuration:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? '✅ Set' : '❌ Missing');
console.log('');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    console.error('❌ Missing Twilio configuration in .env file');
    process.exit(1);
}

// Test phone number - REPLACE THIS WITH YOUR VERIFIED NUMBER
const TEST_PHONE = '8286643512'; // Your phone number without +91

console.log('📱 Test Phone Number:', `+91${TEST_PHONE}`);
console.log('');
console.log('⚠️  IMPORTANT: Make sure this number is verified in Twilio Console:');
console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
console.log('');

// Test 1: Send OTP
console.log('🧪 Test 1: Sending OTP...');
sendOTP(TEST_PHONE)
    .then(result => {
        console.log('✅ OTP sent successfully!');
        console.log('   Status:', result.status);
        console.log('   SID:', result.sid);
        console.log('');
        
        // Prompt for OTP verification
        console.log('📝 Check your phone for the OTP');
        console.log('');
        console.log('🧪 Test 2: To verify OTP, run:');
        console.log(`   node -e "require('./utils/twilioVerify').verifyOTP('${TEST_PHONE}', 'YOUR_OTP').then(r => console.log('Valid:', r))"`);
        console.log('');
        console.log('Or manually test verification in your app');
        console.log('');
        
        // Example verification (commented out)
        /*
        console.log('🧪 Test 2: Verifying OTP...');
        console.log('Enter the OTP you received:');
        
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        readline.question('OTP: ', (otpCode) => {
            verifyOTP(TEST_PHONE, otpCode)
                .then(isValid => {
                    if (isValid) {
                        console.log('✅ OTP is valid!');
                    } else {
                        console.log('❌ OTP is invalid or expired');
                    }
                    readline.close();
                })
                .catch(error => {
                    console.error('❌ Verification error:', error.message);
                    readline.close();
                });
        });
        */
    })
    .catch(error => {
        console.error('❌ Error sending OTP:', error.message);
        console.error('');
        
        // Common error solutions
        if (error.message.includes('Invalid phone number')) {
            console.log('💡 Solution: Check phone number format (+91XXXXXXXXXX)');
        } else if (error.message.includes('Max send attempts')) {
            console.log('💡 Solution: Wait a few minutes before trying again');
        } else if (error.message.includes('Too many requests')) {
            console.log('💡 Solution: Rate limit reached. Wait before retrying.');
        } else {
            console.log('💡 Solution: Check Twilio Console logs:');
            console.log('   https://console.twilio.com/us1/monitor/logs/verify');
        }
        
        console.log('');
        console.log('📚 Twilio Verify Docs: https://www.twilio.com/docs/verify/api');
    });
