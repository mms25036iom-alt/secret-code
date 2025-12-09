/**
 * Enhanced Medical AI Service
 * Provides CNN/LSTM-like analysis using GPT-4 Vision and Gemini
 * Supports: ECG, X-ray, Retinopathy, PET scans, Skin diseases, Alzheimer's
 */

import { analyzeImage, generateText, isAIAvailable } from './aiService';

// Medical analysis types with detailed configurations
export const ANALYSIS_TYPES = {
  ecg: {
    name: 'ECG Analysis',
    icon: '💓',
    description: 'Analyze electrocardiogram for heart rhythm abnormalities',
    color: '#ef4444',
  },
  xray: {
    name: 'X-Ray Analysis',
    icon: '🦴',
    description: 'Analyze chest, bone, and other X-ray images',
    color: '#3b82f6',
  },
  retinopathy: {
    name: 'Retinopathy Screening',
    icon: '👁️',
    description: 'Screen for diabetic retinopathy and eye conditions',
    color: '#8b5cf6',
  },
  pet: {
    name: 'PET Scan Analysis',
    icon: '🧠',
    description: 'Analyze PET scans for metabolic activity',
    color: '#f59e0b',
  },
  skin: {
    name: 'Skin Disease Detection',
    icon: '🔬',
    description: 'Analyze skin lesions and conditions',
    color: '#10b981',
  },
  alzheimer: {
    name: 'Alzheimer\'s Assessment',
    icon: '🧠',
    description: 'Analyze brain MRI for neurodegeneration signs',
    color: '#6366f1',
  },
  mri: {
    name: 'MRI Analysis',
    icon: '🏥',
    description: 'General MRI image analysis',
    color: '#0ea5e9',
  },
  ct: {
    name: 'CT Scan Analysis',
    icon: '📊',
    description: 'Analyze CT scan images',
    color: '#14b8a6',
  },
};

// Structured prompts for each analysis type (simulating CNN/LSTM output)
const getAnalysisPrompt = (type, patientInfo = {}) => {
  const { age, gender, symptoms, medicalHistory } = patientInfo;
  
  let context = '';
  if (age) context += `Patient Age: ${age} years. `;
  if (gender) context += `Gender: ${gender}. `;
  if (symptoms) context += `Reported Symptoms: ${symptoms}. `;
  if (medicalHistory) context += `Medical History: ${medicalHistory}. `;

  const baseDisclaimer = `
IMPORTANT: You are an AI medical image analysis assistant. This analysis is for EDUCATIONAL and SCREENING purposes only. 
It is NOT a medical diagnosis. Always recommend consultation with qualified healthcare professionals.
Provide your analysis in a structured JSON-like format for easy parsing.`;

  const prompts = {
    ecg: `${baseDisclaimer}
${context}

Analyze this ECG/EKG image using advanced pattern recognition. Provide a comprehensive report:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100): Rate clarity and diagnostic quality
2. **Heart Rate**: Estimated BPM and rhythm regularity
3. **Rhythm Analysis**:
   - Type (Sinus/Atrial Fibrillation/Flutter/etc.)
   - Regularity assessment
   - P-wave presence and morphology
4. **Interval Measurements** (if visible):
   - PR interval assessment
   - QRS duration assessment
   - QT/QTc assessment
5. **Wave Morphology**:
   - P waves description
   - QRS complex description
   - T waves description
   - ST segment assessment
6. **Detected Abnormalities**: List any concerning patterns
7. **Risk Assessment**: Low/Moderate/High/Critical
8. **Confidence Score**: 0-100%
9. **Recommendations**: Next steps for patient

End with: EMERGENCY_LEVEL: [0-3] where 0=Normal, 1=Monitor, 2=Consult Doctor, 3=Urgent Care Needed`,

    xray: `${baseDisclaimer}
${context}

Analyze this X-ray image using advanced pattern recognition. Provide a comprehensive report:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100): Rate clarity, positioning, exposure
2. **Image Type**: Chest/Bone/Abdominal/Other
3. **Anatomical Assessment**:
   - Bone structures: Alignment, density, fractures
   - Soft tissues: Any abnormalities
   - For chest: Heart size, lung fields, mediastinum
4. **Key Findings**:
   - Primary observations
   - Secondary observations
5. **Detected Abnormalities**: List with locations
6. **Differential Considerations**: Possible conditions to investigate
7. **Risk Assessment**: Low/Moderate/High/Critical
8. **Confidence Score**: 0-100%
9. **Recommendations**: Follow-up imaging or consultations needed

End with: EMERGENCY_LEVEL: [0-3] where 0=Normal, 1=Monitor, 2=Consult Doctor, 3=Urgent Care Needed`,

    retinopathy: `${baseDisclaimer}
${context}

Analyze this retinal/fundus image for diabetic retinopathy screening:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100): Rate clarity and diagnostic quality
2. **Retinopathy Grade**:
   - No DR (0)
   - Mild NPDR (1)
   - Moderate NPDR (2)
   - Severe NPDR (3)
   - Proliferative DR (4)
3. **Key Findings**:
   - Microaneurysms: Present/Absent, count estimate
   - Hemorrhages: Type, location, severity
   - Hard exudates: Present/Absent, location
   - Soft exudates (cotton wool spots): Present/Absent
   - Neovascularization: Present/Absent
   - Macular edema signs: Present/Absent
4. **Optic Disc Assessment**: Normal/Abnormal
5. **Vessel Assessment**: Caliber, tortuosity, AV nicking
6. **Risk of Vision Loss**: Low/Moderate/High
7. **Confidence Score**: 0-100%
8. **Recommendations**: Treatment urgency and follow-up

End with: EMERGENCY_LEVEL: [0-3] where 0=No DR, 1=Mild-Moderate, 2=Severe NPDR, 3=PDR/Urgent`,

    pet: `${baseDisclaimer}
${context}

Analyze this PET scan image for metabolic activity patterns:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100): Rate clarity and diagnostic quality
2. **Scan Type**: FDG-PET/Other tracer
3. **Metabolic Activity Assessment**:
   - Overall uptake pattern
   - Areas of increased uptake (hypermetabolic)
   - Areas of decreased uptake (hypometabolic)
4. **Regional Analysis**:
   - Brain regions (if brain PET)
   - Body regions (if whole body)
5. **SUV Assessment**: Qualitative assessment of uptake intensity
6. **Abnormal Findings**: Location, size, intensity
7. **Differential Considerations**: Possible conditions
8. **Risk Assessment**: Low/Moderate/High/Critical
9. **Confidence Score**: 0-100%
10. **Recommendations**: Additional imaging or follow-up

End with: EMERGENCY_LEVEL: [0-3] where 0=Normal, 1=Monitor, 2=Consult Specialist, 3=Urgent`,

    skin: `${baseDisclaimer}
${context}

Analyze this skin image for dermatological conditions:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100): Rate clarity and diagnostic quality
2. **Lesion Characteristics** (ABCDE criteria):
   - Asymmetry: Symmetric/Asymmetric
   - Border: Regular/Irregular
   - Color: Uniform/Multiple colors
   - Diameter: Estimated size
   - Evolution: (if history provided)
3. **Lesion Type**: Macule/Papule/Nodule/Plaque/Vesicle/etc.
4. **Morphological Features**:
   - Surface texture
   - Pigmentation pattern
   - Distribution
5. **Differential Diagnoses** (ranked by likelihood):
   - Most likely condition
   - Alternative considerations
6. **Malignancy Risk**: Low/Moderate/High
7. **Confidence Score**: 0-100%
8. **Urgency**: Routine/Soon/Urgent
9. **Recommendations**: Biopsy needed? Dermatologist referral?

End with: EMERGENCY_LEVEL: [0-3] where 0=Benign appearing, 1=Monitor, 2=Dermatologist consult, 3=Urgent biopsy needed`,

    alzheimer: `${baseDisclaimer}
${context}

Analyze this brain MRI/CT for signs of neurodegeneration and Alzheimer's disease:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100): Rate clarity and diagnostic quality
2. **Global Brain Assessment**:
   - Overall brain volume
   - Cortical thickness assessment
   - White matter integrity
3. **Hippocampal Analysis**:
   - Volume assessment (Normal/Mild/Moderate/Severe atrophy)
   - Symmetry
4. **Ventricular System**:
   - Lateral ventricle size
   - Third ventricle
   - Signs of hydrocephalus
5. **Regional Atrophy Pattern**:
   - Temporal lobes
   - Parietal lobes
   - Frontal lobes
6. **White Matter Changes**: Presence of leukoaraiosis
7. **Cognitive Impairment Risk**: Low/Moderate/High
8. **Staging Estimate**: Normal/MCI/Mild AD/Moderate AD/Severe AD
9. **Confidence Score**: 0-100%
10. **Recommendations**: Cognitive testing, specialist referral

End with: EMERGENCY_LEVEL: [0-3] where 0=Normal aging, 1=Mild changes, 2=Moderate changes, 3=Significant findings`,

    mri: `${baseDisclaimer}
${context}

Analyze this MRI image:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100)
2. **Scan Type**: T1/T2/FLAIR/DWI/Other
3. **Body Region**: Brain/Spine/Joint/Abdomen/Other
4. **Key Anatomical Structures**: Normal/Abnormal
5. **Signal Abnormalities**: Location, characteristics
6. **Mass Lesions**: Present/Absent, details if present
7. **Differential Diagnoses**: Ranked list
8. **Risk Assessment**: Low/Moderate/High
9. **Confidence Score**: 0-100%
10. **Recommendations**: Follow-up needed

End with: EMERGENCY_LEVEL: [0-3]`,

    ct: `${baseDisclaimer}
${context}

Analyze this CT scan image:

**STRUCTURED ANALYSIS:**
1. **Image Quality Score** (0-100)
2. **Scan Type**: With/Without contrast
3. **Body Region**: Head/Chest/Abdomen/Pelvis/Other
4. **Key Findings**:
   - Bone windows assessment
   - Soft tissue assessment
   - Vascular structures (if visible)
5. **Abnormalities Detected**: Location, size, characteristics
6. **Differential Diagnoses**: Ranked list
7. **Risk Assessment**: Low/Moderate/High/Critical
8. **Confidence Score**: 0-100%
9. **Recommendations**: Additional imaging, intervention needed

End with: EMERGENCY_LEVEL: [0-3]`,
  };

  return prompts[type] || prompts.mri;
};

/**
 * Parse the AI response into structured data
 */
const parseAnalysisResponse = (response, type) => {
  const result = {
    rawAnalysis: response,
    emergencyLevel: 0,
    confidenceScore: 0,
    riskLevel: 'Unknown',
    keyFindings: [],
    recommendations: [],
    timestamp: new Date().toISOString(),
    analysisType: type,
  };

  // Extract emergency level
  const emergencyMatch = response.match(/EMERGENCY_LEVEL:\s*\[?(\d)\]?/i);
  if (emergencyMatch) {
    result.emergencyLevel = parseInt(emergencyMatch[1]);
  }

  // Extract confidence score
  const confidenceMatch = response.match(/Confidence Score[:\s]*(\d+)/i);
  if (confidenceMatch) {
    result.confidenceScore = parseInt(confidenceMatch[1]);
  }

  // Extract risk level
  const riskMatch = response.match(/Risk Assessment[:\s]*(Low|Moderate|High|Critical)/i);
  if (riskMatch) {
    result.riskLevel = riskMatch[1];
  }

  // Map emergency level to status
  const statusMap = {
    0: { status: 'Normal', color: '#10b981', action: 'No immediate action needed' },
    1: { status: 'Monitor', color: '#f59e0b', action: 'Schedule follow-up appointment' },
    2: { status: 'Consult Doctor', color: '#f97316', action: 'Consult healthcare provider soon' },
    3: { status: 'Urgent', color: '#ef4444', action: 'Seek immediate medical attention' },
  };

  result.statusInfo = statusMap[result.emergencyLevel] || statusMap[0];

  return result;
};

/**
 * Main analysis function - simulates CNN/LSTM analysis using vision AI
 */
export const analyzeMedicalImageAdvanced = async (imageBase64, type, patientInfo = {}) => {
  if (!isAIAvailable()) {
    throw new Error('AI service is not available. Please check your API keys.');
  }

  if (!ANALYSIS_TYPES[type]) {
    throw new Error(`Unknown analysis type: ${type}`);
  }

  const prompt = getAnalysisPrompt(type, patientInfo);
  
  try {
    console.log(`🏥 Starting ${type} analysis...`);
    const response = await analyzeImage(imageBase64, prompt, { maxTokens: 4000 });
    const parsedResult = parseAnalysisResponse(response, type);
    console.log(`✅ ${type} analysis complete`);
    return parsedResult;
  } catch (error) {
    console.error(`❌ ${type} analysis failed:`, error);
    throw error;
  }
};

/**
 * Batch analysis - analyze multiple images
 */
export const batchAnalyze = async (images, type, patientInfo = {}) => {
  const results = [];
  for (const image of images) {
    try {
      const result = await analyzeMedicalImageAdvanced(image, type, patientInfo);
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  return results;
};

/**
 * Generate a comprehensive medical report
 */
export const generateMedicalReport = async (analysisResult, patientInfo = {}) => {
  const { name, age, gender, date } = patientInfo;
  
  const prompt = `Generate a professional medical screening report based on this AI analysis:

Patient: ${name || 'Anonymous'}
Age: ${age || 'Not provided'}
Gender: ${gender || 'Not provided'}
Date: ${date || new Date().toLocaleDateString()}
Analysis Type: ${ANALYSIS_TYPES[analysisResult.analysisType]?.name || analysisResult.analysisType}

AI Analysis Results:
${analysisResult.rawAnalysis}

Create a formal, professional medical screening report with:
1. Executive Summary
2. Detailed Findings
3. Risk Assessment
4. Recommendations
5. Follow-up Plan
6. Disclaimer about AI-assisted screening

Format it professionally for printing or PDF export.`;

  return generateText(prompt, { maxTokens: 3000 });
};

/**
 * Get analysis history from localStorage
 */
export const getAnalysisHistory = () => {
  try {
    const history = localStorage.getItem('medicalAnalysisHistory');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

/**
 * Save analysis to history
 */
export const saveToHistory = (analysis, imagePreview = null) => {
  try {
    const history = getAnalysisHistory();
    const entry = {
      id: Date.now(),
      ...analysis,
      imagePreview: imagePreview?.substring(0, 100) + '...', // Store truncated preview
      savedAt: new Date().toISOString(),
    };
    history.unshift(entry);
    // Keep only last 50 analyses
    localStorage.setItem('medicalAnalysisHistory', JSON.stringify(history.slice(0, 50)));
    return entry;
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
};

export default {
  ANALYSIS_TYPES,
  analyzeMedicalImageAdvanced,
  batchAnalyze,
  generateMedicalReport,
  getAnalysisHistory,
  saveToHistory,
};
