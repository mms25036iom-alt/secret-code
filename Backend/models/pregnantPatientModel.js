const mongoose = require("mongoose");

const pregnantPatientSchema = new mongoose.Schema({
    ashaWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AshaWorker",
        required: true
    },
    name: {
        type: String,
        required: [true, "Please enter patient name"],
        maxLength: [50, "Name cannot exceed 50 characters"],
    },
    age: {
        type: Number,
        required: [true, "Please enter age"],
        min: [15, "Age must be at least 15"],
        max: [50, "Age must be less than 50"]
    },
    phone: {
        type: String,
        required: [true, "Please enter phone number"],
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: "Please enter a valid 10-digit phone number"
        }
    },
    address: {
        village: {
            type: String,
            required: true,
            default: "Nabha"
        },
        houseNo: String,
        landmark: String,
    },
    husbandName: {
        type: String,
        required: true
    },
    husbandPhone: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^\d{10}$/.test(v);
            },
            message: "Please enter a valid 10-digit phone number"
        }
    },
    pregnancyDetails: {
        lmp: {
            type: Date,
            required: [true, "Last Menstrual Period date is required"]
        },
        edd: {
            type: Date,
            required: [true, "Expected Delivery Date is required"]
        },
        currentWeek: {
            type: Number,
            min: 1,
            max: 42
        },
        gravida: {
            type: Number,
            default: 1,
            min: 1
        },
        para: {
            type: Number,
            default: 0,
            min: 0
        },
        abortion: {
            type: Number,
            default: 0,
            min: 0
        },
        living: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    medicalHistory: {
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
            default: 'Unknown'
        },
        previousComplications: String,
        chronicDiseases: [String],
        allergies: [String],
        currentMedications: [String]
    },
    riskFactors: {
        highRisk: {
            type: Boolean,
            default: false
        },
        reasons: [String]
    },
    followUps: [{
        date: {
            type: Date,
            required: true
        },
        weekOfPregnancy: Number,
        weight: Number,
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        hemoglobin: Number,
        complaints: String,
        findings: String,
        advice: String,
        nextVisitDate: Date,
        referredToDoctor: {
            type: Boolean,
            default: false
        },
        referralReason: String,
        conductedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AshaWorker"
        }
    }],
    medicines: [{
        name: {
            type: String,
            required: true
        },
        dosage: String,
        frequency: String,
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        prescribedBy: String,
        notes: String
    }],
    vaccinations: [{
        name: {
            type: String,
            enum: ['TT1', 'TT2', 'TT Booster', 'Other']
        },
        date: Date,
        nextDueDate: Date
    }],
    labTests: [{
        testName: String,
        date: Date,
        result: String,
        notes: String
    }],
    deliveryDetails: {
        delivered: {
            type: Boolean,
            default: false
        },
        deliveryDate: Date,
        deliveryType: {
            type: String,
            enum: ['Normal', 'C-Section', 'Assisted', 'Home', 'Hospital']
        },
        babyGender: {
            type: String,
            enum: ['Male', 'Female']
        },
        babyWeight: Number,
        complications: String,
        hospitalName: String
    },
    status: {
        type: String,
        enum: ['Active', 'Delivered', 'Referred', 'Inactive'],
        default: 'Active'
    },
    emergencyContact: {
        name: String,
        relation: String,
        phone: String
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    lastVisitDate: Date,
    nextScheduledVisit: Date,
});

// Calculate current week of pregnancy
pregnantPatientSchema.methods.calculateCurrentWeek = function() {
    const now = new Date();
    const lmp = new Date(this.pregnancyDetails.lmp);
    const diffTime = Math.abs(now - lmp);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.pregnancyDetails.currentWeek = Math.floor(diffDays / 7);
    return this.pregnancyDetails.currentWeek;
};

// Check if high risk
pregnantPatientSchema.methods.assessRisk = function() {
    const risks = [];
    
    if (this.age < 18 || this.age > 35) {
        risks.push('Age factor');
    }
    
    if (this.pregnancyDetails.gravida > 4) {
        risks.push('Grand multipara');
    }
    
    if (this.medicalHistory.chronicDiseases && this.medicalHistory.chronicDiseases.length > 0) {
        risks.push('Chronic diseases');
    }
    
    if (risks.length > 0) {
        this.riskFactors.highRisk = true;
        this.riskFactors.reasons = risks;
    }
    
    return this.riskFactors;
};

module.exports = mongoose.model("PregnantPatient", pregnantPatientSchema);
