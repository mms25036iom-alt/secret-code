/**
 * Smart Appointment Service
 * Uses OpenAI (primary) or Gemini (fallback) to analyze symptoms
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from '../axios';

// Initialize OpenAI
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
let openai = null;
if (OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
  } catch (e) { console.error('OpenAI init error:', e); }
}

// Initialize Gemini (fallback)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let geminiModel = null;
if (GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (e) { console.error('Gemini init error:', e); }
}

// Specialty mapping
const SPECIALTY_KEYWORDS = {
  'General Physician': ['fever', 'cold', 'cough', 'flu', 'fatigue', 'weakness', 'general', 'checkup'],
  'Cardiologist': ['heart', 'chest pain', 'palpitation', 'blood pressure', 'hypertension', 'breathless'],
  'Dermatologist': ['skin', 'rash', 'acne', 'eczema', 'itching', 'allergy', 'hair loss'],
  'Orthopedic': ['bone', 'joint', 'fracture', 'back pain', 'knee', 'spine', 'arthritis'],
  'Neurologist': ['headache', 'migraine', 'seizure', 'numbness', 'dizziness', 'memory'],
  'Gastroenterologist': ['stomach', 'digestion', 'acidity', 'constipation', 'diarrhea', 'liver'],
  'Ophthalmologist': ['eye', 'vision', 'blur', 'cataract'],
  'ENT': ['ear', 'nose', 'throat', 'hearing', 'sinus'],
  'Psychiatrist': ['anxiety', 'depression', 'stress', 'sleep', 'insomnia', 'mental'],
  'Pulmonologist': ['lung', 'breathing', 'asthma', 'respiratory'],
};

/**
 * Analyze user intent
 */
export const analyzeUserIntent = async (message) => {
  const prompt = `Analyze if this message describes health symptoms.
Message: "${message}"
Respond ONLY in JSON:
{"isSymptomReport":true/false,"wantsAppointment":true/false,"symptoms":["symptom1"],"suggestedSpecialty":"specialty","urgencyLevel":1-5,"summary":"brief"}`;

  // Try OpenAI first
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      });
      const text = response.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) { console.error('OpenAI intent error:', e); }
  }

  // Fallback to Gemini
  if (geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) { console.error('Gemini intent error:', e); }
  }

  return { isSymptomReport: false, wantsAppointment: false };
};

export const fetchDoctors = async () => {
  try {
    const { data } = await axios.get('/doctors');
    return data.doctors || [];
  } catch (e) { return []; }
};

export const findBestDoctor = async (suggestedSpecialty, symptoms) => {
  const doctors = await fetchDoctors();
  if (!doctors?.length) return null;

  let matchedDoctor = doctors.find(doc => 
    doc.specialization?.toLowerCase().includes(suggestedSpecialty?.toLowerCase())
  );

  if (!matchedDoctor && symptoms?.length) {
    for (const [specialty, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
      if (symptoms.some(s => keywords.some(k => s.toLowerCase().includes(k)))) {
        matchedDoctor = doctors.find(doc => doc.specialization?.toLowerCase().includes(specialty.toLowerCase()));
        if (matchedDoctor) break;
      }
    }
  }

  return matchedDoctor || doctors.find(doc => doc.specialization?.toLowerCase().includes('general')) || doctors[0];
};

export const getAvailableSlots = async (doctorId) => {
  const slots = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    try {
      const { data } = await axios.get(`/appointment/slots/${doctorId}/${dateStr}`);
      if (data.availableSlots?.length) {
        slots.push({ date: dateStr, dayName: date.toLocaleDateString('en-US', { weekday: 'long' }), slots: data.availableSlots });
      }
    } catch (e) {}
  }
  return slots;
};

export const bookAppointment = async (doctorId, date, time, symptoms, description) => {
  try {
    const { data } = await axios.post('/appointment/new', {
      doctor: doctorId, day: date, time, symptoms: Array.isArray(symptoms) ? symptoms.join(', ') : symptoms,
      description, bookingFor: 'self'
    });
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🏥 Appointment Booked!', { body: `Scheduled for ${date} at ${time}` });
    }
    return { success: true, appointment: data };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Failed to book' };
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const handleSmartAppointment = async (userMessage, conversationHistory, user) => {
  if (!user) return { shouldBook: false, message: "Please log in to book." };

  const intent = await analyzeUserIntent(userMessage);
  if (!intent.isSymptomReport && !intent.wantsAppointment) return { shouldBook: false };

  const doctor = await findBestDoctor(intent.suggestedSpecialty, intent.symptoms);
  if (!doctor) return { shouldBook: false, message: "No doctors available." };

  const availableSlots = await getAvailableSlots(doctor._id);
  if (!availableSlots?.length) return { shouldBook: false, message: `Dr. ${doctor.name} has no slots this week.` };

  return {
    shouldBook: true, intent, doctor, availableSlots,
    suggestedSlot: { date: availableSlots[0].date, dayName: availableSlots[0].dayName, time: availableSlots[0].slots[0] }
  };
};

export default { analyzeUserIntent, fetchDoctors, findBestDoctor, getAvailableSlots, bookAppointment, handleSmartAppointment, requestNotificationPermission };
