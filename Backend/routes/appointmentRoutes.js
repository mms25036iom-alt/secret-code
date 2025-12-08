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

module.exports = router