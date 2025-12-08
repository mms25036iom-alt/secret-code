// API Configuration for Web and Mobile
// This file handles different API URLs for development, production, and mobile platforms

// Check if Capacitor is available (mobile app)
const isCapacitorAvailable = () => {
  try {
    return window.Capacitor !== undefined;
  } catch {
    return false;
  }
};

// Detect if running on mobile device
const isNativePlatform = () => {
  if (isCapacitorAvailable()) {
    return window.Capacitor.isNativePlatform();
  }
  return false;
};

// ============================================
// IMPORTANT: UPDATE THESE URLs BEFORE BUILDING APK
// ============================================

// Your production backend URL - UPDATE THIS!
// Example: 'https://your-backend.onrender.com' or 'https://api.yourapp.com'
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.101:4000';

// Local development URL
const LOCAL_API_URL = 'http://localhost:4000';

// For mobile testing on real device, use your computer's local IP
// Find your IP: Windows (ipconfig) | Mac/Linux (ifconfig)
// IMPORTANT: Update this with YOUR computer's IP address
const LOCAL_IP = '192.168.0.101'; // UPDATE THIS WITH YOUR LOCAL IP
const MOBILE_DEV_API_URL = `http://${LOCAL_IP}:4000`;

// ============================================
// MOBILE APK CONFIGURATION
// ============================================
// For APK testing, the app will use:
// - Development build: MOBILE_DEV_API_URL (your local IP)
// - Production build: PRODUCTION_API_URL (your production server)
// ============================================

// Determine which API URL to use
export const API_BASE_URL = (() => {
  // Priority 1: Environment variable (if set)
  if (import.meta.env.VITE_API_URL) {
    console.log('📡 Using API URL from environment variable:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Mobile apps (Capacitor) - ALWAYS use local IP for testing
  if (isNativePlatform()) {
    // For mobile APK, always use local IP for testing
    // Change this to PRODUCTION_API_URL when deploying to production
    const mobileUrl = MOBILE_DEV_API_URL;
    console.log('📱 Mobile app detected, using:', mobileUrl);
    console.log('📱 Make sure your phone is on the same WiFi network!');
    return mobileUrl;
  }
  
  // Priority 3: Web apps
  if (import.meta.env.DEV) {
    console.log('🌐 Web development mode, using:', LOCAL_API_URL);
    return LOCAL_API_URL;
  }
  
  console.log('🌐 Web production mode, using:', PRODUCTION_API_URL);
  return PRODUCTION_API_URL;
})();

// Socket.IO URL (same as API base URL)
export const SOCKET_URL = API_BASE_URL;

// API Version
export const API_VERSION = 'v1';

// Full API path
export const API_PATH = `/api/${API_VERSION}`;

// Complete API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}${API_PATH}/login`,
  REGISTER: `${API_BASE_URL}${API_PATH}/register`,
  LOGOUT: `${API_BASE_URL}${API_PATH}/logout`,
  VERIFY_OTP: `${API_BASE_URL}${API_PATH}/verify-otp`,
  RESEND_OTP: `${API_BASE_URL}${API_PATH}/resend-otp`,
  
  // User
  USER: `${API_BASE_URL}${API_PATH}/me`,
  UPDATE_PROFILE: `${API_BASE_URL}${API_PATH}/me/update`,
  UPDATE_PASSWORD: `${API_BASE_URL}${API_PATH}/password/update`,
  
  // Appointments
  APPOINTMENTS: `${API_BASE_URL}${API_PATH}/appointments`,
  CREATE_APPOINTMENT: `${API_BASE_URL}${API_PATH}/appointments/new`,
  UPDATE_APPOINTMENT: `${API_BASE_URL}${API_PATH}/appointments`,
  DELETE_APPOINTMENT: `${API_BASE_URL}${API_PATH}/appointments`,
  
  // Prescriptions
  PRESCRIPTIONS: `${API_BASE_URL}${API_PATH}/prescriptions`,
  CREATE_PRESCRIPTION: `${API_BASE_URL}${API_PATH}/prescriptions/new`,
  
  // Doctors
  DOCTORS: `${API_BASE_URL}${API_PATH}/doctors`,
  DOCTOR_DETAILS: `${API_BASE_URL}${API_PATH}/doctor`,
  
  // Pharmacy
  PHARMACY: `${API_BASE_URL}${API_PATH}/pharmacy`,
  MEDICINES: `${API_BASE_URL}${API_PATH}/medicines`,
  ORDERS: `${API_BASE_URL}${API_PATH}/orders`,
  CREATE_ORDER: `${API_BASE_URL}${API_PATH}/orders/new`,
  
  // AI Analysis
  ANALYSIS: `${API_BASE_URL}${API_PATH}/analysis`,
  ECG_ANALYSIS: `${API_BASE_URL}${API_PATH}/analysis/ecg`,
  XRAY_ANALYSIS: `${API_BASE_URL}${API_PATH}/analysis/xray`,
  SKIN_ANALYSIS: `${API_BASE_URL}${API_PATH}/analysis/skin`,
  RETINOPATHY_ANALYSIS: `${API_BASE_URL}${API_PATH}/analysis/retinopathy`,
  ALZHEIMER_ANALYSIS: `${API_BASE_URL}${API_PATH}/analysis/alzheimer`,
  CANCER_ANALYSIS: `${API_BASE_URL}${API_PATH}/analysis/cancer`,
  
  // Chat
  CHAT: `${API_BASE_URL}${API_PATH}/chat`,
  MESSAGES: `${API_BASE_URL}${API_PATH}/messages`,
  
  // Payment
  PAYMENT: `${API_BASE_URL}${API_PATH}/payment`,
  CREATE_PAYMENT_INTENT: `${API_BASE_URL}${API_PATH}/payment/create-intent`,
  
  // Upload
  UPLOAD: `${API_BASE_URL}${API_PATH}/upload`,
  UPLOAD_IMAGE: `${API_BASE_URL}${API_PATH}/upload/image`,
};

// Helper function to build URL with query params
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(endpoint);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

// Export platform detection utilities
export const platformUtils = {
  isNativePlatform,
  isCapacitorAvailable,
  isMobile: () => {
    return isNativePlatform() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  getPlatform: () => {
    if (isCapacitorAvailable()) {
      return window.Capacitor.getPlatform();
    }
    return 'web';
  }
};

// Log current configuration (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    platform: platformUtils.getPlatform(),
    isNative: isNativePlatform(),
    apiBaseUrl: API_BASE_URL,
    socketUrl: SOCKET_URL
  });
}

export default {
  API_BASE_URL,
  SOCKET_URL,
  API_ENDPOINTS,
  buildUrl,
  platformUtils
};
