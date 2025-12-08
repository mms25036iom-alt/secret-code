// Quick script to check if appointments exist in database
const mongoose = require('mongoose');
require('dotenv').config();

const Appointment = require('./models/appointmentModel');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('✅ Connected to MongoDB');
    
    try {
        // Count total appointments
        const count = await Appointment.countDocuments();
        console.log(`📊 Total appointments in database: ${count}`);
        
        // Get all appointments (without validation)
        const appointments = await Appointment.find({}).lean();
        console.log(`\n📋 Appointments found: ${appointments.length}`);
        
        if (appointments.length > 0) {
            console.log('\n📝 Sample appointment:');
            console.log(JSON.stringify(appointments[0], null, 2));
            
            // Check for missing fields
            const missingCancellationReason = appointments.filter(apt => !apt.hasOwnProperty('cancellationReason'));
            console.log(`\n⚠️  Appointments missing cancellationReason field: ${missingCancellationReason.length}`);
            
            // Status breakdown
            const statusCounts = {};
            appointments.forEach(apt => {
                statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
            });
            console.log('\n📊 Status breakdown:');
            console.log(statusCounts);
        } else {
            console.log('\n❌ No appointments found in database!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    process.exit(0);
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
