// Health Alert Service - Handles health monitoring alerts and notifications

const User = require('../models/userModel');
const Emergency = require('../models/emergencyModel');

// Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
let twilioClient = null;

if (accountSid && authToken && twilioPhone) {
    try {
        twilioClient = require('twilio')(accountSid, authToken);
    } catch (error) {
        console.error('Twilio initialization failed:', error.message);
    }
}

// Send SMS notification
const sendSMS = async (to, message) => {
    if (!twilioClient) {
        console.log('Twilio not configured, SMS not sent to:', to);
        return { success: false, error: 'Twilio not configured' };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: twilioPhone,
            to: `+91${to}`
        });
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('SMS sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

// Auto-trigger SOS for critical readings
const autoTriggerSOS = async (userId, reading, location) => {
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Create emergency record
        const emergency = await Emergency.create({
            patient: userId,
            type: 'sos',
            location: location || { 
                latitude: 0, 
                longitude: 0, 
                address: 'Location unavailable' 
            },
            description: `Auto-triggered by smartwatch: ${reading.alertMessage}`,
            severity: 'critical',
            status: 'active',
            triggeredBy: 'smartwatch',
            healthReadingId: reading._id
        });

        // Link emergency to health reading
        reading.emergencyId = emergency._id;
        await reading.save();

        // Notify emergency contacts
        const contactedPersons = [];
        
        if (user.emergencyContacts && user.emergencyContacts.length > 0) {
            const sosMessage = `🚨 CRITICAL HEALTH ALERT 🚨\n\n${user.name} has abnormal health readings detected by their smartwatch!\n\n${reading.alertMessage}\n\nTime: ${new Date().toLocaleString()}\n\nThis is an automatic alert. Please contact them immediately or call emergency services if needed.\n\n- Cureon Health App`;

            for (const contact of user.emergencyContacts) {
                const smsResult = await sendSMS(contact.phone, sosMessage);
                
                contactedPersons.push({
                    name: contact.name,
                    phone: contact.phone,
                    relationship: contact.relationship,
                    status: smsResult.success ? 'sent' : 'failed',
                    sentAt: new Date()
                });

                console.log(`SOS SMS to ${contact.name} (${contact.phone}): ${smsResult.success ? 'Sent' : 'Failed'}`);
            }

            emergency.contactedPersons = contactedPersons;
            await emergency.save();
        }

        console.log(`✅ Auto-SOS triggered for user ${user.name} (${userId})`);
        console.log(`   Emergency ID: ${emergency._id}`);
        console.log(`   Contacts notified: ${contactedPersons.length}`);

        return { 
            success: true, 
            emergency, 
            contactsNotified: contactedPersons.length,
            contactedPersons 
        };

    } catch (error) {
        console.error('Auto SOS Error:', error);
        return { success: false, error: error.message };
    }
};

// Send warning notification to emergency contacts
const sendWarningNotification = async (userId, reading) => {
    try {
        const user = await User.findById(userId);
        
        if (!user || !user.emergencyContacts || user.emergencyContacts.length === 0) {
            return { success: false, message: 'No emergency contacts' };
        }

        const warningMessage = `⚠️ HEALTH WARNING ⚠️\n\n${user.name} has abnormal health readings:\n\n${reading.alertMessage}\n\nTime: ${new Date().toLocaleString()}\n\nPlease check on them when possible.\n\n- Cureon Health App`;

        // Only notify primary contact for warnings
        const primaryContact = user.emergencyContacts.find(c => c.isPrimary);
        
        if (primaryContact) {
            const smsResult = await sendSMS(primaryContact.phone, warningMessage);
            
            console.log(`Warning SMS to ${primaryContact.name}: ${smsResult.success ? 'Sent' : 'Failed'}`);
            
            return { 
                success: smsResult.success, 
                contactNotified: primaryContact.name 
            };
        }

        return { success: false, message: 'No primary contact found' };

    } catch (error) {
        console.error('Warning notification error:', error);
        return { success: false, error: error.message };
    }
};

// Check if reading is within quiet hours
const isQuietHours = (thresholds) => {
    if (!thresholds.alertPreferences.quietHours.enabled) {
        return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = thresholds.alertPreferences.quietHours.start;
    const end = thresholds.alertPreferences.quietHours.end;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
        return currentTime >= start || currentTime <= end;
    }
    
    return currentTime >= start && currentTime <= end;
};

// Process health reading and trigger appropriate alerts
const processHealthReading = async (reading, thresholds, userId, location) => {
    try {
        // Check for abnormality
        const abnormalityCheck = reading.checkAbnormality(thresholds);

        if (!abnormalityCheck.isAbnormal || !thresholds.monitoringEnabled) {
            return { 
                success: true, 
                alert: null,
                message: 'Reading is normal' 
            };
        }

        // Update reading with alert info
        reading.alertTriggered = true;

        // Check quiet hours (but always alert for critical)
        const inQuietHours = isQuietHours(thresholds);
        if (inQuietHours && abnormalityCheck.severity !== 'critical') {
            console.log('Quiet hours active, suppressing non-critical alert');
            reading.alertType = 'notification';
            await reading.save();
            return {
                success: true,
                alert: {
                    type: 'notification',
                    severity: abnormalityCheck.severity,
                    message: abnormalityCheck.message,
                    suppressed: true,
                    reason: 'quiet_hours'
                }
            };
        }

        // Handle critical readings - Auto trigger SOS
        if (abnormalityCheck.severity === 'critical' && thresholds.alertPreferences.autoTriggerSOS) {
            reading.alertType = 'sos';
            await reading.save();
            
            const sosResult = await autoTriggerSOS(userId, reading, location);
            
            return {
                success: true,
                alert: {
                    type: 'sos',
                    severity: 'critical',
                    message: abnormalityCheck.message,
                    sosTriggered: sosResult.success,
                    contactsNotified: sosResult.contactsNotified || 0,
                    emergencyId: sosResult.emergency?._id
                }
            };
        }

        // Handle warning readings
        if (abnormalityCheck.severity === 'warning') {
            reading.alertType = 'notification';
            await reading.save();

            // Notify emergency contacts if enabled
            if (thresholds.alertPreferences.notifyEmergencyContacts) {
                await sendWarningNotification(userId, reading);
            }

            return {
                success: true,
                alert: {
                    type: 'notification',
                    severity: 'warning',
                    message: abnormalityCheck.message
                }
            };
        }

        return { 
            success: true, 
            alert: {
                type: 'notification',
                severity: abnormalityCheck.severity,
                message: abnormalityCheck.message
            }
        };

    } catch (error) {
        console.error('Process health reading error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendSMS,
    autoTriggerSOS,
    sendWarningNotification,
    processHealthReading,
    isQuietHours
};
