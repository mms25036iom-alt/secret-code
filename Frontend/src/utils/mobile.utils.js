// Mobile Utilities for Capacitor
// This file provides cross-platform utilities for camera, geolocation, sharing, etc.

// Check if Capacitor is available
const isCapacitorAvailable = () => {
  try {
    return window.Capacitor !== undefined;
  } catch {
    return false;
  }
};

// Platform detection
export const isMobile = () => {
  if (isCapacitorAvailable()) {
    return window.Capacitor.isNativePlatform();
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getPlatform = () => {
  if (isCapacitorAvailable()) {
    return window.Capacitor.getPlatform();
  }
  return 'web';
};

export const isAndroid = () => getPlatform() === 'android';
export const isIOS = () => getPlatform() === 'ios';
export const isWeb = () => getPlatform() === 'web';

// Camera utilities
export const takePicture = async () => {
  if (!isCapacitorAvailable()) {
    throw new Error('Camera not available on web. Use file input instead.');
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true
    });
    
    return image.dataUrl;
  } catch (error) {
    console.error('Camera error:', error);
    throw error;
  }
};

export const pickImage = async () => {
  if (!isCapacitorAvailable()) {
    throw new Error('Photo picker not available on web. Use file input instead.');
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      correctOrientation: true
    });
    
    return image.dataUrl;
  } catch (error) {
    console.error('Image picker error:', error);
    throw error;
  }
};

export const requestCameraPermission = async () => {
  if (!isCapacitorAvailable()) {
    return true; // Web doesn't need explicit permission
  }

  try {
    const { Camera } = await import('@capacitor/camera');
    const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    return result.camera === 'granted' && result.photos === 'granted';
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

// Geolocation utilities
export const getCurrentPosition = async () => {
  if (!isCapacitorAvailable()) {
    // Fallback to web geolocation API
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    
    return {
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude,
      accuracy: coordinates.coords.accuracy
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    throw error;
  }
};

export const requestLocationPermission = async () => {
  if (!isCapacitorAvailable()) {
    return true; // Web handles permissions automatically
  }

  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const result = await Geolocation.requestPermissions();
    return result.location === 'granted';
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

// Share utilities
export const shareContent = async (title, text, url) => {
  if (!isCapacitorAvailable()) {
    // Fallback to Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (error) {
        console.error('Share error:', error);
        return false;
      }
    }
    // If Web Share API not available, copy to clipboard
    try {
      await navigator.clipboard.writeText(url || text);
      alert('Link copied to clipboard!');
      return true;
    } catch (error) {
      console.error('Clipboard error:', error);
      return false;
    }
  }

  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title,
      text,
      url,
      dialogTitle: 'Share via'
    });
    return true;
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
};

// Toast notifications
export const showToast = async (message, duration = 'short') => {
  if (!isCapacitorAvailable()) {
    // Fallback to alert or custom toast
    console.log('Toast:', message);
    return;
  }

  try {
    const { Toast } = await import('@capacitor/toast');
    await Toast.show({
      text: message,
      duration: duration === 'short' ? 'short' : 'long',
      position: 'bottom'
    });
  } catch (error) {
    console.error('Toast error:', error);
  }
};

// Network status
export const getNetworkStatus = async () => {
  if (!isCapacitorAvailable()) {
    return {
      connected: navigator.onLine,
      connectionType: 'unknown'
    };
  }

  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType
    };
  } catch (error) {
    console.error('Network status error:', error);
    return {
      connected: navigator.onLine,
      connectionType: 'unknown'
    };
  }
};

export const addNetworkListener = async (callback) => {
  if (!isCapacitorAvailable()) {
    window.addEventListener('online', () => callback({ connected: true }));
    window.addEventListener('offline', () => callback({ connected: false }));
    return;
  }

  try {
    const { Network } = await import('@capacitor/network');
    Network.addListener('networkStatusChange', callback);
  } catch (error) {
    console.error('Network listener error:', error);
  }
};

// App state
export const addAppStateListener = async (callback) => {
  if (!isCapacitorAvailable()) {
    document.addEventListener('visibilitychange', () => {
      callback({ isActive: !document.hidden });
    });
    return;
  }

  try {
    const { App } = await import('@capacitor/app');
    App.addListener('appStateChange', callback);
  } catch (error) {
    console.error('App state listener error:', error);
  }
};

// Filesystem utilities
export const saveFile = async (filename, data, mimeType = 'application/octet-stream') => {
  if (!isCapacitorAvailable()) {
    // Web: Download file
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    await Filesystem.writeFile({
      path: filename,
      data: data,
      directory: Directory.Documents
    });
    await showToast('File saved successfully');
  } catch (error) {
    console.error('File save error:', error);
    throw error;
  }
};

// Browser utilities
export const openUrl = async (url) => {
  if (!isCapacitorAvailable()) {
    window.open(url, '_blank');
    return;
  }

  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch (error) {
    console.error('Browser error:', error);
    window.open(url, '_blank');
  }
};

// Haptics (vibration)
export const vibrate = async (duration = 100) => {
  if (!isCapacitorAvailable()) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
    return;
  }

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.error('Haptics error:', error);
  }
};

// Status bar (mobile only)
export const setStatusBarColor = async (color) => {
  if (!isCapacitorAvailable()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.error('Status bar error:', error);
  }
};

export const hideStatusBar = async () => {
  if (!isCapacitorAvailable()) return;

  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.hide();
  } catch (error) {
    console.error('Status bar error:', error);
  }
};

export const showStatusBar = async () => {
  if (!isCapacitorAvailable()) return;

  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.show();
  } catch (error) {
    console.error('Status bar error:', error);
  }
};

// Splash screen
export const hideSplashScreen = async () => {
  if (!isCapacitorAvailable()) return;

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (error) {
    console.error('Splash screen error:', error);
  }
};

// Keyboard utilities
export const hideKeyboard = async () => {
  if (!isCapacitorAvailable()) {
    document.activeElement?.blur();
    return;
  }

  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    await Keyboard.hide();
  } catch (error) {
    console.error('Keyboard error:', error);
  }
};

// Device info
export const getDeviceInfo = async () => {
  if (!isCapacitorAvailable()) {
    return {
      platform: 'web',
      model: 'Unknown',
      operatingSystem: navigator.platform,
      osVersion: 'Unknown',
      manufacturer: 'Unknown',
      isVirtual: false,
      webViewVersion: 'Unknown'
    };
  }

  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    return info;
  } catch (error) {
    console.error('Device info error:', error);
    return null;
  }
};

// Clear all app data (useful for logout)
export const clearAppData = async () => {
  // Clear web storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Clear IndexedDB if available
  if (window.indexedDB) {
    try {
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
    } catch (e) {
      console.log('IndexedDB clear error:', e);
    }
  }
  
  // On Capacitor, try to clear WebView cache
  if (isCapacitorAvailable()) {
    try {
      // Clear any cached data in the WebView
      if (window.caches) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(name => window.caches.delete(name)));
      }
    } catch (e) {
      console.log('Cache clear error:', e);
    }
  }
  
  return true;
};

// Export all utilities
export default {
  // Platform detection
  isMobile,
  getPlatform,
  isAndroid,
  isIOS,
  isWeb,
  
  // Camera
  takePicture,
  pickImage,
  requestCameraPermission,
  
  // Geolocation
  getCurrentPosition,
  requestLocationPermission,
  
  // Share
  shareContent,
  
  // Toast
  showToast,
  
  // Network
  getNetworkStatus,
  addNetworkListener,
  
  // App state
  addAppStateListener,
  
  // Filesystem
  saveFile,
  
  // Browser
  openUrl,
  
  // Haptics
  vibrate,
  
  // Status bar
  setStatusBarColor,
  hideStatusBar,
  showStatusBar,
  
  // Splash screen
  hideSplashScreen,
  
  // Keyboard
  hideKeyboard,
  
  // Device info
  getDeviceInfo,
  
  // App data
  clearAppData
};
