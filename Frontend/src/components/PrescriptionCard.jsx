import React, { useState, useRef, useEffect } from 'react';
import { Calendar, User, FileText, Download, Eye, ChevronDown, ChevronUp, Volume2, Play, Pause, QrCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from '../axios';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';

const PrescriptionCard = ({ prescription, userRole }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const audioRef = useRef(null);

  // Debug: Log prescription data
  useEffect(() => {
    console.log('🔍 Prescription Card Data:', {
      id: prescription._id,
      diagnosisAudio: prescription.diagnosisAudio,
      medicationsWithAudio: prescription.medications?.filter(m => m.instructionsAudio).length || 0,
      medications: prescription.medications?.map(m => ({
        name: m.name,
        hasAudio: !!m.instructionsAudio
      }))
    });
  }, [prescription]);

  // Generate QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Check if prescription is already dispensed
        const isDispensed = prescription.pharmacyStatus === 'dispensed';
        
        // Create prescription data for QR code
        const prescriptionData = {
          id: prescription._id,
          number: prescription.prescriptionNumber,
          patient: prescription.patient?.name,
          doctor: prescription.doctor?.name,
          date: new Date(prescription.createdAt).toLocaleDateString(),
          diagnosis: prescription.diagnosis,
          medications: prescription.medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration
          })),
          status: prescription.pharmacyStatus,
          dispensedAt: prescription.dispensedAt,
          // Add validation flag
          isValid: !isDispensed,
          // Create a verification URL
          verifyUrl: `${window.location.origin}/verify-prescription/${prescription._id}`
        };
        
        // Generate QR code with prescription data
        // If dispensed, make it visually different (red color)
        const qrUrl = await QRCode.toDataURL(JSON.stringify(prescriptionData), {
          width: 300,
          margin: 2,
          color: {
            dark: isDispensed ? '#dc2626' : '#2563eb', // Red if dispensed, blue if active
            light: '#ffffff'
          }
        });
        
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    
    if (prescription) {
      generateQRCode();
    }
  }, [prescription, prescription.pharmacyStatus]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get(`/prescription/${prescription._id}/pdf`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${prescription.prescriptionNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Prescription downloaded successfully!');
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast.error('Failed to download prescription');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Determine if prescription is dispensed
  const isDispensed = prescription.pharmacyStatus === 'dispensed';
  const dispensedDate = prescription.dispensedAt ? new Date(prescription.dispensedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  return (
    <div className={`bg-white rounded-lg md:rounded-xl shadow-md border-2 overflow-hidden ${
      isDispensed ? 'border-green-500' : 'border-gray-200'
    }`}>
      {/* Header - Mobile Optimized */}
      <div className={`p-3 md:p-6 border-b ${
        isDispensed 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left side - Icon and Info */}
          <div className="flex items-start md:items-center space-x-2 md:space-x-4">
            <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${
              isDispensed ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <FileText className={`w-4 h-4 md:w-6 md:h-6 ${
                isDispensed ? 'text-green-600' : 'text-blue-600'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-xl font-bold text-gray-900 truncate">
                  Prescription #{prescription.prescriptionNumber}
                </h3>
                {isDispensed && (
                  <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white shadow-sm">
                    ✓ Medicine Taken
                  </span>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-sm text-gray-600 mt-1 gap-1 md:gap-0">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(prescription.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {userRole === 'doctor' 
                      ? `Patient: ${prescription.patient?.name || 'Unknown'}`
                      : `Dr. ${prescription.doctor?.name || 'Unknown'}`
                    }
                  </span>
                </div>
              </div>
              {isDispensed && dispensedDate && (
                <div className="mt-2 text-xs text-green-700 font-medium">
                  📦 Dispensed on {dispensedDate} by {prescription.dispensedBy?.name || 'Pharmacist'}
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Action Buttons */}
          <div className="flex items-center justify-end space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowQRModal(true)}
              className="p-1.5 md:p-2 hover:bg-purple-100 rounded-lg transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 md:p-2 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              ) : (
                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="w-3 h-3 md:w-4 md:h-4" />
              )}
              <span className="hidden md:inline">Download PDF</span>
              <span className="md:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Doctor & Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Doctor Information</h4>
              <p className="text-gray-700"><strong>Name:</strong> Dr. {prescription.doctor?.name || 'Unknown'}</p>
              <p className="text-gray-700"><strong>Speciality:</strong> {prescription.doctor?.speciality || 'General Medicine'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
              <p className="text-gray-700"><strong>Name:</strong> {prescription.patient?.name || 'Unknown'}</p>
              <p className="text-gray-700"><strong>Contact:</strong> {prescription.patient?.contact || 'Not provided'}</p>
            </div>
          </div>

          {/* Diagnosis */}
          {prescription.diagnosis && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">Diagnosis</h4>
                {prescription.diagnosisAudio && prescription.diagnosisAudio.trim() !== '' ? (
                  <button
                    onClick={() => playAudio(prescription.diagnosisAudio)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm shadow-md"
                  >
                    {playingAudio === prescription.diagnosisAudio ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>🎤 Play Doctor's Audio</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 italic">No audio recording</span>
                )}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prescription.diagnosis}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Symptoms */}
          {prescription.symptoms && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Symptoms</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prescription.symptoms}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Medications */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Medications</h4>
            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-blue-900 text-lg">
                      {index + 1}. {medication.name}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Dosage:</span>
                      <span className="ml-2 text-gray-600">{medication.dosage}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Frequency:</span>
                      <span className="ml-2 text-gray-600">{medication.frequency}</span>
                    </div>
                    {medication.duration && (
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="ml-2 text-gray-600">{medication.duration}</span>
                      </div>
                    )}
                    {medication.instructions && (
                      <div className="md:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <span className="font-medium text-gray-700">Instructions:</span>
                          {medication.instructionsAudio && medication.instructionsAudio.trim() !== '' ? (
                            <button
                              onClick={() => playAudio(medication.instructionsAudio)}
                              className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-xs shadow-md"
                            >
                              {playingAudio === medication.instructionsAudio ? (
                                <>
                                  <Pause className="w-3 h-3" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>🎤 Play Audio</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No audio</span>
                          )}
                        </div>
                        <div className="text-gray-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {medication.instructions}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          {prescription.notes && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prescription.notes}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Follow-up Instructions */}
          {prescription.followUpInstructions && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Follow-up Instructions</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prescription.followUpInstructions}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              This prescription is digitally signed and valid for 30 days from the date of issue.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For any queries, please contact the prescribing doctor.
            </p>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Prescription QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-500">&times;</span>
              </button>
            </div>
            
            {/* Dispensed Warning */}
            {isDispensed && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="font-bold text-red-900">QR Code Invalid</h4>
                </div>
                <p className="text-sm text-red-800">
                  This prescription has already been dispensed on {dispensedDate}. 
                  The QR code is no longer valid for pharmacy use.
                </p>
              </div>
            )}
            
            <div className="text-center">
              <div className={`p-6 rounded-xl mb-4 ${
                isDispensed 
                  ? 'bg-gradient-to-br from-red-50 to-orange-50 opacity-60' 
                  : 'bg-gradient-to-br from-blue-50 to-purple-50'
              }`}>
                {qrCodeUrl ? (
                  <div className="relative">
                    <img src={qrCodeUrl} alt="Prescription QR Code" className="mx-auto" />
                    {isDispensed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-xl transform rotate-12 shadow-2xl">
                          USED
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              <div className={`border rounded-lg p-4 mb-4 ${
                isDispensed 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Prescription #:</strong> {prescription.prescriptionNumber}
                </p>
                <p className={`text-xs font-semibold ${
                  isDispensed ? 'text-red-700' : 'text-gray-600'
                }`}>
                  {isDispensed 
                    ? '❌ This QR code has been used and is no longer valid'
                    : '✓ Scan this QR code at the pharmacy to dispense medicines'
                  }
                </p>
              </div>
              
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCodeUrl;
                  link.download = `prescription-qr-${prescription.prescriptionNumber}.png`;
                  link.click();
                  toast.success('QR Code downloaded!');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionCard;
