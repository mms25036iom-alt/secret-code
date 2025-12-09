import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  ANALYSIS_TYPES, 
  analyzeMedicalImageAdvanced, 
  generateMedicalReport,
  saveToHistory 
} from '../utils/medicalAI';
import { isAIAvailable, getAIProvider } from '../utils/aiService';
import { analyzeSkinLesionHF, classifyImageHF } from '../utils/huggingFaceAI';

const MedicalAnalysis = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const fileInputRef = useRef(null);
  
  const [selectedType, setSelectedType] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    gender: '',
    symptoms: '',
    medicalHistory: '',
  });
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [hfResult, setHfResult] = useState(null);
  const [hfLoading, setHfLoading] = useState(false);

  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setImageBase64(event.target.result);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedType) {
      toast.error('Please select an analysis type');
      return;
    }
    if (!imageBase64) {
      toast.error('Please upload an image');
      return;
    }
    if (!isAIAvailable()) {
      toast.error('AI service is not available');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setHfResult(null);

    try {
      // Run main AI analysis
      const result = await analyzeMedicalImageAdvanced(imageBase64, selectedType, patientInfo);
      setAnalysisResult(result);
      saveToHistory(result, imagePreview);
      toast.success('Analysis complete!');

      // Also run Hugging Face analysis for skin type (bonus)
      if (selectedType === 'skin') {
        setHfLoading(true);
        try {
          const hfRes = await analyzeSkinLesionHF(imageBase64);
          setHfResult(hfRes);
        } catch (hfErr) {
          console.log('HF analysis skipped:', hfErr.message);
        } finally {
          setHfLoading(false);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!analysisResult) return;
    
    setGeneratingReport(true);
    try {
      const reportText = await generateMedicalReport(analysisResult, {
        name: user?.name || 'Patient',
        ...patientInfo,
        date: new Date().toLocaleDateString(),
      });
      setReport(reportText);
      setShowReport(true);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const resetAnalysis = () => {
    setImagePreview(null);
    setImageBase64(null);
    setAnalysisResult(null);
    setReport(null);
    setShowReport(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getEmergencyBadge = (level) => {
    const badges = {
      0: { text: 'Normal', bg: 'bg-green-500', icon: '✓' },
      1: { text: 'Monitor', bg: 'bg-yellow-500', icon: '⚠' },
      2: { text: 'Consult Doctor', bg: 'bg-orange-500', icon: '!' },
      3: { text: 'Urgent', bg: 'bg-red-500', icon: '🚨' },
    };
    return badges[level] || badges[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏥 AI Medical Analysis
          </h1>
          <p className="text-blue-200">
            Advanced AI-powered medical image analysis
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Powered by {getAIProvider()} • For educational purposes only
          </p>
        </div>

        {/* Analysis Type Selection */}
        {!selectedType && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(ANALYSIS_TYPES).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 
                         hover:bg-white/20 transition-all text-center group"
              >
                <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">
                  {type.icon}
                </span>
                <h3 className="text-white font-semibold text-sm">{type.name}</h3>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{type.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* Selected Type Header */}
        {selectedType && (
          <div className="mb-6">
            <button
              onClick={() => { setSelectedType(null); resetAnalysis(); }}
              className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
            >
              ← Back to selection
            </button>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur">
              <span className="text-4xl">{ANALYSIS_TYPES[selectedType].icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {ANALYSIS_TYPES[selectedType].name}
                </h2>
                <p className="text-gray-300 text-sm">
                  {ANALYSIS_TYPES[selectedType].description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Image Upload & Analysis */}
        {selectedType && !analysisResult && (
          <div className="space-y-6">
            {/* Patient Info (Optional) */}
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10">
              <h3 className="text-white font-semibold mb-3">Patient Information (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Age"
                  value={patientInfo.age}
                  onChange={(e) => setPatientInfo(p => ({ ...p, age: e.target.value }))}
                  className="p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20"
                />
                <select
                  value={patientInfo.gender}
                  onChange={(e) => setPatientInfo(p => ({ ...p, gender: e.target.value }))}
                  className="p-3 rounded-lg bg-white/10 text-white border border-white/20"
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <textarea
                  placeholder="Symptoms (optional)"
                  value={patientInfo.symptoms}
                  onChange={(e) => setPatientInfo(p => ({ ...p, symptoms: e.target.value }))}
                  className="col-span-2 p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 
                           border border-white/20 resize-none h-20"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
                        ${imagePreview 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-white/30 bg-white/5 hover:bg-white/10'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              {imagePreview ? (
                <div className="text-center">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <p className="text-green-400">✓ Image loaded - Click to change</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-5xl block mb-4">📤</span>
                  <p className="text-white font-semibold">Upload Medical Image</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Click or drag to upload • Max 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!imageBase64 || isAnalyzing}
              className={`w-full p-4 rounded-xl font-bold text-lg transition-all
                        ${imageBase64 && !isAnalyzing
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">⚙️</span>
                  Analyzing with AI...
                </span>
              ) : (
                '🔬 Analyze Image'
              )}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Emergency Level Badge */}
            <div className={`p-4 rounded-xl ${getEmergencyBadge(analysisResult.emergencyLevel).bg} 
                          text-white text-center`}>
              <span className="text-2xl mr-2">
                {getEmergencyBadge(analysisResult.emergencyLevel).icon}
              </span>
              <span className="font-bold text-lg">
                {getEmergencyBadge(analysisResult.emergencyLevel).text}
              </span>
              <p className="text-sm mt-1 opacity-90">
                {analysisResult.statusInfo?.action}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/10 text-center">
                <p className="text-3xl font-bold text-white">
                  {analysisResult.confidenceScore}%
                </p>
                <p className="text-gray-400 text-sm">Confidence</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 text-center">
                <p className="text-xl font-bold text-white">
                  {analysisResult.riskLevel}
                </p>
                <p className="text-gray-400 text-sm">Risk Level</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 text-center">
                <p className="text-xl font-bold text-white">
                  {ANALYSIS_TYPES[selectedType]?.icon}
                </p>
                <p className="text-gray-400 text-sm">{selectedType?.toUpperCase()}</p>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                📋 Detailed Analysis
              </h3>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                  {analysisResult.rawAnalysis}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="flex-1 p-4 rounded-xl bg-purple-600 text-white font-semibold
                         hover:bg-purple-700 transition-all disabled:opacity-50"
              >
                {generatingReport ? '⏳ Generating...' : '📄 Generate Report'}
              </button>
              <button
                onClick={resetAnalysis}
                className="flex-1 p-4 rounded-xl bg-white/10 text-white font-semibold
                         hover:bg-white/20 transition-all"
              >
                🔄 New Analysis
              </button>
            </div>

            {/* Hugging Face Results (for skin analysis) */}
            {selectedType === 'skin' && (hfLoading || hfResult) && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  🤗 Hugging Face AI Analysis
                </h3>
                {hfLoading ? (
                  <div className="flex items-center gap-2 text-purple-300">
                    <span className="animate-spin">⚙️</span>
                    Running additional skin analysis...
                  </div>
                ) : hfResult?.success ? (
                  <div className="space-y-2">
                    <p className="text-white">
                      <strong>Top Prediction:</strong> {hfResult.topPrediction}
                    </p>
                    <p className="text-gray-300">
                      <strong>Confidence:</strong> {hfResult.confidence}%
                    </p>
                    {hfResult.predictions?.length > 1 && (
                      <div className="mt-2">
                        <p className="text-gray-400 text-sm mb-1">Other possibilities:</p>
                        <div className="flex flex-wrap gap-2">
                          {hfResult.predictions.slice(1, 4).map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                              {p.label}: {p.confidence}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Additional analysis unavailable: {hfResult?.error || 'Unknown error'}
                  </p>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/50">
              <p className="text-yellow-200 text-sm">
                ⚠️ <strong>Disclaimer:</strong> This AI analysis is for educational and screening 
                purposes only. It is NOT a medical diagnosis. Always consult qualified healthcare 
                professionals for medical advice and treatment decisions.
              </p>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReport && report && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-bold">📄 Medical Screening Report</h3>
                <button 
                  onClick={() => setShowReport(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                  {report}
                </pre>
              </div>
              <div className="p-4 border-t border-white/10 flex gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(report);
                    toast.success('Report copied to clipboard');
                  }}
                  className="flex-1 p-3 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  📋 Copy Report
                </button>
                <button
                  onClick={() => setShowReport(false)}
                  className="flex-1 p-3 rounded-lg bg-white/10 text-white font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalAnalysis;
