const ErrorHander = require("../utils/errorHander");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const catchAsyncError = require("../middleware/catchAsyncError");
const validator = require("validator");
const { sendSMS, sendOTPVerify, verifyOTPVerify } = require("../utils/twilioVerify");
const { uploadSingle } = require("../utils/cloudinary");


// Register a User
exports.registerUser = catchAsyncError(async (req, res, next) => {
    console.log('🔔 Registration endpoint hit!');
    
    const { name, contact, password, role, speciality } = req.body;

    console.log('📝 Registration attempt:', { name, contact, role, hasPassword: !!password });
    console.log('📦 Full req.body:', req.body);

    // Validation
    if (!name || !contact || !password) {
        console.log('❌ Missing required fields');
        return next(new ErrorHander("Please provide name, contact, and password", 400));
    }

    if (name.length < 4) {
        console.log('❌ Name too short:', name.length);
        return next(new ErrorHander("Name should have more than 4 characters", 400));
    }

    if (password.length < 8) {
        console.log('❌ Password too short:', password.length);
        return next(new ErrorHander("Password should be at least 8 characters", 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ contact });
    if (existingUser) {
        console.log('❌ User already exists:', contact);
        return next(new ErrorHander("User already exists with this contact", 400));
    }

    // Handle avatar upload for doctors
    let avatarData = {};
    if (req.file && role === 'doctor') {
        avatarData = {
            public_id: req.file.public_id,
            url: req.file.secure_url
        };
    } else if (req.body.avatar && role === 'doctor') {
        // Handle client-side uploaded avatar data
        try {
            const parsedAvatar = JSON.parse(req.body.avatar);
            avatarData = {
                public_id: parsedAvatar.public_id,
                url: parsedAvatar.url
            };
        } catch (error) {
            console.error('Error parsing avatar data:', error);
        }
    }

    // Ensure role is explicitly set and valid
    const validRoles = ['user', 'doctor', 'pharmacist', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'user';
    
    console.log('🔍 Final role to be saved:', userRole);

    const userData = {
        name,
        contact,
        password,
        role: userRole,
        avatar: avatarData.public_id ? avatarData : {
            public_id: "",
            url: "",
        },
    };

    // Add speciality ONLY for doctors
    if (userRole === 'doctor') {
        if (speciality) {
            userData.speciality = speciality;
        }
    } else {
        // For non-doctors, explicitly set speciality to general or don't include it
        userData.speciality = 'general';
    }

    console.log('✅ Creating user with data:', { ...userData, password: '[HIDDEN]' });
    console.log('🔍 Role being saved:', userData.role);
    
    const user = await User.create(userData);

    console.log('✅ User created successfully:', user.name);
    console.log('🔍 User role in DB:', user.role);
    console.log('🔍 User speciality in DB:', user.speciality);

    // Check if contact is email or phone
    const isEmail = validator.isEmail(contact);
    
    // Try to send welcome message but don't fail registration if it fails
    try {
        if (isEmail) {
            const message = `Welcome to Cureon ${name}`;
            await sendEmail({
                email: contact,
                subject: `Welcome to Cureon`,
                message,
            });
            console.log('✅ Welcome email sent successfully');
        } else {
            const message = `Welcome to Cureon ${name}`;
            let sms = await sendSMS({
                phone: `+91${contact}`,
                message,
            });
            console.log('✅ Welcome SMS sent successfully:', sms);
        }
    } catch (error) {
        // Log the error but continue with registration
        console.error('⚠️ Failed to send welcome message:', error.message);
        console.log('Registration will continue without welcome message');
    }

    console.log('✅ Sending token and user data to client');
    sendToken(user, 201, res);
    console.log('✅ Registration completed successfully!');
});

// Login User
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { contact, password } = req.body;
    
    console.log('🔐 Login attempt for contact:', contact);
    
    if (!contact || !password) {
        return next(new ErrorHander("Please Enter Contact & Password", 400));
    }

    const user = await User.findOne({ contact }).select("+password");
    if (!user) {
        console.log('❌ User not found with contact:', contact);
        return next(new ErrorHander("Invalid credentials - User not found", 401));
    }

    console.log('✅ User found:', user.name);
    
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        console.log('❌ Password mismatch for user:', user.name);
        return next(new ErrorHander("Invalid credentials - Wrong password", 401));
    }

    console.log('✅ Login successful for:', user.name);
    sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});

// Forgot Password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {}); // TODO : ADD IF POSSIBLE

// Reset Password
exports.resetPassword = catchAsyncError(async (req, res, next) => {}); // TODO : ADD IF POSSIBLE

// Get User Detail
exports.getUserDetails = catchAsyncError(async (req, res, next) => {
    if (!req.user._id) {
        return next(new ErrorHander("Login", 401));
    }
    const user = await User.findById(req.user._id);
    res.status(200).json({
        success: true,
        user,
    });
});

// Update User password
exports.updatePassword = catchAsyncError(async (req, res, next) => {}); // TODO : ADD IF POSSIBLE

// Update User Details
exports.updateUserProfile = catchAsyncError(async (req, res, next) => {}); // TODO : ADD IF POSSIBLE

// Get all Doctors
exports.getAllDoctors = catchAsyncError(async (req, res, next) => {
    const doctors = await User.find({ role: "doctor" }).select("-password");

    // If no doctors found
    if (!doctors || doctors.length === 0) {
        return next(new ErrorHander("No doctors found", 404));
    }

    // Format the response data
    const formattedDoctors = doctors.map(doctor => ({
        _id: doctor._id,
        name: doctor.name,
        contact: doctor.contact,
        phone: doctor.phone,
        gender: doctor.gender,
        age: doctor.age,
        qualification: doctor.qualification,
        description: doctor.description,
        speciality: doctor.speciality,
        availability: doctor.availablity, // Note: Fix typo in model from 'availablity' to 'availability'
        avatar: doctor.avatar,
        createdAt: doctor.createdAt
    }));


    res.status(200).json({
        success: true,
        count: doctors.length,
        doctors: formattedDoctors
    });
})

// Get single users --> Admin
exports.getSingleUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id)
    if (!user) {
        return next(new ErrorHander(`User not found with id: ${req.params.id}`, 404))
    }
    res.status(200).json({
        success: true,
        user: user,
    })
})

// update User Role -- Admin
exports.updateUserRole = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        contact: req.body.contact,
        role: req.body.role,
    };

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});




// Delete User --Admin

exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
            new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
        );
    }

    await user.deleteOne();
    res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    });
});


// Add Medical History with Image
exports.addMedicalHistory = catchAsyncError(async (req, res, next) => {
    if (!req.user._id) {
        return next(new ErrorHander("Please login to add medical history", 401));
    }

    const { analysis, url } = req.body;

    if (!analysis) {
        return next(new ErrorHander("Analysis is required", 400));
    }

    if (!url) {
        return next(new ErrorHander("Image details are required", 400));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new ErrorHander("User not found", 404));
    }

    user.medicalHistory.push({
        analysis,
        image: {
            url
        },
        createdAt: new Date()
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: "Medical history added successfully",
        medicalHistory: user.medicalHistory
    });
});

// Get Medical History
exports.getMedicalHistory = catchAsyncError(async (req, res, next) => {
    const userId = req.params.userId;

    if (!userId) {
        return next(new ErrorHander("User ID is required", 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorHander("User not found", 404));
    }

    // Check if the requesting user is authorized to view this medical history
    if (req.user.role !== "doctor" && req.user._id.toString() !== userId.toString()) {
        return next(new ErrorHander("Not authorized to view this medical history", 403));
    }

    res.status(200).json({
        success: true,
        medicalHistory: user.medicalHistory
    });
});

// Notify patient when doctor joins video call
// POST /api/v1/notify-doctor-joined
// Body: { patientId: string, roomId: string }
// Headers: Authorization: Bearer <doctor_token>
exports.notifyDoctorJoined = catchAsyncError(async (req, res, next) => {
    const { patientId, roomId } = req.body;
    const doctor = req.user;

    // Validate required fields
    if (!patientId || !roomId) {
        return next(new ErrorHander("Patient ID and Room ID are required", 400));
    }

    // Find the patient
    const patient = await User.findById(patientId);
    if (!patient) {
        return next(new ErrorHander("Patient not found", 404));
    }

    // Validate patient email
    if (!validator.isEmail(patient.contact)) {
        return next(new ErrorHander("Patient email is not valid", 400));
    }

    // Create video call link
    const videoCallLink = `https://video-call-final-git-main-orthodox-64s-projects.vercel.app/?roomID=${roomId}`;

    // Prepare email content
    const emailOptions = {
        email: patient.contact,
        subject: `🎥 Doctor ${doctor.name} has joined your video consultation`,
        message: `
Dear ${patient.name},

Great news! Dr. ${doctor.name} has joined your video consultation and is ready to provide medical assistance.

📋 Consultation Details:
- Doctor: Dr. ${doctor.name}
- Speciality: ${doctor.speciality || 'General Medicine'}
- Room ID: ${roomId}
- Join Time: ${new Date().toLocaleString()}

🎥 Join Video Call:
Click the link below to join your video consultation:
${videoCallLink}

📱 Alternative Access:
If the link doesn't work, you can also access the video call by:
1. Going to the telemedicine section
2. Clicking on "Video Consultation"
3. Using Room ID: ${roomId}

⏰ Important Notes:
- Please join the call as soon as possible
- Ensure you have a stable internet connection
- Have your medical documents ready if needed
- The consultation will be recorded for quality purposes

🆘 Technical Support:
If you experience any technical difficulties, please contact our support team immediately.

We hope this consultation helps address your health concerns effectively.

Best regards,
AgPatil Healthcare Team

---
This is an automated notification. Please do not reply to this email.
For support, contact: ${process.env.SUPPORT_EMAIL || 'support@agpatil.com'}
        `.trim()
    };

    try {
        // Send email notification
        await sendEmail(emailOptions);

        console.log(`✅ Doctor join notification sent to patient ${patient.name} (${patient.contact})`);

        res.status(200).json({
            success: true,
            message: "Patient notification sent successfully",
            data: {
                patientName: patient.name,
                patientEmail: patient.contact,
                doctorName: doctor.name,
                roomId: roomId,
                notificationTime: new Date()
            }
        });
    } catch (error) {
        console.error("❌ Failed to send doctor join notification:", error);
        return next(new ErrorHander("Failed to send notification email", 500));
    }
});

// Get complete patient medical data for QR code
exports.getCompletePatientData = catchAsyncError(async (req, res, next) => {
    const { patientId } = req.params;
    
    // Find the patient with all related data
    const patient = await User.findById(patientId)
        .populate('medicalHistory')
        .populate({
            path: 'appointments',
            populate: {
                path: 'doctor',
                select: 'name speciality'
            }
        })
        .populate({
            path: 'prescriptions',
            populate: {
                path: 'doctor',
                select: 'name speciality'
            }
        });

    if (!patient) {
        return next(new ErrorHander("Patient not found", 404));
    }

    // Create comprehensive data structure
    const completeData = {
        patientId: patient._id,
        name: patient.name,
        email: patient.contact,
        role: patient.role,
        speciality: patient.speciality || null,
        createdAt: patient.createdAt,
        lastUpdated: new Date().toISOString(),
        system: 'AgPatil Healthcare System',
        medicalHistory: patient.medicalHistory || [],
        appointments: patient.appointments || [],
        prescriptions: patient.prescriptions || [],
        avatar: patient.avatar || null,
        isActive: patient.isActive !== undefined ? patient.isActive : true
    };

    res.status(200).json({
        success: true,
        data: completeData
    });
});

// Upload Medical Document
exports.uploadMedicalDocument = catchAsyncError(async (req, res, next) => {
    const { name, description } = req.body;
    
    if (!name) {
        return next(new ErrorHander("Document name is required", 400));
    }
    
    if (!req.file) {
        return next(new ErrorHander("Please upload a file", 400));
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
        return next(new ErrorHander("User not found", 404));
    }
    
    // Initialize medicalDocuments array if it doesn't exist
    if (!user.medicalDocuments) {
        user.medicalDocuments = [];
    }
    
    // Add document to user's medical documents
    const document = {
        name,
        description: description || '',
        fileName: req.file.originalname,
        url: req.file.secure_url || req.file.url || req.file.path,
        publicId: req.file.public_id || req.file.filename || '',
        uploadedAt: new Date()
    };
    
    console.log('📄 Uploaded file details:', {
        originalname: req.file.originalname,
        secure_url: req.file.secure_url,
        url: req.file.url,
        path: req.file.path,
        public_id: req.file.public_id,
        filename: req.file.filename
    });
    
    user.medicalDocuments.push(document);
    await user.save();
    
    console.log('✅ Document saved to user:', document);
    
    res.status(200).json({
        success: true,
        message: "Document uploaded successfully",
        document: user.medicalDocuments[user.medicalDocuments.length - 1]
    });
});

// Get Medical Documents
exports.getMedicalDocuments = catchAsyncError(async (req, res, next) => {
    const userId = req.params.userId || req.user._id;
    
    const user = await User.findById(userId);
    
    if (!user) {
        return next(new ErrorHander("User not found", 404));
    }
    
    // Check authorization
    if (req.user.role !== 'doctor' && req.user._id.toString() !== userId.toString()) {
        return next(new ErrorHander("Not authorized to view these documents", 403));
    }
    
    res.status(200).json({
        success: true,
        documents: user.medicalDocuments || []
    });
});

// Delete Medical Document
exports.deleteMedicalDocument = catchAsyncError(async (req, res, next) => {
    const { documentId } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
        return next(new ErrorHander("User not found", 404));
    }
    
    if (!user.medicalDocuments) {
        return next(new ErrorHander("No documents found", 404));
    }
    
    // Find and remove the document
    const documentIndex = user.medicalDocuments.findIndex(
        doc => doc._id.toString() === documentId
    );
    
    if (documentIndex === -1) {
        return next(new ErrorHander("Document not found", 404));
    }
    
    user.medicalDocuments.splice(documentIndex, 1);
    await user.save();
    
    res.status(200).json({
        success: true,
        message: "Document deleted successfully"
    });
});

// Get Doctor Stats (patient count) - Public endpoint
exports.getDoctorStats = catchAsyncError(async (req, res, next) => {
    const { doctorId } = req.params;
    
    const Appointment = require('../models/appointmentModel');
    
    // Get all completed appointments for this doctor
    const completedAppointments = await Appointment.find({
        doctor: doctorId,
        status: 'completed'
    });
    
    // Get unique patient count
    const uniquePatients = new Set();
    completedAppointments.forEach(appointment => {
        uniquePatients.add(appointment.patient.toString());
    });
    
    res.status(200).json({
        success: true,
        patientCount: uniquePatients.size
    });
});

// Get Treated Patients (for doctors)
exports.getTreatedPatients = catchAsyncError(async (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return next(new ErrorHander("Only doctors can access this resource", 403));
    }
    
    const Appointment = require('../models/appointmentModel');
    
    // Get all completed appointments for this doctor
    const completedAppointments = await Appointment.find({
        doctor: req.user._id,
        status: 'completed'
    }).populate('patient', 'name contact phone gender');
    
    // Group by patient and get unique patients
    const patientMap = new Map();
    
    completedAppointments.forEach(appointment => {
        const patientId = appointment.patient._id.toString();
        
        if (!patientMap.has(patientId)) {
            patientMap.set(patientId, {
                _id: appointment.patient._id,
                name: appointment.patient.name,
                contact: appointment.patient.contact,
                phone: appointment.patient.phone,
                gender: appointment.patient.gender,
                appointmentCount: 1,
                lastAppointment: appointment.day
            });
        } else {
            const patient = patientMap.get(patientId);
            patient.appointmentCount++;
            // Update last appointment if this one is more recent
            if (new Date(appointment.day) > new Date(patient.lastAppointment)) {
                patient.lastAppointment = appointment.day;
            }
        }
    });
    
    const patients = Array.from(patientMap.values());
    
    res.status(200).json({
        success: true,
        count: patients.length,
        patients
    });
});

// Get Complete Patient Details (for doctors)
exports.getPatientCompleteDetails = catchAsyncError(async (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return next(new ErrorHander("Only doctors can access this resource", 403));
    }
    
    const { patientId } = req.params;
    const Appointment = require('../models/appointmentModel');
    
    // Find the patient
    const patient = await User.findById(patientId);
    
    if (!patient) {
        return next(new ErrorHander("Patient not found", 404));
    }
    
    // Get all appointments between this doctor and patient
    const appointments = await Appointment.find({
        doctor: req.user._id,
        patient: patientId
    }).sort({ day: -1 });
    
    // Prepare complete patient data
    const patientData = {
        _id: patient._id,
        name: patient.name,
        contact: patient.contact,
        phone: patient.phone,
        gender: patient.gender,
        avatar: patient.avatar,
        medicalHistory: patient.medicalHistory || [],
        medicalDocuments: patient.medicalDocuments || [],
        appointments: appointments
    };
    
    res.status(200).json({
        success: true,
        patient: patientData
    });
});

// Generate Complete Patient Data PDF
exports.generatePatientDataPDF = catchAsyncError(async (req, res, next) => {
    const userId = req.params.userId || req.user._id;
    
    console.log('📄 PDF Request - User ID:', userId);
    console.log('📄 PDF Request - Requesting User:', req.user._id, 'Role:', req.user.role);
    
    // Find the patient with all related data
    const patient = await User.findById(userId);
    
    if (!patient) {
        console.log('❌ Patient not found:', userId);
        return next(new ErrorHander("Patient not found", 404));
    }
    
    console.log('✅ Patient found:', patient.name);
    
    // Check authorization - patient can download their own data, doctors can download patient data
    if (req.user.role !== 'doctor' && req.user._id.toString() !== userId.toString()) {
        console.log('❌ Authorization failed');
        return next(new ErrorHander("Not authorized to download this data", 403));
    }
    
    // Get appointments and prescriptions
    const Appointment = require('../models/appointmentModel');
    const Prescription = require('../models/prescriptionModel');
    
    const appointments = await Appointment.find({ patient: userId })
        .populate('doctor', 'name speciality')
        .sort({ day: -1 });
    
    const prescriptions = await Prescription.find({ patient: userId })
        .populate('doctor', 'name speciality')
        .sort({ createdAt: -1 });
    
    console.log('📊 Data Summary:');
    console.log('   - Medical History:', patient.medicalHistory?.length || 0);
    console.log('   - Medical Documents:', patient.medicalDocuments?.length || 0);
    console.log('   - Appointments:', appointments.length);
    console.log('   - Prescriptions:', prescriptions.length);
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="patient-data-${patient.name.replace(/\s+/g, '-')}.pdf"`);
    
    console.log('📄 Generating PDF...');
    
    // Generate and stream PDF
    generatePatientDataPDFHelper(patient, appointments, prescriptions, res);
});

// Helper function to generate patient data PDF
function generatePatientDataPDFHelper(patient, appointments, prescriptions, res) {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
    });
    
    // Pipe the PDF directly to the response
    doc.pipe(res);
    
    // Header
    doc.fontSize(26)
       .fillColor('#2563eb')
       .text('COMPLETE PATIENT MEDICAL RECORD', { align: 'center' });
    
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('Cureon Healthcare System', { align: 'center' });
    
    doc.moveDown(2);
    
    // Patient Information Section
    doc.fontSize(16)
       .fillColor('#1e40af')
       .text('PATIENT INFORMATION', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(11)
       .fillColor('#000000');
    
    const patientInfo = [
        ['Patient ID:', patient._id.toString()],
        ['Full Name:', patient.name],
        ['Contact:', patient.contact],
        ['Phone:', patient.phone || patient.contact],
        ['Gender:', patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Not specified'],
        ['Account Created:', new Date(patient.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Report Generated:', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })]
    ];
    
    patientInfo.forEach(([label, value]) => {
        doc.text(label, { continued: true, width: 150 });
        doc.fillColor('#374151').text(value);
        doc.fillColor('#000000');
    });
    
    doc.moveDown(2);
    
    // Medical History Section
    doc.fontSize(16)
       .fillColor('#1e40af')
       .text('MEDICAL HISTORY', { underline: true });
    
    doc.moveDown(0.5);
    
    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
        patient.medicalHistory.forEach((history, index) => {
            doc.fontSize(12)
               .fillColor('#000000')
               .text(`${index + 1}. Medical Record`, { bold: true });
            
            doc.fontSize(10)
               .fillColor('#374151');
            
            doc.text(`   Date: ${new Date(history.createdAt).toLocaleDateString()}`, { indent: 20 });
            doc.text(`   Analysis: ${history.analysis || 'No analysis provided'}`, { indent: 20 });
            if (history.image && history.image.url) {
                doc.text(`   Image: ${history.image.url}`, { indent: 20 });
            }
            
            doc.moveDown(0.8);
        });
    } else {
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text('No medical history recorded', { italic: true });
    }
    
    doc.moveDown(2);
    
    // Medical Documents Section
    doc.fontSize(16)
       .fillColor('#1e40af')
       .text('MEDICAL DOCUMENTS', { underline: true });
    
    doc.moveDown(0.5);
    
    if (patient.medicalDocuments && patient.medicalDocuments.length > 0) {
        patient.medicalDocuments.forEach((document, index) => {
            doc.fontSize(11)
               .fillColor('#000000')
               .text(`${index + 1}. ${document.name}`, { bold: true });
            
            doc.fontSize(10)
               .fillColor('#374151');
            
            doc.text(`   Uploaded: ${new Date(document.uploadedAt).toLocaleDateString()}`, { indent: 20 });
            if (document.description) {
                doc.text(`   Description: ${document.description}`, { indent: 20 });
            }
            doc.text(`   File: ${document.fileName}`, { indent: 20 });
            doc.text(`   URL: ${document.url}`, { indent: 20 });
            
            doc.moveDown(0.8);
        });
    } else {
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text('No medical documents uploaded', { italic: true });
    }
    
    doc.moveDown(2);
    
    // Appointments Section
    doc.fontSize(16)
       .fillColor('#1e40af')
       .text('APPOINTMENT HISTORY', { underline: true });
    
    doc.moveDown(0.5);
    
    if (appointments && appointments.length > 0) {
        appointments.forEach((appointment, index) => {
            doc.fontSize(12)
               .fillColor('#000000')
               .text(`${index + 1}. Appointment with Dr. ${appointment.doctor?.name || 'Unknown'}`, { bold: true });
            
            doc.fontSize(10)
               .fillColor('#374151');
            
            doc.text(`   Date: ${appointment.day}`, { indent: 20 });
            doc.text(`   Time: ${appointment.time}`, { indent: 20 });
            doc.text(`   Status: ${appointment.status}`, { indent: 20 });
            doc.text(`   Speciality: ${appointment.doctor?.speciality || 'General Medicine'}`, { indent: 20 });
            doc.text(`   Symptoms: ${appointment.symptoms || 'Not specified'}`, { indent: 20 });
            doc.text(`   Description: ${appointment.description || 'No description'}`, { indent: 20 });
            
            doc.moveDown(0.8);
        });
    } else {
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text('No appointments recorded', { italic: true });
    }
    
    doc.moveDown(2);
    
    // Prescriptions Section
    doc.fontSize(16)
       .fillColor('#1e40af')
       .text('PRESCRIPTION HISTORY', { underline: true });
    
    doc.moveDown(0.5);
    
    if (prescriptions && prescriptions.length > 0) {
        prescriptions.forEach((prescription, index) => {
            doc.fontSize(12)
               .fillColor('#000000')
               .text(`${index + 1}. Prescription #${prescription.prescriptionNumber}`, { bold: true });
            
            doc.fontSize(10)
               .fillColor('#374151');
            
            doc.text(`   Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, { indent: 20 });
            doc.text(`   Doctor: Dr. ${prescription.doctor?.name || 'Unknown'}`, { indent: 20 });
            doc.text(`   Speciality: ${prescription.doctor?.speciality || 'General Medicine'}`, { indent: 20 });
            doc.text(`   Diagnosis: ${prescription.diagnosis || 'Not specified'}`, { indent: 20 });
            
            if (prescription.medications && prescription.medications.length > 0) {
                doc.text(`   Medications:`, { indent: 20 });
                prescription.medications.forEach((med, medIndex) => {
                    doc.text(`      ${medIndex + 1}. ${med.name}`, { indent: 30 });
                    doc.text(`         Dosage: ${med.dosage}`, { indent: 40 });
                    doc.text(`         Frequency: ${med.frequency}`, { indent: 40 });
                    if (med.duration) doc.text(`         Duration: ${med.duration}`, { indent: 40 });
                });
            }
            
            doc.moveDown(0.8);
        });
    } else {
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text('No prescriptions recorded', { italic: true });
    }
    
    doc.moveDown(2);
    
    // Summary Statistics
    doc.fontSize(16)
       .fillColor('#1e40af')
       .text('MEDICAL SUMMARY', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(11)
       .fillColor('#000000');
    
    const stats = [
        ['Total Medical Records:', (patient.medicalHistory?.length || 0).toString()],
        ['Total Documents:', (patient.medicalDocuments?.length || 0).toString()],
        ['Total Appointments:', (appointments?.length || 0).toString()],
        ['Total Prescriptions:', (prescriptions?.length || 0).toString()],
        ['Account Age:', `${Math.floor((new Date() - new Date(patient.createdAt)) / (1000 * 60 * 60 * 24))} days`]
    ];
    
    stats.forEach(([label, value]) => {
        doc.text(label, { continued: true, width: 200 });
        doc.fillColor('#374151').text(value);
        doc.fillColor('#000000');
    });
    
    // Footer
    const bottomY = doc.page.height - 100;
    doc.moveTo(50, bottomY)
       .lineTo(doc.page.width - 50, bottomY)
       .stroke();
    
    doc.y = bottomY + 10;
    
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text('This document contains confidential patient medical information.', { align: 'center' });
    
    doc.text('Please handle with care and maintain patient privacy.', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.fontSize(8)
       .text('Cureon Healthcare System - Complete Patient Medical Record', { align: 'center' });
    
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
    console.log('✅ Patient data PDF generated and streamed successfully');
}


// ==================== OTP-BASED AUTHENTICATION ====================

// Send OTP for Registration/Login
exports.sendOTP = catchAsyncError(async (req, res, next) => {
    const { phone } = req.body;
    
    console.log('📱 ========================================');
    console.log('📱 OTP REQUEST RECEIVED');
    console.log('📱 Phone:', phone);
    console.log('📱 ========================================');
    
    // Validate phone number
    if (!phone) {
        console.log('❌ No phone number provided');
        return next(new ErrorHander("Please enter your phone number", 400));
    }
    
    if (!/^\d{10}$/.test(phone)) {
        console.log('❌ Invalid phone format:', phone);
        return next(new ErrorHander("Please enter a valid 10-digit phone number", 400));
    }
    
    try {
        // Check if user exists
        let user = await User.findOne({ phone }).select("+otp +otpExpire");
        let isNewUser = false;
        
        if (!user) {
            console.log('📝 New user detected - creating temporary record');
            isNewUser = true;
            
            // For new users, create a minimal temporary record
            user = new User({
                phone,
                contact: phone,
                name: `User_${phone}`,
                password: `temp_${Date.now()}_${Math.random()}`, // Temporary password
                isVerified: false
            });
            
            console.log('📝 Temporary user created');
        } else {
            console.log('✅ Existing user found:', user.name);
        }
        
        const phoneWithCountryCode = `+91${phone}`;
        let otp = null;
        let smsSent = false;
        let useTwilioVerify = false;
        
        // Try Twilio Verify API first (recommended)
        if (process.env.TWILIO_VERIFY_SERVICE_SID && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            try {
                console.log('🔐 Using Twilio Verify API (recommended)');
                const verification = await sendOTPVerify(phoneWithCountryCode);
                
                if (verification.status === 'pending') {
                    smsSent = true;
                    useTwilioVerify = true;
                    console.log('✅ OTP sent via Twilio Verify API');
                    
                    // Mark that we're using Twilio Verify
                    user.useTwilioVerify = true;
                    await user.save({ validateBeforeSave: false });
                }
            } catch (verifyError) {
                console.error('⚠️ Twilio Verify API failed:', verifyError.message);
                console.log('📱 Falling back to manual OTP generation');
            }
        }
        
        // Fallback to manual OTP generation
        if (!useTwilioVerify) {
            console.log('🔐 Using manual OTP generation');
            
            // Generate OTP
            otp = user.generateOTP();
            console.log('🔐 OTP Generated:', otp);
            console.log('⏰ OTP Expires:', new Date(user.otpExpire).toLocaleString());
            
            // Mark that we're NOT using Twilio Verify
            user.useTwilioVerify = false;
            
            // Save user with OTP
            await user.save({ validateBeforeSave: false });
            console.log('✅ User saved with OTP');
            
            // Try to send SMS with manual OTP
            const message = `Your Cureon OTP is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
            
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
                try {
                    await sendSMS({
                        phone: phoneWithCountryCode,
                        message,
                    });
                    smsSent = true;
                    console.log('✅ SMS sent successfully to', phoneWithCountryCode);
                } catch (smsError) {
                    console.error('⚠️ SMS sending failed:', smsError.message);
                    console.log('📱 Continuing without SMS (OTP will be shown in console)');
                }
            } else {
                console.log('⚠️ Twilio not configured - SMS disabled');
            }
            
            // Always log OTP in development or if SMS failed
            if (process.env.NODE_ENV === 'development' || !smsSent) {
                console.log('');
                console.log('╔════════════════════════════════════╗');
                console.log('║     🔐 YOUR OTP CODE 🔐           ║');
                console.log('║                                    ║');
                console.log(`║          ${otp}                  ║`);
                console.log('║                                    ║');
                console.log('║   Valid for 10 minutes            ║');
                console.log('╚════════════════════════════════════╝');
                console.log('');
            }
        }
        
        console.log('✅ OTP request completed successfully');
        console.log('📱 Method:', useTwilioVerify ? 'Twilio Verify API' : 'Manual OTP');
        console.log('📱 ========================================\n');
        
        res.status(200).json({
            success: true,
            message: smsSent 
                ? "OTP sent successfully to your phone" 
                : "OTP generated successfully (check console)",
            isNewUser: isNewUser || !user.isVerified,
            useTwilioVerify: useTwilioVerify,
            // Include OTP in response for development/testing (only for manual OTP) - EXACTLY like CureConnect
            ...(!useTwilioVerify && process.env.NODE_ENV === 'development' && { otp }),
            ...(!useTwilioVerify && !smsSent && { otp }) // Include OTP if SMS failed
        });
        
    } catch (error) {
        console.error('❌ OTP Generation Error:', error);
        console.error('❌ Error Stack:', error.stack);
        return next(new ErrorHander(`Failed to generate OTP: ${error.message}`, 500));
    }
});

// Verify OTP and Register/Login
exports.verifyOTPAndAuth = catchAsyncError(async (req, res, next) => {
    const { phone, otp, name, gender, role, speciality, avatar } = req.body;
    
    console.log('🔍 ========================================');
    console.log('🔍 OTP VERIFICATION REQUEST');
    console.log('🔍 Phone:', phone);
    console.log('🔍 OTP:', otp);
    console.log('🔍 ========================================');
    
    // Validate inputs
    if (!phone) {
        console.log('❌ No phone number provided');
        return next(new ErrorHander("Please provide phone number", 400));
    }
    
    if (!otp) {
        console.log('❌ No OTP provided');
        return next(new ErrorHander("Please provide OTP", 400));
    }
    
    if (otp.length !== 6) {
        console.log('❌ Invalid OTP length:', otp.length);
        return next(new ErrorHander("OTP must be 6 digits", 400));
    }
    
    try {
        // Find user
        const user = await User.findOne({ phone }).select("+otp +otpExpire +password");
        
        if (!user) {
            console.log('❌ User not found for phone:', phone);
            return next(new ErrorHander("User not found. Please request OTP again.", 404));
        }
        
        console.log('✅ User found:', user.name);
        
        const phoneWithCountryCode = `+91${phone}`;
        let isOTPValid = false;
        
        // Check if using Twilio Verify API
        if (user.useTwilioVerify && process.env.TWILIO_VERIFY_SERVICE_SID) {
            console.log('🔍 Verifying OTP via Twilio Verify API');
            
            try {
                const verificationCheck = await verifyOTPVerify(phoneWithCountryCode, otp);
                
                if (verificationCheck.status === 'approved' && verificationCheck.valid) {
                    isOTPValid = true;
                    console.log('✅ OTP verified successfully via Twilio Verify API');
                } else {
                    console.log('❌ Twilio Verify API returned:', verificationCheck.status);
                }
            } catch (verifyError) {
                console.error('❌ Twilio Verify API error:', verifyError.message);
                return next(new ErrorHander("Invalid or expired OTP. Please try again.", 401));
            }
        } else {
            // Manual OTP verification
            console.log('🔍 Verifying OTP manually');
            console.log('🔍 OTP Expire Time:', user.otpExpire ? new Date(user.otpExpire).toLocaleString() : 'Not set');
            console.log('🔍 Current Time:', new Date().toLocaleString());
            
            isOTPValid = user.verifyOTP(otp);
            
            if (!isOTPValid) {
                console.log('❌ OTP verification failed');
                if (user.otpExpire && user.otpExpire < Date.now()) {
                    console.log('❌ OTP has expired');
                    return next(new ErrorHander("OTP has expired. Please request a new one.", 401));
                }
                console.log('❌ OTP does not match');
                return next(new ErrorHander("Invalid OTP. Please check and try again.", 401));
            }
            
            console.log('✅ OTP verified successfully (manual)');
        }
        
        if (!isOTPValid) {
            return next(new ErrorHander("Invalid OTP. Please try again.", 401));
        }
        
        // Track if this is a new registration
        const wasNewUser = !user.isVerified;
        
        // If new user (not verified), update details
        if (wasNewUser) {
            console.log('📝 Processing new user registration');
            
            if (!name || !gender) {
                console.log('❌ Missing registration details');
                return next(new ErrorHander("Please provide name and gender for registration", 400));
            }
            
            if (name.length < 4) {
                console.log('❌ Name too short:', name.length);
                return next(new ErrorHander("Name should have more than 4 characters", 400));
            }
            
            // Ensure role is valid
            const validRoles = ['user', 'doctor', 'pharmacist'];
            const userRole = validRoles.includes(role) ? role : 'user';
            
            user.name = name;
            user.gender = gender;
            user.role = userRole;
            user.contact = phone;
            user.isVerified = true;
            
            // Handle avatar for doctors
            if (userRole === 'doctor' && avatar) {
                try {
                    const parsedAvatar = typeof avatar === 'string' ? JSON.parse(avatar) : avatar;
                    user.avatar = {
                        public_id: parsedAvatar.public_id || "",
                        url: parsedAvatar.url || ""
                    };
                    console.log('✅ Avatar set for doctor');
                } catch (error) {
                    console.error('⚠️ Error parsing avatar:', error);
                }
            }
            
            // Add speciality for doctors
            if (userRole === 'doctor') {
                user.speciality = speciality || 'General Physician';
                console.log('✅ Speciality set:', user.speciality);
            }
            
            console.log('📝 New user details:', { name, gender, role: userRole });
        } else {
            console.log('🔐 Logging in existing user:', user.name);
        }
        
        // Clear OTP and Twilio Verify flag
        user.otp = undefined;
        user.otpExpire = undefined;
        user.useTwilioVerify = undefined;
        
        // Save user
        await user.save({ validateBeforeSave: false });
        console.log('✅ User saved successfully');
        
        // Send welcome message for new users
        if (wasNewUser) {
            try {
                const message = `Welcome to Cureon ${user.name}! Your account has been created successfully.`;
                
                if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
                    await sendSMS({
                        phone: phoneWithCountryCode,
                        message,
                    });
                    console.log('✅ Welcome SMS sent');
                } else {
                    console.log('⚠️ Twilio not configured - Welcome SMS skipped');
                }
            } catch (error) {
                console.error('⚠️ Failed to send welcome message:', error.message);
            }
        }
        
        console.log('✅ Authentication completed successfully');
        console.log('🔍 ========================================\n');
        
        // Send token
        sendToken(user, wasNewUser ? 201 : 200, res);
        
    } catch (error) {
        console.error('❌ OTP Verification Error:', error);
        console.error('❌ Error Stack:', error.stack);
        return next(new ErrorHander(`Failed to verify OTP: ${error.message}`, 500));
    }
});
