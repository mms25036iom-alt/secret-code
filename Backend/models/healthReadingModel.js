const mongoose = require("mongoose");

const healthReadingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "User is required"],
        index: true
    },
    // Reading type
    type: {
        type: String,
        enum: ['heart_rate', 'blood_pressure', 'spo2', 'temperature', 'steps', 'sleep', 'ecg', 'stress_level', 'blood_glucose'],
        required: true
    },
    // Values based on type
    value: {
        // For heart_rate, spo2, temperature, steps, stress_level, blood_glucose
        single: {
            type: Number
        },
        // For blood_pressure
        systolic: {
            type: Number
        },
        diastolic: {
            type: Number
        },
        // For sleep
        duration: {
            type: Number // in minutes
        },
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent']
        },
        // For ECG
        ecgData: {
            type: String // Base64 or JSON string
        },
        ecgResult: {
            type: String,
            enum: ['normal', 'afib', 'inconclusive', 'low_heart_rate', 'high_heart_rate']
        }
    },
    // Source device
    source: {
        deviceType: {
            type: String,
            enum: ['apple_watch', 'fitbit', 'garmin', 'samsung_galaxy_watch', 'mi_band', 'manual', 'other'],
            default: 'manual'
        },
        deviceModel: String,
        deviceId: String
    },
    // Status flags
    isAbnormal: {
        type: Boolean,
        default: false
    },
    severity: {
        type: String,
        enum: ['normal', 'warning', 'critical'],
        default: 'normal'
    },
    // Alert information
    alertTriggered: {
        type: Boolean,
        default: false
    },
    alertType: {
        type: String,
        enum: ['notification', 'sos', 'none'],
        default: 'none'
    },
    alertMessage: String,
    // Emergency reference if SOS was triggered
    emergencyId: {
        type: mongoose.Schema.ObjectId,
        ref: "Emergency"
    },
    // Metadata
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    notes: {
        type: String,
        maxLength: 500
    },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
healthReadingSchema.index({ user: 1, type: 1, timestamp: -1 });
healthReadingSchema.index({ user: 1, isAbnormal: 1, timestamp: -1 });

// Method to check if reading is abnormal
healthReadingSchema.methods.checkAbnormality = function(thresholds) {
    let isAbnormal = false;
    let severity = 'normal';
    let message = '';

    switch(this.type) {
        case 'heart_rate':
            const hr = this.value.single;
            if (hr < thresholds.heartRate.critical.min || hr > thresholds.heartRate.critical.max) {
                isAbnormal = true;
                severity = 'critical';
                message = `Critical heart rate: ${hr} bpm`;
            } else if (hr < thresholds.heartRate.warning.min || hr > thresholds.heartRate.warning.max) {
                isAbnormal = true;
                severity = 'warning';
                message = `Abnormal heart rate: ${hr} bpm`;
            }
            break;

        case 'blood_pressure':
            const sys = this.value.systolic;
            const dia = this.value.diastolic;
            if (sys >= thresholds.bloodPressure.critical.systolic || dia >= thresholds.bloodPressure.critical.diastolic) {
                isAbnormal = true;
                severity = 'critical';
                message = `Critical blood pressure: ${sys}/${dia} mmHg`;
            } else if (sys >= thresholds.bloodPressure.warning.systolic || dia >= thresholds.bloodPressure.warning.diastolic) {
                isAbnormal = true;
                severity = 'warning';
                message = `High blood pressure: ${sys}/${dia} mmHg`;
            }
            break;

        case 'spo2':
            const spo2 = this.value.single;
            if (spo2 < thresholds.spo2.critical) {
                isAbnormal = true;
                severity = 'critical';
                message = `Critical oxygen level: ${spo2}%`;
            } else if (spo2 < thresholds.spo2.warning) {
                isAbnormal = true;
                severity = 'warning';
                message = `Low oxygen level: ${spo2}%`;
            }
            break;

        case 'temperature':
            const temp = this.value.single;
            if (temp >= thresholds.temperature.critical.max || temp <= thresholds.temperature.critical.min) {
                isAbnormal = true;
                severity = 'critical';
                message = `Critical temperature: ${temp}°F`;
            } else if (temp >= thresholds.temperature.warning.max || temp <= thresholds.temperature.warning.min) {
                isAbnormal = true;
                severity = 'warning';
                message = `Abnormal temperature: ${temp}°F`;
            }
            break;

        case 'blood_glucose':
            const glucose = this.value.single;
            if (glucose < thresholds.bloodGlucose.critical.min || glucose > thresholds.bloodGlucose.critical.max) {
                isAbnormal = true;
                severity = 'critical';
                message = `Critical blood glucose: ${glucose} mg/dL`;
            } else if (glucose < thresholds.bloodGlucose.warning.min || glucose > thresholds.bloodGlucose.warning.max) {
                isAbnormal = true;
                severity = 'warning';
                message = `Abnormal blood glucose: ${glucose} mg/dL`;
            }
            break;
    }

    this.isAbnormal = isAbnormal;
    this.severity = severity;
    this.alertMessage = message;

    return { isAbnormal, severity, message };
};

module.exports = mongoose.model("HealthReading", healthReadingSchema);
