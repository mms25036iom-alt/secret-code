import { useState } from 'react';
import { Activity, Watch, Settings, TrendingUp } from 'lucide-react';
import HealthMonitoring from '../components/HealthMonitoring';
import SmartwatchSync from '../components/SmartwatchSync';
import HealthSettings from '../components/HealthSettings';

const HealthDashboard = () => {
    const [activeTab, setActiveTab] = useState('monitoring');

    const tabs = [
        { id: 'monitoring', label: 'Health Monitoring', icon: Activity },
        { id: 'sync', label: 'Smartwatch Sync', icon: Watch },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
                    </div>
                    <p className="text-gray-600">Monitor your health metrics from your smartwatch</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                                            ${activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'monitoring' && <HealthMonitoring />}
                        {activeTab === 'sync' && <SmartwatchSync />}
                        {activeTab === 'settings' && <HealthSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthDashboard;
