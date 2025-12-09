import { useState, useEffect, useCallback } from 'react';
import axios from '../axios';
import { toast } from 'react-toastify';
import smartwatchService from '../services/smartwatchService';

export const useHealthMonitoring = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [device, setDevice] = useState(null);
    const [latestReadings, setLatestReadings] = useState({});
    const [isMonitoring, setIsMonitoring] = useState(false);

    // Check connection status
    useEffect(() => {
        const checkConnection = () => {
            const connected = smartwatchService.isConnected();
            setIsConnected(connected);
            
            if (connected) {
                const deviceInfo = smartwatchService.getDeviceInfo();
                setDevice(deviceInfo);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 5000);

        return () => clearInterval(interval);
    }, []);

    // Connect to smartwatch
    const connect = useCallback(async () => {
        try {
            const deviceInfo = await smartwatchService.connect();
            setDevice(deviceInfo);
            setIsConnected(true);
            toast.success(`Connected to ${deviceInfo.name}`);
            return deviceInfo;
        } catch (error) {
            console.error('Connection error:', error);
            toast.error('Failed to connect to smartwatch');
            throw error;
        }
    }, []);

    // Disconnect from smartwatch
    const disconnect = useCallback(async () => {
        try {
            await smartwatchService.disconnect();
            setDevice(null);
            setIsConnected(false);
            setIsMonitoring(false);
            toast.info('Disconnected from smartwatch');
        } catch (error) {
            console.error('Disconnect error:', error);
            toast.error('Failed to disconnect');
        }
    }, []);

    // Start real-time monitoring
    const startMonitoring = useCallback(async () => {
        if (!isConnected) {
            toast.error('Please connect your smartwatch first');
            return;
        }

        try {
            await smartwatchService.startHeartRateMonitoring((data) => {
                setLatestReadings(prev => ({
                    ...prev,
                    heart_rate: data.value
                }));

                // Send to backend
                sendReading('heart_rate', { single: data.value });
            });

            setIsMonitoring(true);
            toast.success('Monitoring started');
        } catch (error) {
            console.error('Monitoring error:', error);
            toast.error('Failed to start monitoring');
        }
    }, [isConnected]);

    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        smartwatchService.stopHeartRateMonitoring();
        setIsMonitoring(false);
        toast.info('Monitoring stopped');
    }, []);

    // Sync all data
    const syncData = useCallback(async () => {
        if (!isConnected) {
            toast.error('Please connect your smartwatch first');
            return;
        }

        try {
            const readings = await smartwatchService.syncAllData();
            
            if (readings.length > 0) {
                const response = await axios.post('/api/v1/health/readings/bulk', {
                    readings
                });

                if (response.data.success) {
                    toast.success(`Synced ${response.data.count} readings`);

                    // Check for alerts
                    if (response.data.alerts && response.data.alerts.length > 0) {
                        response.data.alerts.forEach(alert => {
                            if (alert.severity === 'critical') {
                                toast.error(alert.message, { autoClose: false });
                            } else {
                                toast.warning(alert.message);
                            }
                        });
                    }

                    return response.data;
                }
            } else {
                toast.info('No new readings to sync');
            }
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Failed to sync data');
            throw error;
        }
    }, [isConnected]);

    // Send single reading
    const sendReading = useCallback(async (type, value) => {
        try {
            const response = await axios.post('/api/v1/health/reading', {
                type,
                value,
                source: {
                    deviceType: 'other',
                    deviceModel: device?.name || 'Unknown',
                    deviceId: device?.id
                }
            });

            if (response.data.alert) {
                const alert = response.data.alert;
                if (alert.severity === 'critical') {
                    toast.error(alert.message, { autoClose: false });
                    
                    // Show browser notification
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

            return response.data;
        } catch (error) {
            console.error('Send reading error:', error);
        }
    }, [device]);

    return {
        isConnected,
        device,
        latestReadings,
        isMonitoring,
        connect,
        disconnect,
        startMonitoring,
        stopMonitoring,
        syncData,
        sendReading
    };
};

export default useHealthMonitoring;
