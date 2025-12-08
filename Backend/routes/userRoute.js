const express = require('express');
const { registerUser, loginUser, getUserDetails, logout, getAllUsers, getSingleUser, updateUserRole, deleteUser, getAllDoctors, addMedicalHistory, getMedicalHistory, notifyDoctorJoined, getCompletePatientData, sendOTP, verifyOTPAndAuth, uploadMedicalDocument, getMedicalDocuments, deleteMedicalDocument, getTreatedPatients, getPatientCompleteDetails, generatePatientDataPDF, getDoctorStats } = require('../controller/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { createPrescription, getPrescriptions, getSinglePrescription, generatePrescriptionPDF } = require('../controller/prescriptionController');
const { uploadSingle, uploadDocument } = require('../utils/cloudinary');

const router = express.Router()

// OTP-based authentication routes
router.route('/send-otp').post(sendOTP)
router.route('/verify-otp').post(verifyOTPAndAuth)

// Traditional authentication routes (kept for backward compatibility)
router.route('/register').post(uploadSingle, registerUser)
router.route('/login').post(loginUser)
router.route('/logout').get(logout)


router.route('/doctors').get(getAllDoctors)
router.route('/doctor/:doctorId/stats').get(getDoctorStats)
router.route('/me').get(isAuthenticatedUser, getUserDetails)

router.route("/medical-history")
    .post(isAuthenticatedUser, addMedicalHistory)

router.route("/medical-history/:userId")
    .get(isAuthenticatedUser, getMedicalHistory)

router.route("/prescription/new")
    .post(isAuthenticatedUser, authorizeRoles("doctor"), createPrescription);

router.route("/prescriptions")
    .get(isAuthenticatedUser, getPrescriptions);

router.route("/prescription/:id")
    .get(isAuthenticatedUser, getSinglePrescription);

router.route("/prescription/:id/pdf")
    .get(isAuthenticatedUser, generatePrescriptionPDF);

router.route("/notify-doctor-joined")
    .post(isAuthenticatedUser, authorizeRoles("doctor"), notifyDoctorJoined);

router.route("/patient/:patientId/complete-data")
    .get(isAuthenticatedUser, getCompletePatientData);

// Medical Documents routes
router.route("/medical-documents/upload")
    .post(isAuthenticatedUser, uploadDocument, uploadMedicalDocument);

router.route("/medical-documents/:userId")
    .get(isAuthenticatedUser, getMedicalDocuments);

router.route("/medical-documents/:documentId")
    .delete(isAuthenticatedUser, deleteMedicalDocument);

// Doctor routes - Treated Patients
router.route("/doctor/treated-patients")
    .get(isAuthenticatedUser, authorizeRoles("doctor"), getTreatedPatients);

router.route("/patient/:patientId/complete-details")
    .get(isAuthenticatedUser, authorizeRoles("doctor"), getPatientCompleteDetails);

// Patient Data PDF Download
router.route("/patient/:userId/data-pdf")
    .get(isAuthenticatedUser, generatePatientDataPDF);

router.route("/patient/data-pdf")
    .get(isAuthenticatedUser, generatePatientDataPDF);

// Route for doctors to lookup patient by ID
router.route("/user/:id")
    .get(isAuthenticatedUser, authorizeRoles("doctor"), getSingleUser);

// router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers)
// router.route('/admin/user/:id')
//     .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
//     .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
//     .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser)


module.exports = router