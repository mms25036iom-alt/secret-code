/**
 * ZegoCloud Native Call Plugin for Capacitor
 * This module provides a bridge to the native Android ZegoCloud SDK
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// Register the native plugin
const ZegoCall = registerPlugin('ZegoCall');

// Check if we're running on native Android
export const isNativeAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

// ZegoCloud credentials from environment
const getZegoConfig = () => ({
  appID: Number(import.meta.env.VITE_ZEGO_APP_ID) || 1970983545,
  appSign: import.meta.env.VITE_ZEGO_APP_SIGN || 'b460cb2b3b763f4dad0f205c83b8339575a9f323f723a0afb9e8a60b7d60f08e',
});

/**
 * Initialize ZegoCloud native SDK
 * @param {string} userID - The user's ID
 * @param {string} userName - The user's display name
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const initializeZegoNative = async (userID, userName) => {
  if (!isNativeAndroid()) {
    console.log('Not running on native Android, skipping native initialization');
    return { success: false, message: 'Not on native Android' };
  }

  try {
    const config = getZegoConfig();
    console.log('Initializing ZegoCloud native SDK with appID:', config.appID);
    
    // Sanitize userID - only allow alphanumeric and underscore
    const sanitizedUserID = userID.replace(/[^a-zA-Z0-9_]/g, '_');
    
    const result = await ZegoCall.initialize({
      appID: config.appID,
      appSign: config.appSign,
      userID: sanitizedUserID,
      userName: userName || 'User',
    });
    
    console.log('ZegoCloud native SDK initialized:', result);
    return result;
  } catch (error) {
    console.error('Failed to initialize ZegoCloud native SDK:', error);
    return { success: false, message: error.message || 'Initialization failed' };
  }
};

/**
 * Join a video call room using native SDK
 * @param {string} roomID - The room ID to join
 * @param {string} userID - The user's ID
 * @param {string} userName - The user's display name
 * @param {boolean} isVideoCall - Whether this is a video call (true) or voice call (false)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const joinRoomNative = async (roomID, userID, userName, isVideoCall = true) => {
  if (!isNativeAndroid()) {
    console.log('Not running on native Android, cannot use native video call');
    return { success: false, message: 'Not on native Android' };
  }

  try {
    console.log('Joining room via native SDK:', { roomID, userID, userName, isVideoCall });
    
    // Sanitize userID
    const sanitizedUserID = userID.replace(/[^a-zA-Z0-9_]/g, '_');
    
    const result = await ZegoCall.joinRoom({
      roomID,
      userID: sanitizedUserID,
      userName: userName || 'User',
      isVideoCall,
    });
    
    console.log('Join room result:', result);
    return result;
  } catch (error) {
    console.error('Failed to join room via native SDK:', error);
    return { success: false, message: error.message || 'Failed to join room' };
  }
};

/**
 * Start a call to another user
 * @param {string} targetUserID - The target user's ID
 * @param {string} targetUserName - The target user's display name
 * @param {boolean} isVideoCall - Whether this is a video call
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const startCallNative = async (targetUserID, targetUserName, isVideoCall = true) => {
  if (!isNativeAndroid()) {
    return { success: false, message: 'Not on native Android' };
  }

  try {
    const result = await ZegoCall.startCall({
      targetUserID,
      targetUserName: targetUserName || 'User',
      isVideoCall,
    });
    
    return result;
  } catch (error) {
    console.error('Failed to start call:', error);
    return { success: false, message: error.message || 'Failed to start call' };
  }
};

/**
 * End the current call
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const endCallNative = async () => {
  if (!isNativeAndroid()) {
    return { success: false, message: 'Not on native Android' };
  }

  try {
    const result = await ZegoCall.endCall();
    return result;
  } catch (error) {
    console.error('Failed to end call:', error);
    return { success: false, message: error.message || 'Failed to end call' };
  }
};

/**
 * Uninitialize the ZegoCloud SDK
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const uninitializeZegoNative = async () => {
  if (!isNativeAndroid()) {
    return { success: false, message: 'Not on native Android' };
  }

  try {
    const result = await ZegoCall.uninitialize();
    return result;
  } catch (error) {
    console.error('Failed to uninitialize:', error);
    return { success: false, message: error.message || 'Failed to uninitialize' };
  }
};

export default {
  isNativeAndroid,
  initializeZegoNative,
  joinRoomNative,
  startCallNative,
  endCallNative,
  uninitializeZegoNative,
};
