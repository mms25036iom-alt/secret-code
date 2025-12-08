import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Download } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createPrescription } from '../actions/prescriptionActions';
import { toast } from 'react-toastify';

const PrescriptionModal = ({ isOpen, onClose, appointmentId, patientId, patientName }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.prescription);
  const { user } = useSelector(state => state.user);

  const [formData, setFormData] = useState({
    patientId: patientId || '',
    patientName: patientName || '',
    diagnosis: '',
    symptoms: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: '',
    followUpInstructions: ''
  });

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Fetch patients when modal opens (for doctors)
  useEffect(() => {
    if (isOpen && user?.role === 'doctor' && !patientId) {
      fetchPatients();
    }
    if (patientId && patientName) {
      setFormData(prev => ({
        ...prev,
        patientId,
        patientName
      }));
    }
  }, [isOpen, patientId, patientName, user]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    console.log('🔍 Fetching patients for prescription...');
    try {
      const response = await fetch('/api/v1/appointment/my', {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📋 Appointments data:', data);
      
      if (data.success && Array.isArray(data.appointments)) {
        // Extract unique patients from doctor's appointments
        const uniquePatients = [];
        const patientIds = new Set();
        
        data.appointments.forEach(apt => {
          // Check if appointment has patient data
          if (apt.patient && apt.patient.id && !patientIds.has(apt.patient.id)) {
            patientIds.add(apt.patient.id);
            uniquePatients.push({
              id: apt.patient.id,
              name: apt.patient.name,
              contact: apt.patient.contact
            });
          }
        });
        
        console.log('👥 Unique patients found:', uniquePatients.length);
        console.log('👥 Patients:', uniquePatients);
        setPatients(uniquePatients);
        
        if (uniquePatients.length === 0) {
          toast.info('No patients found. Complete an appointment first to create prescriptions.');
        }
      } else {
        console.warn('⚠️ No appointments data received');
        setPatients([]);
      }
    } catch (error) {
      console.error('❌ Error fetching patients:', error);
      toast.error('Failed to load patients. Please try again.');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index][field] = value;
    setFormData(prev => ({
      ...prev,
      medications: updatedMedications
    }));
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removeMedication = (index) => {
    if (formData.medications.length > 1) {
      const updatedMedications = formData.medications.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        medications: updatedMedications
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Submitting prescription with data:', formData);
    
    if (!formData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    if (!formData.diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    const validMedications = formData.medications.filter(med => 
      med.name.trim() && med.dosage.trim() && med.frequency.trim()
    );

    if (validMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    const prescriptionData = {
      patientId: formData.patientId,
      diagnosis: formData.diagnosis.trim(),
      symptoms: formData.symptoms.trim(),
      medications: validMedications,
      notes: formData.notes.trim(),
      followUpInstructions: formData.followUpInstructions.trim()
    };

    // Only add appointmentId if it exists
    if (appointmentId) {
      prescriptionData.appointmentId = appointmentId;
    }

    console.log('📤 Sending prescription data:', prescriptionData);

    try {
      await dispatch(createPrescription(prescriptionData));
      toast.success('Prescription created successfully!');
      
      // Refresh prescriptions list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      onClose();
      setFormData({
        patientId: '',
        patientName: '',
        diagnosis: '',
        symptoms: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        notes: '',
        followUpInstructions: ''
      });
    } catch (error) {
      console.error('❌ Error creating prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Prescription</h2>
                <p className="text-gray-600">Patient: {patientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection - Always show if patient not pre-selected */}
            {(!patientId || !patientName) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient *
                </label>
                {loadingPatients ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading patients...</span>
                  </div>
                ) : patients.length > 0 ? (
                  <select
                    value={formData.patientId}
                    onChange={(e) => {
                      const selectedPatient = patients.find(p => p.id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        patientId: e.target.value,
                        patientName: selectedPatient?.name || ''
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    required
                  >
                    <option value="">-- Select a patient --</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.contact})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      No patients found. You need to have at least one appointment with a patient to create a prescription.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis *
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                rows="3"
                placeholder="Enter the medical diagnosis"
                required
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                rows="3"
                placeholder="Describe the symptoms observed"
              />
            </div>

            {/* Medications */}
            <div className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Medications *
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medication</span>
                </button>
              </div>

              <div className="space-y-4 mb-4">
                {formData.medications.map((medication, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-700">Medication {index + 1}</h4>
                      {formData.medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medication Name *
                        </label>
                        <input
                          type="text"
                          value={medication.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          placeholder="e.g., Paracetamol"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dosage *
                        </label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          placeholder="e.g., 500mg"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frequency *
                        </label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          placeholder="e.g., Twice daily"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          placeholder="e.g., 7 days"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instructions
                        </label>
                        <textarea
                          value={medication.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          rows="2"
                          placeholder="Special instructions for taking this medication"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                rows="3"
                placeholder="Any additional notes or recommendations"
              />
            </div>

            {/* Follow-up Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Instructions
              </label>
              <textarea
                name="followUpInstructions"
                value={formData.followUpInstructions}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                rows="3"
                placeholder="Instructions for follow-up care"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 pb-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Create Prescription</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;
