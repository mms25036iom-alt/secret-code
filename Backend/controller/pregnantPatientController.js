const PregnantPatient = require("../models/pregnantPatientModel");

// Add new pregnant patient
exports.addPatient = async (req, res) => {
    try {
        const ashaWorkerId = req.ashaWorker.id;
        const patientData = {
            ...req.body,
            ashaWorker: ashaWorkerId
        };

        const patient = await PregnantPatient.create(patientData);
        
        // Calculate current week and assess risk
        patient.calculateCurrentWeek();
        patient.assessRisk();
        await patient.save();

        res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all patients for ASHA worker
exports.getAllPatients = async (req, res) => {
    try {
        const ashaWorkerId = req.ashaWorker.id;
        const { status, highRisk, search } = req.query;

        let query = { ashaWorker: ashaWorkerId };

        if (status) {
            query.status = status;
        }

        if (highRisk === 'true') {
            query['riskFactors.highRisk'] = true;
        }

        let patients = await PregnantPatient.find(query).sort({ nextScheduledVisit: 1 });

        // Search filter
        if (search) {
            patients = patients.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.phone.includes(search)
            );
        }

        res.status(200).json({
            success: true,
            count: patients.length,
            patients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single patient details
exports.getPatientDetails = async (req, res) => {
    try {
        const patient = await PregnantPatient.findById(req.params.id).populate('ashaWorker', 'name phone');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker._id.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Update current week
        patient.calculateCurrentWeek();
        await patient.save();

        res.status(200).json({
            success: true,
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update patient details
exports.updatePatient = async (req, res) => {
    try {
        let patient = await PregnantPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        patient = await PregnantPatient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        patient.assessRisk();
        await patient.save();

        res.status(200).json({
            success: true,
            message: "Patient updated successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add follow-up visit
exports.addFollowUp = async (req, res) => {
    try {
        const patient = await PregnantPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const followUpData = {
            ...req.body,
            conductedBy: req.ashaWorker.id,
            weekOfPregnancy: patient.calculateCurrentWeek()
        };

        patient.followUps.push(followUpData);
        patient.lastVisitDate = followUpData.date;
        patient.nextScheduledVisit = followUpData.nextVisitDate;

        await patient.save();

        res.status(200).json({
            success: true,
            message: "Follow-up added successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add medicine
exports.addMedicine = async (req, res) => {
    try {
        const patient = await PregnantPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        patient.medicines.push(req.body);
        await patient.save();

        res.status(200).json({
            success: true,
            message: "Medicine added successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update medicine
exports.updateMedicine = async (req, res) => {
    try {
        const patient = await PregnantPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const medicine = patient.medicines.id(req.params.medicineId);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found"
            });
        }

        Object.assign(medicine, req.body);
        await patient.save();

        res.status(200).json({
            success: true,
            message: "Medicine updated successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add vaccination
exports.addVaccination = async (req, res) => {
    try {
        const patient = await PregnantPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        patient.vaccinations.push(req.body);
        await patient.save();

        res.status(200).json({
            success: true,
            message: "Vaccination added successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add lab test
exports.addLabTest = async (req, res) => {
    try {
        const patient = await PregnantPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        patient.labTests.push(req.body);
        await patient.save();

        res.status(200).json({
            success: true,
            message: "Lab test added successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update delivery details
exports.updateDeliveryDetails = async (req, res) => {
    try {
        const patient = await PregnantPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Verify ASHA worker owns this patient
        if (patient.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        patient.deliveryDetails = {
            ...patient.deliveryDetails,
            ...req.body,
            delivered: true
        };
        patient.status = 'Delivered';

        await patient.save();

        res.status(200).json({
            success: true,
            message: "Delivery details updated successfully",
            patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get patients with upcoming visits
exports.getUpcomingVisits = async (req, res) => {
    try {
        const ashaWorkerId = req.ashaWorker.id;
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const patients = await PregnantPatient.find({
            ashaWorker: ashaWorkerId,
            status: 'Active',
            nextScheduledVisit: { $gte: today, $lte: nextWeek }
        }).sort({ nextScheduledVisit: 1 });

        res.status(200).json({
            success: true,
            count: patients.length,
            patients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get overdue visits
exports.getOverdueVisits = async (req, res) => {
    try {
        const ashaWorkerId = req.ashaWorker.id;
        const today = new Date();

        const patients = await PregnantPatient.find({
            ashaWorker: ashaWorkerId,
            status: 'Active',
            nextScheduledVisit: { $lt: today }
        }).sort({ nextScheduledVisit: 1 });

        res.status(200).json({
            success: true,
            count: patients.length,
            patients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = exports;
