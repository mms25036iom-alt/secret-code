const mongoose = require("mongoose");

const healthThresholdSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    // Heart Rate thresholds (bpm)
    heartRate: {
        warning: {
            min: { type: Number, default: 50 },
            max: { type: Number, default: 120 }
        },
        critical: {
            min: { type: Number, default: 40 },
            max: { type: Number, default: 150 }
        }
    },
    // Blood Pressure thresholds (mmHg)
    bloodPressure: {
        warning: {
            systolic: { type: Number, default: 140 },
            diastolic: { type: Number, default: 90 }
        },
        critical: {
            systolic: { type: Number, default: 180 },
            diastolic: { type: Number, default: 120 }
        }
    },
    // SpO2 thresholds (%)
    spo2: {
        warning: { type: Number, default: 94 },
        critical: { type: Number, default: 90 }
    },
    // Temperature thresholds (°F)
    temperature: {
        warning: {
            min: { type: Number, default: 96.0 },
            max: { type: Number, default: 100.4 }
        },
        critical: {
            min: { type: Number, default: 95.0 },
            max: { type: Number, default: 103.0 }
        }
    },
    // Blood Glucose thresholds (mg/dL)
    bloodGlucose: {
        warning: {
            min: { type: Number, default: 70 },
            max: { type: Number, default: 180 }
        },
        critical: {
            min: { type: Number, default: 50 },
            max: { type: Number, default: 250 }
        }
    },
    // Alert preferences
    alertPreferences: {
        enableNotifications: {
            type: Boolean,
            default: true
        },
        enableSMS: {
            type: Boolean,
            default: true
        },
        autoTriggerSOS: {
            type: Boolean,
            default: true
        },
        notifyEmergencyContacts: {
            type: Boolean,
            default: true
        },
        // Quiet hours (no alerts during this time unless critical)
        quietHours: {
            enabled: { type: Boolean, default: false },
            start: { type: String, default: "22:00" }, // 24-hour format
            end: { type: String, default: "07:00" }
        }
    },
    // Monitoring settings
    monitoringEnabled: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to get default thresholds
healthThresholdSchema.statics.getDefaultThresholds = function() {
    return {
        heartRate: {
            warning: { min: 50, max: 120 },
            critical: { min: 40, max: 150 }
        },
        bloodPressure: {
            warning: { systolic: 140, diastolic: 90 },
            critical: { systolic: 180, diastolic: 120 }
        },
        spo2: {
            warning: 94,
            critical: 90
        },
        temperature: {
            warning: { min: 96.0, max: 100.4 },
            critical: { min: 95.0, max: 103.0 }
        },
        bloodGlucose: {
            warning: { min: 70, max: 180 },
            critical: { min: 50, max: 250 }
        }
    };
};

module.exports = mongoose.model("HealthThreshold", healthThresholdSchema);
