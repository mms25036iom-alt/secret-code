import {
    CLEAR_ERRORS,
    LOAD_USER_FAIL, LOAD_USER_SUCCESS,
    LOGIN_FAIL, LOGIN_REQUEST, LOGIN_SUCCESS,
    LOGOUT_SUCCESS,
    REGISTER_USER_FAIL, REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS,
    UPLOAD_REQUEST, UPLOAD_SUCCESS, UPLOAD_FAIL,
    GET_HISTORY_REQUEST, GET_HISTORY_SUCCESS, GET_HISTORY_FAIL
} from "../constants/userConstants";
import axios from '../axios';
import { purgePersistedState } from '../store';
import { isMobile, clearAppData } from '../utils/mobile.utils';


export const login = (contact, password) => async (dispatch) => {
    try {
        dispatch({ type: LOGIN_REQUEST });
        const config = { 
            headers: { "Content-Type": "application/json" }
        };
        
        const { data } = await axios.post(
            `/login`,
            { contact, password },
            config
        );

        // Save token to localStorage for axios interceptor
        if (data.token) {
            localStorage.setItem('token', data.token);
            console.log('✅ Token saved to localStorage');
        }

        dispatch({ type: LOGIN_SUCCESS, payload: data.user });
    } catch (error) {
        dispatch({ type: LOGIN_FAIL, payload: error.response?.data?.message || 'Login failed' });
    }
}

export const register = (contact, password, name, role, speciality, availability, avatar) => async (dispatch) => {
    try {
        dispatch({ type: REGISTER_USER_REQUEST });
        
        console.log('🚀 Register action called with:', { contact, name, role, speciality, availability });
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('name', name);
        formData.append('contact', contact);
        formData.append('password', password);
        formData.append('role', role);
        
        console.log('📦 FormData role:', formData.get('role'));
        
        if (role === 'doctor') {
            if (speciality) formData.append('speciality', speciality);
            if (availability !== undefined) formData.append('availability', availability);
            if (avatar) {
                formData.append('avatar', JSON.stringify(avatar));
            }
        }
        
        const config = { 
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true
        }
        
        console.log('📡 Sending registration request...');
        
        const { data } = await axios.post(
            `/register`,
            formData,
            config
        )

        console.log('✅ Registration successful:', data);
        
        // Save token to localStorage for axios interceptor
        if (data.token) {
            localStorage.setItem('token', data.token);
            console.log('✅ Token saved to localStorage');
        }
        
        dispatch({ type: REGISTER_USER_SUCCESS, payload: data.user })
    } catch (error) {
        console.error('❌ Registration failed:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error data:', error.response?.data);
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
        console.error('❌ Final error message:', errorMessage);
        dispatch({ type: REGISTER_USER_FAIL, payload: errorMessage })
    }
}

export const loadUser = () => async (dispatch) => {
    try {
        // Check if token exists before making API call
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('⚠️ No token found, skipping loadUser');
            localStorage.removeItem('persist:root');
            dispatch({ type: LOAD_USER_FAIL, payload: 'No token' });
            return;
        }
        
        const { data } = await axios.get(`/me`);
        dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
    } catch (error) {
        // If user is not authenticated, clear any persisted state
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('🔒 User not authenticated, clearing state');
            localStorage.removeItem('token');
            localStorage.removeItem('persist:root');
            dispatch({ type: LOAD_USER_FAIL, payload: 'Not authenticated' });
        } else {
            dispatch({ type: LOAD_USER_FAIL, payload: error.response?.data?.message || 'Failed to load user' });
        }
    }
};

export const logout = () => async (dispatch) => {
    console.log('🚪 Logout initiated...');
    
    // Helper function to clear all storage synchronously
    const clearAllStorage = () => {
        console.log('🧹 Clearing all storage...');
        
        // Clear localStorage first (most important)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('persist:root');
        
        // Clear everything else in localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            keysToRemove.push(localStorage.key(i));
        }
        keysToRemove.forEach(key => {
            if (key) localStorage.removeItem(key);
        });
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('✅ Storage cleared');
    };

    // Helper function to navigate to login (works on both web and mobile)
    const navigateToLogin = () => {
        console.log('🔄 Navigating to login...');
        const isOnMobile = isMobile();
        
        if (isOnMobile && window.Capacitor) {
            console.log('📱 Mobile detected, using location.href');
            // On Capacitor/Android, use direct location change
            // This forces a full page reload which clears all in-memory state
            window.location.href = '/login';
        } else {
            console.log('🌐 Web detected, using location.replace');
            // On web, use replace to prevent back button issues
            window.location.replace('/login');
        }
    };

    try {
        // Step 1: Clear all storage FIRST
        clearAllStorage();
        
        // Step 2: On mobile, do a more thorough cleanup
        if (isMobile()) {
            console.log('📱 Running mobile cleanup...');
            try {
                await clearAppData();
            } catch (e) {
                console.log('Mobile clear error:', e);
            }
        }
        
        // Step 3: Purge Redux Persist
        console.log('🗑️ Purging Redux Persist...');
        try {
            await purgePersistedState();
        } catch (e) {
            console.log('Purge error:', e);
        }
        
        // Step 4: Dispatch logout success to update Redux state
        dispatch({ type: LOGOUT_SUCCESS });
        console.log('✅ Redux state updated');
        
        // Step 5: Try to call backend logout (fire and forget)
        axios.get(`/logout`).catch(() => {
            console.log('Backend logout call failed (ignored)');
        });
        
        // Step 6: Navigate to login after a small delay
        // The delay ensures Redux state is updated before navigation
        setTimeout(() => {
            navigateToLogin();
        }, 100);
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        // Even if something fails, force logout
        clearAllStorage();
        dispatch({ type: LOGOUT_SUCCESS });
        
        // Force navigation even on error
        setTimeout(() => {
            window.location.href = '/login';
        }, 100);
    }
}

export const addMedicalHistory = (analysis, url) => async (dispatch) => {
    try {
        dispatch({ type: UPLOAD_REQUEST });
        
        const config = { 
            headers: { "Content-Type": "application/json" }
        };

        // Determine if the URL is for a video
        const isVideo = url.includes('video') || url.includes('.mp4') || url.includes('.mov');
        
        const { data } = await axios.post(
            `/medical-history`,
            { 
                analysis, 
                url,
                type: isVideo ? 'video' : 'image'  // Add type field to distinguish between video and image
            },
            config
        );

        dispatch({ 
            type: UPLOAD_SUCCESS,
            payload: data.medicalHistory 
        });

        return data.medicalHistory;
    } catch (error) {
        dispatch({ 
            type: UPLOAD_FAIL, 
            payload: error.response?.data?.message || "Failed to upload medical history"
        });
        throw error; // Re-throw for component error handling
    }
};

export const getMedicalHistory = (userId) => async (dispatch) => {
    try {
        dispatch({ type: GET_HISTORY_REQUEST });
        
        const { data } = await axios.get(`/medical-history/${userId}`);

        // Process the medical history to ensure proper URL handling
        const processedHistory = data.medicalHistory.map(record => ({
            ...record,
            image: {
                ...record.image,
                url: record.image?.url || record.url, // Handle both old and new URL formats
                type: record.image?.type || (record.url?.includes('video') ? 'video' : 'image')
            }
        }));

        dispatch({ 
            type: GET_HISTORY_SUCCESS,
            payload: processedHistory 
        });

        return processedHistory;
    } catch (error) {
        dispatch({ 
            type: GET_HISTORY_FAIL, 
            payload: error.response?.data?.message || "Failed to fetch medical history"
        });
        throw error;
    }
};

export const clearErrors = () => async (dispatch) => {
    dispatch({ type: CLEAR_ERRORS })
}