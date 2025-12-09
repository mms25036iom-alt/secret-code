const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Patient is required"]
    },
    type: {
        type: String,
        enum: ['sos', 'ambulance', 'emergency_call'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'cancelled'],
        default: 'active'
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            trim: true
        }
    },
    description: {
        type: String,
        maxLength: [500, "Description cannot exceed 500 characters"],
        trim: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'high'
    },
    contactedPersons: [{
        name: String,
        phone: String,
        relationship: String,
        contactedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
        }
    }],
    ambulanceDetails: {
        requested: {
            type: Boolean,
            default: false
        },
        provider: String,
        vehicleNumber: String,
        driverName: String,
        driverPhone: String,
        estimatedArrival: Date,
        status: {
            type: String,
            enum: ['requested', 'dispatched', 'arrived', 'completed', 'cancelled']
        }
    },
    assignedDoctor: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    notes: {
        type: String,
        maxLength: [1000, "Notes cannot exceed 1000 characters"]
    },
    resolvedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for quick lookup of active emergencies
emergencySchema.index({ patient: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Emergency", emergencySchema);
