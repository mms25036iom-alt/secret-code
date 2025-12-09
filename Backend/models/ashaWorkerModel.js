const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ashaWorkerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter ASHA worker name"],
        maxLength: [50, "Name cannot exceed 50 characters"],
        minLength: [3, "Name should have more than 3 characters"],
    },
    govtId: {
        type: String,
        required: [true, "Please enter Government ID"],
        unique: true,
        uppercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Please enter phone number"],
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: "Please enter a valid 10-digit phone number"
        }
    },
    password: {
        type: String,
        required: [true, "Please enter password"],
        minLength: [8, "Password should be at least 8 characters"],
        select: false,
    },
    village: {
        type: String,
        required: [true, "Please enter village name"],
        default: "Nabha"
    },
    district: {
        type: String,
        default: "Patiala"
    },
    state: {
        type: String,
        default: "Punjab"
    },
    qualification: {
        type: String,
        default: "ASHA Certified"
    },
    yearsOfExperience: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    assignedArea: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
ashaWorkerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

// JWT Token
ashaWorkerSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Compare Password
ashaWorkerSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("AshaWorker", ashaWorkerSchema);
