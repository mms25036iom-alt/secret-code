import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './styles/chat.css';
import { useSelector, useDispatch } from 'react-redux';
import { Send } from 'lucide-react';
import { allDoctors } from '../../actions/appointmentActions';
import { useFilter } from '../../context/FilterContext';
import AppointmentBooking from '../AppointmentBooking';
import SearchBar from '../SearchBar';

const Chat = () => {
    const { user } = useSelector((state) => state.user);
    const { doctors } = useSelector((state) => state.allDoctors);
    const dispatch = useDispatch();
    const { womenOnlyFilter, toggleWomenOnlyFilter } = useFilter();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [joined, setJoined] = useState(false);
    const [socket, setSocket] = useState(null);
    const [currentRoom, setCurrentRoom] = useState('');
    const messagesEndRef = useRef(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showDoctorProfile, setShowDoctorProfile] = useState(false);
    const [doctorPatientCount, setDoctorPatientCount] = useState(0);

    useEffect(() => {
        const backendUrl = 'https://localhost:5001';
        const newSocket = io(backendUrl + '/chat', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            secure: true,
            rejectUnauthorized: false, // Allow self-signed certificates for localhost
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            withCredentials: true
        });

        setSocket(newSocket);

        if (user.role === 'doctor') {
            const doctorRoom = user.contact || user.email;
            newSocket.emit('join-room', doctorRoom);
            setJoined(true);
            setCurrentRoom(doctorRoom);
        } else {
            dispatch(allDoctors());
        }

        return () => newSocket.disconnect();
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('message', (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
        });

        return () => {
            socket.off('message');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        if (!socket || !socket.connected) {
            alert('Connection lost. Please refresh the page.');
            return;
        }
        
        socket.emit('user-message', { roomId: currentRoom, text: message });
        setMessage('');
    };

    // Category mapping
    const categories = [
        { id: 'all', name: 'General', emoji: '🏥', color: 'bg-purple-100', specialty: 'General Physician' },
        { id: 'neurologist', name: 'Neurologist', emoji: '🧠', color: 'bg-red-100', specialty: 'Neurologist' },
        { id: 'cardiologist', name: 'Cardiologist', emoji: '❤️', color: 'bg-blue-100', specialty: 'Cardiologist' },
        { id: 'orthopedic', name: 'Orthopedic', emoji: '🦴', color: 'bg-green-100', specialty: 'Orthopedic' }
    ];

    // Filter doctors by category and gender
    const filteredDoctors = doctors?.filter(doctor => {
        const matchesGender = !womenOnlyFilter || doctor.gender === 'female';
        const matchesCategory = selectedCategory === 'all' || 
            doctor.speciality?.toLowerCase().includes(categories.find(c => c.id === selectedCategory)?.specialty.toLowerCase());
        return matchesGender && matchesCategory;
    }) || [];

    // Fetch doctor patient count when profile is shown
    useEffect(() => {
        const fetchDoctorStats = async () => {
            if (showDoctorProfile && selectedDoctorForBooking) {
                try {
                    const response = await fetch(`http://localhost:5000/api/v1/doctor/${selectedDoctorForBooking._id}/stats`);
                    const data = await response.json();
                    if (data.success) {
                        setDoctorPatientCount(data.patientCount);
                    }
                } catch (error) {
                    console.error('Error fetching doctor stats:', error);
                    setDoctorPatientCount(0);
                }
            }
        };
        fetchDoctorStats();
    }, [showDoctorProfile, selectedDoctorForBooking]);

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-3 sm:px-4 pb-24">
            {!joined ? (
                user.role === 'user' ? (
                    <div className="max-w-7xl mx-auto">
                        {/* Header with Greeting - Compact */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">
                                        👋 Hello!
                                    </h1>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {user?.name || 'Patient'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg relative">
                                    {user?.name?.charAt(0).toUpperCase() || 'P'}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                            </div>

                            {/* Search Bar - Compact */}
                            <SearchBar 
                                value=""
                                onChange={() => {}}
                                placeholder="Search doctors..."
                            />
                        </div>

                        {/* Upcoming Appointment Section - Compact */}
                        <div className="mb-3">
                            <h2 className="text-base font-bold text-gray-900 mb-2">Upcoming Appointment</h2>
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-3 shadow-md">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-sm">No upcoming appointments</h3>
                                        <p className="text-blue-100 text-xs mt-0.5">Book an appointment below</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories Section - Compact & Clickable */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-base font-bold text-gray-900">Categories</h2>
                                <button 
                                    onClick={() => setSelectedCategory('all')}
                                    className="text-blue-600 font-semibold text-xs"
                                >
                                    See All
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`flex flex-col items-center transition-all active:scale-95 ${
                                            selectedCategory === category.id ? 'opacity-100' : 'opacity-70'
                                        }`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center mb-1.5 ${
                                            selectedCategory === category.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                        }`}>
                                            <span className="text-2xl">{category.emoji}</span>
                                        </div>
                                        <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
                                            {category.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Women Only Filter - Compact */}
                        <div className="mb-3">
                            <button
                                type="button"
                                onClick={toggleWomenOnlyFilter}
                                className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-2xl font-semibold transition-all duration-300 active:scale-95 text-xs ${
                                    womenOnlyFilter
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                                        : 'bg-white text-gray-700 border-2 border-gray-200'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C10.34 2 9 3.34 9 5s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                <span className="font-semibold">
                                    {womenOnlyFilter ? 'Women Doctors Only' : 'Show Women Doctors'}
                                </span>
                                {womenOnlyFilter && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Popular Doctors Section - Compact */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-base font-bold text-gray-900">Popular Doctors</h2>
                                <button className="text-blue-600 font-semibold text-xs">See All</button>
                            </div>
                            
                            <div className="space-y-2.5">
                                {filteredDoctors.map((doctor) => (
                                    <div 
                                        key={doctor._id} 
                                        className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {/* Doctor Image - Smaller */}
                                            <img
                                                src={"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200"}
                                                alt={doctor.name}
                                                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                            />
                                            
                                            {/* Doctor Info - Compact */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-gray-900 truncate">{doctor.name}</h3>
                                                <p className="text-xs text-gray-600 mb-1.5">{doctor.speciality}</p>
                                                
                                                {/* Doctor Details - Inline & Compact */}
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-600 mb-2">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="font-medium">Age:</span>
                                                        <span>{doctor.age || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="font-medium">Gender:</span>
                                                        <span className="capitalize">{doctor.gender || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="font-medium">Qual:</span>
                                                        <span>{doctor.qualification || 'MBBS'}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Book Button - Compact */}
                                                <button 
                                                    onClick={() => {
                                                        setSelectedDoctorForBooking(doctor);
                                                        setShowDoctorProfile(true);
                                                    }}
                                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-1.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 shadow-sm text-xs"
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                        <p className="text-xl text-gray-600 bg-white p-8 rounded-lg shadow-md">Waiting for patients to connect...</p>
                    </div>
                )
            ) : (
                <div className="max-w-4xl mx-auto h-[80vh] p-4 flex flex-col">
                    <div className="bg-white rounded-xl shadow-xl flex-1 flex flex-col overflow-hidden">
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Telemedicine Chat</h2>
                                    <p className="text-blue-100 mt-1">Room: {currentRoom}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-lg">{user.name}</p>
                                    <p className="text-blue-100">
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.sender === socket.id ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs md:max-w-md rounded-2xl p-4 shadow-md ${
                                            msg.sender === socket.id
                                                ? 'bg-gradient-to-r from-blue-900 to-blue-700 text-white'
                                                : 'bg-white text-gray-800'
                                        }`}
                                    >
                                        <p className="text-[15px] leading-relaxed">{msg.text}</p>
                                        <p className={`text-xs mt-2 ${msg.sender === socket.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {new Date().toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100">
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    className="flex-1 rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 py-2.5"
                                    placeholder="Type your message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Doctor Profile Modal */}
            {showDoctorProfile && selectedDoctorForBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" style={{ zIndex: 10001 }}>
                    <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up mb-20" style={{ zIndex: 10002 }}>
                        {/* Header with Doctor Info */}
                        <div className="relative p-4 sm:p-6 pb-3 sm:pb-4">
                            <button
                                onClick={() => {
                                    setShowDoctorProfile(false);
                                    setSelectedDoctorForBooking(null);
                                }}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                                <img
                                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300"
                                    alt={selectedDoctorForBooking.name}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{selectedDoctorForBooking.name}</h2>
                                    <p className="text-sm text-gray-600 mt-1 truncate">
                                        {selectedDoctorForBooking.qualification || 'MBBS'}
                                    </p>
                                    <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1 truncate">
                                        {selectedDoctorForBooking.speciality}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm sm:text-lg font-bold text-gray-900">{selectedDoctorForBooking.age || 'N/A'}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Age (Years)</p>
                                </div>
                                <div className="bg-green-50 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm sm:text-lg font-bold text-gray-900">{doctorPatientCount}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Patients Treated</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-xs sm:text-lg font-bold text-gray-900 truncate">{selectedDoctorForBooking.speciality}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Speciality</p>
                                </div>
                            </div>
                        </div>

                        {/* Doctor Biography */}
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Doctor Biography</h3>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                {selectedDoctorForBooking.description || 
                                    `${selectedDoctorForBooking.name} is a dedicated ${selectedDoctorForBooking.speciality.toLowerCase()} ${selectedDoctorForBooking.age ? `with ${selectedDoctorForBooking.age} years of age` : ''} specializing in providing quality healthcare. ${selectedDoctorForBooking.gender === 'female' ? 'She is' : 'He is'} passionate about ensuring the well-being of patients and believes in a holistic approach to healthcare.`
                                }
                            </p>
                        </div>

                        {/* Additional Info */}
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-gray-600">Age</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{selectedDoctorForBooking.age || 'N/A'} years</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-gray-600">Gender</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 capitalize">{selectedDoctorForBooking.gender || 'Female'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-gray-600">Specialization</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate ml-2">{selectedDoctorForBooking.speciality}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-gray-600">Qualification</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate ml-2">{selectedDoctorForBooking.qualification || 'MBBS'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Book Appointment Button - Fixed at bottom with extra spacing to avoid navbar */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
                            <button
                                onClick={() => {
                                    setShowDoctorProfile(false);
                                    setShowBookingModal(true);
                                }}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 shadow-lg"
                            >
                                Book Appointment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Booking Modal */}
            {showBookingModal && (
                <AppointmentBooking 
                    onClose={() => {
                        setShowBookingModal(false);
                        setSelectedDoctorForBooking(null);
                    }}
                    preSelectedDoctor={selectedDoctorForBooking}
                />
            )}
        </div>
    );
};

export default Chat;
