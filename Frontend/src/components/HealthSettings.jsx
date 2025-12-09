import { useState, useEffect } from 'react';
import { Settings, Save, Bell, AlertCircle, Shield } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const HealthSettings = () => {
    const [thresholds, setThresholds] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchThresholds();
    }, []);

    const fetchThresholds = async () => {
        try {
            const response = await axios.get('/api/v1/health/thresholds');
            if (response.data.success) {
                setThresholds(response.data.thresholds);
            }
        } catch (error) {
            console.error('Fetch thresholds error:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await axios.put('/api/v1/health/thresholds', thresholds);
            if (response.data.success) {
                toast.success('Settings saved successfully');
            }
        } catch (error) {
            console.error('Save thresholds error:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateThreshold = (path, value) => {
        setThresholds(prev => {
            const updated = { ...prev };
            const keys = path.split('.');
            let current = updated;
            
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            return updated;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!thresholds) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Health Monitoring Settings</h2>
                    <p className="text-sm text-gray-600 mt-1">Configure thresholds and alert preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Alert Preferences */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                    <Bell className="w-5 h-5 text-gray-700 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Alert Preferences</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">Enable Notifications</p>
                            <p className="text-sm text-gray-600">Receive in-app notifications for abnormal readings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={thresholds.alertPreferences.enableNotifications}
                                onChange={(e) => updateThreshold('alertPreferences.enableNotifications', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">Enable SMS Alerts</p>
                            <p className="text-sm text-gray-600">Send SMS to emergency contacts for critical readings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={thresholds.alertPreferences.enableSMS}
                                onChange={(e) => updateThreshold('alertPreferences.enableSMS', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                        <div>
                            <p className="font-medium text-gray-900 flex items-center">
                                <Shield className="w-4 h-4 text-red-600 mr-2" />
                                Auto-Trigger SOS
                            </p>
                            <p className="text-sm text-gray-600">Automatically trigger SOS for critical health readings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={thresholds.alertPreferences.autoTriggerSOS}
                                onChange={(e) => updateThreshold('alertPreferences.autoTriggerSOS', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">Notify Emergency Contacts</p>
                            <p className="text-sm text-gray-600">Alert emergency contacts for warning-level readings</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={thresholds.alertPreferences.notifyEmergencyContacts}
                                onChange={(e) => updateThreshold('alertPreferences.notifyEmergencyContacts', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Health Thresholds */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                    <Settings className="w-5 h-5 text-gray-700 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Health Thresholds</h3>
                </div>

                <div className="space-y-6">
                    {/* Heart Rate */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Heart Rate (bpm)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Warning Min</label>
                                <input
                                    type="number"
                                    value={thresholds.heartRate.warning.min}
                                    onChange={(e) => updateThreshold('heartRate.warning.min', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Warning Max</label>
                                <input
                                    type="number"
                                    value={thresholds.heartRate.warning.max}
                                    onChange={(e) => updateThreshold('heartRate.warning.max', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Critical Min</label>
                                <input
                                    type="number"
                                    value={thresholds.heartRate.critical.min}
                                    onChange={(e) => updateThreshold('heartRate.critical.min', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Critical Max</label>
                                <input
                                    type="number"
                                    value={thresholds.heartRate.critical.max}
                                    onChange={(e) => updateThreshold('heartRate.critical.max', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Blood Pressure */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Blood Pressure (mmHg)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Warning Systolic</label>
                                <input
                                    type="number"
                                    value={thresholds.bloodPressure.warning.systolic}
                                    onChange={(e) => updateThreshold('bloodPressure.warning.systolic', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Warning Diastolic</label>
                                <input
                                    type="number"
                                    value={thresholds.bloodPressure.warning.diastolic}
                                    onChange={(e) => updateThreshold('bloodPressure.warning.diastolic', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Critical Systolic</label>
                                <input
                                    type="number"
                                    value={thresholds.bloodPressure.critical.systolic}
                                    onChange={(e) => updateThreshold('bloodPressure.critical.systolic', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Critical Diastolic</label>
                                <input
                                    type="number"
                                    value={thresholds.bloodPressure.critical.diastolic}
                                    onChange={(e) => updateThreshold('bloodPressure.critical.diastolic', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SpO2 */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">SpO2 (%)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Warning Level</label>
                                <input
                                    type="number"
                                    value={thresholds.spo2.warning}
                                    onChange={(e) => updateThreshold('spo2.warning', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Critical Level</label>
                                <input
                                    type="number"
                                    value={thresholds.spo2.critical}
                                    onChange={(e) => updateThreshold('spo2.critical', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Important Information</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Warning alerts notify you of abnormal readings</li>
                            <li>Critical alerts can auto-trigger SOS if enabled</li>
                            <li>Consult your doctor before changing thresholds</li>
                            <li>Emergency contacts will be notified based on your settings</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthSettings;
