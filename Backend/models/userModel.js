const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
        maxLength: [30, "Name cannot exceed 30 characters"],
        minLength: [4, "Name should have more than 4 characters"],
    },
    phone: {
        type: String,
        required: [true, "Please Enter Phone Number"],
        unique: true,
        sparse: true,
        validate: {
            validator: function(v) {
                // Check if it's a valid 10-digit phone number
                return !v || /^\d{10}$/.test(v);
            },
            message: "Please enter a valid 10-digit phone number"
        }
    },
    contact: {
        type: String,
        sparse: true,
        validate: {
            validator: function(v) {
                // Check if it's a valid email or 10-digit phone number
                return !v || validator.isEmail(v) || /^\d{10}$/.test(v);
            },
            message: "Please enter a valid email or 10-digit phone number"
        }
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    password: {
        type: String,
        minLength: [8, "Password should be greater than 8 characters"],
        select: false,
    },
    otp: {
        type: String,
        select: false,
    },
    otpExpire: {
        type: Date,
        select: false,
    },
    useTwilioVerify: {
        type: Boolean,
        default: false,
        select: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    avatar: {
        public_id: {
            type: String,
            default: "",
        },
        url: {
            type: String,
            default: "",
        },
    },
    role: {
        type: String,
        enum: ['user', 'doctor', 'pharmacist', 'admin'],
        default: "user",
    },
    availablity: {
        type: String,
        default: "true",
    },
    speciality: {
        type: String,
        default: "general",
    },
    age: {
        type: Number,
        min: [18, "Age must be at least 18"],
        max: [100, "Age must be less than 100"]
    },
    qualification: {
        type: String,
        default: "MBBS"
    },
    description: {
        type: String,
        maxLength: [500, "Description cannot exceed 500 characters"]
    },
    medicalHistory: [{
        analysis: {
            type: String,
            required: true
        },
        image: {
            url: {
                type: String,
                required: true
            }
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    medicalDocuments: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        fileName: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            default: ''
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    emergencyContacts: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        relationship: {
            type: String,
            required: true,
            enum: ['spouse', 'parent', 'child', 'sibling', 'friend', 'other']
        },
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                    return /^\d{10}$/.test(v);
                },
                message: "Please enter a valid 10-digit phone number"
            }
        },
        isPrimary: {
            type: Boolean,
            default: false
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    familyMembers: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        relationship: {
            type: String,
            required: true,
            enum: ['spouse', 'parent', 'child', 'sibling', 'grandparent', 'grandchild', 'other']
        },
        age: {
            type: Number,
            min: 0,
            max: 150
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },
        phone: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^\d{10}$/.test(v);
                },
                message: "Please enter a valid 10-digit phone number"
            }
        },
        medicalConditions: {
            type: String,
            maxLength: 500
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }

    this.password = await bcrypt.hash(this.password, 10);
});

// JWT TOKEN
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1h'
    });
};

// Compare Password

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
    // Generating Token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hashing and adding resetPasswordToken to userSchema
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
};

// Generate OTP
userSchema.methods.generateOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before saving
    this.otp = crypto.createHash("sha256").update(otp).digest("hex");
    
    // OTP expires in 10 minutes
    this.otpExpire = Date.now() + 10 * 60 * 1000;
    
    return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (otp) {
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    return this.otp === hashedOTP && this.otpExpire > Date.now();
};

module.exports = mongoose.model("User", userSchema);