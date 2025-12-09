const AshaWorker = require("../models/ashaWorkerModel");
const PregnantPatient = require("../models/pregnantPatientModel");
const Notification = require("../models/notificationModel");

// Register ASHA Worker (Admin only)
exports.registerAshaWorker = async (req, res) => {
    try {
        const { name, govtId, phone, password, village, district, state, qualification, yearsOfExperience, assignedArea } = req.body;

        // Check if ASHA worker already exists
        const existingWorker = await AshaWorker.findOne({ $or: [{ govtId }, { phone }] });
        if (existingWorker) {
            return res.status(400).json({
                success: false,
                message: "ASHA worker with this Govt ID or phone already exists"
            });
        }

        const ashaWorker = await AshaWorker.create({
            name,
            govtId,
            phone,
            password,
            village,
            district,
            state,
            qualification,
            yearsOfExperience,
            assignedArea
        });

        const token = ashaWorker.getJWTToken();

        res.status(201).json({
            success: true,
            message: "ASHA worker registered successfully",
            ashaWorker: {
                id: ashaWorker._id,
                name: ashaWorker.name,
                govtId: ashaWorker.govtId,
                phone: ashaWorker.phone,
                village: ashaWorker.village
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ASHA Worker Login
exports.loginAshaWorker = async (req, res) => {
    try {
        const { govtId, password } = req.body;

        if (!govtId || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide Govt ID and password"
            });
        }

        const ashaWorker = await AshaWorker.findOne({ govtId: govtId.toUpperCase() }).select("+password");

        if (!ashaWorker) {
            return res.status(401).json({
                success: false,
                message: "Invalid Govt ID or password"
            });
        }

        if (!ashaWorker.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact administrator"
            });
        }

        const isPasswordMatched = await ashaWorker.comparePassword(password);

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid Govt ID or password"
            });
        }

        const token = ashaWorker.getJWTToken();

        res.status(200).json({
            success: true,
            message: "Login successful",
            ashaWorker: {
                id: ashaWorker._id,
                name: ashaWorker.name,
                govtId: ashaWorker.govtId,
                phone: ashaWorker.phone,
                village: ashaWorker.village,
                assignedArea: ashaWorker.assignedArea
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get ASHA Worker Profile
exports.getAshaWorkerProfile = async (req, res) => {
    try {
        const ashaWorker = await AshaWorker.findById(req.ashaWorker.id);

        if (!ashaWorker) {
            return res.status(404).json({
                success: false,
                message: "ASHA worker not found"
            });
        }

        // Get patient statistics
        const totalPatients = await PregnantPatient.countDocuments({ ashaWorker: ashaWorker._id });
        const activePatients = await PregnantPatient.countDocuments({ ashaWorker: ashaWorker._id, status: 'Active' });
        const highRiskPatients = await PregnantPatient.countDocuments({ 
            ashaWorker: ashaWorker._id, 
            'riskFactors.highRisk': true,
            status: 'Active'
        });

        res.status(200).json({
            success: true,
            ashaWorker,
            statistics: {
                totalPatients,
                activePatients,
                highRiskPatients
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update ASHA Worker Profile
exports.updateAshaWorkerProfile = async (req, res) => {
    try {
        const { name, phone, village, assignedArea } = req.body;

        const ashaWorker = await AshaWorker.findByIdAndUpdate(
            req.ashaWorker.id,
            { name, phone, village, assignedArea },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            ashaWorker
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const ashaWorkerId = req.ashaWorker.id;

        const totalPatients = await PregnantPatient.countDocuments({ ashaWorker: ashaWorkerId });
        const activePatients = await PregnantPatient.countDocuments({ ashaWorker: ashaWorkerId, status: 'Active' });
        const deliveredPatients = await PregnantPatient.countDocuments({ ashaWorker: ashaWorkerId, status: 'Delivered' });
        const highRiskPatients = await PregnantPatient.countDocuments({ 
            ashaWorker: ashaWorkerId, 
            'riskFactors.highRisk': true,
            status: 'Active'
        });

        // Patients needing visit this week
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingVisits = await PregnantPatient.countDocuments({
            ashaWorker: ashaWorkerId,
            status: 'Active',
            nextScheduledVisit: { $gte: today, $lte: nextWeek }
        });

        // Overdue visits
        const overdueVisits = await PregnantPatient.countDocuments({
            ashaWorker: ashaWorkerId,
            status: 'Active',
            nextScheduledVisit: { $lt: today }
        });

        res.status(200).json({
            success: true,
            statistics: {
                totalPatients,
                activePatients,
                deliveredPatients,
                highRiskPatients,
                upcomingVisits,
                overdueVisits
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Notifications
exports.getNotifications = async (req, res) => {
    try {
        const ashaWorkerId = req.ashaWorker.id;

        const notifications = await Notification.find({ ashaWorker: ashaWorkerId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('patient', 'name phone');

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        // Verify ownership
        if (notification.ashaWorker.toString() !== req.ashaWorker.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate Reports
exports.generateReport = async (req, res) => {
    try {
        const ashaWorkerId = req.ashaWorker.id;
        const { month, year } = req.query;
        const reportType = req.params.type;

        let startDate, endDate;

        if (reportType === 'monthly') {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
        } else if (reportType === 'quarterly') {
            const quarter = Math.ceil(month / 3);
            startDate = new Date(year, (quarter - 1) * 3, 1);
            endDate = new Date(year, quarter * 3, 0);
        } else if (reportType === 'annual') {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
        }

        // Get statistics for the period
        const totalPatients = await PregnantPatient.countDocuments({
            ashaWorker: ashaWorkerId,
            registeredAt: { $lte: endDate }
        });

        const activePatients = await PregnantPatient.countDocuments({
            ashaWorker: ashaWorkerId,
            status: 'Active',
            registeredAt: { $lte: endDate }
        });

        const highRiskPatients = await PregnantPatient.countDocuments({
            ashaWorker: ashaWorkerId,
            'riskFactors.highRisk': true,
            status: 'Active',
            registeredAt: { $lte: endDate }
        });

        const deliveries = await PregnantPatient.countDocuments({
            ashaWorker: ashaWorkerId,
            'deliveryDetails.delivered': true,
            'deliveryDetails.deliveryDate': { $gte: startDate, $lte: endDate }
        });

        // Count follow-ups in the period
        const patients = await PregnantPatient.find({ ashaWorker: ashaWorkerId });
        let followUpsCount = 0;
        let referralsCount = 0;

        patients.forEach(patient => {
            if (patient.followUps) {
                const periodFollowUps = patient.followUps.filter(f => {
                    const fDate = new Date(f.date);
                    return fDate >= startDate && fDate <= endDate;
                });
                followUpsCount += periodFollowUps.length;
                referralsCount += periodFollowUps.filter(f => f.referredToDoctor).length;
            }
        });

        const report = {
            period: { startDate, endDate },
            totalPatients,
            activePatients,
            highRiskPatients,
            deliveries,
            followUps: followUpsCount,
            referrals: referralsCount
        };

        res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create notification (utility function)
exports.createNotification = async (ashaWorkerId, patientId, type, title, message, priority = 'medium') => {
    try {
        await Notification.create({
            ashaWorker: ashaWorkerId,
            patient: patientId,
            type,
            title,
            message,
            priority
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = exports;
