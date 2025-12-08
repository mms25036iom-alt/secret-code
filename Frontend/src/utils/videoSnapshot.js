import axios from 'axios';

// Cloudinary configuration (use env variables with fallbacks)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drxliiejo';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sachin';

console.log('Cloudinary Config:', { 
  cloudName: CLOUDINARY_CLOUD_NAME, 
  uploadPreset: CLOUDINARY_UPLOAD_PRESET 
});

/**
 * Captures a snapshot from a video file and returns it as a data URL
 * @param {File} videoFile - The video file to capture snapshot from
 * @param {number} timeOffset - Time in seconds to capture snapshot (default: 2)
 * @returns {Promise<string>} - The data URL of the captured image
 */
export const captureVideoSnapshot = async (videoFile, timeOffset = 2) => {
  return new Promise((resolve, reject) => {
    try {
      // Create video element
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      // Create canvas for capturing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to the specified time
        video.currentTime = Math.min(timeOffset, video.duration - 0.1);
      };
      
      video.onseeked = async () => {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = (error) => {
        reject(new Error('Error loading video: ' + error.message));
      };
      
      // Load the video
      video.src = URL.createObjectURL(videoFile);
      video.load();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Uploads an image blob to Cloudinary
 * @param {Blob} imageBlob - The image blob to upload
 * @returns {Promise<string>} - The Cloudinary URL of the uploaded image
 */
const uploadImageToCloudinary = async (imageBlob) => {
  try {
    console.log('Uploading image to Cloudinary, size:', imageBlob.size);
    
    const formData = new FormData();
    formData.append('file', imageBlob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `${CLOUDINARY_UPLOAD_PRESET}/video-snapshots`);
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      }
    );
    
    if (!response.data || !response.data.secure_url) {
      throw new Error('Invalid response from Cloudinary - no URL returned');
    }
    
    console.log('Image uploaded successfully to:', response.data.secure_url);
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout: Cloudinary upload took too long. Please try again.');
    } else if (error.response?.status === 401) {
      throw new Error('Cloudinary authentication failed. Please check upload preset configuration.');
    } else if (error.response?.status === 400) {
      const cloudinaryError = error.response?.data?.error?.message || 'Invalid upload request';
      throw new Error(`Cloudinary error: ${cloudinaryError}`);
    } else if (error.message?.includes('Network Error')) {
      throw new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection.');
    }
    
    const cloudinaryError = error?.response?.data?.error?.message || error?.message;
    throw new Error(`Failed to upload image: ${cloudinaryError}`);
  }
};

// API key rotation for handling quota limits
const API_KEYS = [
  "AIzaSyBjhpEfKWZa5jNA6iV-Rs6qmMhCnbtrJA8",
  "AIzaSyAerBoGRKAl_AMK4uGDG1re1u86sNxa28o",
  "AIzaSyCZ6peDBhq_ZPkNeBSFTVt-CWldGATimbg"
].filter(Boolean);

let currentKeyIndex = 0;

/**
 * Analyzes an image using Gemini 1.5 Flash AI
 * @param {string} imageUrl - The Cloudinary URL of the image (or data URL)
 * @param {string} analysisType - The type of analysis (xray, skin, retinopathy, etc.)
 * @param {string} base64Image - Optional base64 image data to avoid fetching from URL
 * @returns {Promise<string>} - The analysis result
 */
export const analyzeImageWithGemini = async (imageUrl, analysisType, base64Image = null) => {
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
  
  const makeRequest = async (apiKey) => {
    try {
    
    // Define analysis prompts based on type
    const prompts = {
      xray: "You are an expert radiologist specializing in X-ray analysis. Analyze this X-ray image for signs of abnormalities, fractures, infections, or other conditions. Focus on bone structure, joint alignment, and any unusual patterns. Assess the severity and progression of any detected conditions. Provide detailed findings and recommendations. IMPORTANT: At the end of your analysis, include exactly one of these emergency levels: 'Emergency Level: 1' (beginner level - minor issues, routine care), 'Emergency Level: 2' (intermediate level - moderate concerns, prompt attention needed), 'Emergency Level: 3' (high level - serious conditions, immediate attention required), or 'Emergency Level: 0' (no emergency - normal findings).",
      skin: "You are an expert dermatologist specializing in skin condition analysis. Analyze this skin image for any dermatological conditions, lesions, moles, rashes, or abnormalities. Look for signs of skin cancer, infections, or other skin disorders. Assess the characteristics, size, color, and texture of any findings. Provide detailed analysis and recommendations. IMPORTANT: At the end of your analysis, include exactly one of these emergency levels: 'Emergency Level: 1' (beginner level - minor issues, routine care), 'Emergency Level: 2' (intermediate level - moderate concerns, prompt attention needed), 'Emergency Level: 3' (high level - serious conditions, immediate attention required), or 'Emergency Level: 0' (no emergency - normal findings).",
      retinopathy: "You are an expert ophthalmologist specializing in retinal analysis. Analyze this retinal image for signs of diabetic retinopathy, macular degeneration, or other eye conditions. Look for microaneurysms, hemorrhages, exudates, or other abnormalities. Assess the severity and provide detailed findings and recommendations. IMPORTANT: At the end of your analysis, include exactly one of these emergency levels: 'Emergency Level: 1' (beginner level - minor issues, routine care), 'Emergency Level: 2' (intermediate level - moderate concerns, prompt attention needed), 'Emergency Level: 3' (high level - serious conditions, immediate attention required), or 'Emergency Level: 0' (no emergency - normal findings).",
      ecg: "You are an expert cardiologist specializing in ECG analysis. Analyze this ECG/EKG image for any cardiac abnormalities, arrhythmias, or other heart conditions. Look for irregular rhythms, ST segment changes, or other concerning patterns. Provide detailed analysis and recommendations. IMPORTANT: At the end of your analysis, include exactly one of these emergency levels: 'Emergency Level: 1' (beginner level - minor issues, routine care), 'Emergency Level: 2' (intermediate level - moderate concerns, prompt attention needed), 'Emergency Level: 3' (high level - serious conditions, immediate attention required), or 'Emergency Level: 0' (no emergency - normal findings).",
      cancer: "You are an expert oncologist specializing in cancer detection. Analyze this medical image for any signs of cancer, tumors, or malignant growths. Look for suspicious masses, irregular shapes, or other concerning features. Assess the characteristics and provide detailed analysis and recommendations. IMPORTANT: At the end of your analysis, include exactly one of these emergency levels: 'Emergency Level: 1' (beginner level - minor issues, routine care), 'Emergency Level: 2' (intermediate level - moderate concerns, prompt attention needed), 'Emergency Level: 3' (high level - serious conditions, immediate attention required), or 'Emergency Level: 0' (no emergency - normal findings).",
      alzheimer: "You are an expert neurologist specializing in brain scan analysis. Analyze this brain scan or medical image for signs of Alzheimer's disease, dementia, or other neurological conditions. Look for brain atrophy, abnormal patterns, or other concerning features. Provide detailed analysis and recommendations. IMPORTANT: At the end of your analysis, include exactly one of these emergency levels: 'Emergency Level: 1' (beginner level - minor issues, routine care), 'Emergency Level: 2' (intermediate level - moderate concerns, prompt attention needed), 'Emergency Level: 3' (high level - serious conditions, immediate attention required), or 'Emergency Level: 0' (no emergency - normal findings)."
    };
    
    const prompt = prompts[analysisType] || prompts.xray;
    
    // Use provided base64 or fetch from URL
    let base64Data;
    if (base64Image) {
      console.log('Using provided base64 image data (avoiding CORS)');
      base64Data = base64Image;
    } else {
      console.log('Fetching image from URL:', imageUrl);
      base64Data = await fetchImageAsBase64(imageUrl);
    }
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };
    
      console.log('Sending request to Gemini API...');
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout for AI analysis
        }
      );
      
      console.log('Received response from Gemini API');
      
      if (response.data && response.data.candidates && response.data.candidates[0]) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        console.error('Invalid Gemini API response:', response.data);
        throw new Error('Invalid response from Gemini API - no analysis generated');
      }
    } catch (error) {
      console.error('Gemini API request error:', error.message);
      
      // Check if it's a quota/rate limit error
      if (error.response?.status === 429 || 
          error.response?.data?.error?.message?.includes('quota') ||
          error.response?.data?.error?.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // Check for network errors
      if (error.code === 'ECONNABORTED') {
        throw new Error('AI analysis timeout: Request took too long. Please try again.');
      } else if (error.message?.includes('Network Error')) {
        throw new Error('Network error: Unable to connect to AI service. Please check your internet connection.');
      } else if (error.response?.status === 400) {
        throw new Error(`AI service error: ${error.response?.data?.error?.message || 'Invalid request'}`);
      } else if (error.response?.status === 403) {
        throw new Error('AI service authentication failed: Invalid API key');
      }
      
      throw error;
    }
  };

  // Try with current API key
  try {
    return await makeRequest(API_KEYS[currentKeyIndex]);
  } catch (error) {
    console.error('Error analyzing image with Gemini (attempt 1):', error.message);
    
    // If quota exceeded, try next key
    if (error.message === 'QUOTA_EXCEEDED' && API_KEYS.length > 1) {
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      console.log(`Switching to API key ${currentKeyIndex + 1}/${API_KEYS.length}`);
      
      try {
        return await makeRequest(API_KEYS[currentKeyIndex]);
      } catch (retryError) {
        console.error('Error analyzing image with Gemini (attempt 2):', retryError.message);
        
        // Try one more key if available
        if (retryError.message === 'QUOTA_EXCEEDED' && API_KEYS.length > 2) {
          currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
          console.log(`Switching to API key ${currentKeyIndex + 1}/${API_KEYS.length}`);
          return await makeRequest(API_KEYS[currentKeyIndex]);
        }
        
        throw new Error(`Failed to analyze image: ${retryError.response?.data?.error?.message || retryError.message}`);
      }
    }
    
    throw new Error(`Failed to analyze image: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * Fetches an image from URL and converts it to base64
 * @param {string} imageUrl - The URL of the image
 * @returns {Promise<string>} - The base64 encoded image
 */
const fetchImageAsBase64 = async (imageUrl) => {
  try {
    console.log('Fetching image from URL:', imageUrl);
    
    // Add CORS mode and credentials
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('Image fetched successfully, size:', blob.size);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    if (error.message.includes('CORS')) {
      throw new Error('CORS error: Unable to fetch image from Cloudinary. Please check Cloudinary CORS settings.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection.');
    }
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
};

/**
 * Complete video analysis workflow: capture snapshot, upload to Cloudinary, and analyze with Gemini
 * @param {File} videoFile - The video file to analyze
 * @param {string} analysisType - The type of analysis
 * @param {number} timeOffset - Time in seconds to capture snapshot (default: 2)
 * @returns {Promise<{imageUrl: string, analysis: string}>} - The image URL and analysis result
 */
export const analyzeVideoWithSnapshot = async (videoFile, analysisType, timeOffset = 2) => {
  let imageUrl = null;
  let base64Image = null;
  
  try {
    // Step 1: Capture snapshot from video
    console.log('Step 1: Capturing video snapshot...');
    const dataUrl = await captureVideoSnapshot(videoFile, timeOffset);
    console.log('✓ Snapshot captured successfully');
    
    // Extract base64 from data URL for direct use
    base64Image = dataUrl.split(',')[1];
    
    // Step 2: Convert data URL to blob and upload to Cloudinary
    console.log('Step 2: Uploading to Cloudinary...');
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    try {
      imageUrl = await uploadImageToCloudinary(blob);
      console.log('✓ Uploaded to Cloudinary successfully:', imageUrl);
    } catch (uploadError) {
      console.warn('Cloudinary upload failed, will use direct base64 for analysis:', uploadError.message);
      // Continue without Cloudinary URL - we'll use base64 directly
      imageUrl = dataUrl; // Use data URL as fallback
    }
    
    // Step 3: Analyze image with Gemini AI (using base64 directly to avoid CORS)
    console.log('Step 3: Analyzing image with Gemini AI...');
    const analysis = await analyzeImageWithGemini(imageUrl, analysisType, base64Image);
    console.log('✓ Analysis completed successfully');
    
    return {
      imageUrl: imageUrl.startsWith('data:') ? null : imageUrl, // Return null if using data URL
      analysis
    };
  } catch (error) {
    console.error('❌ Error in video analysis workflow:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Cloudinary')) {
      throw new Error('Failed to upload image to cloud storage. Please check your internet connection and try again.');
    } else if (error.message?.includes('video') || error.message?.includes('snapshot')) {
      throw new Error('Failed to process video file. Please ensure the video is valid and try again.');
    } else if (error.message?.includes('quota') || error.message?.includes('RATE_LIMIT')) {
      throw new Error('AI service quota exceeded. Please try again in a few minutes.');
    } else if (error.message?.includes('Network')) {
      throw new Error(`Network error: ${error.message}. Please check your internet connection.`);
    } else if (error.message?.includes('CORS')) {
      throw new Error(`CORS error: ${error.message}. This is a configuration issue.`);
    } else if (error.message?.includes('analyze') || error.message?.includes('AI')) {
      throw new Error(`AI analysis failed: ${error.message}`);
    } else {
      throw new Error(`Analysis failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
};
