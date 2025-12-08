const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Patient is required"]
    },
    doctor: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Doctor is required"]
    },
    appointment: {
        type: mongoose.Schema.ObjectId,
        ref: "Appointment",
        required: false // Made optional - prescriptions can be created without appointments
    },
    medications: [{
        name: {
            type: String,
            required: [true, "Medication name is required"]
        },
        dosage: {
            type: String,
            required: [true, "Dosage is required"]
        },
        frequency: {
            type: String,
            required: [true, "Frequency is required"]
        },
        duration: String,
        instructions: String,
        instructionsAudio: String // URL to audio file
    }],
    notes: {
        type: String,
        maxLength: [2000, "Notes cannot exceed 2000 characters"]
    },
    diagnosis: {
        type: String,
        required: [true, "Diagnosis is required"],
        maxLength: [1000, "Diagnosis cannot exceed 1000 characters"]
    },
    diagnosisAudio: {
        type: String // URL to audio file
    },
    symptoms: {
        type: String,
        maxLength: [1000, "Symptoms cannot exceed 1000 characters"]
    },
    followUpInstructions: {
        type: String,
        maxLength: [1000, "Follow-up instructions cannot exceed 1000 characters"]
    },
    prescriptionNumber: {
        type: String,
        unique: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Prescription", prescriptionSchema);