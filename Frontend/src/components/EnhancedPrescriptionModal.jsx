import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, FileText, Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createPrescription } from '../actions/prescriptionActions';
import { toast } from 'react-toastify';

// Common symptoms list
const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Headache',
  'Sore Throat',
  'Body Ache',
  'Fatigue',
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Abdominal Pain',
  'Chest Pain',
  'Shortness of Breath',
  'Dizziness',
  'Loss of Appetite',
  'Runny Nose',
  'Sneezing',
  'Chills',
  'Sweating',
  'Weakness',
  'Other'
];

const EnhancedPrescriptionModal = ({ isOpen, onClose, appointmentId, patientId, patientName }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.prescription);
  const { user } = useSelector(state => state.user);

  const [formData, setFormData] = useState({
    patientId: patientId || '',
    patientName: patientName || '',
    diagnosis: '',
    diagnosisAudio: null,
    symptoms: [],
    otherSymptom: '',
    medications: [{ 
      name: '', 
      dosage: '', 
      frequency: '', 
      duration: '', 
      instructions: '',
      instructionsAudio: null 
    }]
  });

  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  
  // Audio recording states
  const [isRecordingDiagnosis, setIsRecordingDiagnosis] = useState(false);
  const [recordingMedicationIndex, setRecordingMedicationIndex] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  
  // Audio playback states
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  
  // Speech recognition ref
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Fetch patients and medicines when modal opens
  useEffect(() => {
    if (isOpen) {
      if (user?.role === 'doctor' && !patientId) {
        fetchPatients();
      }
      fetchMedicines();
      
      if (patientId && patientName) {
        setFormData(prev => ({
          ...prev,
          patientId,
          patientName
        }));
      }
    }
    
    // Cleanup on unmount or close
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Recognition cleanup');
        }
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [isOpen, patientId, patientName, user]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await fetch('/api/v1/appointment/my', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.appointments)) {
        const uniquePatients = [];
        const patientIds = new Set();
        
        data.appointments.forEach(apt => {
          if (apt.patient && apt.patient.id && !patientIds.has(apt.patient.id)) {
            patientIds.add(apt.patient.id);
            uniquePatients.push({
              id: apt.patient.id,
              name: apt.patient.name,
              contact: apt.patient.contact
            });
          }
        });
        
        setPatients(uniquePatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchMedicines = async () => {
    setLoadingMedicines(true);
    try {
      const response = await fetch('/api/v1/medicines', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.medicines)) {
        setMedicines(data.medicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicines list');
    } finally {
      setLoadingMedicines(false);
    }
  };

  // Audio recording functions
  const startRecording = async (type, medicationIndex = null) => {
    try {
      // Check if speech recognition is available
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error('Speech recognition is not supported in this browser. Please use Chrome.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Store recognition instance
      recognitionRef.current = recognition;
      transcriptRef.current = '';

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result received');
        let interimTranscript = '';
        let finalTranscript = transcriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            transcriptRef.current = finalTranscript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullText = finalTranscript + interimTranscript;
        console.log('Transcribed text:', fullText);

        // Update the form data in real-time
        if (type === 'diagnosis') {
          setFormData(prev => ({
            ...prev,
            diagnosis: fullText
          }));
        } else if (type === 'instructions' && medicationIndex !== null) {
          setFormData(prev => {
            const updatedMedications = [...prev.medications];
            updatedMedications[medicationIndex].instructions = fullText;
            return {
              ...prev,
              medications: updatedMedications
            };
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'network') {
          toast.warning('Network error. Transcription may not work, but audio is being recorded.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else if (event.error !== 'aborted') {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
      };

      // Start recognition
      try {
        recognition.start();
        console.log('Started speech recognition');
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.warning('Transcription may not work, but audio is being recorded.');
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.log('Recognition already stopped');
          }
        }
        
        if (type === 'diagnosis') {
          setFormData(prev => ({
            ...prev,
            diagnosisAudio: audioUrl
          }));
          setIsRecordingDiagnosis(false);
        } else if (type === 'instructions' && medicationIndex !== null) {
          setFormData(prev => {
            const updatedMedications = [...prev.medications];
            updatedMedications[medicationIndex].instructionsAudio = audioUrl;
            return {
              ...prev,
              medications: updatedMedications
            };
          });
          setRecordingMedicationIndex(null);
        }
        
        stream.getTracks().forEach(track => track.stop());
        toast.success('Recording saved!');
        
        // Reset transcript
        transcriptRef.current = '';
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      
      if (type === 'diagnosis') {
        setIsRecordingDiagnosis(true);
      } else {
        setRecordingMedicationIndex(medicationIndex);
      }
      
      toast.info('🎤 Recording started... Speak clearly');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Recognition already stopped');
        }
      }
      
      toast.success('Recording stopped!');
    }
  };

  const transcribeAudio = async (audioBlob) => {
    // Note: Web Speech API transcribes live audio, not recorded audio
    // The transcription happens during recording, not after
    // This function is kept for compatibility but returns empty string
    return '';
  };

  const playAudio = (audioUrl, type) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => {
      const symptoms = prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom];
      return { ...prev, symptoms };
    });
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
      medications: [...prev.medications, { 
        name: '', 
        dosage: '', 
        frequency: '', 
        duration: '', 
        instructions: '',
        instructionsAudio: null 
      }]
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

  // Upload audio to Cloudinary
  const uploadAudioToCloudinary = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('resource_type', 'video'); // Cloudinary treats audio as video

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading audio:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

    // Show uploading toast
    const uploadingToast = toast.info('Uploading audio files...', { autoClose: false });

    try {
      // Upload diagnosis audio if exists
      let diagnosisAudioUrl = null;
      if (formData.diagnosisAudio) {
        const audioBlob = await fetch(formData.diagnosisAudio).then(r => r.blob());
        diagnosisAudioUrl = await uploadAudioToCloudinary(audioBlob);
      }

      // Upload medication instruction audios
      const medicationsWithAudio = await Promise.all(
        validMedications.map(async (med) => {
          if (med.instructionsAudio) {
            const audioBlob = await fetch(med.instructionsAudio).then(r => r.blob());
            const audioUrl = await uploadAudioToCloudinary(audioBlob);
            return { ...med, instructionsAudio: audioUrl };
          }
          return med;
        })
      );

      toast.dismiss(uploadingToast);

      // Combine selected symptoms with other symptom
      const allSymptoms = [...formData.symptoms];
      if (formData.symptoms.includes('Other') && formData.otherSymptom.trim()) {
        allSymptoms.push(formData.otherSymptom.trim());
      }

      const prescriptionData = {
        patientId: formData.patientId,
        diagnosis: formData.diagnosis.trim(),
        diagnosisAudio: diagnosisAudioUrl,
        symptoms: allSymptoms.filter(s => s !== 'Other').join(', '),
        medications: medicationsWithAudio
      };

      if (appointmentId) {
        prescriptionData.appointmentId = appointmentId;
      }

      console.log('📤 Sending prescription data:', {
        ...prescriptionData,
        diagnosisAudio: diagnosisAudioUrl ? 'URL present' : 'No audio',
        medicationsWithAudio: medicationsWithAudio.filter(m => m.instructionsAudio).length
      });

      await dispatch(createPrescription(prescriptionData));
      toast.success('Prescription created successfully!');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      onClose();
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl max-w-5xl w-full my-2 sm:my-8">
        <div className="p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-blue-200">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Create Prescription
                </h2>
                {patientName && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Patient: <span className="font-semibold">{patientName}</span></p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-all duration-200 group flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:text-red-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Patient Selection */}
            {(!patientId || !patientName) && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Patient <span className="text-red-500">*</span>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
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
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      No patients found. Complete an appointment first to create prescriptions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Diagnosis with Audio Recording */}
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  {formData.diagnosisAudio && (
                    <button
                      type="button"
                      onClick={() => playAudio(formData.diagnosisAudio, 'diagnosis')}
                      className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-xs sm:text-sm"
                    >
                      {playingAudio === formData.diagnosisAudio ? (
                        <><Pause className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Pause</span></>
                      ) : (
                        <><Play className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Play</span></>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => isRecordingDiagnosis ? stopRecording() : startRecording('diagnosis')}
                    className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${
                      isRecordingDiagnosis
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isRecordingDiagnosis ? (
                      <><MicOff className="w-3 h-3 sm:w-4 sm:h-4" /><span className="text-xs sm:text-sm">Stop</span></>
                    ) : (
                      <><Mic className="w-3 h-3 sm:w-4 sm:h-4" /><span className="text-xs sm:text-sm">Record</span></>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                rows="4"
                placeholder="Enter the medical diagnosis or use voice recording..."
                required
              />
            </div>

            {/* Symptoms - Multi-select Dropdown */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Symptoms
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.symptoms.includes(symptom)
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
              
              {/* Other Symptom Input */}
              {formData.symptoms.includes('Other') && (
                <input
                  type="text"
                  value={formData.otherSymptom}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherSymptom: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="Specify other symptom..."
                />
              )}
              
              {formData.symptoms.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Selected:</span> {formData.symptoms.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 pb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Medications <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Medication</span>
                </button>
              </div>

              <div className="space-y-4 mb-4">
                {formData.medications.map((medication, index) => (
                  <div key={index} className="border-2 border-blue-100 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs">
                          {index + 1}
                        </span>
                        <span>Medication {index + 1}</span>
                      </h4>
                      {formData.medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Medicine Name - Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medicine Name <span className="text-red-500">*</span>
                        </label>
                        {loadingMedicines ? (
                          <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        ) : (
                          <select
                            value={medication.name}
                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                            required
                          >
                            <option value="">-- Select Medicine --</option>
                            {medicines.map((med) => (
                              <option key={med._id} value={med.name}>
                                {med.name} {med.manufacturer && `(${med.manufacturer})`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dosage <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                          placeholder="e.g., 500mg"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frequency <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
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
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                          placeholder="e.g., 7 days"
                        />
                      </div>

                      {/* Instructions with Audio Recording */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Instructions
                          </label>
                          <div className="flex items-center space-x-2">
                            {medication.instructionsAudio && (
                              <button
                                type="button"
                                onClick={() => playAudio(medication.instructionsAudio, `instructions-${index}`)}
                                className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-xs"
                              >
                                {playingAudio === medication.instructionsAudio ? (
                                  <><Pause className="w-3 h-3" /><span>Pause</span></>
                                ) : (
                                  <><Play className="w-3 h-3" /><span>Play</span></>
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => 
                                recordingMedicationIndex === index 
                                  ? stopRecording() 
                                  : startRecording('instructions', index)
                              }
                              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all text-xs ${
                                recordingMedicationIndex === index
                                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              {recordingMedicationIndex === index ? (
                                <><MicOff className="w-3 h-3" /><span>Stop</span></>
                              ) : (
                                <><Mic className="w-3 h-3" /><span>Record</span></>
                              )}
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={medication.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                          rows="2"
                          placeholder="Special instructions or use voice recording..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-4 pt-4 sm:pt-6 pb-4 border-t-2 border-blue-200 sticky bottom-0 bg-gradient-to-br from-blue-50 to-white z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg font-medium text-sm sm:text-base order-1 sm:order-2"
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

export default EnhancedPrescriptionModal;
