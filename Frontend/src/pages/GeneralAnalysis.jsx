import { useState, useRef, useEffect } from "react";
import { Upload, MessageSquare, Image, Download, RefreshCw, Sparkles, Camera, X, Play, Square } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnalysisResults from '../components/AnalysisResults';
import jsPDF from 'jspdf';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Initialize Gemini AI with fallback keys
const API_KEYS = [
    "AIzaSyAerBoGRKAl_AMK4uGDG1re1u86sNxa28o",
    import.meta.env.VITE_GEMINI_API_KEY,
    "AIzaSyBjhpEfKWZa5jNA6iV-Rs6qmMhCnbtrJA8",
    import.meta.env.VITE_GEMINI_API_KEY_BACKUP,
    "AIzaSyACJ3rdIqTTxzeQAm25_95nZEXNHo9PqtoI"
].filter(Boolean); // Remove undefined keys

let currentKeyIndex = 0;
const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);

const uploadToCloudinary = async (file) => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return URL.createObjectURL(file);
};

const simplifyAnalysis = async (medicalAnalysis) => {
    const prompt = `You are a medical translator who specializes in explaining complex medical terms in simple, easy-to-understand language. 
    Please convert this medical analysis into simple terms that someone without a medical background can understand.
    Keep the same structure but use everyday language. Here's the analysis:

    ${medicalAnalysis}

    Please provide the simplified version while maintaining the key information.`;
    
    try {
        const currentGenAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
        const model = currentGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error simplifying analysis:", error);
        
        // If quota error, try next key
        if (error.message?.includes('quota') || error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('429')) {
            const previousKeyIndex = currentKeyIndex;
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            
            if (currentKeyIndex !== previousKeyIndex && API_KEYS.length > 1) {
                // Retry with next key
                console.log(`Simplify: Retrying with API key ${currentKeyIndex + 1}/${API_KEYS.length}...`);
                try {
                    const newGenAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
                    const model = newGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                } catch (retryError) {
                    console.error("Simplify retry failed:", retryError);
                    throw new Error("Failed to simplify the analysis. API quota exceeded. Please try again in 1-2 minutes.");
                }
            }
        }
        
        throw new Error(`Failed to simplify the analysis: ${error.message || 'Unknown error'}`);
    }
};

const analyzeImage = async (imageUrl, problemDescription = '') => {
    // Declare variables outside try block for retry access
    let base64Image;
    let prompt;
    
    try {
        // Convert image to base64
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
        });

        // Check for emergency keywords in user input
        const emergencyKeywords = ['severe', 'emergency', 'urgent', 'critical', 'acute', 'serious', 'life-threatening', 'extreme pain', 'unbearable', 'blood'];
        const hasEmergencyKeywords = emergencyKeywords.some(keyword =>
            problemDescription.toLowerCase().includes(keyword.toLowerCase())
        );

        // Create the prompt with context
        prompt = `You are an experienced general medical practitioner. Analyze this medical image and provide a detailed assessment. 
        Focus on identifying any visible conditions, abnormalities, or concerns. 
        Structure your response in the following format:
        1. Medical Condition Detected (if any)
        2. Confidence Score (as a percentage)
        3. Type of Condition (if detected)
        4. Affected Region
        5. Recommendation
        6. Additional Observations
        7. IMPORTANT: At the end of your analysis, include exactly one of these emergency levels: 'Emergency Level: 1' (beginner level - minor issues, routine care), 'Emergency Level: 2' (intermediate level - moderate concerns, prompt attention needed), 'Emergency Level: 3' (high level - serious conditions, immediate attention required), or 'Emergency Level: 0' (no emergency - normal findings).


        ${hasEmergencyKeywords ? 'IMPORTANT: The patient has described their condition using emergency-related keywords. Please carefully consider this in your emergency level assessment and err on the side of caution.' : ''}

        Keep the response clear and concise, using medical terminology appropriately but explaining in user-friendly language.`;

        // Add patient description to context if provided
        if (problemDescription) {
            prompt += `\n\nPatient's Description: ${problemDescription}\n\nPlease consider this additional context in your analysis.`;
        }

        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate content
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image
                }
            }
        ]);

        const aiResponse = await result.response;
        const text = aiResponse.text();

        // Extract emergency level
        const emergencyLevelMatch = text.match(/Emergency Level:\s*(\d)/i);
        let emergencyLevel = emergencyLevelMatch ? parseInt(emergencyLevelMatch[1]) : 0;

        // Override emergency level if emergency keywords are present
        if (hasEmergencyKeywords && emergencyLevel === 0) {
            emergencyLevel = 3; // High level for emergency keywords
        }

        // Format the response
        const formattedResponse = text.split('\n')
            .map(line => {
                if (line.match(/^(Emergency Level|Medical Condition|Confidence Score|Type|Affected Region|Recommendation|Additional Observations)/i)) {
                    return `**${line}**`;
                }
                return line;
            })
            .join('\n');

        return { formattedResponse, emergencyLevel };
    } catch (error) {
        console.error("Error analyzing image:", error);
        
        // Check if it's a quota error
        if (error.message?.includes('quota') || error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('429')) {
            // Try next API key
            const previousKeyIndex = currentKeyIndex;
            currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
            
            if (currentKeyIndex === previousKeyIndex || API_KEYS.length === 1) {
                // We've tried all keys or only have one key
                throw new Error("API quota exceeded for all available keys. Please wait 1-2 minutes and try again.");
            }
            
            // Retry with next key
            console.log(`Retrying with API key ${currentKeyIndex + 1}/${API_KEYS.length}...`);
            
            try {
                const newGenAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
                const model = newGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                
                // Retry the request
                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]);
                
                const aiResponse = await result.response;
                const text = aiResponse.text();
                
                // Extract emergency level
                const emergencyLevelMatch = text.match(/Emergency Level:\s*(\d)/i);
                let emergencyLevel = emergencyLevelMatch ? parseInt(emergencyLevelMatch[1]) : 0;
                
                // Check for emergency keywords again
                const emergencyKeywords = ['severe', 'emergency', 'urgent', 'critical', 'acute', 'serious', 'life-threatening', 'extreme pain', 'unbearable', 'blood'];
                const hasEmergencyKeywords = emergencyKeywords.some(keyword =>
                    problemDescription.toLowerCase().includes(keyword.toLowerCase())
                );
                
                if (hasEmergencyKeywords && emergencyLevel === 0) {
                    emergencyLevel = 3;
                }
                
                const formattedResponse = text.split('\n')
                    .map(line => {
                        if (line.match(/^(Emergency Level|Medical Condition|Confidence Score|Type|Affected Region|Recommendation|Additional Observations)/i)) {
                            return `**${line}**`;
                        }
                        return line;
                    })
                    .join('\n');
                
                return { formattedResponse, emergencyLevel };
            } catch (retryError) {
                console.error("Retry also failed:", retryError);
                if (retryError.message?.includes('quota') || retryError.message?.includes('RATE_LIMIT_EXCEEDED')) {
                    throw new Error("API quota exceeded for all available keys. Please wait 1-2 minutes and try again.");
                }
                throw retryError;
            }
        }
        
        throw new Error(`Failed to analyze image: ${error.message || 'Unknown error'}`);
    }
};

const formatAnalysisResults = (text) => {
    // Split the text into lines and process each line
    const lines = text.split('\n').filter(line => line.trim() !== '');

    // Convert the text into markdown format
    const markdownText = lines.map(line => {
        // Remove existing asterisks
        const cleanLine = line.replace(/\*\*/g, '');

        // Add markdown formatting for headers
        if (cleanLine.match(/^(Medical Condition|Confidence Score|Type|Affected Region|Recommendation|Additional Observations)/i)) {
            return `## ${cleanLine}`;
        }
        return cleanLine;
    }).join('\n\n');

    return markdownText;
};

export default function GeneralAnalysis() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSimplifying, setIsSimplifying] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [problemDescription, setProblemDescription] = useState('');
    const [isSimplified, setIsSimplified] = useState(false);
    const [logoImageData, setLogoImageData] = useState(null);
    const [emergencyLevel, setEmergencyLevel] = useState(null);
    const [countdown, setCountdown] = useState(5);
    const [showRedirect, setShowRedirect] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Live camera states
    const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();

    // Cleanup camera stream on component unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const startLiveCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Use back camera on mobile if available
                }
            });
            setStream(mediaStream);
            setIsLiveCameraActive(true);

            // Set video stream
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Unable to access camera. Please check your camera permissions.");
        }
    };

    const stopLiveCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsLiveCameraActive(false);
        setCapturedImage(null);
    };

    const captureSnapshot = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob and create file
            canvas.toBlob((blob) => {
                const file = new File([blob], `snapshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
                setSelectedImage(file);

                // Create preview URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                    setCapturedImage(reader.result);
                };
                reader.readAsDataURL(file);

                // Stop camera after capture
                stopLiveCamera();
            }, 'image/jpeg', 0.9);
        }
    };

    const handleUploadAndAnalyze = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        setAnalysis(null);
        setEmergencyLevel(null);
        setShowRedirect(false);
        setCountdown(5);
        setIsRedirecting(false);

        try {
            const cloudinaryUrl = await uploadToCloudinary(selectedImage);
            const { formattedResponse, emergencyLevel } = await analyzeImage(cloudinaryUrl, problemDescription);
            setAnalysis(formattedResponse);
            setEmergencyLevel(emergencyLevel);
            setShowRedirect(true);
        } catch (error) {
            console.error("Error processing image:", error);
            const errorMessage = error.message || 'Error processing image. Please try again.';
            setAnalysis(`❌ **Analysis Error**\n\n${errorMessage}\n\n**Troubleshooting:**\n- Ensure you have a stable internet connection\n- Try uploading a different image\n- Wait a few minutes if quota exceeded\n- Contact support if the issue persists`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedImage(file);

            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleSimplify = async () => {
        if (!analysis) return;

        setIsSimplifying(true);
        try {
            const simplifiedAnalysis = await simplifyAnalysis(analysis);
            setAnalysis(simplifiedAnalysis);
            setIsSimplified(true);
        } catch (error) {
            console.error("Error simplifying analysis:", error);
            alert("Failed to simplify the analysis. Please try again.");
        } finally {
            setIsSimplifying(false);
        }
    };

    const resetAnalysis = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setAnalysis(null);
        setProblemDescription('');
        setIsSimplified(false);
        setCapturedImage(null);
        stopLiveCamera();
    };

    const generatePDF = () => {
        if (!analysis) {
            alert('No analysis data available');
            return;
        }

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPosition = 30; // Starting y position

            // Add header with logo
            if (logoImageData) {
                doc.addImage(logoImageData, 'PNG', margin, 10, 30, 30);
                yPosition = 50; // Adjust y position after logo
            }

            // Add title
            doc.setFontSize(20);
            doc.setTextColor(41, 128, 185);
            doc.text('Medical Image Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;

            // Add patient info
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            doc.text(`Patient Name: ${user?.name || 'Not logged in'}`, margin, yPosition);
            yPosition += 10;
            doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 10;
            doc.text(`Time: ${new Date().toLocaleTimeString()}`, margin, yPosition);
            yPosition += 20;

            // Add analysis results
            doc.setFontSize(14);
            doc.setTextColor(41, 128, 185);
            doc.text('Analysis Results:', margin, yPosition);
            yPosition += 10;

            // Add analysis text with proper formatting
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            const splitText = doc.splitTextToSize(analysis, contentWidth);

            // Add text with page breaks
            for (let i = 0; i < splitText.length; i++) {
                if (yPosition > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(splitText[i], margin, yPosition);
                yPosition += 7;
            }

            // Add footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    'Generated by Cureon - Your Health, Our Priority',
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            // Save the PDF
            doc.save(`medical_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF report');
        }
    };

    const handleRedirect = () => {
        setIsRedirecting(true);
        setCountdown(5);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Handle routing based on emergency level
                    if (emergencyLevel === 1) {
                        navigate('/chat'); // Beginner level - chat support
                    } else if (emergencyLevel === 2) {
                        navigate('/telemedicine'); // Intermediate level - telemedicine
                    } else if (emergencyLevel === 3) {
                        window.location.href = 'https://tinyurl.com/4jdnrr5b'; // High level - emergency
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    };

    const handleStayOnPage = () => {
        setShowRedirect(false);
        setCountdown(5);
        setIsRedirecting(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4 pb-24">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-12">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">MedicalVision AI Assistant</h1>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-8 p-4 sm:p-8">
                    {/* Live Camera Section */}
                    {isLiveCameraActive && (
                        <div className="mb-4 sm:mb-8">
                            <div className="relative bg-black rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-auto max-h-64 sm:max-h-96 object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Camera Controls */}
                                <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 sm:gap-4">
                                    <button
                                        onClick={captureSnapshot}
                                        className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
                                    </button>
                                    <button
                                        onClick={stopLiveCamera}
                                        className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                                    >
                                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">
                                Position your camera to capture the area you want to analyze, then click the camera button to take a snapshot.
                            </p>
                        </div>
                    )}

                    <div
                        className={`border-2 border-dashed rounded-lg p-8 sm:p-16 text-center transition-colors ${dragActive
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {!imagePreview ? (
                            <div>
                                <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-xl font-semibold text-gray-700 mb-1 sm:mb-2">Upload an image for analysis</h3>
                                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Click to browse, drag and drop, or use live camera</p>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Browse Files
                                    </button>
                                    <button
                                        onClick={startLiveCamera}
                                        className="px-4 py-2 sm:px-6 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <Camera className="w-4 h-4" />
                                        Go Live
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-h-48 sm:max-h-64 mx-auto mb-4 sm:mb-6 rounded-lg shadow-sm"
                                />

                                {/* Problem Description Field */}
                                <div className="mb-4 sm:mb-6">
                                    <label htmlFor="problemDescription" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Describe your problem (optional)
                                    </label>
                                    <textarea
                                        id="problemDescription"
                                        value={problemDescription}
                                        onChange={(e) => setProblemDescription(e.target.value)}
                                        placeholder="Enter any symptoms or concerns you'd like to share..."
                                        className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
                                        rows="3"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                                    <button
                                        onClick={handleUploadAndAnalyze}
                                        disabled={isAnalyzing}
                                        className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                                    >
                                        {isAnalyzing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Analyzing...
                                            </span>
                                        ) : (
                                            'Analyze Image'
                                        )}
                                    </button>
                                    <button
                                        onClick={resetAnalysis}
                                        className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Results Section */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
                    <AnalysisResults
                        analysis={analysis}
                        isAnalyzing={isAnalyzing}
                        isSimplifying={isSimplifying}
                        isSimplified={isSimplified}
                        onSimplify={handleSimplify}
                        onShowMedicalTerms={() => {
                            setAnalysis(analysis);
                            setIsSimplified(false);
                        }}
                        onDownloadReport={generatePDF}
                    />
                </div>

                {/* Disclaimer */}
                <div className="text-center mt-4 sm:mt-8 text-gray-600 px-4">
                    <p className="mb-1 text-xs sm:text-sm">This is a demonstration of AI-powered medical image analysis.</p>
                    <p className="text-xs sm:text-sm">For actual medical advice, please consult with healthcare professionals.</p>
                </div>

                {showRedirect && emergencyLevel && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full">
                            <div className="text-center">
                                <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">Emergency Level Detected</h2>
                                <div className={`text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 ${emergencyLevel === 1 ? 'text-green-600' :
                                        emergencyLevel === 2 ? 'text-yellow-600' :
                                            'text-red-600'
                                    }`}>
                                    Level {emergencyLevel}
                                </div>
                                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                                    {emergencyLevel === 1 ? 'Beginner Level - Minor issues, routine care recommended' :
                                        emergencyLevel === 2 ? 'Intermediate Level - Moderate concerns, prompt attention needed' :
                                            'High Level - Serious conditions, immediate attention required'}
                                </p>

                                {!isRedirecting ? (
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-4 sm:mt-6">
                                        <button
                                            onClick={handleRedirect}
                                            className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-semibold text-white text-sm sm:text-base ${emergencyLevel === 1 ? 'bg-green-600 hover:bg-green-700' :
                                                    emergencyLevel === 2 ? 'bg-yellow-600 hover:bg-yellow-700' :
                                                        'bg-red-600 hover:bg-red-700'
                                                }`}
                                        >
                                            Proceed to {emergencyLevel === 1 ? 'Chat' :
                                                emergencyLevel === 2 ? 'Telemedicine' :
                                                    'Emergency'}
                                        </button>
                                        <button
                                            onClick={handleStayOnPage}
                                            className="px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm sm:text-base"
                                        >
                                            Stay on Page
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm sm:text-base text-gray-500">
                                            Redirecting in {countdown} seconds...
                                        </p>
                                        <div className="mt-3 sm:mt-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="h-2.5 rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${(countdown / 5) * 100}%`,
                                                        backgroundColor: emergencyLevel === 1 ? '#16a34a' :
                                                            emergencyLevel === 2 ? '#d97706' :
                                                                '#dc2626'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}