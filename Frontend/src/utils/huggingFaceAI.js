/**
 * Hugging Face AI Integration
 * Free medical AI models for additional analysis
 */

// Hugging Face Inference API endpoint
const HF_API_URL = 'https://api-inference.huggingface.co/models';

// Free medical AI models on Hugging Face
export const HF_MODELS = {
  // Skin lesion classification
  skinLesion: 'marmal88/skin_cancer',
  
  // Chest X-ray analysis
  chestXray: 'alkzar90/NIH-Chest-X-ray-dataset',
  
  // Medical image classification
  medicalImage: 'microsoft/resnet-50',
  
  // General image classification (can detect medical equipment, body parts)
  generalVision: 'google/vit-base-patch16-224',
};

/**
 * Query Hugging Face model (free tier - may have rate limits)
 */
export const queryHuggingFace = async (modelId, imageBase64) => {
  try {
    // Clean base64 if needed
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to blob
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const response = await fetch(`${HF_API_URL}/${modelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: blob,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw error;
  }
};

/**
 * Analyze skin lesion using Hugging Face model
 */
export const analyzeSkinLesionHF = async (imageBase64) => {
  try {
    const result = await queryHuggingFace(HF_MODELS.skinLesion, imageBase64);
    
    // Parse results
    if (Array.isArray(result)) {
      return {
        success: true,
        predictions: result.map(p => ({
          label: p.label,
          confidence: (p.score * 100).toFixed(1),
        })),
        topPrediction: result[0]?.label || 'Unknown',
        confidence: ((result[0]?.score || 0) * 100).toFixed(1),
      };
    }
    
    return { success: false, error: 'Unexpected response format' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * General image classification
 */
export const classifyImageHF = async (imageBase64) => {
  try {
    const result = await queryHuggingFace(HF_MODELS.generalVision, imageBase64);
    
    if (Array.isArray(result)) {
      return {
        success: true,
        predictions: result.slice(0, 5).map(p => ({
          label: p.label,
          confidence: (p.score * 100).toFixed(1),
        })),
      };
    }
    
    return { success: false, error: 'Unexpected response format' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check if Hugging Face API is available
 */
export const checkHFAvailability = async () => {
  try {
    const response = await fetch(`${HF_API_URL}/${HF_MODELS.generalVision}`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  HF_MODELS,
  queryHuggingFace,
  analyzeSkinLesionHF,
  classifyImageHF,
  checkHFAvailability,
};
