# Cureon Healthcare Application - Complete Project Documentation

> **Last Updated:** December 9, 2025  
> **Version:** 1.0.0  
> **Platform:** Web + Android (Capacitor)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Authentication Flow](#authentication-flow)
5. [Logout Feature (Recent Fix)](#logout-feature-recent-fix)
6. [Android/Capacitor Setup](#androidcapacitor-setup)
7. [API Configuration](#api-configuration)
8. [State Management](#state-management)
9. [Key Features](#key-features)
10. [Environment Setup](#environment-setup)
11. [Running the Project](#running-the-project)
12. [Building Android APK](#building-android-apk)
13. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Cureon** is a comprehensive telemedicine/healthcare application that provides:
- Patient-Doctor video consultations (ZegoCloud)
- AI-powered medical image analysis (Gemini AI)
- Digital prescriptions with QR codes
- Pharmacy integration for medicine dispensing
- Multi-language support (English, Hindi, Punjabi)
- Health monitoring dashboard
- SOS emergency feature

---

## Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **State Management:** Redux + Redux Persist + Redux Thunk
- **Styling:** Tailwind CSS 4 + Material UI
- **Mobile:** Capacitor 7 (Android)
- **HTTP Client:** Axios
- **Video Calls:** ZegoCloud UIKit
- **Charts:** Chart.js + Recharts

### Backend
- **Runtime:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** Cloudinary
- **AI:** Google Gemini AI
- **SMS/OTP:** Twilio
- **PDF Generation:** PDFKit
- **Real-time:** Socket.IO

---

## Project Structure

```
cureon-final/
├── Backend/
│   ├── controller/           # Route handlers
│   │   ├── userController.js
│   │   ├── appointmentController.js
│   │   ├── prescriptionController.js
│   │   └── pharmacyController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── catchAsyncError.js
│   ├── models/               # MongoDB schemas
│   │   ├── userModel.js
│   │   ├── appointmentModel.js
│   │   ├── prescriptionModel.js
│   │   └── pharmacyModel.js
│   ├── routes/               # API route definitions
│   ├── utils/
│   │   ├── jwtToken.js       # Token generation
│   │   ├── sendEmail.js
│   │   └── twilioVerify.js
│   ├── server.js             # Main Express server
│   ├── socketServer.js       # Socket.IO server
│   └── .env                  # Environment variables
│
├── Frontend/
│   ├── src/
│   │   ├── actions/          # Redux actions
│   │   │   └── userActions.js  # Login, logout, register
│   │   ├── reducers/         # Redux reducers
│   │   │   └── userReducer.js
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── config/
│   │   │   └── api.config.js # API URL configuration
│   │   ├── utils/
│   │   │   └── mobile.utils.js # Capacitor utilities
│   │   ├── context/          # React contexts
│   │   ├── locales/          # Translation files
│   │   ├── axios.js          # Configured Axios instance
│   │   ├── store.js          # Redux store configuration
│   │   └── App.jsx           # Main app component
│   ├── android/              # Android native project
│   ├── capacitor.config.json # Capacitor configuration
│   └── .env                  # Frontend environment variables
│
├── capacitor.config.json     # Root Capacitor config
├── DEVELOPMENT_CHANGELOG.md  # Feature changelog
└── PROJECT_DOCUMENTATION.md  # This file
```

---

## Authentication Flow

### Login Flow
```
1. User enters credentials (contact + password)
2. Frontend dispatches LOGIN_REQUEST action
3. POST /api/v1/login → Backend validates credentials
4. Backend generates JWT token, sends in response + cookie
5. Frontend stores token in localStorage
6. Redux state updated: isAuthenticated = true
7. Redux Persist saves user state to localStorage
8. User redirected to home page
```

### Token Handling
- **Storage:** localStorage (key: 'token')
- **Transmission:** Authorization header (`Bearer <token>`)
- **Validation:** Backend middleware checks both cookie and header
- **Expiry:** Configured in JWT_EXPIRE env variable (default: 7 days)

### Protected Routes
```jsx
// Frontend/src/components/ProtectedRoute.jsx
- Checks isAuthenticated from Redux state
- Shows loading spinner while checking
- Redirects to /login if not authenticated
```

---

## Logout Feature (Recent Fix)

### Problem Solved
The logout feature was not working properly because:
1. **Token not saved on login** - The login/register actions weren't saving the JWT token to localStorage
2. Redux Persist was restoring user state before cleanup completed
3. `localStorage.clear()` wasn't thorough enough
4. `window.location.href` allowed back-button navigation to authenticated pages
5. Mobile (Capacitor) needed different navigation handling
6. `loadUser()` was making API calls even without a token
7. Backend logout cookie settings weren't correct for cross-origin requests

### Solution Implemented

#### File: `Frontend/src/actions/userActions.js`

**Login - Now saves token:**
```javascript
export const login = (contact, password) => async (dispatch) => {
    // ... API call ...
    
    // Save token to localStorage for axios interceptor
    if (data.token) {
        localStorage.setItem('token', data.token);
    }
    dispatch({ type: LOGIN_SUCCESS, payload: data.user });
}
```

**LoadUser - Checks for token first:**
```javascript
export const loadUser = () => async (dispatch) => {
    // Check if token exists before making API call
    const token = localStorage.getItem('token');
    if (!token) {
        localStorage.removeItem('persist:root');
        dispatch({ type: LOAD_USER_FAIL, payload: 'No token' });
        return;
    }
    // ... rest of the function
}
```

**Logout - Complete implementation:**
```javascript
export const logout = () => async (dispatch) => {
    const clearAllStorage = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('persist:root');
        
        // Clear all remaining localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            keysToRemove.push(localStorage.key(i));
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        sessionStorage.clear();
        // Clear cookies...
    };

    const navigateToLogin = () => {
        if (isMobile() && window.Capacitor) {
            window.location.href = '/login'; // Direct navigation for mobile
        } else {
            window.location.replace('/login'); // Prevent back button on web
        }
    };

    try {
        clearAllStorage();
        if (isMobile()) await clearAppData();
        await purgePersistedState();
        dispatch({ type: LOGOUT_SUCCESS });
        axios.get(`/logout`).catch(() => {});
        setTimeout(() => navigateToLogin(), 100);
    } catch (error) {
        clearAllStorage();
        dispatch({ type: LOGOUT_SUCCESS });
        setTimeout(() => window.location.href = '/login', 100);
    }
}
```

#### File: `Frontend/src/store.js`
```javascript
export const purgePersistedState = async () => {
    try {
        await persistor.flush();  // Complete pending writes
        await persistor.purge();  // Clear persisted state
    } catch (e) {
        console.error('Error purging persisted state:', e);
    }
};
```

#### File: `Backend/controller/userController.js`
```javascript
exports.logout = catchAsyncError(async (req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie("token", "", {
        expires: new Date(0),
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        path: '/'
    });

    res.status(200).json({ success: true, message: "Logged Out" });
});
```

#### File: `Frontend/src/utils/mobile.utils.js`
```javascript
export const clearAppData = async () => {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear IndexedDB
    if (window.indexedDB) {
        const databases = await window.indexedDB.databases();
        databases.forEach(db => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
        });
    }
    
    // Clear WebView caches (Capacitor)
    if (window.caches) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(name => window.caches.delete(name)));
    }
};
```

---

## Android/Capacitor Setup

### Configuration File: `capacitor.config.json`
```json
{
  "appId": "com.cureon.telemed",
  "appName": "Cureon Health",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "allowNavigation": ["*"]
  },
  "android": {
    "allowMixedContent": true,
    "webContentsDebuggingEnabled": true
  },
  "plugins": {
    "SplashScreen": { "launchShowDuration": 2000 },
    "Camera": { "permissions": ["camera", "photos"] }
  }
}
```

### Mobile Utilities: `Frontend/src/utils/mobile.utils.js`
Provides cross-platform utilities:
- `isMobile()` - Detect if running on mobile
- `getPlatform()` - Get platform (android/ios/web)
- `takePicture()` - Camera access
- `getCurrentPosition()` - Geolocation
- `shareContent()` - Native sharing
- `clearAppData()` - Clear all app data (for logout)

---

## API Configuration

### File: `Frontend/src/config/api.config.js`

**URL Selection Priority:**
1. Environment variable `VITE_API_URL`
2. Production mode → Deployed URL
3. Auto-detect based on hostname

```javascript
// Auto-detection logic
const getAutoDetectedUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost') return 'http://localhost:4000';
    return `${protocol}//${hostname}:4000`; // Same IP, port 4000
};
```

### Axios Instance: `Frontend/src/axios.js`
- Base URL from api.config.js
- 30-second timeout (mobile-friendly)
- Auto-attaches JWT token to requests
- Handles 401 errors (auto-logout)

---

## State Management

### Redux Store: `Frontend/src/store.js`
```javascript
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['user'] // Only persist user state
};
```

### User Reducer States
```javascript
{
    loading: boolean,
    isAuthenticated: boolean,
    user: { _id, name, contact, role, ... } | null,
    error: string | null
}
```

### Key Actions
- `LOGIN_REQUEST/SUCCESS/FAIL`
- `REGISTER_USER_REQUEST/SUCCESS/FAIL`
- `LOAD_USER_SUCCESS/FAIL`
- `LOGOUT_SUCCESS`

---

## Key Features

### 1. Video Consultation (ZegoCloud)
- Real-time video calls between patient and doctor
- Room-based system with unique IDs
- Email notification when doctor joins

### 2. AI Medical Analysis
- ECG analysis
- X-Ray analysis
- Skin condition analysis
- Retinopathy detection
- Alzheimer's detection
- Cancer screening

### 3. Prescription System
- Digital prescriptions with QR codes
- PDF generation
- Pharmacy integration
- QR becomes invalid after dispensing

### 4. Pharmacy Integration
- Medicine inventory management
- QR code scanning for dispensing
- Auto-deduction from inventory
- Order tracking

### 5. Multi-language Support
- English, Hindi, Punjabi
- Language saved to localStorage
- Dynamic UI updates

---

## Environment Setup

### Backend `.env`
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Gemini AI
GEMINI_API_KEY=...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TWILIO_VERIFY_SERVICE_SID=...
```

### Frontend `.env`
```env
VITE_API_URL=https://cureon-backend.onrender.com
VITE_SOCKET_URL=https://cureon-backend.onrender.com
VITE_GEMINI_API_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
VITE_ZEGO_APP_ID=...
VITE_ZEGO_SERVER_SECRET=...
```

---

## Running the Project

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Android Studio (for APK)

### Backend
```bash
cd Backend
npm install
npm run dev    # Development with nodemon
# OR
npm start      # Production
```

### Frontend (Web)
```bash
cd Frontend
npm install
npm run dev -- --host  # Accessible on network
```

### Frontend (Android)
```bash
cd Frontend
npm run build
npx cap sync android
npx cap open android   # Opens Android Studio
```

---

## Building Android APK

### Debug APK
```bash
cd Frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/
```

### Release APK
```bash
cd android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/
```

### Quick Commands
```bash
npm run android        # Build + Sync + Open Android Studio
npm run android:sync   # Just sync
npm run android:open   # Just open Android Studio
```

---

## Troubleshooting

### Logout Not Working
1. Check browser DevTools → Application → Local Storage
2. Ensure `persist:root` is being cleared
3. Check console for "Purge error" messages
4. Try hard refresh (Ctrl+Shift+R)

### Android: API Calls Failing
1. Check `capacitor.config.json` has `cleartext: true`
2. Ensure backend URL is HTTPS or localhost
3. Check Android logcat for network errors

### Token Issues
1. Check localStorage for 'token' key
2. Verify token format (should not have extra quotes)
3. Check backend JWT_SECRET matches

### Redux State Not Updating
1. Check Redux DevTools extension
2. Verify action is being dispatched
3. Check reducer is handling the action type

---

## Contact & Support

For issues or questions about this codebase, refer to:
- `DEVELOPMENT_CHANGELOG.md` - Feature history
- `Frontend/src/config/api.config.js` - API configuration
- `Frontend/src/actions/userActions.js` - Auth actions
- `Backend/middleware/auth.js` - Auth middleware

---

*This documentation was generated to help developers understand and continue work on the Cureon Healthcare Application.*
