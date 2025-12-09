const express = require('express');
const { registerUser, loginUser, getUserDetails, logout, getAllUsers, getSingleUser, updateUserRole, deleteUser, getAllDoctors, addMedicalHistory, getMedicalHistory, notifyDoctorJoined, getCompletePatientData, sendOTP, verifyOTPAndAuth, uploadMedicalDocument, getMedicalDocuments, deleteMedicalDocument, getTreatedPatients, getPatientCompleteDetails, generatePatientDataPDF, getDoctorStats } = require('../controller/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { createPrescription, getPrescriptions, getSinglePrescription, generatePrescriptionPDF, dispensePrescription, getAllPharmacies } = require('../controller/prescriptionController');
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

router.route("/prescription/:id/verify")
    .get(getSinglePrescription); // Public route for QR code verification (no auth required)

router.route("/prescription/:id/dispense")
    .put(isAuthenticatedUser, authorizeRoles("pharmacist", "pharmacy"), dispensePrescription);

router.route("/pharmacies/all")
    .get(isAuthenticatedUser, getAllPharmacies);

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

// Emergency Contacts routes
router.route("/emergency-contacts")
    .get(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const user = await User.findById(req.user.id).select('emergencyContacts');
            
            res.status(200).json({
                success: true,
                emergencyContacts: user.emergencyContacts || []
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch emergency contacts",
                error: error.message
            });
        }
    })
    .post(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const { name, relationship, phone, isPrimary } = req.body;

            if (!name || !relationship || !phone) {
                return res.status(400).json({
                    success: false,
                    message: "Name, relationship, and phone are required"
                });
            }

            const user = await User.findById(req.user.id);
            
            // If this is set as primary, unset other primary contacts
            if (isPrimary) {
                user.emergencyContacts.forEach(contact => {
                    contact.isPrimary = false;
                });
            }

            user.emergencyContacts.push({
                name,
                relationship,
                phone,
                isPrimary: isPrimary || false
            });

            await user.save();

            res.status(201).json({
                success: true,
                message: "Emergency contact added successfully",
                emergencyContacts: user.emergencyContacts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to add emergency contact",
                error: error.message
            });
        }
    });

router.route("/emergency-contacts/:contactId")
    .put(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const { name, relationship, phone, isPrimary } = req.body;
            
            const user = await User.findById(req.user.id);
            const contact = user.emergencyContacts.id(req.params.contactId);
            
            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message: "Emergency contact not found"
                });
            }

            if (name) contact.name = name;
            if (relationship) contact.relationship = relationship;
            if (phone) contact.phone = phone;
            
            if (isPrimary) {
                user.emergencyContacts.forEach(c => {
                    c.isPrimary = false;
                });
                contact.isPrimary = true;
            }

            await user.save();

            res.status(200).json({
                success: true,
                message: "Emergency contact updated successfully",
                emergencyContacts: user.emergencyContacts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update emergency contact",
                error: error.message
            });
        }
    })
    .delete(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const user = await User.findById(req.user.id);
            
            user.emergencyContacts = user.emergencyContacts.filter(
                contact => contact._id.toString() !== req.params.contactId
            );

            await user.save();

            res.status(200).json({
                success: true,
                message: "Emergency contact deleted successfully",
                emergencyContacts: user.emergencyContacts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to delete emergency contact",
                error: error.message
            });
        }
    });

// Family Members routes
router.route("/family-members")
    .get(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const user = await User.findById(req.user.id).select('familyMembers');
            
            res.status(200).json({
                success: true,
                familyMembers: user.familyMembers || []
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch family members",
                error: error.message
            });
        }
    })
    .post(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const { name, relationship, age, gender, phone, medicalConditions } = req.body;

            if (!name || !relationship) {
                return res.status(400).json({
                    success: false,
                    message: "Name and relationship are required"
                });
            }

            const user = await User.findById(req.user.id);
            
            user.familyMembers.push({
                name,
                relationship,
                age,
                gender,
                phone,
                medicalConditions
            });

            await user.save();

            res.status(201).json({
                success: true,
                message: "Family member added successfully",
                familyMembers: user.familyMembers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to add family member",
                error: error.message
            });
        }
    });

router.route("/family-members/:memberId")
    .put(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const { name, relationship, age, gender, phone, medicalConditions } = req.body;
            
            const user = await User.findById(req.user.id);
            const member = user.familyMembers.id(req.params.memberId);
            
            if (!member) {
                return res.status(404).json({
                    success: false,
                    message: "Family member not found"
                });
            }

            if (name) member.name = name;
            if (relationship) member.relationship = relationship;
            if (age !== undefined) member.age = age;
            if (gender) member.gender = gender;
            if (phone) member.phone = phone;
            if (medicalConditions !== undefined) member.medicalConditions = medicalConditions;

            await user.save();

            res.status(200).json({
                success: true,
                message: "Family member updated successfully",
                familyMembers: user.familyMembers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update family member",
                error: error.message
            });
        }
    })
    .delete(isAuthenticatedUser, async (req, res) => {
        try {
            const User = require('../models/userModel');
            const user = await User.findById(req.user.id);
            
            user.familyMembers = user.familyMembers.filter(
                member => member._id.toString() !== req.params.memberId
            );

            await user.save();

            res.status(200).json({
                success: true,
                message: "Family member deleted successfully",
                familyMembers: user.familyMembers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to delete family member",
                error: error.message
            });
        }
    });
