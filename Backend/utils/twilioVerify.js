const twilio = require('twilio');

// Send OTP using Twilio Verify API (Recommended)
const sendOTPVerify = async (phone) => {
    try {
        // Validate Twilio credentials
        if (!process.env.TWILIO_ACCOUNT_SID) {
            throw new Error('TWILIO_ACCOUNT_SID is not configured');
        }
        if (!process.env.TWILIO_AUTH_TOKEN) {
            throw new Error('TWILIO_AUTH_TOKEN is not configured');
        }
        if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
            throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured');
        }
        
        console.log('📱 Sending OTP via Twilio Verify...');
        console.log('   To:', phone);
        
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({
                to: phone,
                channel: 'sms'
            });
        
        console.log('✅ OTP sent successfully via Twilio Verify');
        console.log('   Verification SID:', verification.sid);
        console.log('   Status:', verification.status);
        console.log('   Valid:', verification.valid);
        
        return verification;
    } catch (error) {
        console.error('❌ Twilio Verify Error:', error.message);
        if (error.code) {
            console.error('   Error Code:', error.code);
        }
        if (error.moreInfo) {
            console.error('   More Info:', error.moreInfo);
        }
        throw error;
    }
};

// Verify OTP using Twilio Verify API (Recommended)
const verifyOTPVerify = async (phone, code) => {
    try {
        // Validate Twilio credentials
        if (!process.env.TWILIO_ACCOUNT_SID) {
            throw new Error('TWILIO_ACCOUNT_SID is not configured');
        }
        if (!process.env.TWILIO_AUTH_TOKEN) {
            throw new Error('TWILIO_AUTH_TOKEN is not configured');
        }
        if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
            throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured');
        }
        
        console.log('🔍 Verifying OTP via Twilio Verify...');
        console.log('   Phone:', phone);
        console.log('   Code:', code);
        
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({
                to: phone,
                code: code
            });
        
        console.log('✅ OTP verification response:');
        console.log('   Status:', verificationCheck.status);
        console.log('   Valid:', verificationCheck.valid);
        
        return verificationCheck;
    } catch (error) {
        console.error('❌ Twilio Verify Check Error:', error.message);
        if (error.code) {
            console.error('   Error Code:', error.code);
        }
        if (error.moreInfo) {
            console.error('   More Info:', error.moreInfo);
        }
        throw error;
    }
};

// Legacy SMS function (for non-OTP messages)
const sendSMS = async (options) => {
    try {
        // Validate Twilio credentials
        if (!process.env.TWILIO_ACCOUNT_SID) {
            throw new Error('TWILIO_ACCOUNT_SID is not configured');
        }
        if (!process.env.TWILIO_AUTH_TOKEN) {
            throw new Error('TWILIO_AUTH_TOKEN is not configured');
        }
        if (!process.env.TWILIO_PHONE_NUMBER) {
            throw new Error('TWILIO_PHONE_NUMBER is not configured');
        }
        
        console.log('📱 Sending SMS...');
        console.log('   To:', options.phone);
        console.log('   From:', process.env.TWILIO_PHONE_NUMBER);
        
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const message = await client.messages.create({
            body: options.message,
            to: options.phone,
            from: process.env.TWILIO_PHONE_NUMBER,
        });
        
        console.log('✅ SMS sent successfully');
        console.log('   Message SID:', message.sid);
        console.log('   Status:', message.status);
        
        return message;
    } catch (error) {
        console.error('❌ SMS Error:', error.message);
        if (error.code) {
            console.error('   Error Code:', error.code);
        }
        if (error.moreInfo) {
            console.error('   More Info:', error.moreInfo);
        }
        throw error;
    }
};

module.exports = {
    sendSMS,
    sendOTPVerify,
    verifyOTPVerify
};
