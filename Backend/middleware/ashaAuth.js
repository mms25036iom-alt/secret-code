const jwt = require("jsonwebtoken");
const AshaWorker = require("../models/ashaWorkerModel");

exports.isAuthenticatedAshaWorker = async (req, res, next) => {
    try {
        const { token } = req.cookies || {};
        const authHeader = req.headers.authorization;

        let authToken = token;

        // Check for Bearer token in Authorization header
        if (!authToken && authHeader && authHeader.startsWith('Bearer ')) {
            authToken = authHeader.substring(7);
        }

        if (!authToken) {
            return res.status(401).json({
                success: false,
                message: "Please login to access this resource"
            });
        }

        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
        req.ashaWorker = await AshaWorker.findById(decodedData.id);

        if (!req.ashaWorker) {
            return res.status(401).json({
                success: false,
                message: "ASHA worker not found"
            });
        }

        if (!req.ashaWorker.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = exports;
