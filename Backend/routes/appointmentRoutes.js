const express = require('express')
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { newAppointment, allAppointments, deleteAppointment, getSingleAppointment, getAvailableSlots, updateAppointmentStatus, migrateAppointments } = require('../controller/appointmentController');

const router = express.Router();

router.route("/appointment/new").post(isAuthenticatedUser, newAppointment)
router.route("/appointment/my").get(isAuthenticatedUser, allAppointments)
router.route("/appointment/slots/:doctorId/:date").get(getAvailableSlots)
router.route("/appointment/migrate").get(migrateAppointments) // Temporary migration endpoint
router.route("/appointment/:id")
    .get(isAuthenticatedUser, getSingleAppointment)
    .delete(isAuthenticatedUser, deleteAppointment)
router.route("/appointment/:id/status").put(isAuthenticatedUser, updateAppointmentStatus)

// Debug endpoint to check appointments
router.route("/appointment/debug/check").get(isAuthenticatedUser, async (req, res) => {
    try {
        const Appointment = require('../models/appointmentModel');
        const appointments = await Appointment.find({ doctor: req.user._id })
            .populate('patient', 'name contact email')
            .populate('doctor', 'name speciality');
        
        res.json({
            success: true,
            count: appointments.length,
            userRole: req.user.role,
            userId: req.user._id,
            appointments: appointments.map(apt => ({
                id: apt._id,
                status: apt.status,
                day: apt.day,
                time: apt.time,
                patient: apt.patient ? {
                    id: apt.patient._id,
                    name: apt.patient.name,
                    contact: apt.patient.contact
                } : null,
                doctor: apt.doctor ? {
                    id: apt.doctor._id,
                    name: apt.doctor.name
                } : null
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router