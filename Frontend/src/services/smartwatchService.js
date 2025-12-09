// Smartwatch Service - Handles Bluetooth connectivity and data sync

class SmartwatchService {
    constructor() {
        this.device = null;
        this.server = null;
        this.services = {};
        this.characteristics = {};
        this.listeners = new Map();
    }

    // Check if Web Bluetooth is supported
    isSupported() {
        return 'bluetooth' in navigator;
    }

    // Connect to smartwatch
    async connect() {
        if (!this.isSupported()) {
            throw new Error('Web Bluetooth is not supported in this browser');
        }

        try {
            // Request device with multiple service filters
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['heart_rate'] },
                    { services: [0x180D] }, // Heart Rate Service
                    { namePrefix: 'boAt' },
                    { namePrefix: 'Mi' },
                    { namePrefix: 'Amazfit' },
                    { namePrefix: 'Fitbit' },
                    { namePrefix: 'Galaxy' },
                    { namePrefix: 'Apple' }
                ],
                optionalServices: [
                    'heart_rate',
                    'blood_pressure',
                    'health_thermometer',
                    'battery_service',
                    'device_information',
                    0x180D, // Heart Rate
                    0x1810, // Blood Pressure
                    0x1809, // Health Thermometer
                    0x180F  // Battery Service
                ]
            });

            // Connect to GATT server
            this.server = await this.device.gatt.connect();

            // Setup disconnect handler
            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            // Initialize available services
            await this.initializeServices();

            return {
                name: this.device.name,
                id: this.device.id,
                connected: true
            };

        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    // Initialize available services
    async initializeServices() {
        const serviceUUIDs = [
            { uuid: 'heart_rate', name: 'heartRate' },
            { uuid: 0x1810, name: 'bloodPressure' },
            { uuid: 0x1809, name: 'temperature' },
            { uuid: 0x180F, name: 'battery' }
        ];

        for (const { uuid, name } of serviceUUIDs) {
            try {
                const service = await this.server.getPrimaryService(uuid);
                this.services[name] = service;
                console.log(`${name} service available`);
            } catch (error) {
                console.log(`${name} service not available`);
            }
        }
    }

    // Start heart rate monitoring
    async startHeartRateMonitoring(callback) {
        if (!this.services.heartRate) {
            throw new Error('Heart rate service not available');
        }

        try {
            const characteristic = await this.services.heartRate.getCharacteristic('heart_rate_measurement');
            this.characteristics.heartRate = characteristic;

            await characteristic.startNotifications();
            
            const listener = (event) => {
                const value = event.target.value;
                const heartRate = value.getUint8(1);
                callback({ type: 'heart_rate', value: heartRate });
            };

            characteristic.addEventListener('characteristicvaluechanged', listener);
            this.listeners.set('heartRate', listener);

            return true;
        } catch (error) {
            console.error('Heart rate monitoring error:', error);
            throw error;
        }
    }

    // Read heart rate once
    async readHeartRate() {
        if (!this.services.heartRate) {
            throw new Error('Heart rate service not available');
        }

        try {
            const characteristic = await this.services.heartRate.getCharacteristic('heart_rate_measurement');
            const value = await characteristic.readValue();
            const heartRate = value.getUint8(1);
            
            return {
                type: 'heart_rate',
                value: { single: heartRate },
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Read heart rate error:', error);
            throw error;
        }
    }

    // Read blood pressure
    async readBloodPressure() {
        if (!this.services.bloodPressure) {
            throw new Error('Blood pressure service not available');
        }

        try {
            const characteristic = await this.services.bloodPressure.getCharacteristic('blood_pressure_measurement');
            const value = await characteristic.readValue();
            
            const systolic = value.getUint16(1, true);
            const diastolic = value.getUint16(3, true);
            const meanArterialPressure = value.getUint16(5, true);

            return {
                type: 'blood_pressure',
                value: { systolic, diastolic },
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Read blood pressure error:', error);
            throw error;
        }
    }

    // Read temperature
    async readTemperature() {
        if (!this.services.temperature) {
            throw new Error('Temperature service not available');
        }

        try {
            const characteristic = await this.services.temperature.getCharacteristic('temperature_measurement');
            const value = await characteristic.readValue();
            
            // Temperature is in Celsius, convert to Fahrenheit
            const tempCelsius = value.getFloat32(1, true);
            const tempFahrenheit = (tempCelsius * 9/5) + 32;

            return {
                type: 'temperature',
                value: { single: tempFahrenheit },
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Read temperature error:', error);
            throw error;
        }
    }

    // Read battery level
    async readBatteryLevel() {
        if (!this.services.battery) {
            return null;
        }

        try {
            const characteristic = await this.services.battery.getCharacteristic('battery_level');
            const value = await characteristic.readValue();
            const batteryLevel = value.getUint8(0);
            
            return batteryLevel;
        } catch (error) {
            console.error('Read battery error:', error);
            return null;
        }
    }

    // Sync all available data
    async syncAllData() {
        const readings = [];

        // Heart Rate
        try {
            const hr = await this.readHeartRate();
            readings.push(hr);
        } catch (error) {
            console.log('Heart rate not available');
        }

        // Blood Pressure
        try {
            const bp = await this.readBloodPressure();
            readings.push(bp);
        } catch (error) {
            console.log('Blood pressure not available');
        }

        // Temperature
        try {
            const temp = await this.readTemperature();
            readings.push(temp);
        } catch (error) {
            console.log('Temperature not available');
        }

        // Add device info to all readings
        readings.forEach(reading => {
            reading.source = {
                deviceType: 'other',
                deviceModel: this.device?.name || 'Unknown',
                deviceId: this.device?.id
            };
        });

        return readings;
    }

    // Stop heart rate monitoring
    stopHeartRateMonitoring() {
        if (this.characteristics.heartRate) {
            const listener = this.listeners.get('heartRate');
            if (listener) {
                this.characteristics.heartRate.removeEventListener('characteristicvaluechanged', listener);
                this.listeners.delete('heartRate');
            }
            this.characteristics.heartRate.stopNotifications();
        }
    }

    // Disconnect from device
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.stopHeartRateMonitoring();
            await this.device.gatt.disconnect();
        }
        
        this.device = null;
        this.server = null;
        this.services = {};
        this.characteristics = {};
        this.listeners.clear();
    }

    // Handle disconnection
    onDisconnected() {
        console.log('Device disconnected');
        this.device = null;
        this.server = null;
        this.services = {};
        this.characteristics = {};
        this.listeners.clear();
    }

    // Check if connected
    isConnected() {
        return this.device && this.device.gatt.connected;
    }

    // Get device info
    getDeviceInfo() {
        if (!this.device) {
            return null;
        }

        return {
            name: this.device.name,
            id: this.device.id,
            connected: this.device.gatt.connected
        };
    }

    // Get available services
    getAvailableServices() {
        return Object.keys(this.services);
    }
}

// Export singleton instance
export default new SmartwatchService();
