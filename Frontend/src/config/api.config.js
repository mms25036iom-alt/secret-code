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
// CONFIGURATION OPTIONS
// ============================================

// Option 1: Use environment variable (recommended for production)
// Set VITE_API_URL in .env file

// Option 2: Use deployed backend URL (works from anywhere)
// UPDATE THIS with your actual Render URL after deploying
const DEPLOYED_API_URL = 'https://cureon-backend.onrender.com';

// Option 3: Auto-detect for local development
// Uses the same host as the frontend (works when backend runs on same machine)
const getAutoDetectedUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If accessing via IP or localhost, use that same host for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  
  // If accessing via network IP (192.168.x.x, 10.x.x.x, etc.)
  // Use the same IP for the backend
  return `${protocol}//${hostname}:4000`;
};

// ============================================
// API URL SELECTION LOGIC
// ============================================

export const API_BASE_URL = (() => {
  // Priority 1: Environment variable (highest priority)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'auto') {
    console.log('📡 Using API URL from .env:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Production mode - use deployed URL
  if (import.meta.env.PROD) {
    console.log('🌐 Production mode, using deployed URL:', DEPLOYED_API_URL);
    return DEPLOYED_API_URL;
  }
  
  // Priority 3: Auto-detect based on current hostname
  const autoUrl = getAutoDetectedUrl();
  console.log('🔍 Auto-detected API URL:', autoUrl);
  console.log('💡 Tip: Set VITE_API_URL in .env for custom URL');
  return autoUrl;
})();

// Socket.IO URL (same as API base URL)
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

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
