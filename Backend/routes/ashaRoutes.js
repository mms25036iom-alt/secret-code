const express = require("express");
const router = express.Router();
const {
    registerAshaWorker,
    loginAshaWorker,
    getAshaWorkerProfile,
    updateAshaWorkerProfile,
    getDashboardStats
} = require("../controller/ashaWorkerController");
const {
    addPatient,
    getAllPatients,
    getPatientDetails,
    updatePatient,
    addFollowUp,
    addMedicine,
    updateMedicine,
    addVaccination,
    addLabTest,
    updateDeliveryDetails,
    getUpcomingVisits,
    getOverdueVisits
} = require("../controller/pregnantPatientController");
const { isAuthenticatedAshaWorker } = require("../middleware/ashaAuth");

// ASHA Worker Authentication Routes
router.post("/register", registerAshaWorker); // Admin only in production
router.post("/login", loginAshaWorker);
router.get("/profile", isAuthenticatedAshaWorker, getAshaWorkerProfile);
router.put("/profile", isAuthenticatedAshaWorker, updateAshaWorkerProfile);
router.get("/dashboard/stats", isAuthenticatedAshaWorker, getDashboardStats);

// Notifications Routes
router.get("/notifications", isAuthenticatedAshaWorker, require("../controller/ashaWorkerController").getNotifications);
router.put("/notifications/:id/read", isAuthenticatedAshaWorker, require("../controller/ashaWorkerController").markNotificationRead);

// Reports Routes
router.get("/reports/:type", isAuthenticatedAshaWorker, require("../controller/ashaWorkerController").generateReport);

// Patient Management Routes
router.post("/patients", isAuthenticatedAshaWorker, addPatient);
router.get("/patients", isAuthenticatedAshaWorker, getAllPatients);
router.get("/patients/upcoming-visits", isAuthenticatedAshaWorker, getUpcomingVisits);
router.get("/patients/overdue-visits", isAuthenticatedAshaWorker, getOverdueVisits);
router.get("/patients/:id", isAuthenticatedAshaWorker, getPatientDetails);
router.put("/patients/:id", isAuthenticatedAshaWorker, updatePatient);

// Follow-up Routes
router.post("/patients/:id/followup", isAuthenticatedAshaWorker, addFollowUp);

// Medicine Routes
router.post("/patients/:id/medicines", isAuthenticatedAshaWorker, addMedicine);
router.put("/patients/:id/medicines/:medicineId", isAuthenticatedAshaWorker, updateMedicine);

// Vaccination Routes
router.post("/patients/:id/vaccinations", isAuthenticatedAshaWorker, addVaccination);

// Lab Test Routes
router.post("/patients/:id/labtests", isAuthenticatedAshaWorker, addLabTest);

// Delivery Routes
router.put("/patients/:id/delivery", isAuthenticatedAshaWorker, updateDeliveryDetails);

module.exports = router;
