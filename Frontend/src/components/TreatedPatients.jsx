import React, { useState, useEffect } from 'react';
import { Users, Eye, Calendar, FileText, Phone, Mail, Search } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const TreatedPatients = ({ doctorId }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTreatedPatients();
    }, [doctorId]);

    const fetchTreatedPatients = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/doctor/treated-patients`);
            setPatients(data.patients || []);
        } catch (error) {
            console.error('Error fetching treated patients:', error);
            toast.error('Failed to load treated patients');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPatient = async (patientId) => {
        try {
            const { data } = await axios.get(`/patient/${patientId}/complete-details`);
            setSelectedPatient(data.patient);
            setShowPatientModal(true);
        } catch (error) {
            console.error('Error fetching patient details:', error);
            toast.error('Failed to load patient details');
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Treated Patients
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">
                        {searchTerm ? 'No patients found matching your search' : 'No treated patients yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient._id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start space-x-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                    {patient.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{patient.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{patient.gender || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="truncate">{patient.contact}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>Last visit: {formatDate(patient.lastAppointment)}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{patient.appointmentCount} appointment{patient.appointmentCount !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleViewPatient(patient._id)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                <span>View Details</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Patient Details Modal */}
            {showPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-semibold text-gray-900">Patient Details</h3>
                                <button
                                    onClick={() => setShowPatientModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {/* Patient Info */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium text-gray-900">{selectedPatient.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Gender</p>
                                        <p className="font-medium text-gray-900 capitalize">{selectedPatient.gender || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Contact</p>
                                        <p className="font-medium text-gray-900">{selectedPatient.contact}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium text-gray-900">{selectedPatient.phone || selectedPatient.contact}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment History */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Appointment History</h4>
                                {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedPatient.appointments.map((appointment) => (
                                            <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-900">
                                                        {formatDate(appointment.day)} at {appointment.time}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {appointment.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1"><strong>Symptoms:</strong> {appointment.symptoms}</p>
                                                <p className="text-sm text-gray-600"><strong>Description:</strong> {appointment.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No appointment history available</p>
                                )}
                            </div>

                            {/* Medical Documents */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Medical Documents</h4>
                                {selectedPatient.medicalDocuments && selectedPatient.medicalDocuments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedPatient.medicalDocuments.map((doc) => (
                                            <div key={doc._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                                                        <p className="text-xs text-gray-500">{formatDate(doc.uploadedAt)}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No medical documents available</p>
                                )}
                            </div>

                            {/* Medical History */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Medical History</h4>
                                {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedPatient.medicalHistory.map((history, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start space-x-3">
                                                    {history.image && (
                                                        <img
                                                            src={history.image.url}
                                                            alt="Medical record"
                                                            className="w-20 h-20 object-cover rounded-lg"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-600 mb-2">{history.analysis}</p>
                                                        <p className="text-xs text-gray-500">{formatDate(history.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No medical history available</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowPatientModal(false)}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatedPatients;
