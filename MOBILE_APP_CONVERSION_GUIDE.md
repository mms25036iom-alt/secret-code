# 📱 Mobile App Conversion Guide - Smartwatch Integration

## Overview

Since boAt watches connect through their companion app, the web version uses manual data entry. When converted to a mobile app using Capacitor, we can integrate directly with the boAt app's data storage for automatic synchronization.

---

## Current Implementation (Web)

### ✅ What Works Now:

1. **Manual Data Entry**
   - User opens boAt app
   - Views health readings
   - Manually enters values in our app
   - Data syncs to backend

2. **File Import**
   - User exports data from boAt app (if supported)
   - Imports JSON file
   - Bulk sync to backend

3. **Direct Bluetooth** (Desktop Chrome/Edge only)
   - Direct connection to smartwatch
   - Real-time monitoring
   - Automatic sync

### 🎯 User Flow (Current):
```
boAt Watch → boAt App → User views readings → 
Manual entry in our app → Backend → Dashboard
```

---

## Mobile App Conversion (Capacitor)

### Step 1: Install Capacitor

```bash
cd Frontend

# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add android
npx cap add ios
```

### Step 2: Install Required Plugins

```bash
# Health data access
npm install @capacitor-community/health

# Bluetooth
npm install @capacitor-community/bluetooth-le

# Background tasks
npm install @capacitor/background-task

# Local notifications
npm install @capacitor/local-notifications

# App state
npm install @capacitor/app
```

### Step 3: Configure Permissions

#### Android (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.BODY_SENSORS" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE" />
<uses-permission android:name="android.permission.health.READ_OXYGEN_SATURATION" />
<uses-permission android:name="android.permission.health.READ_STEPS" />
```

#### iOS (`ios/App/App/Info.plist`):
```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to monitor your wellness</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need to update your health data</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>We need Bluetooth to connect to your smartwatch</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location for emergency services</string>
```

---

## Enhanced Mobile Implementation

### Create Mobile Health Service

```javascript
// Frontend/src/services/mobileHealthService.js

import { Capacitor } from '@capacitor/core';
import { Health } from '@capacitor-community/health';
import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { BackgroundTask } from '@capacitor/background-task';
import { LocalNotifications } from '@capacitor/local-notifications';

class MobileHealthService {
    constructor() {
        this.isMobile = Capacitor.isNativePlatform();
        this.isMonitoring = false;
    }

    // Request health permissions
    async requestPermissions() {
        if (!this.isMobile) return false;

        try {
            const result = await Health.requestAuthorization({
                read: [
                    'heart_rate',
                    'blood_pressure',
                    'oxygen_saturation',
                    'steps',
                    'sleep'
                ],
                write: []
            });

            return result.granted;
        } catch (error) {
            console.error('Permission request failed:', error);
            return false;
        }
    }

    // Read health data from device
    async readHealthData(type, startDate, endDate) {
        if (!this.isMobile) return null;

        try {
            const data = await Health.query({
                dataType: type,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            return data.data;
        } catch (error) {
            console.error('Read health data failed:', error);
            return null;
        }
    }

    // Sync all health data
    async syncAllHealthData() {
        if (!this.isMobile) return [];

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

        const readings = [];

        try {
            // Heart Rate
            const heartRateData = await this.readHealthData('heart_rate', startDate, endDate);
            if (heartRateData && heartRateData.length > 0) {
                heartRateData.forEach(entry => {
                    readings.push({
                        type: 'heart_rate',
                        value: { single: entry.value },
                        timestamp: new Date(entry.startDate),
                        source: {
                            deviceType: 'other',
                            deviceModel: 'boAt Watch',
                            deviceId: 'mobile-health-api'
                        }
                    });
                });
            }

            // Blood Pressure
            const bpData = await this.readHealthData('blood_pressure', startDate, endDate);
            if (bpData && bpData.length > 0) {
                bpData.forEach(entry => {
                    readings.push({
                        type: 'blood_pressure',
                        value: {
                            systolic: entry.systolic,
                            diastolic: entry.diastolic
                        },
                        timestamp: new Date(entry.startDate),
                        source: {
                            deviceType: 'other',
                            deviceModel: 'boAt Watch',
                            deviceId: 'mobile-health-api'
                        }
                    });
                });
            }

            // SpO2
            const spo2Data = await this.readHealthData('oxygen_saturation', startDate, endDate);
            if (spo2Data && spo2Data.length > 0) {
                spo2Data.forEach(entry => {
                    readings.push({
                        type: 'spo2',
                        value: { single: entry.value * 100 }, // Convert to percentage
                        timestamp: new Date(entry.startDate),
                        source: {
                            deviceType: 'other',
                            deviceModel: 'boAt Watch',
                            deviceId: 'mobile-health-api'
                        }
                    });
                });
            }

            // Steps
            const stepsData = await this.readHealthData('steps', startDate, endDate);
            if (stepsData && stepsData.length > 0) {
                const totalSteps = stepsData.reduce((sum, entry) => sum + entry.value, 0);
                readings.push({
                    type: 'steps',
                    value: { single: totalSteps },
                    timestamp: endDate,
                    source: {
                        deviceType: 'other',
                        deviceModel: 'boAt Watch',
                        deviceId: 'mobile-health-api'
                    }
                });
            }

            return readings;

        } catch (error) {
            console.error('Sync all health data failed:', error);
            return [];
        }
    }

    // Start background monitoring
    async startBackgroundMonitoring(callback) {
        if (!this.isMobile) return;

        this.isMonitoring = true;

        // Setup background task
        BackgroundTask.beforeExit(async () => {
            try {
                const readings = await this.syncAllHealthData();
                if (readings.length > 0) {
                    await callback(readings);
                }
            } catch (error) {
                console.error('Background sync failed:', error);
            }
        });

        // Setup periodic sync (every 15 minutes)
        setInterval(async () => {
            if (this.isMonitoring) {
                const readings = await this.syncAllHealthData();
                if (readings.length > 0) {
                    await callback(readings);
                }
            }
        }, 15 * 60 * 1000);
    }

    // Stop background monitoring
    stopBackgroundMonitoring() {
        this.isMonitoring = false;
    }

    // Send local notification
    async sendNotification(title, body, critical = false) {
        if (!this.isMobile) return;

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id: Date.now(),
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: critical ? 'critical.wav' : 'default',
                        attachments: null,
                        actionTypeId: critical ? 'CRITICAL_ALERT' : 'HEALTH_ALERT',
                        extra: null
                    }
                ]
            });
        } catch (error) {
            console.error('Send notification failed:', error);
        }
    }

    // Check if running on mobile
    isMobilePlatform() {
        return this.isMobile;
    }
}

export default new MobileHealthService();
```

---

## Updated Smartwatch Sync Component for Mobile

```javascript
// Frontend/src/components/SmartwatchSyncMobile.jsx

import { useState, useEffect } from 'react';
import { Watch, RefreshCw, CheckCircle, Smartphone } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';
import mobileHealthService from '../services/mobileHealthService';

const SmartwatchSyncMobile = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const isMobile = mobileHealthService.isMobilePlatform();

    useEffect(() => {
        checkPermissions();
        loadLastSync();
    }, []);

    const checkPermissions = async () => {
        if (isMobile) {
            const granted = await mobileHealthService.requestPermissions();
            setHasPermission(granted);
        }
    };

    const loadLastSync = () => {
        const saved = localStorage.getItem('lastHealthSync');
        if (saved) {
            setLastSync(new Date(saved));
        }
    };

    const syncNow = async () => {
        setIsSyncing(true);

        try {
            const readings = await mobileHealthService.syncAllHealthData();

            if (readings.length > 0) {
                const response = await axios.post('/api/v1/health/readings/bulk', {
                    readings
                });

                if (response.data.success) {
                    setLastSync(new Date());
                    localStorage.setItem('lastHealthSync', new Date().toISOString());
                    
                    toast.success(`Synced ${response.data.count} readings from boAt watch`);

                    // Handle alerts
                    if (response.data.alerts && response.data.alerts.length > 0) {
                        response.data.alerts.forEach(alert => {
                            if (alert.severity === 'critical') {
                                toast.error(alert.message, { autoClose: false });
                                mobileHealthService.sendNotification(
                                    '🚨 CRITICAL HEALTH ALERT',
                                    alert.message,
                                    true
                                );
                            } else {
                                toast.warning(alert.message);
                            }
                        });
                    }
                }
            } else {
                toast.info('No new health data to sync');
            }

        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Failed to sync health data');
        } finally {
            setIsSyncing(false);
        }
    };

    const startMonitoring = async () => {
        await mobileHealthService.startBackgroundMonitoring(async (readings) => {
            // Auto-sync in background
            try {
                const response = await axios.post('/api/v1/health/readings/bulk', {
                    readings
                });

                if (response.data.alerts && response.data.alerts.length > 0) {
                    response.data.alerts.forEach(alert => {
                        if (alert.severity === 'critical') {
                            mobileHealthService.sendNotification(
                                '🚨 CRITICAL HEALTH ALERT',
                                alert.message,
                                true
                            );
                        }
                    });
                }
            } catch (error) {
                console.error('Background sync error:', error);
            }
        });

        setIsMonitoring(true);
        toast.success('Background monitoring started');
    };

    const stopMonitoring = () => {
        mobileHealthService.stopBackgroundMonitoring();
        setIsMonitoring(false);
        toast.info('Background monitoring stopped');
    };

    if (!isMobile) {
        return (
            <div className="text-center p-8">
                <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                    Automatic sync is only available in the mobile app.
                    Please use manual entry on web.
                </p>
            </div>
        );
    }

    if (!hasPermission) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Health Data Permission Required</h3>
                <p className="text-gray-600 mb-4">
                    To automatically sync your boAt watch data, we need permission to access your health data.
                </p>
                <button
                    onClick={checkPermissions}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    Grant Permission
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-sm p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                boAt Watch Connected
                            </h3>
                            <p className="text-sm text-gray-600">
                                Automatic sync enabled
                            </p>
                        </div>
                    </div>
                    <Watch className="w-12 h-12 text-green-600" />
                </div>

                {lastSync && (
                    <p className="text-sm text-gray-600">
                        Last synced: {lastSync.toLocaleString()}
                    </p>
                )}
            </div>

            {/* Sync Button */}
            <button
                onClick={syncNow}
                disabled={isSyncing}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
            >
                <RefreshCw className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            {/* Background Monitoring */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Background Monitoring</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Enable automatic background sync every 15 minutes
                </p>

                {!isMonitoring ? (
                    <button
                        onClick={startMonitoring}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                        Start Monitoring
                    </button>
                ) : (
                    <button
                        onClick={stopMonitoring}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                    >
                        Stop Monitoring
                    </button>
                )}
            </div>
        </div>
    );
};

export default SmartwatchSyncMobile;
```

---

## Build Commands

### Android:
```bash
# Build web assets
npm run build

# Copy to native project
npx cap copy android

# Open in Android Studio
npx cap open android

# Or build APK directly
cd android
./gradlew assembleDebug
```

### iOS:
```bash
# Build web assets
npm run build

# Copy to native project
npx cap copy ios

# Open in Xcode
npx cap open ios
```

---

## Testing on Mobile

### 1. Test Manual Entry (Works Now)
- Open boAt app
- View readings
- Enter in our app
- Verify sync

### 2. Test Automatic Sync (After Mobile Conversion)
- Install mobile app
- Grant health permissions
- boAt watch syncs to boAt app
- boAt app stores in Health API
- Our app reads from Health API
- Auto-sync to backend

---

## Enhanced User Flow (Mobile App)

```
boAt Watch → boAt App → Android/iOS Health API → 
Our Mobile App (Auto-reads) → Backend → Dashboard
```

**No manual entry needed!**

---

## Key Benefits of Mobile App

1. ✅ **Automatic Sync** - No manual entry
2. ✅ **Background Monitoring** - Continuous tracking
3. ✅ **Real-time Alerts** - Push notifications
4. ✅ **Offline Support** - Works without internet
5. ✅ **Better Performance** - Native app speed
6. ✅ **Health API Integration** - Direct data access

---

## Next Steps

1. ✅ **Current**: Manual entry works on web
2. 🔄 **Next**: Convert to Capacitor mobile app
3. 🔄 **Then**: Integrate Health API
4. 🔄 **Finally**: Enable automatic sync

---

## Estimated Timeline

- **Capacitor Setup**: 2-3 hours
- **Health API Integration**: 4-6 hours
- **Testing**: 2-3 hours
- **Total**: 1-2 days

---

**Status**: Web version complete with manual entry. Ready for mobile conversion.

**Last Updated**: December 9, 2025
