import { useState, useEffect } from 'react';
import { AlertCircle, MapPin, Phone, X } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const SOSButton = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('high');

    // Get user location
    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    try {
                        // Try to get address from coordinates using reverse geocoding
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();
                        
                        resolve({
                            latitude,
                            longitude,
                            address: data.display_name || `${latitude}, ${longitude}`
                        });
                    } catch (error) {
                        // If reverse geocoding fails, just use coordinates
                        resolve({
                            latitude,
                            longitude,
                            address: `${latitude}, ${longitude}`
                        });
                    }
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    };

    // Fetch location when modal opens
    useEffect(() => {
        if (showModal && !location) {
            getUserLocation()
                .then(loc => {
                    setLocation(loc);
                    setLocationError(null);
                })
                .catch(err => {
                    setLocationError(err.message);
                    toast.error('Failed to get location. Please enable location services.');
                });
        }
    }, [showModal]);

    const handleSOSTrigger = async () => {
        if (!location) {
            toast.error('Location is required for SOS');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/v1/emergency/sos', {
                location,
                description: description || 'Emergency SOS triggered',
                severity
            });

            if (response.data.success) {
                toast.success(`SOS triggered! ${response.data.contactsNotified} contacts notified.`);
                setShowModal(false);
                setDescription('');
            }
        } catch (error) {
            console.error('SOS Error:', error);
            toast.error(error.response?.data?.message || 'Failed to trigger SOS');
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
            const response = await axios.post('/api/v1/emergency/ambulance', {
                location,
                description: description || 'Ambulance requested',
                severity
            });

            if (response.data.success) {
                toast.success('Ambulance requested successfully!');
                
                // Show ambulance info
                const { ambulanceInfo } = response.data;
                toast.info(
                    `Emergency Number: ${ambulanceInfo.emergencyNumber}\nLocal: ${ambulanceInfo.localNumber}\nETA: ${ambulanceInfo.estimatedArrival}`,
                    { autoClose: 10000 }
                );
                
                setShowModal(false);
                setDescription('');
            }
        } catch (error) {
            console.error('Ambulance Request Error:', error);
            toast.error(error.response?.data?.message || 'Failed to request ambulance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating SOS Button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-24 right-4 z-50 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 animate-pulse"
                aria-label="Emergency SOS"
            >
                <AlertCircle className="w-8 h-8" />
            </button>

            {/* SOS Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Emergency SOS</h2>
                                    <p className="text-sm text-gray-500">Get immediate help</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Location Status */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start">
                                <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Your Location</p>
                                    {location ? (
                                        <p className="text-xs text-gray-600 break-words">{location.address}</p>
                                    ) : locationError ? (
                                        <p className="text-xs text-red-600">{locationError}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500">Getting location...</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Describe the emergency (optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows="3"
                                placeholder="What's happening?"
                                maxLength={500}
                            />
                        </div>

                        {/* Severity */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Severity Level
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['medium', 'high', 'critical'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSeverity(level)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            severity === level
                                                ? level === 'critical'
                                                    ? 'bg-red-600 text-white'
                                                    : level === 'high'
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-yellow-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleSOSTrigger}
                                disabled={loading || !location}
                                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {loading ? 'Sending SOS...' : 'Trigger SOS Alert'}
                            </button>

                            <button
                                onClick={handleAmbulanceRequest}
                                disabled={loading || !location}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <Phone className="w-5 h-5 mr-2" />
                                {loading ? 'Requesting...' : 'Request Ambulance'}
                            </button>

                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Emergency Numbers */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-medium text-blue-900 mb-2">Emergency Numbers:</p>
                            <div className="space-y-1">
                                <p className="text-xs text-blue-800">🚑 Ambulance: 108</p>
                                <p className="text-xs text-blue-800">🏥 Nabha Civil Hospital: 01765-222108</p>
                                <p className="text-xs text-blue-800">🚨 Police: 100</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SOSButton;
