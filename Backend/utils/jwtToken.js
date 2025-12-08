// Creating tokens & saving in cookies

const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();
    
    // Determine if we're in production or development
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Options for cookies
    const options = {
        expires: new Date(
            Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax', // 'lax' for development, 'none' for production
        secure: isProduction, // true only in production (HTTPS)
        path: '/'
    }

    console.log('🍪 Setting cookie with options:', options);

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token: token,
        user: user
    })
}

module.exports = sendToken