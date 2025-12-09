import { useState, useEffect, useRef } from 'react';
import { Watch, Bluetooth, Activity, Heart, Droplet, TrendingUp, AlertCircle, CheckCircle, RefreshCw, Settings as SettingsIcon, Smartphone, Upload } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const SmartwatchSync = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [device, setDevice] = useState(null);
    const [syncStatus, setSyncStatus] = useState('idle');
    const [lastSync, setLastSync] = useState(null);
    const [autoSync, setAutoSync] = useState(true);
    const [syncInterval, setSyncInterval] = useState(300000); // 5 minutes
    const [manualData, setManualData] = useState({
        heartRate: '',
        systolic: '',
        diastolic: '',
        spo2: '',
        steps: ''
    });
    const syncTimerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Check if running in mobile app (Capacitor)
    const isMobileApp = window.Capacitor !== undefined;
    
    // Web Bluetooth API support check
    const isBluetoothSupported = 'bluetooth' in navigator;

    useEffect(() => {
        // Load last sync time from localStorage
        const savedLastSync = localStorage.getItem('lastHealthSync');
        if (savedLastSync) {
            setLastSync(new Date(savedLastSync));
        }

        // Setup auto-sync
        if (autoSync && isConnected) {
            startAutoSync();
        }

        return () => {
            if (syncTimerRef.current) {
                clearInterval(syncTimerRef.current);
            }
        };
    }, [autoSync, isConnected]);

    const startAutoSync = () => {
        if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
        }

        syncTimerRef.current = setInterval(() => {
            if (isConnected) {
                syncHealthData();
            }
        }, syncInterval);
    };

    // Connect via Web Bluetooth (for desktop/Android Chrome)
    const connectViaBluetoothWeb = async () => {
        if (!isBluetoothSupported) {
            toast.error('Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
            return;
        }

        setIsConnecting(true);

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['heart_rate'] },
                    { services: [0x180D] },
                    { namePrefix: 'boAt' },
                    { namePrefix: 'Mi' },
                    { namePrefix: 'Amazfit' }
                ],
                optionalServices: [
                    'heart_rate',
                    'blood_pressure',
                    'health_thermometer',
                    0x180D,
                    0x1810,
                    0x1809
                ]
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('heart_rate');
            const characteristic = await service.getCharacteristic('heart_rate_measurement');
            
            setDevice({ name: device.name, id: device.id, gatt: server, characteristic });
            setIsConnected(true);
            toast.success(`Connected to ${device.name}`);

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', handleHeartRateChange);

            await syncHealthData();

        } catch (error) {
            console.error('Bluetooth connection error:', error);
            if (error.name === 'NotFoundError') {
                toast.error('No device selected');
            } else {
                toast.error(`Connection failed: ${error.message}`);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleHeartRateChange = (event) => {
        const value = event.target.value;
        const heartRate = value.getUint8(1);
        
        console.log('Heart rate reading:', heartRate);
        sendHealthReading('heart_rate', { single: heartRate });
    };

    const disconnectSmartwatch = async () => {
        if (device && device.gatt && device.gatt.connected) {
            await device.gatt.disconnect();
        }
        setIsConnected(false);
        setDevice(null);
        toast.info('Disconnected from smartwatch');
    };

    const syncHealthData = async () => {
        setSyncStatus('syncing');

        try {
            const readings = [];

            if (device && device.characteristic) {
                const value = await device.characteristic.readValue();
                const heartRate = value.getUint8(1);
                readings.push({
                    type: 'heart_rate',
                    value: { single: heartRate },
                    source: {
                        deviceType: 'other',
                        deviceModel: device.name,
                        deviceId: device.id
                    },
                    timestamp: new Date()
                });
            }

            if (readings.length > 0) {
                const response = await axios.post('/api/v1/health/readings/bulk', {
                    readings
                });

                if (response.data.success) {
                    setSyncStatus('success');
                    setLastSync(new Date());
                    localStorage.setItem('lastHealthSync', new Date().toISOString());
                    
                    toast.success(`Synced ${response.data.count} readings`);

                    if (response.data.alerts && response.data.alerts.length > 0) {
                        response.data.alerts.forEach(alert => {
                            if (alert.severity === 'critical') {
                                toast.error(alert.message, { autoClose: false });
                            } else {
                                toast.warning(alert.message);
                            }
                        });
                    }
                }
            } else {
                toast.info('No new readings to sync');
            }

        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('error');
            toast.error('Failed to sync health data');
        } finally {
            setTimeout(() => setSyncStatus('idle'), 2000);
        }
    };

    const sendHealthReading = async (type, value) => {
        try {
            const response = await axios.post('/api/v1/health/reading', {
                type,
                value,
                source: {
                    deviceType: 'other',
                    deviceModel: device?.name || 'boAt Watch',
                    deviceId: device?.id || 'manual'
                }
            });

            if (response.data.alert) {
                const alert = response.data.alert;
                if (alert.severity === 'critical') {
                    toast.error(alert.message, { autoClose: false });
                    
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('🚨 CRITICAL HEALTH ALERT', {
                            body: alert.message,
                            requireInteraction: true
                        });
                    }
                } else if (alert.severity === 'warning') {
                    toast.warning(alert.message);
                }
            }

        } catch (error) {
            console.error('Send reading error:', error);
        }
    };

    // Manual data entry from boAt app
    const handleManualSync = async () => {
        setSyncStatus('syncing');

        try {
            const readings = [];

            if (manualData.heartRate) {
                readings.push({
                    type: 'heart_rate',
                    value: { single: parseInt(manualData.heartRate) },
                    source: {
                        deviceType: 'other',
                        deviceModel: 'boAt Watch (Manual)',
                        deviceId: 'manual-entry'
                    },
                    timestamp: new Date()
                });
            }

            if (manualData.systolic && manualData.diastolic) {
                readings.push({
                    type: 'blood_pressure',
                    value: {
                        systolic: parseInt(manualData.systolic),
                        diastolic: parseInt(manualData.diastolic)
                    },
                    source: {
                        deviceType: 'other',
                        deviceModel: 'boAt Watch (Manual)',
                        deviceId: 'manual-entry'
                    },
                    timestamp: new Date()
                });
            }

            if (manualData.spo2) {
                readings.push({
                    type: 'spo2',
                    value: { single: parseInt(manualData.spo2) },
                    source: {
                        deviceType: 'other',
                        deviceModel: 'boAt Watch (Manual)',
                        deviceId: 'manual-entry'
                    },
                    timestamp: new Date()
                });
            }

            if (manualData.steps) {
                readings.push({
                    type: 'steps',
                    value: { single: parseInt(manualData.steps) },
                    source: {
                        deviceType: 'other',
                        deviceModel: 'boAt Watch (Manual)',
                        deviceId: 'manual-entry'
                    },
                    timestamp: new Date()
                });
            }

            if (readings.length === 0) {
                toast.error('Please enter at least one health metric');
                setSyncStatus('idle');
                return;
            }

            const response = await axios.post('/api/v1/health/readings/bulk', {
                readings
            });

            if (response.data.success) {
                setSyncStatus('success');
                setLastSync(new Date());
                localStorage.setItem('lastHealthSync', new Date().toISOString());
                
                toast.success(`Synced ${response.data.count} readings from boAt app`);

                // Clear form
                setManualData({
                    heartRate: '',
                    systolic: '',
                    diastolic: '',
                    steps: '',
                    spo2: ''
                });

                if (response.data.alerts && response.data.alerts.length > 0) {
                    response.data.alerts.forEach(alert => {
                        if (alert.severity === 'critical') {
                            toast.error(alert.message, { autoClose: false });
                        } else {
                            toast.warning(alert.message);
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Manual sync error:', error);
            setSyncStatus('error');
            toast.error('Failed to sync health data');
        } finally {
            setTimeout(() => setSyncStatus('idle'), 2000);
        }
    };

    // Import from boAt app export file
    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSyncStatus('syncing');

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Parse boAt app export format
            const readings = [];

            if (data.healthData) {
                data.healthData.forEach(entry => {
                    if (entry.heartRate) {
                        readings.push({
                            type: 'heart_rate',
                            value: { single: entry.heartRate },
                            source: {
                                deviceType: 'other',
                                deviceModel: 'boAt Watch',
                                deviceId: 'import'
                            },
                            timestamp: new Date(entry.timestamp || Date.now())
                        });
                    }

                    if (entry.bloodPressure) {
                        readings.push({
                            type: 'blood_pressure',
                            value: {
                                systolic: entry.bloodPressure.systolic,
                                diastolic: entry.bloodPressure.diastolic
                            },
                            source: {
                                deviceType: 'other',
                                deviceModel: 'boAt Watch',
                                deviceId: 'import'
                            },
                            timestamp: new Date(entry.timestamp || Date.now())
                        });
                    }

                    if (entry.spo2) {
                        readings.push({
                            type: 'spo2',
                            value: { single: entry.spo2 },
                            source: {
                                deviceType: 'other',
                                deviceModel: 'boAt Watch',
                                deviceId: 'import'
                            },
                            timestamp: new Date(entry.timestamp || Date.now())
                        });
                    }

                    if (entry.steps) {
                        readings.push({
                            type: 'steps',
                            value: { single: entry.steps },
                            source: {
                                deviceType: 'other',
                                deviceModel: 'boAt Watch',
                                deviceId: 'import'
                            },
                            timestamp: new Date(entry.timestamp || Date.now())
                        });
                    }
                });
            }

            if (readings.length > 0) {
                const response = await axios.post('/api/v1/health/readings/bulk', {
                    readings
                });

                if (response.data.success) {
                    setSyncStatus('success');
                    setLastSync(new Date());
                    localStorage.setItem('lastHealthSync', new Date().toISOString());
                    
                    toast.success(`Imported ${response.data.count} readings from boAt app`);

                    if (response.data.alerts && response.data.alerts.length > 0) {
                        response.data.alerts.forEach(alert => {
                            if (alert.severity === 'critical') {
                                toast.error(alert.message, { autoClose: false });
                            } else {
                                toast.warning(alert.message);
                            }
                        });
                    }
                }
            } else {
                toast.error('No valid health data found in file');
            }

        } catch (error) {
            console.error('File import error:', error);
            toast.error('Failed to import data. Please check file format.');
        } finally {
            setSyncStatus('idle');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Smartwatch Sync</h2>
                    <p className="text-sm text-gray-600 mt-1">Sync your boAt watch health data</p>
                </div>
                <button
                    onClick={() => window.location.href = '/health/settings'}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center transition-colors"
                >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Settings
                </button>
            </div>

            {/* Connection Methods */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Sync Your boAt Watch Data</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Method 1: Manual Entry */}
                    <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                        <div className="flex items-center space-x-2 mb-3">
                            <Smartphone className="w-6 h-6 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Manual Entry</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Open boAt app, view your readings, and enter them manually below
                        </p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Recommended</span>
                    </div>

                    {/* Method 2: File Import */}
                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                        <div className="flex items-center space-x-2 mb-3">
                            <Upload className="w-6 h-6 text-gray-600" />
                            <h4 className="font-semibold text-gray-900">Import File</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Export data from boAt app and import the JSON file here
                        </p>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">If available</span>
                    </div>

                    {/* Method 3: Bluetooth */}
                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                        <div className="flex items-center space-x-2 mb-3">
                            <Bluetooth className="w-6 h-6 text-gray-600" />
                            <h4 className="font-semibold text-gray-900">Direct Bluetooth</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Connect directly via Bluetooth (Chrome/Edge only)
                        </p>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Desktop only</span>
                    </div>
                </div>
            </div>

            {/* Manual Data Entry Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
                    Enter Data from boAt App
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Heart className="w-4 h-4 inline mr-1 text-red-500" />
                            Heart Rate (bpm)
                        </label>
                        <input
                            type="number"
                            value={manualData.heartRate}
                            onChange={(e) => setManualData({...manualData, heartRate: e.target.value})}
                            placeholder="e.g., 75"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Activity className="w-4 h-4 inline mr-1 text-blue-500" />
                            SpO2 (%)
                        </label>
                        <input
                            type="number"
                            value={manualData.spo2}
                            onChange={(e) => setManualData({...manualData, spo2: e.target.value})}
                            placeholder="e.g., 98"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Droplet className="w-4 h-4 inline mr-1 text-purple-500" />
                            Blood Pressure - Systolic (mmHg)
                        </label>
                        <input
                            type="number"
                            value={manualData.systolic}
                            onChange={(e) => setManualData({...manualData, systolic: e.target.value})}
                            placeholder="e.g., 120"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Droplet className="w-4 h-4 inline mr-1 text-purple-500" />
                            Blood Pressure - Diastolic (mmHg)
                        </label>
                        <input
                            type="number"
                            value={manualData.diastolic}
                            onChange={(e) => setManualData({...manualData, diastolic: e.target.value})}
                            placeholder="e.g., 80"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <TrendingUp className="w-4 h-4 inline mr-1 text-green-500" />
                            Steps
                        </label>
                        <input
                            type="number"
                            value={manualData.steps}
                            onChange={(e) => setManualData({...manualData, steps: e.target.value})}
                            placeholder="e.g., 5000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <button
                    onClick={handleManualSync}
                    disabled={syncStatus === 'syncing'}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                >
                    <Upload className="w-5 h-5 mr-2" />
                    {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}
                </button>

                {lastSync && (
                    <p className="text-sm text-gray-600 text-center mt-3">
                        Last synced: {lastSync.toLocaleString()}
                    </p>
                )}
            </div>

            {/* File Import */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-gray-600" />
                    Import from boAt App Export
                </h3>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                    <Upload className="w-5 h-5 mr-2" />
                    Choose JSON File
                </button>

                <p className="text-sm text-gray-600 mt-3">
                    If your boAt app supports data export, export your health data as JSON and import it here.
                </p>
            </div>

            {/* Bluetooth Connection (Desktop only) */}
            {isBluetoothSupported && !isMobileApp && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Bluetooth className="w-5 h-5 mr-2 text-blue-600" />
                        Direct Bluetooth Connection
                    </h3>

                    {!isConnected ? (
                        <button
                            onClick={connectViaBluetoothWeb}
                            disabled={isConnecting}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <Bluetooth className="w-5 h-5 mr-2" />
                            {isConnecting ? 'Connecting...' : 'Connect via Bluetooth'}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center space-x-3">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-900">{device?.name || 'Connected'}</p>
                                        <p className="text-sm text-green-700">Monitoring active</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={syncHealthData}
                                disabled={syncStatus === 'syncing'}
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                            </button>

                            <button
                                onClick={disconnectSmartwatch}
                                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">How to Sync from boAt App</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Open your boAt smartwatch companion app on your phone</li>
                            <li>View your latest health readings (Heart Rate, BP, SpO2, Steps)</li>
                            <li>Enter the values in the form above</li>
                            <li>Click "Sync Data" to upload to your health dashboard</li>
                            <li>The system will automatically check for abnormal readings</li>
                            <li>You'll receive alerts if any critical values are detected</li>
                        </ol>
                        <p className="mt-3 font-medium">For Mobile App:</p>
                        <p>Once converted to mobile app, we'll integrate directly with boAt app's data storage for automatic sync.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartwatchSync;
