// Script to verify pharmacies by phone number
const mongoose = require('mongoose');
require('dotenv').config();

const Pharmacy = require('../models/pharmacyModel');

const verifyPharmacyByPhone = async (phoneNumber) => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database');

        // Find pharmacy by phone number
        const pharmacy = await Pharmacy.findOne({
            'contactInfo.phone': phoneNumber
        });

        if (!pharmacy) {
            console.log(`❌ No pharmacy found with phone number: ${phoneNumber}`);
            return;
        }

        console.log(`📋 Found pharmacy: ${pharmacy.name}`);
        console.log(`📍 Location: ${pharmacy.address.city}, ${pharmacy.address.state}`);
        console.log(`📊 Current status: ${pharmacy.verificationStatus}`);

        // Update verification status
        pharmacy.verificationStatus = 'verified';
        pharmacy.isVerified = true;
        pharmacy.status = 'active';
        await pharmacy.save();

        console.log(`✅ Pharmacy verified successfully!`);
        console.log(`📝 New status: ${pharmacy.verificationStatus}`);
        console.log(`🏥 Pharmacy ID: ${pharmacy._id}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from database');
    }
};

// Get phone number from command line argument
const phoneNumber = process.argv[2];

if (!phoneNumber) {
    console.log('❌ Please provide a phone number');
    console.log('Usage: node verifyPharmacy.js <phone_number>');
    console.log('Example: node verifyPharmacy.js 4444444444');
    process.exit(1);
}

verifyPharmacyByPhone(phoneNumber);
