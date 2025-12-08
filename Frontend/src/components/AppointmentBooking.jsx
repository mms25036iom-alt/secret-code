import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, Stethoscope, MessageSquare, CheckCircle, Loader2, Brain, Mic, MicOff, Play, Pause } from 'lucide-react';
import { createAppointment, allDoctors, getAvailableSlots, clearErrors } from '../actions/appointmentActions';
import { generateSymptomAnalysis } from '../utils/geminiAI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';

const AppointmentBooking = ({ onClose, preSelectedDoctor = null }) => {
    const dispatch = useDispatch();
    const { loading: appointmentLoading, error, appointment } = useSelector(state => state.newAppointment);
    const { availableSlots, loading: slotsLoading } = useSelector(state => state.availableSlots || {});

    const [formData, setFormData] = useState({
        doctor: preSelectedDoctor?._id || '',
        description: '',
        symptoms: '',
        day: '',
        time: ''
    });

    const [selectedDate, setSelectedDate] = useState('');
    const [isDateSelected, setIsDateSelected] = useState(false);
    const [combinedDescription, setCombinedDescription] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctor);
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    
    // Audio recording states
    const [isRecordingSymptoms, setIsRecordingSymptoms] = useState(false);
    const [symptomsAudio, setSymptomsAudio] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [playingAudio, setPlayingAudio] = useState(false);
    
    // Refs
    const audioRef = useRef(null);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');

    useEffect(() => {
        dispatch(allDoctors());
        dispatch(clearErrors());
        
        // Cleanup on unmount
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
    }, [dispatch, mediaRecorder]);


    useEffect(() => {
        if (appointment) {
            onClose();
        }
    }, [appointment, onClose]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // If doctor is selected and date is selected, fetch available slots
        if (name === 'doctor' && selectedDate) {
            dispatch(getAvailableSlots(value, selectedDate));
        }
    };

    const handleCombinedDescriptionChange = (e) => {
        const value = e.target.value;
        setCombinedDescription(value);
        // Update both description and symptoms with the same value
        setFormData(prev => ({
            ...prev,
            description: value,
            symptoms: value
        }));

        // Generate AI suggestions when description is long enough
        if (value.length > 20) {
            generateAISuggestions(value);
        } else {
            setAiSuggestions('');
        }
    };

    const generateAISuggestions = async (symptoms) => {
        if (!symptoms || symptoms.length < 20) return;
        
        setIsGeneratingAI(true);
        try {
            const suggestions = await generateSymptomAnalysis(symptoms);
            setAiSuggestions(suggestions);
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            setAiSuggestions('');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    // Audio recording functions
    const startRecording = async () => {
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

                // Update the symptoms text in real-time
                setCombinedDescription(fullText);
                setFormData(prev => ({
                    ...prev,
                    description: fullText,
                    symptoms: fullText
                }));
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
                
                setSymptomsAudio(audioUrl);
                setIsRecordingSymptoms(false);
                
                stream.getTracks().forEach(track => track.stop());
                toast.success('Recording saved!');
                
                // Reset transcript
                transcriptRef.current = '';
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecordingSymptoms(true);
            
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

    const playAudio = () => {
        if (!symptomsAudio) return;
        
        if (playingAudio) {
            audioRef.current?.pause();
            setPlayingAudio(false);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(symptomsAudio);
            audioRef.current = audio;
            audio.play();
            setPlayingAudio(true);
            
            audio.onended = () => {
                setPlayingAudio(false);
            };
        }
    };

    // Upload audio to Cloudinary
    const uploadAudioToCloudinary = async (audioBlob) => {
        try {
            console.log('☁️ Uploading to Cloudinary...');
            console.log('Cloud name:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
            console.log('Upload preset:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            
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

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Cloudinary response error:', response.status, errorText);
                return null;
            }

            const data = await response.json();
            console.log('☁️ Cloudinary response:', data);
            
            if (data.secure_url) {
                console.log('✅ Cloudinary URL:', data.secure_url);
                return data.secure_url;
            } else {
                console.error('❌ No secure_url in response:', data);
                return null;
            }
        } catch (error) {
            console.error('❌ Error uploading audio to Cloudinary:', error);
            return null;
        }
    };



    const handleDateChange = (e) => {
        const date = e.target.value;
        setSelectedDate(date);
        setIsDateSelected(true);
        setFormData(prev => ({
            ...prev,
            day: date,
            time: '' // Reset time when date changes
        }));

        // If doctor is already selected, fetch available slots
        if (formData.doctor) {
            dispatch(getAvailableSlots(formData.doctor, date));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Enhanced validation
        if (!formData.doctor) {
            toast.error('Please select a doctor');
            return;
        }
        
        if (!formData.day) {
            toast.error('Please select a date');
            return;
        }
        
        if (!formData.time) {
            toast.error('Please select a time slot');
            return;
        }
        
        // Validate that at least one of text or audio is provided
        if ((!combinedDescription || combinedDescription.trim().length < 10) && !symptomsAudio) {
            toast.error('Please describe your symptoms either by text (at least 10 characters) or audio recording');
            return;
        }

        // Validate date is not in the past
        const selectedDateObj = new Date(formData.day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDateObj < today) {
            toast.error('Please select a future date');
            return;
        }

        // Validate time is not in the past for today
        if (selectedDateObj.toDateString() === today.toDateString()) {
            const selectedTime = new Date(`${formData.day}T${formData.time}`);
            const now = new Date();
            
            if (selectedTime <= now) {
                toast.error('Please select a future time slot');
                return;
            }
        }

        // Upload audio if exists
        let symptomsAudioUrl = null;
        if (symptomsAudio) {
            console.log('🎤 Audio blob URL:', symptomsAudio);
            const uploadingToast = toast.info('Uploading audio...', { autoClose: false });
            try {
                const audioBlob = await fetch(symptomsAudio).then(r => r.blob());
                console.log('📦 Audio blob size:', audioBlob.size, 'bytes');
                
                symptomsAudioUrl = await uploadAudioToCloudinary(audioBlob);
                toast.dismiss(uploadingToast);
                
                if (!symptomsAudioUrl || symptomsAudioUrl.trim().length === 0) {
                    console.error('❌ Upload returned empty URL');
                    toast.error('Failed to upload audio. Please try again.');
                    return;
                }
                
                console.log('✅ Audio uploaded successfully:', symptomsAudioUrl);
                toast.success('Audio uploaded successfully!');
            } catch (error) {
                toast.dismiss(uploadingToast);
                console.error('❌ Error uploading audio:', error);
                toast.error('Failed to upload audio. Please try again.');
                return;
            }
        }

        // Prepare description and symptoms - use text if available, otherwise use placeholder for audio
        const finalDescription = formData.description && formData.description.trim().length > 0 
            ? formData.description 
            : (symptomsAudioUrl ? 'Audio description provided' : formData.description);
        
        const finalSymptoms = formData.symptoms && formData.symptoms.trim().length > 0 
            ? formData.symptoms 
            : (symptomsAudioUrl ? 'Audio symptoms provided' : formData.symptoms);

        console.log('📋 Submitting appointment:', {
            doctor: formData.doctor,
            day: formData.day,
            time: formData.time,
            description: finalDescription,
            symptoms: finalSymptoms,
            symptomsAudio: symptomsAudioUrl ? 'URL present' : 'No audio'
        });

        dispatch(createAppointment(
            formData.doctor,
            formData.day,
            formData.time,
            finalDescription,
            finalSymptoms,
            symptomsAudioUrl
        ));
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30); // Allow booking up to 30 days in advance
        return maxDate.toISOString().split('T')[0];
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };


    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" style={{ zIndex: 9999, paddingBottom: '80px' }}>
            <div className="appointment-modal bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-lg w-full mx-2 my-4 md:mx-4 border border-gray-200 relative" style={{ zIndex: 10000, backgroundColor: 'white', maxHeight: 'calc(100vh - 100px)' }}>
                <div className="p-4 md:p-6 bg-white overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                    {/* Header - Compact for Mobile */}
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div className="flex items-center space-x-2 md:space-x-3">
                            <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                            </div>
                            <h2 className="text-lg md:text-2xl font-bold text-gray-800">Book Appointment</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                        {/* Selected Doctor Display */}
                        {selectedDoctor && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 md:p-4">
                                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-2">
                                    <Stethoscope className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                                    Selected Doctor
                                </label>
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100&h=100"}
                                        alt={selectedDoctor.name}
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover border-2 border-blue-300"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-sm md:text-base font-bold text-gray-900">{selectedDoctor.name}</h3>
                                        <p className="text-xs md:text-sm text-blue-600 font-medium">{selectedDoctor.speciality}</p>
                                        <p className="text-xs text-gray-500">{selectedDoctor.age ? `${selectedDoctor.age} years` : ''} {selectedDoctor.gender ? `• ${selectedDoctor.gender}` : ''}</p>
                                    </div>
                                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0" />
                                </div>
                            </div>
                        )}

                        {/* Date Selection */}
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                                Select Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                min={getMinDate()}
                                max={getMaxDate()}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                                required
                            />
                        </div>

                        {/* Time Selection */}
                        {isDateSelected && formData.doctor && (
                            <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                                    Select Time Slot
                                </label>
                                {slotsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        <span className="ml-2 text-sm text-gray-600">Loading slots...</span>
                                    </div>
                                ) : availableSlots?.length > 0 ? (
                                    <>
                                        <div className="mb-2 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                                            <span className="font-medium text-blue-700">✓ {availableSlots.length} slots available</span>
                                            <span className="text-gray-500 ml-2">(Booked slots are hidden)</span>
                                        </div>
                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                                                    className={`p-2 md:p-3 text-xs md:text-sm rounded-lg border transition-all active:scale-95 ${
                                                        formData.time === slot
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                                                    }`}
                                                >
                                                    {formatTime(slot)}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6 bg-red-50 rounded-lg border border-red-200">
                                        <Clock className="w-6 h-6 mx-auto mb-2 text-red-400" />
                                        <p className="text-sm font-medium text-red-700">All slots are booked for this date</p>
                                        <p className="text-xs text-red-600 mt-1">Please select a different date</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Combined Description/Symptoms Field with Audio Recording */}
                        <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-blue-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                                <label className="block text-xs md:text-sm font-medium text-gray-700">
                                    <MessageSquare className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                                    Describe Your Symptoms / Appointment Reason
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="flex items-center space-x-2">
                                    {symptomsAudio && (
                                        <button
                                            type="button"
                                            onClick={playAudio}
                                            className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-xs sm:text-sm"
                                        >
                                            {playingAudio ? (
                                                <><Pause className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Pause</span></>
                                            ) : (
                                                <><Play className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Play</span></>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => isRecordingSymptoms ? stopRecording() : startRecording()}
                                        className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${
                                            isRecordingSymptoms
                                                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                    >
                                        {isRecordingSymptoms ? (
                                            <><MicOff className="w-3 h-3 sm:w-4 sm:h-4" /><span className="text-xs sm:text-sm">Stop</span></>
                                        ) : (
                                            <><Mic className="w-3 h-3 sm:w-4 sm:h-4" /><span className="text-xs sm:text-sm">Record</span></>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={combinedDescription}
                                onChange={handleCombinedDescriptionChange}
                                placeholder="Type your symptoms here OR use the Record button to describe them verbally..."
                                rows={4}
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-gray-900 transition-all"
                            />
                            <div className="flex items-start justify-between mt-2">
                                <p className="text-xs text-gray-500">
                                    {symptomsAudio ? (
                                        <span className="text-green-600 font-medium">✓ Audio recorded</span>
                                    ) : (
                                        'You can type OR record audio (at least one required)'
                                    )}
                                </p>
                                {combinedDescription.length > 0 && (
                                    <p className="text-xs text-gray-400">
                                        {combinedDescription.length} characters
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* AI Loading State */}
                        {isGeneratingAI && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                                <div className="flex items-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                                    <span className="text-xs md:text-sm text-blue-700 font-medium">AI is analyzing your symptoms...</span>
                                </div>
                            </div>
                        )}

                        {/* AI Suggestions */}
                        {aiSuggestions && !isGeneratingAI && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 md:p-5">
                                <div className="flex items-center mb-3 md:mb-4">
                                    <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg mr-2 md:mr-3">
                                        <Brain className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm md:text-base font-bold text-blue-800">AI Health Suggestions</h4>
                                        <p className="text-xs text-blue-600">Based on your symptoms</p>
                                    </div>
                                </div>
                                <div className="prose prose-sm max-w-none prose-blue text-xs md:text-sm">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ children }) => <h1 className="text-sm md:text-base font-semibold text-blue-800 mb-2">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-xs md:text-sm font-semibold text-blue-800 mb-1.5">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-xs font-semibold text-blue-800 mb-1">{children}</h3>,
                                            p: ({ children }) => <p className="text-blue-700 mb-1.5 leading-relaxed">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc list-inside text-blue-700 mb-1.5 space-y-0.5">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside text-blue-700 mb-1.5 space-y-0.5">{children}</ol>,
                                            li: ({ children }) => <li className="text-blue-700">{children}</li>,
                                            strong: ({ children }) => <strong className="font-semibold text-blue-800">{children}</strong>,
                                            em: ({ children }) => <em className="italic text-blue-600">{children}</em>,
                                            code: ({ children }) => <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">{children}</code>,
                                            blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-300 pl-3 italic text-blue-600 my-1.5">{children}</blockquote>
                                        }}
                                    >
                                        {aiSuggestions}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Submit Buttons - Mobile Optimized with extra bottom padding */}
                        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 pt-3 md:pt-4 pb-4 md:pb-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full md:flex-1 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all active:scale-95 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={appointmentLoading || !formData.doctor || !formData.day || !formData.time || ((!combinedDescription || combinedDescription.trim().length < 10) && !symptomsAudio)}
                                className="w-full md:flex-1 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center font-semibold shadow-md"
                            >
                                {appointmentLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Booking...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Book Appointment
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

export default AppointmentBooking;
