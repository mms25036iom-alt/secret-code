/**
 * Unified AI Service
 * Uses OpenAI as primary and Gemini as fallback
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Required for client-side usage
});

// Initialize Gemini as fallback
const GEMINI_API_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_BACKUP,
    "AIzaSyAerBoGRKAl_AMK4uGDG1re1u86sNxa28o",
    "AIzaSyBjhpEfKWZa5jNA6iV-Rs6qmMhCnbtrJA8",
].filter(Boolean);

let currentGeminiKeyIndex = 0;
let genAI = GEMINI_API_KEYS.length > 0 ? new GoogleGenerativeAI(GEMINI_API_KEYS[0]) : null;

// Rotate Gemini key on failure
const rotateGeminiKey = () => {
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    genAI = new GoogleGenerativeAI(GEMINI_API_KEYS[currentGeminiKeyIndex]);
    console.log(`🔄 Rotated to Gemini key index: ${currentGeminiKeyIndex}`);
};

/**
 * Generate text using AI (OpenAI primary, Gemini fallback)
 */
export const generateText = async (prompt, options = {}) => {
    const { maxTokens = 2000, temperature = 0.7 } = options;

    // Try OpenAI first
    if (import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            console.log('🤖 Trying OpenAI...');
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature,
            });
            console.log('✅ OpenAI response received');
            return response.choices[0].message.content;
        } catch (error) {
            console.warn('⚠️ OpenAI failed:', error.message);
        }
    }

    // Fallback to Gemini
    if (genAI) {
        for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
            try {
                console.log(`🔮 Trying Gemini (attempt ${attempt + 1})...`);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                console.log('✅ Gemini response received');
                return response.text();
            } catch (error) {
                console.warn(`⚠️ Gemini attempt ${attempt + 1} failed:`, error.message);
                rotateGeminiKey();
            }
        }
    }

    throw new Error('All AI services failed. Please try again later.');
};

/**
 * Analyze image using AI (OpenAI primary, Gemini fallback)
 */
export const analyzeImage = async (imageBase64, prompt, options = {}) => {
    const { maxTokens = 4000 } = options;

    // Clean base64 if needed
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Try OpenAI first (GPT-4 Vision)
    if (import.meta.env.VITE_OPENAI_API_KEY) {
        try {
            console.log('🤖 Trying OpenAI Vision...');
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${cleanBase64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: maxTokens,
            });
            console.log('✅ OpenAI Vision response received');
            return response.choices[0].message.content;
        } catch (error) {
            console.warn('⚠️ OpenAI Vision failed:', error.message);
        }
    }

    // Fallback to Gemini
    if (genAI) {
        for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
            try {
                console.log(`🔮 Trying Gemini Vision (attempt ${attempt + 1})...`);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                
                const imagePart = {
                    inlineData: {
                        data: cleanBase64,
                        mimeType: 'image/jpeg',
                    },
                };

                const result = await model.generateContent([prompt, imagePart]);
                const response = await result.response;
                console.log('✅ Gemini Vision response received');
                return response.text();
            } catch (error) {
                console.warn(`⚠️ Gemini Vision attempt ${attempt + 1} failed:`, error.message);
                rotateGeminiKey();
            }
        }
    }

    throw new Error('All AI vision services failed. Please try again later.');
};

/**
 * Medical image analysis with structured prompt
 */
export const analyzeMedicalImage = async (imageBase64, analysisType, additionalContext = '') => {
    const prompts = {
        ecg: `You are an expert cardiologist analyzing an ECG/EKG image. Analyze this ECG and provide:
1. Heart Rate Assessment
2. Rhythm Analysis
3. Wave Morphology (P waves, QRS complex, T waves)
4. Any abnormalities detected
5. Clinical recommendations

${additionalContext}

Provide a detailed but understandable analysis.`,

        xray: `You are an expert radiologist analyzing a chest X-ray. Analyze this X-ray and provide:
1. Image Quality Assessment
2. Heart Size and Shape
3. Lung Fields Analysis
4. Bone Structure
5. Any abnormalities detected
6. Clinical recommendations

${additionalContext}

Provide a detailed but understandable analysis.`,

        skin: `You are an expert dermatologist analyzing a skin condition image. Analyze this image and provide:
1. Visual Description
2. Possible Conditions (differential diagnosis)
3. Severity Assessment
4. Recommended Actions
5. When to seek immediate medical attention

${additionalContext}

IMPORTANT: This is for educational purposes only. Always recommend consulting a healthcare professional.`,

        retinopathy: `You are an expert ophthalmologist analyzing a retinal image for diabetic retinopathy. Analyze this image and provide:
1. Image Quality Assessment
2. Retinal Vessel Analysis
3. Signs of Diabetic Retinopathy (microaneurysms, hemorrhages, exudates)
4. Severity Classification (None, Mild, Moderate, Severe, Proliferative)
5. Recommendations

${additionalContext}

Provide a detailed analysis.`,

        alzheimer: `You are an expert neurologist analyzing a brain scan for signs of Alzheimer's disease. Analyze this image and provide:
1. Brain Structure Assessment
2. Hippocampal Volume Analysis
3. Cortical Atrophy Assessment
4. Ventricular Size
5. Signs consistent with Alzheimer's Disease
6. Recommendations

${additionalContext}

Provide a detailed analysis.`,

        cancer: `You are an expert oncologist analyzing a medical image for potential cancer indicators. Analyze this image and provide:
1. Image Quality Assessment
2. Tissue Analysis
3. Any suspicious findings
4. Recommended follow-up tests
5. Urgency level

${additionalContext}

IMPORTANT: This is for screening purposes only. Always recommend professional medical evaluation.`,

        general: `You are a medical AI assistant. Analyze this medical image and provide:
1. What you observe in the image
2. Possible medical significance
3. Recommendations
4. When to seek medical attention

${additionalContext}

Provide a helpful but cautious analysis. Always recommend consulting healthcare professionals.`,
    };

    const prompt = prompts[analysisType] || prompts.general;
    return analyzeImage(imageBase64, prompt);
};

/**
 * Simplify medical analysis for patients
 */
export const simplifyMedicalAnalysis = async (medicalAnalysis) => {
    const prompt = `You are a medical translator who specializes in explaining complex medical terms in simple, easy-to-understand language.

Take the following medical analysis and rewrite it in simple terms that a patient without medical background can understand. 
- Use everyday language
- Explain any medical terms
- Keep the important information
- Add reassuring context where appropriate
- Format with clear sections

Medical Analysis:
${medicalAnalysis}

Please provide a simplified version:`;

    return generateText(prompt);
};

/**
 * Generate symptom analysis
 */
export const generateSymptomAnalysis = async (symptoms, patientAge = null, patientGender = null) => {
    let contextInfo = '';
    if (patientAge) contextInfo += `Patient Age: ${patientAge}\n`;
    if (patientGender) contextInfo += `Patient Gender: ${patientGender}\n`;

    const prompt = `You are a helpful medical assistant. Based on the following symptoms, provide:
1. Possible conditions (list 3-5 most likely)
2. Recommended actions
3. When to seek immediate medical attention
4. General health tips

${contextInfo}
Symptoms: ${symptoms}

IMPORTANT: This is for informational purposes only and not a medical diagnosis. Always recommend consulting a healthcare professional.`;

    return generateText(prompt);
};

export default {
    generateText,
    analyzeImage,
    analyzeMedicalImage,
    simplifyMedicalAnalysis,
    generateSymptomAnalysis,
};
