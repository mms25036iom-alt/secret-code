import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { myAppointments } from '../actions/appointmentActions';
import { toast } from 'react-toastify';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentBooking from '../components/AppointmentBooking';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';

const Appointments = () => {
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector(state => state.user);
    const { appointments, loading } = useSelector(state => state.myAppointment || { appointments: [], loading: false });
    const { error, appointment } = useSelector(state => state.newAppointment);

    // Debug: Log appointment data
    console.log('Appointments state:', { appointments, loading, error });
    
    // Debug: Check if symptomsAudio is present in appointments
    useEffect(() => {
        if (appointments && appointments.length > 0) {
            appointments.forEach((apt, index) => {
                console.log(`Appointment ${index + 1}:`, {
                    id: apt._id,
                    symptoms: apt.symptoms,
                    symptomsAudio: apt.symptomsAudio,
                    hasAudio: !!apt.symptomsAudio
                });
            });
        }
    }, [appointments]);

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, upcoming, pending, missed

    useEffect(() => {
        if (isAuthenticated) {
            console.log('Fetching appointments for user:', user);
            dispatch(myAppointments());
        }
    }, [dispatch, isAuthenticated, user]);

    useEffect(() => {
        if (error) {
            console.error('Appointment error:', error);
        }
    }, [error]);

    // Refresh appointments when a new appointment is created
    useEffect(() => {
        if (appointment) {
            toast.success('Appointment booked successfully! Check your email for details.');
            dispatch(myAppointments());
        }
    }, [appointment, dispatch]);

    const filteredAppointments = appointments?.filter(appointment => {
        const matchesSearch = searchTerm === '' || 
            appointment.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.symptoms?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    }) || [];

    const upcomingAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(`${appointment.day}T${appointment.time}`);
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour buffer
        
        // Show appointments that are in the future or within the last hour, and are pending or confirmed
        return appointmentDate > oneHourAgo && (appointment.status === 'pending' || appointment.status === 'confirmed');
    });

    const pastAppointments = filteredAppointments.filter(appointment => {
        // Show all appointments with completed status, regardless of date
        return appointment.status === 'completed';
    });

    const missedAppointments = filteredAppointments.filter(appointment => {
        // Show appointments that are missed or cancelled
        return appointment.status === 'missed' || appointment.status === 'cancelled';
    });

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Search Bar - Mobile First */}
                <div className="mb-4">
                    <SearchBar 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search appointments..."
                    />
                </div>

                {/* Stats Cards - Compact Mobile Design - Clickable */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`bg-white rounded-2xl p-3 shadow-sm transition-all active:scale-95 ${
                            activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''
                        }`}
                    >
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${
                                activeFilter === 'all' ? 'bg-blue-600' : 'bg-blue-100'
                            }`}>
                                <Calendar className={`w-5 h-5 ${
                                    activeFilter === 'all' ? 'text-white' : 'text-blue-600'
                                }`} />
                            </div>
                            <p className="text-xs text-gray-600 font-medium mb-0.5">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{appointments?.length || 0}</p>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setActiveFilter('upcoming')}
                        className={`bg-white rounded-2xl p-3 shadow-sm transition-all active:scale-95 ${
                            activeFilter === 'upcoming' ? 'ring-2 ring-green-500' : ''
                        }`}
                    >
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${
                                activeFilter === 'upcoming' ? 'bg-green-600' : 'bg-green-100'
                            }`}>
                                <Clock className={`w-5 h-5 ${
                                    activeFilter === 'upcoming' ? 'text-white' : 'text-green-600'
                                }`} />
                            </div>
                            <p className="text-xs text-gray-600 font-medium mb-0.5">Upcoming</p>
                            <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setActiveFilter('pending')}
                        className={`bg-white rounded-2xl p-3 shadow-sm transition-all active:scale-95 ${
                            activeFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''
                        }`}
                    >
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${
                                activeFilter === 'pending' ? 'bg-yellow-600' : 'bg-yellow-100'
                            }`}>
                                <User className={`w-5 h-5 ${
                                    activeFilter === 'pending' ? 'text-white' : 'text-yellow-600'
                                }`} />
                            </div>
                            <p className="text-xs text-gray-600 font-medium mb-0.5">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredAppointments.filter(apt => apt.status === 'pending').length}
                            </p>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setActiveFilter('missed')}
                        className={`bg-white rounded-2xl p-3 shadow-sm transition-all active:scale-95 ${
                            activeFilter === 'missed' ? 'ring-2 ring-red-500' : ''
                        }`}
                    >
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${
                                activeFilter === 'missed' ? 'bg-red-600' : 'bg-red-100'
                            }`}>
                                <svg className={`w-5 h-5 ${
                                    activeFilter === 'missed' ? 'text-white' : 'text-red-600'
                                }`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-xs text-gray-600 font-medium mb-0.5">Missed</p>
                            <p className="text-2xl font-bold text-gray-900">{missedAppointments.length}</p>
                        </div>
                    </button>
                </div>

                {/* Section Header - Dynamic based on filter */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        {activeFilter === 'all' && (
                            <>
                                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                                All Appointments
                            </>
                        )}
                        {activeFilter === 'upcoming' && (
                            <>
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Upcoming Appointments
                            </>
                        )}
                        {activeFilter === 'pending' && (
                            <>
                                <User className="w-5 h-5 text-yellow-600 mr-2" />
                                Pending Appointments
                            </>
                        )}
                        {activeFilter === 'missed' && (
                            <>
                                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Missed/Cancelled
                            </>
                        )}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                        activeFilter === 'all' ? 'bg-blue-100 text-blue-800' :
                        activeFilter === 'upcoming' ? 'bg-green-100 text-green-800' :
                        activeFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {activeFilter === 'all' ? filteredAppointments.length :
                         activeFilter === 'upcoming' ? upcomingAppointments.length :
                         activeFilter === 'pending' ? filteredAppointments.filter(apt => apt.status === 'pending').length :
                         missedAppointments.length}
                    </span>
                </div>

                {/* Appointments List - Filtered based on active filter */}
                {filteredAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Appointments Found</h3>
                        <p className="text-sm text-gray-500">
                            {user?.role === 'doctor' 
                                ? 'No patient appointments scheduled yet.'
                                : 'Visit the Chat page to book an appointment.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Show appointments based on active filter */}
                        {activeFilter === 'all' && filteredAppointments.map(appointment => (
                            <AppointmentCard
                                key={appointment._id}
                                appointment={appointment}
                                userRole={user?.role}
                            />
                        ))}
                        
                        {activeFilter === 'upcoming' && (
                            upcomingAppointments.length > 0 ? (
                                upcomingAppointments.map(appointment => (
                                    <AppointmentCard
                                        key={appointment._id}
                                        appointment={appointment}
                                        userRole={user?.role}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 bg-white rounded-2xl">
                                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No upcoming appointments</p>
                                </div>
                            )
                        )}
                        
                        {activeFilter === 'pending' && (
                            filteredAppointments.filter(apt => apt.status === 'pending').length > 0 ? (
                                filteredAppointments.filter(apt => apt.status === 'pending').map(appointment => (
                                    <AppointmentCard
                                        key={appointment._id}
                                        appointment={appointment}
                                        userRole={user?.role}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 bg-white rounded-2xl">
                                    <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No pending appointments</p>
                                </div>
                            )
                        )}
                        
                        {activeFilter === 'missed' && (
                            missedAppointments.length > 0 ? (
                                missedAppointments.map(appointment => (
                                    <AppointmentCard
                                        key={appointment._id}
                                        appointment={appointment}
                                        userRole={user?.role}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 bg-white rounded-2xl">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-gray-500">No missed or cancelled appointments</p>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Booking Modal */}
                {showBookingModal && (
                    <AppointmentBooking onClose={() => setShowBookingModal(false)} />
                )}
            </div>
        </div>
    );
};

export default Appointments;
