import { useState, useEffect } from 'react';
import { Heart, Activity, TrendingUp, AlertTriangle, Watch } from 'lucide-react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';

const HealthWidget = () => {
    const [latestReadings, setLatestReadings] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLatestData();
    }, []);

    const fetchLatestData = async () => {
        try {
            const [readingsRes, alertsRes] = await Promise.all([
                axios.get('/api/v1/health/readings?limit=5'),
                axios.get('/api/v1/health/alerts?days=1')
            ]);

            if (readingsRes.data.success) {
                setLatestReadings(readingsRes.data.readings);
            }

            if (alertsRes.data.success) {
                setAlerts(alertsRes.data.alerts.slice(0, 3));
            }

        } catch (error) {
            console.error('Fetch health data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLatestByType = (type) => {
        if (!latestReadings) return null;
        return latestReadings.find(r => r.type === type);
    };

    const formatValue = (reading) => {
        if (!reading) return 'N/A';
        
        switch(reading.type) {
            case 'heart_rate':
                return `${reading.value.single} bpm`;
            case 'blood_pressure':
                return `${reading.value.systolic}/${reading.value.diastolic}`;
            case 'spo2':
                return `${reading.value.single}%`;
            default:
                return 'N/A';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Watch className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Health Monitor</h3>
                </div>
                <button
                    onClick={() => navigate('/health/dashboard')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    View All
                </button>
            </div>

            {/* Latest Readings */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-gray-600">Heart Rate</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                        {formatValue(getLatestByType('heart_rate'))}
                    </p>
                </div>

                <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                        <Activity className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-gray-600">BP</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                        {formatValue(getLatestByType('blood_pressure'))}
                    </p>
                </div>

                <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-gray-600">SpO2</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                        {formatValue(getLatestByType('spo2'))}
                    </p>
                </div>
            </div>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Recent Alerts</span>
                    </div>
                    {alerts.map((alert) => (
                        <div
                            key={alert._id}
                            className={`p-2 rounded-lg text-xs ${
                                alert.severity === 'critical' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                            <p className="font-medium">{alert.alertMessage}</p>
                            <p className="text-xs opacity-75 mt-1">
                                {new Date(alert.timestamp).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Connect Watch CTA */}
            {!latestReadings || latestReadings.length === 0 ? (
                <button
                    onClick={() => navigate('/health/sync')}
                    className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                    <Watch className="w-5 h-5 mr-2" />
                    Connect Smartwatch
                </button>
            ) : (
                <button
                    onClick={() => navigate('/health/sync')}
                    className="w-full mt-4 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm border border-gray-200"
                >
                    Sync Now
                </button>
            )}
        </div>
    );
};

export default HealthWidget;
