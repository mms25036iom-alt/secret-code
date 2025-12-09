import { useState, useEffect } from 'react';
import { Heart, Activity, Droplet, TrendingUp, AlertTriangle, Settings, Calendar } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const HealthMonitoring = () => {
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(7);
    const [selectedType, setSelectedType] = useState('heart_rate');

    useEffect(() => {
        fetchHealthData();
    }, [selectedPeriod]);

    const fetchHealthData = async () => {
        setLoading(true);
        try {
            const [statsRes, alertsRes] = await Promise.all([
                axios.get(`/api/v1/health/readings/stats?days=${selectedPeriod}`),
                axios.get('/api/v1/health/alerts?days=30')
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
            }

            if (alertsRes.data.success) {
                setAlerts(alertsRes.data.alerts);
            }

        } catch (error) {
            console.error('Fetch health data error:', error);
            toast.error('Failed to load health data');
        } finally {
            setLoading(false);
        }
    };

    const getChartData = () => {
        if (!stats || !stats.byType[selectedType]) {
            return null;
        }

        const typeData = stats.byType[selectedType];
        const values = typeData.values.slice(-20); // Last 20 readings

        return {
            labels: values.map(v => new Date(v.timestamp).toLocaleDateString()),
            datasets: [{
                label: getTypeLabel(selectedType),
                data: values.map(v => {
                    if (selectedType === 'blood_pressure') {
                        return v.value.systolic;
                    }
                    return v.value.single;
                }),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        };
    };

    const getTypeLabel = (type) => {
        const labels = {
            heart_rate: 'Heart Rate (bpm)',
            blood_pressure: 'Blood Pressure (mmHg)',
            spo2: 'SpO2 (%)',
            temperature: 'Temperature (°F)',
            steps: 'Steps',
            blood_glucose: 'Blood Glucose (mg/dL)'
        };
        return labels[type] || type;
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'heart_rate': return <Heart className="w-5 h-5 text-red-500" />;
            case 'blood_pressure': return <Droplet className="w-5 h-5 text-purple-500" />;
            case 'spo2': return <Activity className="w-5 h-5 text-blue-500" />;
            default: return <Activity className="w-5 h-5 text-gray-500" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Health Monitoring</h2>
                    <p className="text-sm text-gray-600 mt-1">Track your health metrics from boAt watch</p>
                </div>
                <button
                    onClick={() => window.location.href = '/health/settings'}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center transition-colors"
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </button>
            </div>

            {/* Period Selector */}
            <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Readings</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReadings}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Abnormal</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.abnormalCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Warnings</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.warningCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Critical</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{stats.criticalCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            {stats && stats.byType && Object.keys(stats.byType).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Metric
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {Object.keys(stats.byType).map(type => (
                                <option key={type} value={type}>
                                    {getTypeLabel(type)} ({stats.byType[type].count} readings)
                                </option>
                            ))}
                        </select>
                    </div>

                    {getChartData() && (
                        <Line
                            data={getChartData()}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: `${getTypeLabel(selectedType)} Trend`
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: false
                                    }
                                }
                            }}
                        />
                    )}
                </div>
            )}

            {/* Recent Alerts */}
            {alerts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
                    <div className="space-y-3">
                        {alerts.slice(0, 10).map((alert) => (
                            <div
                                key={alert._id}
                                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        {getTypeIcon(alert.type)}
                                        <div>
                                            <p className="font-medium">{alert.alertMessage}</p>
                                            <p className="text-sm mt-1">
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </p>
                                            {alert.emergencyId && (
                                                <span className="inline-block mt-2 px-2 py-1 bg-red-200 text-red-800 text-xs rounded">
                                                    SOS Triggered
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                                        alert.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                                        'bg-gray-200 text-gray-800'
                                    }`}>
                                        {alert.severity.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Data Message */}
            {stats && stats.totalReadings === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Data Yet</h3>
                    <p className="text-gray-600 mb-6">
                        Connect your boAt watch and start syncing health data
                    </p>
                    <button
                        onClick={() => window.location.href = '/health/sync'}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Connect Smartwatch
                    </button>
                </div>
            )}
        </div>
    );
};

export default HealthMonitoring;
