const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middleware/auth");
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
            to: `+91${to}` // Assuming Indian phone numbers
        });
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('SMS sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

// @route   POST /api/emergency/sos
// @desc    Trigger SOS emergency
// @access  Private
router.post("/sos", isAuthenticatedUser, async (req, res) => {
    try {
        const { location, description, severity } = req.body;

        if (!location || !location.latitude || !location.longitude) {
            return res.status(400).json({
                success: false,
                message: "Location is required for SOS"
            });
        }

        // Get user with emergency contacts
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Create emergency record
        const emergency = await Emergency.create({
            patient: req.user.id,
            type: 'sos',
            location,
            description: description || 'Emergency SOS triggered',
            severity: severity || 'high',
            status: 'active'
        });

        // Notify emergency contacts
        const contactedPersons = [];
        
        if (user.emergencyContacts && user.emergencyContacts.length > 0) {
            const sosMessage = `🚨 EMERGENCY ALERT 🚨\n\n${user.name} has triggered an SOS emergency!\n\nLocation: ${location.address || `${location.latitude}, ${location.longitude}`}\n\nDescription: ${description || 'Emergency situation'}\n\nPlease contact them immediately or call emergency services.\n\n- Cureon Health App`;

            for (const contact of user.emergencyContacts) {
                const smsResult = await sendSMS(contact.phone, sosMessage);
                
                contactedPersons.push({
                    name: contact.name,
                    phone: contact.phone,
                    relationship: contact.relationship,
                    status: smsResult.success ? 'sent' : 'failed'
                });
            }

            // Update emergency with contacted persons
            emergency.contactedPersons = contactedPersons;
            await emergency.save();
        }

        res.status(201).json({
            success: true,
            message: "SOS emergency triggered successfully",
            emergency,
            contactsNotified: contactedPersons.length
        });

    } catch (error) {
        console.error('SOS Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to trigger SOS",
            error: error.message
        });
    }
});

// @route   POST /api/emergency/ambulance
// @desc    Request ambulance
// @access  Private
router.post("/ambulance", isAuthenticatedUser, async (req, res) => {
    try {
        const { location, description, severity } = req.body;

        if (!location || !location.latitude || !location.longitude) {
            return res.status(400).json({
                success: false,
                message: "Location is required for ambulance request"
            });
        }

        const user = await User.findById(req.user.id);

        // Create emergency record with ambulance request
        const emergency = await Emergency.create({
            patient: req.user.id,
            type: 'ambulance',
            location,
            description: description || 'Ambulance requested',
            severity: severity || 'high',
            status: 'active',
            ambulanceDetails: {
                requested: true,
                status: 'requested'
            }
        });

        // Notify emergency contacts about ambulance request
        const contactedPersons = [];
        
        if (user.emergencyContacts && user.emergencyContacts.length > 0) {
            const ambulanceMessage = `🚑 AMBULANCE REQUESTED 🚑\n\n${user.name} has requested an ambulance!\n\nLocation: ${location.address || `${location.latitude}, ${location.longitude}`}\n\nDescription: ${description || 'Medical emergency'}\n\nAn ambulance has been requested. Please contact them or reach the location.\n\n- Cureon Health App`;

            for (const contact of user.emergencyContacts) {
                const smsResult = await sendSMS(contact.phone, ambulanceMessage);
                
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

        // In a real implementation, integrate with ambulance service API
        // For now, we'll simulate the request
        res.status(201).json({
            success: true,
            message: "Ambulance requested successfully. Emergency services will contact you shortly.",
            emergency,
            contactsNotified: contactedPersons.length,
            ambulanceInfo: {
                estimatedArrival: "10-15 minutes",
                emergencyNumber: "108", // National Ambulance Service India
                localNumber: "01765-222108" // Nabha Civil Hospital
            }
        });

    } catch (error) {
        console.error('Ambulance Request Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to request ambulance",
            error: error.message
        });
    }
});

// @route   GET /api/emergency/my
// @desc    Get user's emergency history
// @access  Private
router.get("/my", isAuthenticatedUser, async (req, res) => {
    try {
        const emergencies = await Emergency.find({ patient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            count: emergencies.length,
            emergencies
        });

    } catch (error) {
        console.error('Get Emergencies Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch emergencies",
            error: error.message
        });
    }
});

// @route   PUT /api/emergency/:id/resolve
// @desc    Resolve an emergency
// @access  Private
router.put("/:id/resolve", isAuthenticatedUser, async (req, res) => {
    try {
        const emergency = await Emergency.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency not found"
            });
        }

        if (emergency.patient.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to resolve this emergency"
            });
        }

        emergency.status = 'resolved';
        emergency.resolvedAt = Date.now();
        emergency.notes = req.body.notes || emergency.notes;

        await emergency.save();

        res.status(200).json({
            success: true,
            message: "Emergency resolved successfully",
            emergency
        });

    } catch (error) {
        console.error('Resolve Emergency Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to resolve emergency",
            error: error.message
        });
    }
});

// @route   PUT /api/emergency/:id/update-location
// @desc    Update emergency location
// @access  Private
router.put("/:id/update-location", isAuthenticatedUser, async (req, res) => {
    try {
        const { location } = req.body;

        if (!location || !location.latitude || !location.longitude) {
            return res.status(400).json({
                success: false,
                message: "Valid location is required"
            });
        }

        const emergency = await Emergency.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency not found"
            });
        }

        if (emergency.patient.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this emergency"
            });
        }

        emergency.location = location;
        await emergency.save();

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            emergency
        });

    } catch (error) {
        console.error('Update Location Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update location",
            error: error.message
        });
    }
});

module.exports = router;
