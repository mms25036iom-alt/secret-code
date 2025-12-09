/**
 * Unified AI Service
 * Uses OpenAI (primary) with Gemini as fallback
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI (Primary)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
let openai = null;
if (OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
    console.log('✅ OpenAI initialized');
  } catch (e) { console.error('OpenAI init error:', e); }
}

// Initialize Gemini (Fallback)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let geminiModel = null;
let geminiVisionModel = null;
if (GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-pro for text and gemini-pro-vision for images (stable models)
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    geminiVisionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    console.log('✅ Gemini initialized as fallback');
  } catch (e) { console.error('Gemini init error:', e); }
}

console.log('🤖 AI Service:', { hasOpenAI: !!openai, hasGemini: !!geminiModel });

/**
 * Generate text - tries OpenAI first, then Gemini
 */
export const generateText = async (prompt, options = {}) => {
  const { maxTokens = 2000, temperature = 0.7 } = options;

  // Try OpenAI first
  if (openai) {
    try {
      console.log('🤖 Using OpenAI...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });
      console.log('✅ OpenAI response');
      return response.choices[0].message.content;
    } catch (e) {
      console.error('OpenAI error:', e.message);
    }
  }

  // Fallback to Gemini
  if (geminiModel) {
    try {
      console.log('🤖 Using Gemini...');
      const result = await geminiModel.generateContent(prompt);
      console.log('✅ Gemini response');
      return result.response.text();
    } catch (e) {
      console.error('Gemini error:', e.message);
    }
  }

  throw new Error('AI service unavailable');
};

/**
 * Analyze image - tries OpenAI Vision first, then Gemini Vision
 */
export const analyzeImage = async (imageBase64, prompt, options = {}) => {
  const { maxTokens = 4000 } = options;
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  let lastError = null;

  // Try OpenAI Vision first
  if (openai) {
    try {
      console.log('🤖 Using OpenAI Vision...');
      console.log('📷 Image base64 length:', cleanBase64.length);
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',  // Use gpt-4o for better vision capabilities
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}`, detail: 'high' } }
          ]
        }],
        max_tokens: maxTokens,
      });
      console.log('✅ OpenAI Vision response received');
      return response.choices[0].message.content;
    } catch (e) {
      console.error('OpenAI Vision error:', e.message, e);
      lastError = e;
      // Continue to fallback
    }
  }

  // Fallback to Gemini Vision
  if (geminiVisionModel) {
    try {
      console.log('🤖 Using Gemini Vision as fallback...');
      console.log('📷 Image base64 length:', cleanBase64.length);
      const imagePart = { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } };
      const result = await geminiVisionModel.generateContent([prompt, imagePart]);
      console.log('✅ Gemini Vision response received');
      return result.response.text();
    } catch (e) {
      console.error('Gemini Vision error:', e.message, e);
      lastError = e;
    }
  }

  // Provide detailed error message
  const errorMsg = lastError?.message || 'No AI service available';
  throw new Error(`Image analysis failed: ${errorMsg}. Please check your API keys and try again.`);
};

/**
 * Medical image analysis
 */
export const analyzeMedicalImage = async (imageBase64, analysisType, additionalContext = '') => {
  const disclaimer = "DISCLAIMER: This is an educational AI assistant for informational purposes only. This is NOT a medical diagnosis. Always consult a qualified healthcare professional for medical advice.";
  
  const prompts = {
    ecg: `You are an educational AI assistant helping users understand ECG images for learning purposes. ${disclaimer}

Analyze this ECG image and provide educational information about:
1) Estimated Heart Rate (if visible)
2) Rhythm characteristics observed
3) Wave Morphology description
4) Any notable patterns or variations
5) General educational recommendations

End your response with 'Emergency Level: X' where X is 0 (educational only), 1 (suggest professional review), 2 (recommend medical consultation), or 3 (urgent - seek immediate care). ${additionalContext}`,

    xray: `You are an educational AI assistant helping users understand X-ray images for learning purposes. ${disclaimer}

Analyze this X-ray image and provide educational information about:
1) Image Quality Assessment
2) Visible anatomical structures
3) Bone structure observations
4) Soft tissue observations
5) Any notable patterns or variations
6) General educational recommendations

End your response with 'Emergency Level: X' where X is 0 (educational only), 1 (suggest professional review), 2 (recommend medical consultation), or 3 (urgent - seek immediate care). ${additionalContext}`,

    skin: `You are an educational AI assistant helping users understand skin conditions for learning purposes. ${disclaimer}

Analyze this skin image and provide educational information about:
1) Visual description of the area
2) Possible conditions to research (not diagnoses)
3) General severity indicators
4) Suggested actions for learning more
5) When to consider professional consultation

End your response with 'Emergency Level: X' where X is 0 (educational only), 1 (suggest professional review), 2 (recommend medical consultation), or 3 (urgent - seek immediate care). ${additionalContext}`,

    retinopathy: `You are an educational AI assistant helping users understand retinal images for learning purposes. ${disclaimer}

Analyze this retinal image and provide educational information about:
1) Image Quality Assessment
2) Visible vessel patterns
3) Observable features
4) Educational notes about diabetic retinopathy signs
5) General recommendations

End your response with 'Emergency Level: X' where X is 0 (educational only), 1 (suggest professional review), 2 (recommend medical consultation), or 3 (urgent - seek immediate care). ${additionalContext}`,

    alzheimer: `You are an educational AI assistant helping users understand brain imaging for learning purposes. ${disclaimer}

Analyze this brain image and provide educational information about:
1) Visible brain structures
2) Hippocampal region observations
3) General atrophy indicators
4) Ventricular observations
5) Educational notes about neurological signs
6) General recommendations

End your response with 'Emergency Level: X' where X is 0 (educational only), 1 (suggest professional review), 2 (recommend medical consultation), or 3 (urgent - seek immediate care). ${additionalContext}`,

    cancer: `You are an educational AI assistant helping users understand medical imaging for learning purposes. ${disclaimer}

Analyze this medical image and provide educational information about:
1) Image Quality Assessment
2) Visible tissue characteristics
3) Notable observations
4) Educational follow-up suggestions
5) General urgency considerations

End your response with 'Emergency Level: X' where X is 0 (educational only), 1 (suggest professional review), 2 (recommend medical consultation), or 3 (urgent - seek immediate care). ${additionalContext}`,

    general: `You are an educational AI assistant helping users understand medical images for learning purposes. ${disclaimer}

Analyze this image and provide educational information about:
1) General observations
2) Educational significance
3) Recommendations for learning more
4) When to consider professional consultation

End your response with 'Emergency Level: X' where X is 0 (educational only), 1 (suggest professional review), 2 (recommend medical consultation), or 3 (urgent - seek immediate care). ${additionalContext}`,
  };
  return analyzeImage(imageBase64, prompts[analysisType] || prompts.general);
};

export const simplifyMedicalAnalysis = async (analysis) => {
  return generateText(`Simplify this medical analysis for a patient:\n${analysis}\n\nUse simple language, explain terms.`);
};

export const generateSymptomAnalysis = async (symptoms, age = null, gender = null) => {
  let context = '';
  if (age) context += `Age: ${age}. `;
  if (gender) context += `Gender: ${gender}. `;
  return generateText(`${context}Symptoms: ${symptoms}\n\nProvide: 1) Possible conditions 2) Actions 3) When to seek help 4) Tips. This is informational only.`);
};

export const isAIAvailable = () => !!(openai || geminiModel);
export const getAIProvider = () => openai ? 'OpenAI' : geminiModel ? 'Gemini' : 'None';

export default { generateText, analyzeImage, analyzeMedicalImage, simplifyMedicalAnalysis, generateSymptomAnalysis, isAIAvailable, getAIProvider };
