import { useState, useEffect, useCallback } from 'react';
import { 
    AlertTriangle, 
    MapPin, 
    Phone, 
    X, 
    Ambulance, 
    Heart, 
    Shield, 
    Navigation,
    PhoneCall,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const SOSButton = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('high');
    const [activeTab, setActiveTab] = useState('sos'); // 'sos' or 'ambulance'
    const [countdown, setCountdown] = useState(null);
    const [sosTriggered, setSosTriggered] = useState(false);

    // Quick emergency options
    const emergencyTypes = [
        { id: 'chest_pain', label: 'Chest Pain', icon: Heart, color: 'red' },
        { id: 'accident', label: 'Accident', icon: AlertTriangle, color: 'orange' },
        { id: 'breathing', label: 'Breathing Issue', icon: AlertCircle, color: 'blue' },
        { id: 'other', label: 'Other', icon: Shield, color: 'gray' },
    ];

    const [selectedEmergency, setSelectedEmergency] = useState(null);

    // Get user location
    const getUserLocation = useCallback(async () => {
        setLocationLoading(true);
        setLocationError(null);

        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude, accuracy } = position.coords;
            
            // Try reverse geocoding
            let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const data = await response.json();
                if (data.display_name) {
                    address = data.display_name;
                }
            } catch (e) {
                console.log('Reverse geocoding failed, using coordinates');
            }

            setLocation({
                latitude,
                longitude,
                accuracy: Math.round(accuracy),
                address
            });
        } catch (err) {
            console.error('Location error:', err);
            let errorMsg = 'Failed to get location';
            if (err.code === 1) errorMsg = 'Location permission denied. Please enable location access.';
            if (err.code === 2) errorMsg = 'Location unavailable. Please try again.';
            if (err.code === 3) errorMsg = 'Location request timed out. Please try again.';
            setLocationError(errorMsg);
        } finally {
            setLocationLoading(false);
        }
    }, []);

    // Fetch location when modal opens
    useEffect(() => {
        if (showModal && !location) {
            getUserLocation();
        }
    }, [showModal, location, getUserLocation]);

    // Countdown timer for SOS
    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            executeSOS();
        }
    }, [countdown]);

    const startSOSCountdown = () => {
        if (!location) {
            toast.error('Location is required for SOS');
            return;
        }
        setCountdown(5);
    };

    const cancelCountdown = () => {
        setCountdown(null);
    };

    const executeSOS = async () => {
        setCountdown(null);
        setLoading(true);

        try {
            const emergencyDescription = selectedEmergency 
                ? `${emergencyTypes.find(e => e.id === selectedEmergency)?.label}: ${description || 'Emergency SOS triggered'}`
                : description || 'Emergency SOS triggered';

            const response = await axios.post('/emergency/sos', {
                location,
                description: emergencyDescription,
                severity,
                emergencyType: selectedEmergency
            });

            if (response.data.success) {
                setSosTriggered(true);
                toast.success(`SOS Alert Sent! ${response.data.contactsNotified || 0} contacts notified.`);
            }
        } catch (error) {
            console.error('SOS Error:', error);
            toast.error(error.response?.data?.message || 'Failed to trigger SOS. Please call emergency services directly.');
        } finally {
            setLoading(false);
        }
    };

    const handleAmbulanceRequest = async () => {
        if (!location) {
            toast.error('Location is required for ambulance request');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/emergency/ambulance', {
                location,
                description: description || 'Ambulance requested',
                severity,
                emergencyType: selectedEmergency
            });

            if (response.data.success) {
                toast.success('Ambulance request sent!');
                
                const { ambulanceInfo } = response.data;
                if (ambulanceInfo) {
                    toast.info(
                        `ETA: ${ambulanceInfo.estimatedArrival || '10-15 mins'}`,
                        { autoClose: 10000 }
                    );
                }
                
                setSosTriggered(true);
            }
        } catch (error) {
            console.error('Ambulance Request Error:', error);
            toast.error(error.response?.data?.message || 'Failed to request ambulance. Please call 108 directly.');
        } finally {
            setLoading(false);
        }
    };

    const handleDirectCall = (number) => {
        window.location.href = `tel:${number}`;
    };

    const resetModal = () => {
        setShowModal(false);
        setSosTriggered(false);
        setDescription('');
        setSelectedEmergency(null);
        setCountdown(null);
        setSeverity('high');
    };

    return (
        <>
            {/* Floating SOS Button - Positioned above Arogya AI button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-28 right-4 z-[9998] group sm:bottom-24"
                aria-label="Emergency SOS"
                style={{
                    position: 'fixed',
                    bottom: '112px',
                    right: '16px',
                    zIndex: 9998
                }}
            >
                <div className="relative">
                    {/* Pulse rings */}
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></div>
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></div>
                    
                    {/* Main button */}
                    <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-active:scale-95 border-2 border-red-400">
                        <span className="text-white font-bold text-sm">SOS</span>
                    </div>
                    
                    {/* Label tooltip */}
                    <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg">
                        Emergency SOS
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-red-600"></div>
                    </div>
                </div>
            </button>

            {/* SOS Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
                        
                        {/* Success State */}
                        {sosTriggered ? (
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Help is on the way!</h2>
                                <p className="text-gray-600 mb-6">
                                    Emergency services have been notified. Stay calm and stay where you are.
                                </p>
                                
                                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-blue-800 font-medium mb-2">Your Location:</p>
                                    <p className="text-sm text-blue-700">{location?.address}</p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleDirectCall('108')}
                                        className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                    >
                                        <PhoneCall className="w-5 h-5" />
                                        Call Ambulance (108)
                                    </button>
                                    <button
                                        onClick={resetModal}
                                        className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : countdown !== null ? (
                            /* Countdown State */
                            <div className="p-8 text-center">
                                <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <span className="text-6xl font-bold text-red-600">{countdown}</span>
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="60"
                                            fill="none"
                                            stroke="#fee2e2"
                                            strokeWidth="8"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="60"
                                            fill="none"
                                            stroke="#dc2626"
                                            strokeWidth="8"
                                            strokeDasharray={`${(countdown / 5) * 377} 377`}
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sending SOS Alert...</h2>
                                <p className="text-gray-600 mb-6">
                                    Tap cancel if this was a mistake
                                </p>
                                <button
                                    onClick={cancelCountdown}
                                    className="w-full px-4 py-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            /* Main Form */
                            <>
                                {/* Header */}
                                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Emergency</h2>
                                            <p className="text-sm text-gray-500">Get immediate help</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={resetModal}
                                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Tab Buttons */}
                                    <div className="flex bg-gray-100 rounded-xl p-1">
                                        <button
                                            onClick={() => setActiveTab('sos')}
                                            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                                                activeTab === 'sos'
                                                    ? 'bg-red-600 text-white shadow-md'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <AlertTriangle className="w-5 h-5" />
                                            SOS Alert
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('ambulance')}
                                            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                                                activeTab === 'ambulance'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <Ambulance className="w-5 h-5" />
                                            Ambulance
                                        </button>
                                    </div>

                                    {/* Location Card */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                location ? 'bg-green-100' : locationError ? 'bg-red-100' : 'bg-blue-100'
                                            }`}>
                                                {locationLoading ? (
                                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                                ) : location ? (
                                                    <MapPin className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Navigation className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 mb-1">Your Location</p>
                                                {locationLoading ? (
                                                    <p className="text-sm text-gray-500">Getting your location...</p>
                                                ) : location ? (
                                                    <>
                                                        <p className="text-sm text-gray-600 line-clamp-2">{location.address}</p>
                                                        <p className="text-xs text-gray-400 mt-1">Accuracy: ±{location.accuracy}m</p>
                                                    </>
                                                ) : locationError ? (
                                                    <div>
                                                        <p className="text-sm text-red-600">{locationError}</p>
                                                        <button
                                                            onClick={getUserLocation}
                                                            className="text-sm text-blue-600 font-medium mt-1"
                                                        >
                                                            Try again
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Type Selection */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 mb-3">What's the emergency?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {emergencyTypes.map((type) => {
                                                const Icon = type.icon;
                                                const isSelected = selectedEmergency === type.id;
                                                return (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => setSelectedEmergency(isSelected ? null : type.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                                            isSelected
                                                                ? 'border-red-500 bg-red-50'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-red-600' : 'text-gray-600'}`} />
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-red-700' : 'text-gray-700'}`}>
                                                            {type.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                                            Additional details (optional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-white"
                                            rows="2"
                                            placeholder="Describe what's happening..."
                                            maxLength={300}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        {activeTab === 'sos' ? (
                                            <button
                                                onClick={startSOSCountdown}
                                                disabled={loading || !location}
                                                className="w-full px-4 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <AlertTriangle className="w-6 h-6" />
                                                )}
                                                {loading ? 'Sending...' : 'Send SOS Alert'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleAmbulanceRequest}
                                                disabled={loading || !location}
                                                className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <Ambulance className="w-6 h-6" />
                                                )}
                                                {loading ? 'Requesting...' : 'Request Ambulance'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Quick Call Buttons */}
                                    <div className="border-t border-gray-100 pt-4">
                                        <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Quick Call
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleDirectCall('108')}
                                                className="p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                            >
                                                <p className="text-lg font-bold text-red-600">108</p>
                                                <p className="text-xs text-red-700">Ambulance</p>
                                            </button>
                                            <button
                                                onClick={() => handleDirectCall('100')}
                                                className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                            >
                                                <p className="text-lg font-bold text-blue-600">100</p>
                                                <p className="text-xs text-blue-700">Police</p>
                                            </button>
                                            <button
                                                onClick={() => handleDirectCall('112')}
                                                className="p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                                            >
                                                <p className="text-lg font-bold text-orange-600">112</p>
                                                <p className="text-xs text-orange-700">Emergency</p>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default SOSButton;
