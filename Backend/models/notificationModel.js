const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    ashaWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AshaWorker",
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PregnantPatient"
    },
    type: {
        type: String,
        enum: ['overdue', 'upcoming', 'highrisk', 'delivery', 'referral', 'general'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    actionUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
notificationSchema.index({ ashaWorker: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
