import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, Minimize2, Maximize2, Stethoscope, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSelector } from 'react-redux';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'react-toastify';
import { handleSmartAppointment, bookAppointment, requestNotificationPermission } from '../utils/smartAppointment';

// Initialize OpenAI (Primary)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
let openai = null;
if (OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
    console.log('✅ OpenAI initialized');
  } catch (e) {
    console.error('OpenAI init error:', e);
  }
}

// Initialize Gemini (Fallback)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let geminiModel = null;
if (GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini initialized as fallback');
  } catch (e) {
    console.error('Gemini init error:', e);
  }
}

console.log('🤖 AI Status:', { hasOpenAI: !!openai, hasGemini: !!geminiModel });

const VOICE_LANG_CODES = {
  english: "en-US", spanish: "es-ES", french: "fr-FR", german: "de-DE",
  hindi: "hi-IN", marathi: "mr-IN", gujarati: "gu-IN", bengali: "bn-IN",
  tamil: "ta-IN", japanese: "ja-JP"
};

const STT_LANG_CODES = { ...VOICE_LANG_CODES };

const MedicalAssistant = forwardRef(({ hideButton = false }, ref) => {
  const { user } = useSelector((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [language, setLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [isBookingAppointment, setIsBookingAppointment] = useState(false);

  useImperativeHandle(ref, () => ({
    toggleChatbot: () => setIsOpen(!isOpen)
  }));

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setIsMinimized(false);
    } else if (!hasShownWelcome) {
      const welcomeMessages = {
        english: "Hello! 👋 I'm Arogya AI, your medical assistant. How can I help you today?",
        hindi: "नमस्ते! 👋 मैं आरोग्य AI हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
        marathi: "नमस्कार! 👋 मी आरोग्य AI आहे. आज मी तुम्हाला कशी मदत करू शकतो?",
        spanish: "¡Hola! 👋 Soy Arogya AI. ¿Cómo puedo ayudarte hoy?",
      };
      setChat([{ sender: "bot", text: welcomeMessages[language] || welcomeMessages.english }]);
      setHasShownWelcome(true);
    }
  };

  // Speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = STT_LANG_CODES[language] || "en-US";
      recognitionInstance.onresult = (event) => {
        if (event.results?.[0]?.[0]) setInput(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionInstance.onerror = () => setIsListening(false);
      recognitionInstance.onend = () => setIsListening(false);
      setRecognition(recognitionInstance);
    }
  }, [language]);

  useEffect(() => { requestNotificationPermission(); }, []);

  // Get AI response - tries OpenAI first, then Gemini
  const getMedicalReply = async (text) => {
    // Simple responses for greetings
    const lowerText = text.toLowerCase().trim();
    if (/^(hi|hello|hey|hii+|hola|namaste)[\s!.]*$/i.test(lowerText)) {
      return "Hey there! 👋 I'm Arogya AI, your health assistant. Tell me about any symptoms or health concerns!";
    }
    if (/thank|thanks|धन्यवाद/i.test(lowerText)) {
      return "You're welcome! 😊 Feel free to ask me anything about your health!";
    }

    const systemPrompt = `You are Arogya AI, a friendly medical assistant for Cureon Healthcare.
Be warm, empathetic, and helpful. Use simple language. Give practical advice.
Always recommend consulting a doctor for serious concerns.
Keep responses concise. Use emojis occasionally.
Respond in ${language}.`;

    // Try OpenAI first
    if (openai) {
      try {
        console.log('🤖 Trying OpenAI...');
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 1024,
          temperature: 0.7,
        });
        if (response?.choices?.[0]?.message?.content) {
          console.log('✅ OpenAI response received');
          return response.choices[0].message.content;
        }
      } catch (error) {
        console.error('OpenAI error:', error.message);
        // Fall through to Gemini
      }
    }

    // Fallback to Gemini
    if (geminiModel) {
      try {
        console.log('🤖 Trying Gemini...');
        const prompt = `${systemPrompt}\n\nUser: ${text}\n\nRespond as a caring health assistant:`;
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        console.log('✅ Gemini response received');
        return response.text();
      } catch (error) {
        console.error('Gemini error:', error.message);
      }
    }

    return "I'm having trouble connecting right now. 😅 Please try again in a moment!";
  };

  const speak = async (text) => {
    try {
      setIsSpeaking(true);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
        utterance.lang = VOICE_LANG_CODES[language] || 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => { setIsSpeaking(false); setCurrentAudio(null); };
        utterance.onerror = () => { setIsSpeaking(false); setCurrentAudio(null); };
        window.speechSynthesis.speak(utterance);
        setCurrentAudio({ stop: () => window.speechSynthesis.cancel() });
      }
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (currentAudio?.stop) currentAudio.stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentAudio(null);
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.lang = STT_LANG_CODES[language] || "en-US";
      recognition.start();
      setIsListening(true);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!pendingAppointment) return;
    setIsBookingAppointment(true);
    const { doctor, suggestedSlot, intent } = pendingAppointment;
    try {
      const result = await bookAppointment(doctor._id, suggestedSlot.date, suggestedSlot.time, intent.symptoms, intent.summary);
      if (result.success) {
        toast.success(`🎉 Appointment booked with Dr. ${doctor.name}!`);
        setChat(prev => [...prev, {
          sender: "bot",
          text: `✅ **Appointment Booked!**\n\n📅 ${suggestedSlot.dayName}, ${suggestedSlot.date}\n⏰ ${suggestedSlot.time}\n👨‍⚕️ Dr. ${doctor.name}`,
          isAppointmentConfirmation: true
        }]);
      } else {
        toast.error(`Booking failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Something went wrong.');
    }
    setPendingAppointment(null);
    setIsBookingAppointment(false);
  };

  const handleDeclineAppointment = () => {
    setPendingAppointment(null);
    setChat(prev => [...prev, { sender: "bot", text: "No problem! Let me know if you need help later. 😊" }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { sender: "user", text: input };
    setChat(prev => [...prev, userMessage]);
    setLoading(true);
    const currentInput = input;
    setInput("");
    
    try {
      // Check for smart appointment
      if (user && user.role === 'user') {
        const appointmentResult = await handleSmartAppointment(currentInput, chat, user);
        if (appointmentResult.shouldBook && appointmentResult.doctor) {
          setPendingAppointment(appointmentResult);
          const { doctor, suggestedSlot, intent } = appointmentResult;
          setChat(prev => [...prev, {
            sender: "bot",
            text: `🏥 **Health concerns detected!**\n\n**Symptoms:** ${intent.symptoms.join(', ')}\n\n**Recommended:**\n👨‍⚕️ Dr. ${doctor.name} (${doctor.specialization})\n📅 ${suggestedSlot.dayName}, ${suggestedSlot.date} at ${suggestedSlot.time}\n\nWould you like me to book this?`,
            isAppointmentSuggestion: true
          }]);
          speak(`I found Dr. ${doctor.name} available. Would you like me to book?`);
          setLoading(false);
          return;
        }
      }
      
      const reply = await getMedicalReply(currentInput);
      setChat(prev => [...prev, { sender: "bot", text: reply }]);
      speak(reply);
    } catch (err) {
      console.error('Error:', err);
      setChat(prev => [...prev, { sender: "bot", text: "Sorry, please try again!" }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!hideButton && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={toggleChatbot}
          className="medical-assistant-button"
          style={styles.floatingBtn}
        >
          <Stethoscope size={24} color="#fff" />
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2, repeat: Infinity }} style={styles.pulse} />
        </motion.button>
      )}

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, height: isMinimized ? 56 : 500 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="medical-assistant-popup"
            style={styles.popup}
          >
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <div style={styles.headerIcon}><Stethoscope size={20} color="#3b82f6" /></div>
                <div>
                  <div style={styles.headerTitle}>Arogya AI</div>
                  <div style={styles.headerSubtitle}>Medical Assistant</div>
                </div>
              </div>
              <div style={styles.headerActions}>
                <button onClick={() => setIsMinimized(!isMinimized)} style={styles.headerBtn}>
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button onClick={toggleChatbot} style={styles.headerBtn}><X size={16} /></button>
              </div>
            </div>

            {!isMinimized && (
              <div style={styles.content}>
                {/* Language */}
                <div style={styles.langBar}>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.langSelect}>
                    <option value="english">🇺🇸 English</option>
                    <option value="hindi">🇮🇳 Hindi</option>
                    <option value="marathi">🇮🇳 Marathi</option>
                    <option value="spanish">🇪🇸 Spanish</option>
                  </select>
                </div>

                {/* Messages */}
                <div style={styles.messages}>
                  {chat.length === 0 && (
                    <div style={styles.emptyState}>
                      <Heart size={40} color="#3b82f6" />
                      <p style={styles.emptyTitle}>Arogya AI</p>
                      <p style={styles.emptyText}>Ask about symptoms, health tips, or medications</p>
                    </div>
                  )}
                  {chat.map((msg, i) => (
                    <div key={i} style={{ ...styles.msgRow, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ ...styles.msgBubble, ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble) }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        {msg.isAppointmentSuggestion && pendingAppointment && i === chat.length - 1 && (
                          <div style={styles.appointmentBtns}>
                            <button onClick={handleConfirmAppointment} disabled={isBookingAppointment} style={styles.confirmBtn}>
                              {isBookingAppointment ? 'Booking...' : '✓ Yes, Book'}
                            </button>
                            <button onClick={handleDeclineAppointment} style={styles.declineBtn}>✗ Not Now</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={styles.msgRow}>
                      <div style={{ ...styles.msgBubble, ...styles.botBubble }}>
                        <div style={styles.typing}>Thinking...</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div style={styles.inputArea}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                    placeholder="Ask about your health..."
                    style={styles.input}
                    disabled={loading}
                  />
                  <button onClick={handleSend} disabled={loading || !input.trim()} style={styles.sendBtn}>
                    {loading ? '...' : 'Send'}
                  </button>
                </div>

                {/* Voice */}
                <div style={styles.voiceArea}>
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : isListening ? null : startListening()}
                    style={{ ...styles.voiceBtn, backgroundColor: isListening ? '#ef4444' : isSpeaking ? '#22c55e' : '#3b82f6' }}
                  >
                    {isListening ? <MicOff size={18} /> : isSpeaking ? <Volume2 size={18} /> : <Mic size={18} />}
                    <span>{isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Voice'}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

const styles = {
  floatingBtn: {
    position: 'fixed', bottom: 24, right: 16, zIndex: 9999,
    width: 56, height: 56, borderRadius: 28,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(59,130,246,0.4)'
  },
  pulse: { position: 'absolute', inset: 0, borderRadius: 28, backgroundColor: '#60a5fa' },
  popup: {
    position: 'fixed', bottom: 90, right: 16, zIndex: 9999,
    width: 360, maxWidth: 'calc(100vw - 32px)',
    backgroundColor: '#fff', borderRadius: 16,
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontWeight: 600, fontSize: 14 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  headerActions: { display: 'flex', gap: 8 },
  headerBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#fff' },
  content: { display: 'flex', flexDirection: 'column', height: 444 },
  langBar: { padding: '8px 12px', borderBottom: '1px solid #e5e7eb' },
  langSelect: { width: '100%', padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 },
  messages: { flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  emptyState: { textAlign: 'center', padding: 40 },
  emptyTitle: { fontWeight: 600, color: '#1f2937', marginTop: 12 },
  emptyText: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  msgRow: { display: 'flex' },
  msgBubble: { maxWidth: '85%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.5 },
  userBubble: { backgroundColor: '#3b82f6', color: '#fff', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#f3f4f6', color: '#1f2937', borderBottomLeftRadius: 4 },
  typing: { color: '#6b7280', fontStyle: 'italic' },
  appointmentBtns: { display: 'flex', gap: 8, marginTop: 12 },
  confirmBtn: { flex: 1, padding: '8px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  declineBtn: { flex: 1, padding: '8px 12px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  inputArea: { display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid #e5e7eb' },
  input: { flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' },
  sendBtn: { padding: '10px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  voiceArea: { padding: '8px 12px 12px', display: 'flex', justifyContent: 'center' },
  voiceBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }
};

MedicalAssistant.displayName = 'MedicalAssistant';
export default MedicalAssistant;
