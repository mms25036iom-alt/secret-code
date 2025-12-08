import React, { useState, useRef } from 'react';
import { Calendar, Clock, User, Stethoscope, MessageSquare, AlertCircle, ChevronDown, ChevronUp, Brain, Mail, Phone, FileText, Check, X, Volume2, Pause } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateAppointmentStatus, myAppointments } from '../actions/appointmentActions';
import { toast } from 'react-toastify';

const AppointmentCard = ({ appointment, userRole }) => {
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [playingAudio, setPlayingAudio] = useState(null);
    const audioRef = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'missed':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Check if appointment is in the past
    const isAppointmentPast = () => {
        const appointmentDateTime = new Date(`${appointment.day}T${appointment.time}`);
        return appointmentDateTime < new Date();
    };

    const handleJoinCall = () => {
        if (appointment.roomId) {
            navigate(`/video-room?roomID=${appointment.roomId}`);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setIsUpdating(true);
        try {
            await dispatch(updateAppointmentStatus(appointment._id, newStatus));
            toast.success(`Appointment ${newStatus} successfully!`);
            // Refresh appointments list
            dispatch(myAppointments());
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${newStatus} appointment`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePatientCancel = async () => {
        setIsUpdating(true);
        try {
            await dispatch(updateAppointmentStatus(appointment._id, 'cancelled'));
            toast.success('Appointment cancelled successfully!');
            setShowCancelModal(false);
            // Refresh appointments list
            dispatch(myAppointments());
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel appointment');
        } finally {
            setIsUpdating(false);
        }
    };

    const playAudio = (audioUrl) => {
        if (playingAudio === audioUrl) {
            audioRef.current?.pause();
            setPlayingAudio(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            setPlayingAudio(audioUrl);
            
            audio.onended = () => {
                setPlayingAudio(null);
            };
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {userRole === 'doctor' ? 'Patient Appointment' : 'Your Appointment'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {formatDate(appointment.day)} at {formatTime(appointment.time)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-2">
                                <Stethoscope className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                    {userRole === 'doctor' ? 'Patient' : 'Doctor'}: {userRole === 'doctor' ? appointment.patient?.name : appointment.doctor?.name}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Speciality:</span>
                                <span className="text-sm font-medium text-blue-600">
                                    {appointment.doctor?.speciality}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                        </span>
                        {appointment.roomId && appointment.status !== 'completed' && appointment.status !== 'missed' && appointment.status !== 'cancelled' && (
                            <button
                                onClick={handleJoinCall}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Join Call
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Description */}
                <div className="mb-4">
                    <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                            <p className="text-sm text-gray-600">{appointment.description}</p>
                        </div>
                    </div>
                </div>

                {/* Symptoms */}
                <div className="mb-4">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-orange-400 mt-1" />
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <h4 className="text-sm font-medium text-gray-700">Symptoms</h4>
                                {appointment.symptomsAudio && appointment.symptomsAudio.trim().length > 0 && (
                                    <button
                                        onClick={() => playAudio(appointment.symptomsAudio)}
                                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-sm shadow-md"
                                    >
                                        {playingAudio === appointment.symptomsAudio ? (
                                            <>
                                                <Pause className="w-4 h-4" />
                                                <span>Pause Audio</span>
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 className="w-4 h-4" />
                                                <span>🎤 Play Patient's Audio</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            {appointment.symptoms && (
                                <p className="text-sm text-gray-600 mb-2">{appointment.symptoms}</p>
                            )}
                            {!appointment.symptoms && !appointment.symptomsAudio && (
                                <p className="text-sm text-gray-400 italic">No symptoms provided</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cancellation Reason - Show for cancelled or missed appointments */}
                {(appointment.status === 'cancelled' || appointment.status === 'missed') && appointment.cancellationReason && (
                    <div className="mb-4">
                        <div className={`flex items-start space-x-2 p-4 rounded-lg ${
                            appointment.status === 'missed' ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'
                        }`}>
                            <AlertCircle className={`w-5 h-5 mt-0.5 ${
                                appointment.status === 'missed' ? 'text-orange-600' : 'text-red-600'
                            }`} />
                            <div className="flex-1">
                                <h4 className={`text-sm font-semibold mb-1 ${
                                    appointment.status === 'missed' ? 'text-orange-800' : 'text-red-800'
                                }`}>
                                    {appointment.status === 'missed' ? 'Appointment Missed' : 'Cancellation Reason'}
                                </h4>
                                <p className={`text-sm ${
                                    appointment.status === 'missed' ? 'text-orange-700' : 'text-red-700'
                                }`}>
                                    {appointment.cancellationReason}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Suggestions - Note: AI suggestions are now generated client-side */}
                {false && appointment.aiSuggestions && (
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAISuggestions(!showAISuggestions)}
                            className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <Brain className="w-4 h-4" />
                            <span>AI Health Suggestions</span>
                            {showAISuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        {showAISuggestions && (
                            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <div className="prose prose-sm max-w-none prose-blue">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ children }) => <h1 className="text-lg font-semibold text-blue-800 mb-2">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-base font-semibold text-blue-800 mb-2">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-sm font-semibold text-blue-800 mb-1">{children}</h3>,
                                            p: ({ children }) => <p className="text-blue-700 mb-2 leading-relaxed">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc list-inside text-blue-700 mb-2 space-y-1">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside text-blue-700 mb-2 space-y-1">{children}</ol>,
                                            li: ({ children }) => <li className="text-blue-700">{children}</li>,
                                            strong: ({ children }) => <strong className="font-semibold text-blue-800">{children}</strong>,
                                            em: ({ children }) => <em className="italic text-blue-600">{children}</em>,
                                            code: ({ children }) => <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">{children}</code>,
                                            blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-300 pl-4 italic text-blue-600 my-2">{children}</blockquote>
                                        }}
                                    >
                                        {appointment.aiSuggestions}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Contact Information (for doctors) */}
                {userRole === 'doctor' && appointment.patient && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Patient Contact</h4>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{appointment.patient.contact}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Toggle */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Additional Details */}
                {showDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Appointment ID:</span>
                                <span className="ml-2 font-mono text-gray-700">{appointment._id}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Room ID:</span>
                                <span className="ml-2 font-mono text-gray-700">{appointment.roomId}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Created:</span>
                                <span className="ml-2 text-gray-700">
                                    {new Date(appointment.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Status:</span>
                                <span className="ml-2 text-gray-700 capitalize">{appointment.status}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-3">
                        {/* Join Call Button - Hide for completed, missed, and cancelled appointments */}
                        {appointment.roomId && appointment.status !== 'completed' && appointment.status !== 'missed' && appointment.status !== 'cancelled' && (
                            <button
                                onClick={handleJoinCall}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>Join Call</span>
                            </button>
                        )}
                        
                        {userRole === 'doctor' && (
                            <>
                                {/* Accept Appointment Button - Only show for pending appointments that are not past */}
                                {appointment.status === 'pending' && !isAppointmentPast() && (
                                    <button
                                        onClick={() => handleStatusUpdate('confirmed')}
                                        disabled={isUpdating}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{isUpdating ? 'Accepting...' : 'Accept Appointment'}</span>
                                    </button>
                                )}
                                
                                {/* Complete Appointment Button - Only show for confirmed appointments */}
                                {appointment.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleStatusUpdate('completed')}
                                        disabled={isUpdating}
                                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>{isUpdating ? 'Completing...' : 'Mark as Completed'}</span>
                                    </button>
                                )}
                                
                                {/* Cancel Appointment Button - Show for pending and confirmed, but not past appointments */}
                                {(appointment.status === 'pending' || appointment.status === 'confirmed') && !isAppointmentPast() && (
                                    <button
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        disabled={isUpdating}
                                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>{isUpdating ? 'Cancelling...' : 'Cancel Appointment'}</span>
                                    </button>
                                )}
                                
                                {/* Create Prescription Button - Only show for pending and confirmed appointments */}
                                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                    <button
                                        onClick={() => navigate('/prescriptions', { state: { appointmentId: appointment._id, patientId: appointment.patient?._id, patientName: appointment.patient?.name } })}
                                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>Create Prescription</span>
                                    </button>
                                )}
                            </>
                        )}
                        
                        {/* Patient Cancel Button - Only show for patients with pending or confirmed appointments that are not past */}
                        {userRole === 'user' && (appointment.status === 'pending' || appointment.status === 'confirmed') && !isAppointmentPast() && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                <X className="w-4 h-4" />
                                <span>Cancel Appointment</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Cancel Confirmation Modal for Patients */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                            Cancel Appointment?
                        </h3>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <div className="flex">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                                        Important Notice
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                        Cancelling this appointment may result in additional charges for your next booking. 
                                        A cancellation fee of ₹100 will be applied to discourage last-minute cancellations.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-gray-600 text-sm text-center">
                                Are you sure you want to cancel your appointment with <span className="font-semibold">Dr. {appointment.doctor?.name}</span> on <span className="font-semibold">{formatDate(appointment.day)}</span> at <span className="font-semibold">{formatTime(appointment.time)}</span>?
                            </p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Cancellation Policy:</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Cancellation fee: ₹100</li>
                                <li>• Fee will be added to your next appointment booking</li>
                                <li>• Repeated cancellations may affect your booking priority</li>
                                <li>• Consider rescheduling instead of cancelling</li>
                            </ul>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handlePatientCancel}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
