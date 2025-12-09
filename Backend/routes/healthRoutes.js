const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middleware/auth");
const HealthReading = require("../models/healthReadingModel");
const HealthThreshold = require("../models/healthThresholdModel");
const Emergency = require("../models/emergencyModel");
const User = require("../models/userModel");

// Twilio setup for SMS notifications
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
        
        // Create emergency record
        const emergency = await Emergency.create({
            patient: userId,
            type: 'sos',
            location: location || { latitude: 0, longitude: 0, address: 'Location unavailable' },
            description: `Auto-triggered: ${reading.alertMessage}`,
            severity: 'critical',
            status: 'active'
        });

        // Link emergency to health reading
        reading.emergencyId = emergency._id;
        await reading.save();

        // Notify emergency contacts
        const contactedPersons = [];
        
        if (user.emergencyContacts && user.emergencyContacts.length > 0) {
            const sosMessage = `🚨 CRITICAL HEALTH ALERT 🚨\n\n${user.name} has abnormal health readings!\n\n${reading.alertMessage}\n\nTime: ${new Date().toLocaleString()}\n\nThis is an automatic alert from their smartwatch. Please contact them immediately or call emergency services.\n\n- Cureon Health App`;

            for (const contact of user.emergencyContacts) {
                const smsResult = await sendSMS(contact.phone, sosMessage);
                
                contactedPersons.push({
                    name: contact.name,
                    phone: contact.phone,
                    relationship: contact.relationship,
                    status: smsResult.success ? 'sent' : 'failed'
                });
            }

            emergency.contactedPersons = contactedPersons;
            await emergency.save();
        }

        return { success: true, emergency, contactsNotified: contactedPersons.length };
    } catch (error) {
        console.error('Auto SOS Error:', error);
        return { success: false, error: error.message };
    }
};

// @route   POST /api/v1/health/reading
// @desc    Add health reading from smartwatch
// @access  Private
router.post("/reading", isAuthenticatedUser, async (req, res) => {
    try {
        const { type, value, source, location, notes } = req.body;

        if (!type || !value) {
            return res.status(400).json({
                success: false,
                message: "Type and value are required"
            });
        }

        // Get or create user thresholds
        let thresholds = await HealthThreshold.findOne({ user: req.user.id });
        if (!thresholds) {
            thresholds = await HealthThreshold.create({
                user: req.user.id,
                ...HealthThreshold.getDefaultThresholds()
            });
        }

        // Create health reading
        const reading = await HealthReading.create({
            user: req.user.id,
            type,
            value,
            source: source || { deviceType: 'other', deviceModel: 'boAt Storm SNO931' },
            location,
            notes,
            timestamp: new Date()
        });

        // Check for abnormality
        const abnormalityCheck = reading.checkAbnormality(thresholds);

        // Handle alerts based on severity
        if (abnormalityCheck.isAbnormal && thresholds.monitoringEnabled) {
            reading.alertTriggered = true;

            // Critical - Auto trigger SOS if enabled
            if (abnormalityCheck.severity === 'critical' && thresholds.alertPreferences.autoTriggerSOS) {
                reading.alertType = 'sos';
                await reading.save();
                
                const sosResult = await autoTriggerSOS(req.user.id, reading, location);
                
                return res.status(201).json({
                    success: true,
                    message: "Critical reading detected! SOS triggered automatically.",
                    reading,
                    alert: {
                        type: 'sos',
                        severity: 'critical',
                        message: abnormalityCheck.message,
                        sosTriggered: sosResult.success,
                        contactsNotified: sosResult.contactsNotified || 0
                    }
                });
            }

            // Warning - Send notification
            if (abnormalityCheck.severity === 'warning') {
                reading.alertType = 'notification';
                await reading.save();

                // Notify emergency contacts if enabled
                if (thresholds.alertPreferences.notifyEmergencyContacts) {
                    const user = await User.findById(req.user.id);
                    
                    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
                        const warningMessage = `⚠️ HEALTH WARNING ⚠️\n\n${user.name} has abnormal health readings:\n\n${abnormalityCheck.message}\n\nTime: ${new Date().toLocaleString()}\n\nPlease check on them.\n\n- Cureon Health App`;

                        for (const contact of user.emergencyContacts.slice(0, 1)) { // Only primary contact
                            if (contact.isPrimary) {
                                await sendSMS(contact.phone, warningMessage);
                            }
                        }
                    }
                }

                return res.status(201).json({
                    success: true,
                    message: "Warning: Abnormal reading detected",
                    reading,
                    alert: {
                        type: 'notification',
                        severity: 'warning',
                        message: abnormalityCheck.message
                    }
                });
            }
        }

        await reading.save();

        res.status(201).json({
            success: true,
            message: "Health reading recorded successfully",
            reading,
            alert: abnormalityCheck.isAbnormal ? {
                type: 'notification',
                severity: abnormalityCheck.severity,
                message: abnormalityCheck.message
            } : null
        });

    } catch (error) {
        console.error('Add Health Reading Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to add health reading",
            error: error.message
        });
    }
});

// @route   POST /api/v1/health/readings/bulk
// @desc    Add multiple health readings (for sync from smartwatch)
// @access  Private
router.post("/readings/bulk", isAuthenticatedUser, async (req, res) => {
    try {
        const { readings } = req.body;

        if (!readings || !Array.isArray(readings) || readings.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Readings array is required"
            });
        }

        // Get user thresholds
        let thresholds = await HealthThreshold.findOne({ user: req.user.id });
        if (!thresholds) {
            thresholds = await HealthThreshold.create({
                user: req.user.id,
                ...HealthThreshold.getDefaultThresholds()
            });
        }

        const savedReadings = [];
        const alerts = [];

        for (const readingData of readings) {
            const reading = await HealthReading.create({
                user: req.user.id,
                ...readingData,
                source: readingData.source || { deviceType: 'other', deviceModel: 'boAt Storm SNO931' }
            });

            const abnormalityCheck = reading.checkAbnormality(thresholds);
            
            if (abnormalityCheck.isAbnormal) {
                alerts.push({
                    readingId: reading._id,
                    type: reading.type,
                    severity: abnormalityCheck.severity,
                    message: abnormalityCheck.message
                });
            }

            await reading.save();
            savedReadings.push(reading);
        }

        res.status(201).json({
            success: true,
            message: `${savedReadings.length} readings synced successfully`,
            count: savedReadings.length,
            alerts: alerts.length > 0 ? alerts : null
        });

    } catch (error) {
        console.error('Bulk Add Readings Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to sync readings",
            error: error.message
        });
    }
});

// @route   GET /api/v1/health/readings
// @desc    Get user's health readings
// @access  Private
router.get("/readings", isAuthenticatedUser, async (req, res) => {
    try {
        const { type, startDate, endDate, limit = 100 } = req.query;

        const query = { user: req.user.id };
        
        if (type) {
            query.type = type;
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const readings = await HealthReading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: readings.length,
            readings
        });

    } catch (error) {
        console.error('Get Readings Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch readings",
            error: error.message
        });
    }
});

// @route   GET /api/v1/health/readings/stats
// @desc    Get health statistics
// @access  Private
router.get("/readings/stats", isAuthenticatedUser, async (req, res) => {
    try {
        const { type, days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const query = {
            user: req.user.id,
            timestamp: { $gte: startDate }
        };

        if (type) {
            query.type = type;
        }

        const readings = await HealthReading.find(query).sort({ timestamp: 1 });

        // Calculate statistics
        const stats = {
            totalReadings: readings.length,
            abnormalCount: readings.filter(r => r.isAbnormal).length,
            criticalCount: readings.filter(r => r.severity === 'critical').length,
            warningCount: readings.filter(r => r.severity === 'warning').length,
            byType: {}
        };

        // Group by type
        readings.forEach(reading => {
            if (!stats.byType[reading.type]) {
                stats.byType[reading.type] = {
                    count: 0,
                    values: [],
                    abnormalCount: 0
                };
            }
            stats.byType[reading.type].count++;
            stats.byType[reading.type].values.push({
                value: reading.value,
                timestamp: reading.timestamp,
                isAbnormal: reading.isAbnormal
            });
            if (reading.isAbnormal) {
                stats.byType[reading.type].abnormalCount++;
            }
        });

        res.status(200).json({
            success: true,
            period: `Last ${days} days`,
            stats
        });

    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message
        });
    }
});

// @route   GET /api/v1/health/thresholds
// @desc    Get user's health thresholds
// @access  Private
router.get("/thresholds", isAuthenticatedUser, async (req, res) => {
    try {
        let thresholds = await HealthThreshold.findOne({ user: req.user.id });
        
        if (!thresholds) {
            thresholds = await HealthThreshold.create({
                user: req.user.id,
                ...HealthThreshold.getDefaultThresholds()
            });
        }

        res.status(200).json({
            success: true,
            thresholds
        });

    } catch (error) {
        console.error('Get Thresholds Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch thresholds",
            error: error.message
        });
    }
});

// @route   PUT /api/v1/health/thresholds
// @desc    Update user's health thresholds
// @access  Private
router.put("/thresholds", isAuthenticatedUser, async (req, res) => {
    try {
        const updates = req.body;

        let thresholds = await HealthThreshold.findOne({ user: req.user.id });
        
        if (!thresholds) {
            thresholds = await HealthThreshold.create({
                user: req.user.id,
                ...updates
            });
        } else {
            Object.assign(thresholds, updates);
            thresholds.lastUpdated = Date.now();
            await thresholds.save();
        }

        res.status(200).json({
            success: true,
            message: "Thresholds updated successfully",
            thresholds
        });

    } catch (error) {
        console.error('Update Thresholds Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update thresholds",
            error: error.message
        });
    }
});

// @route   GET /api/v1/health/alerts
// @desc    Get abnormal readings with alerts
// @access  Private
router.get("/alerts", isAuthenticatedUser, async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const alerts = await HealthReading.find({
            user: req.user.id,
            isAbnormal: true,
            timestamp: { $gte: startDate }
        })
        .sort({ timestamp: -1 })
        .populate('emergencyId');

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {
        console.error('Get Alerts Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch alerts",
            error: error.message
        });
    }
});

module.exports = router;
