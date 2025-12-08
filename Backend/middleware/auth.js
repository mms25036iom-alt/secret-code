const ErrorHander = require('../utils/errorHander');
const catchAsyncError = require('./catchAsyncError');
const jwt = require('jsonwebtoken')
const User = require('../models/userModel');

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
    console.log('🔐 Auth Check - Headers:', req.headers);
    console.log('🍪 Cookies:', req.cookies);
    
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies.token;
    
    // If no token in cookies, check Authorization header
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
            console.log('🔑 Token found in Authorization header');
        }
    }
    
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('🌐 Origin:', req.get('origin'));
    console.log('📍 Request URL:', req.originalUrl);
    console.log('📍 Request Method:', req.method);
    
    if (!token) {
        console.log('❌ No token found in cookies or Authorization header');
        return next(new ErrorHander("Please login to access this feature", 401));
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded successfully:', decodedData);
        
        const user = await User.findById(decodedData.id);
        if (!user) {
            console.log('❌ User not found for ID:', decodedData.id);
            return next(new ErrorHander("User not found", 404));
        }
        
        console.log('✅ User authenticated:', user.name, user.role);
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Token verification error:', error.message);
        return next(new ErrorHander("Invalid or expired token. Please login again.", 401));
    }
})

exports.authorizeRoles = (...roles) => {
    return catchAsyncError(async(req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHander(`Role: ${req.user.role} is not allowed to access this resource`, 403)
            )
        }
        next();
    })
}
