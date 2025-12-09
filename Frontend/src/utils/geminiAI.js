import OpenAI from 'openai';

// Initialize OpenAI
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
}) : null;

export const generateSymptomAnalysis = async (symptoms, patientAge = null, patientGender = null) => {
    try {
        if (!openai) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = `
        As a medical AI assistant, analyze the following symptoms and provide helpful suggestions for the patient until their appointment. 
        Please provide practical, non-diagnostic advice that can help manage symptoms safely.

        Patient Information:
        - Symptoms: ${symptoms}
        ${patientAge ? `- Age: ${patientAge}` : ''}
        ${patientGender ? `- Gender: ${patientGender}` : ''}

        Please provide your response in the following markdown format:

        ## 🏥 Health Suggestions

        ### 📋 General Management Tips
        - [List practical tips for managing symptoms]

        ### ⚠️ When to Seek Immediate Care
        - [List red flag symptoms that require urgent attention]

        ### 🏠 Home Care Recommendations
        - [List safe home care measures]

        ### 📝 Preparing for Your Appointment
        - [List things to prepare and questions to ask]

        ### 💡 Additional Notes
        - [Any other relevant information]

        **Important:** This is not a medical diagnosis. Always consult with your healthcare provider for proper medical advice.

        Keep the response concise, practical, and well-formatted with clear sections.
        `;

        console.log('🤖 Generating symptom analysis with OpenAI...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1500,
            temperature: 0.7,
        });

        console.log('✅ OpenAI symptom analysis received');
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating symptom analysis:', error);
        return `I'm sorry, I'm having trouble analyzing your symptoms right now. Please make sure to discuss all your symptoms with your doctor during your appointment.`;
    }
};

export const generateAppointmentReminder = async (symptoms, doctorName, appointmentDate, appointmentTime) => {
    try {
        if (!openai) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = `
        Generate a helpful appointment reminder message for a patient. Include:
        - Appointment details (doctor, date, time)
        - Brief reminder about their symptoms
        - Preparation tips for the appointment
        - Encouragement to be ready with questions

        Doctor: ${doctorName}
        Date: ${appointmentDate}
        Time: ${appointmentTime}
        Symptoms: ${symptoms}

        Keep it warm, professional, and helpful.
        `;

        console.log('🤖 Generating appointment reminder with OpenAI...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
        });

        console.log('✅ OpenAI appointment reminder received');
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating appointment reminder:', error);
        return `Your appointment with ${doctorName} is scheduled for ${appointmentDate} at ${appointmentTime}. Please be ready to discuss your symptoms: ${symptoms}`;
    }
};
