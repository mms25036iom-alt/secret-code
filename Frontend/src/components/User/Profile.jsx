import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMedicalHistory, logout } from '../../actions/userActions';
import { 
    User, 
    Activity, 
    Settings, 
    LogOut, 
    Mail, 
    Phone, 
    MapPin, 
    Shield,
    FileText,
    QrCode
} from 'lucide-react';
import MedicalHistoryModal from '../MedicalHistoryModal';
import UserQRCode from '../PatientQRCode';
import MedicalDocuments from '../MedicalDocuments';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector(state => state.user);
    const [activeTab, setActiveTab] = useState('profile');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate('/login');
        }
    }, [navigate, isAuthenticated]);

    const handleViewMedicalHistory = async (userId) => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
            const response = await dispatch(getMedicalHistory(userId));
            setSelectedPatientHistory(response);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch medical history:', error);
            setHistoryError(error.response?.data?.message || 'Failed to fetch medical history');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getRoleName = (role) => {
        if (role === 'doctor') return 'Doctor';
        if (role === 'pharmacist') return 'Pharmacist';
        return 'Patient';
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="flex max-w-7xl mx-auto">
                {/* Sidebar - Narrower on mobile, wider on desktop */}
                <div className="w-32 md:w-56 bg-white min-h-screen p-2 md:p-4 sticky top-20 flex-shrink-0">
                    {/* Profile Avatar and Name */}
                    <div className="text-center mb-4 md:mb-6">
                        <div className="relative inline-block">
                            <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-gray-200 mx-auto mb-2 overflow-hidden">
                                {user?.avatar?.url ? (
                                    <img
                                        src={user.avatar.url}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <span className="text-white text-sm md:text-xl font-bold">{getInitials(user.name)}</span>
                                    </div>
                                )}
                            </div>
                            {/* Verified Badge */}
                            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5 md:p-1">
                                <svg className="w-2 h-2 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-xs md:text-base font-bold text-gray-900 break-words px-0.5">{user?.name || 'User'}</h2>
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] md:text-xs font-medium">
                            {getRoleName(user?.role)}
                        </span>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                                activeTab === 'profile'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <User className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                            <span className="font-medium hidden md:inline">Profile</span>
                            <span className="font-medium md:hidden text-[10px]">Profile</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`w-full flex items-center px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                                activeTab === 'activity'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Activity className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                            <span className="font-medium hidden md:inline">Activity</span>
                            <span className="font-medium md:hidden text-[10px]">Activity</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full flex items-center px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                                activeTab === 'settings'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                            <span className="font-medium hidden md:inline">Settings</span>
                            <span className="font-medium md:hidden text-[10px]">Settings</span>
                        </button>
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-1.5 md:px-3 py-1.5 md:py-2 mt-3 md:mt-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs md:text-sm"
                    >
                        <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                        <span className="font-medium hidden md:inline">Log Out</span>
                        <span className="font-medium md:hidden text-[10px]">Log Out</span>
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-2 md:p-8 overflow-y-auto">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            {/* Account Overview */}
                            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Account Overview</h3>
                                
                                <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center min-w-0">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                                            <Shield className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm md:text-base font-medium text-gray-900">Account Status:</p>
                                            <p className="text-xs md:text-sm text-gray-500 truncate">
                                                Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 md:px-4 md:py-2 bg-green-100 text-green-700 rounded-lg font-medium text-xs md:text-sm flex-shrink-0 ml-2">
                                        Active
                                    </span>
                                </div>
                            </div>

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                {/* Personal Information */}
                                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                                    <div className="flex items-center mb-4">
                                        <User className="w-4 h-4 md:w-5 md:h-5 text-gray-700 mr-2" />
                                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Personal Information</h3>
                                    </div>

                                    <div className="space-y-3 md:space-y-4">
                                        {/* Email */}
                                        <div className="flex items-start">
                                            <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm text-gray-500">Email Address</p>
                                                <p className="text-sm md:text-base text-gray-900 font-medium break-words">{user?.contact || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-start">
                                            <Phone className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm text-gray-500">Phone Number</p>
                                                <p className="text-sm md:text-base text-gray-900 font-medium break-words">{user?.contact || 'Not provided'}</p>
                                            </div>
                                        </div>

                                        {/* Gender */}
                                        <div className="flex items-start">
                                            <User className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs md:text-sm text-gray-500">Gender</p>
                                                <p className="text-sm md:text-base text-gray-900 font-medium capitalize">{user?.gender || 'Not specified'}</p>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-start">
                                            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 mr-2 md:mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs md:text-sm text-gray-500">Location</p>
                                                <p className="text-sm md:text-base text-gray-400">Not provided</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient QR Code */}
                                {user?.role === 'user' && (
                                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                                        <div className="flex items-center mb-4">
                                            <QrCode className="w-4 h-4 md:w-5 md:h-5 text-gray-700 mr-2" />
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900">Patient QR Code</h3>
                                        </div>

                                        <div className="text-center">
                                            <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-3 md:mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <QrCode className="w-20 h-20 md:w-28 md:h-28 text-gray-300" />
                                            </div>
                                            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 px-2">
                                                Generate QR code containing all patient information.
                                            </p>
                                            <button
                                                onClick={() => setShowQRModal(true)}
                                                className="w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-sm md:text-base"
                                            >
                                                <QrCode className="w-4 h-4 mr-2" />
                                                Show QR Code
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Medical History */}
                            {user?.role === 'user' && (
                                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                                    <div className="flex items-center mb-3 md:mb-4">
                                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-700 mr-2" />
                                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Medical History</h3>
                                    </div>

                                    <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                                        View your complete medical analysis and appointment history.
                                    </p>

                                    <button
                                        onClick={() => handleViewMedicalHistory(user._id)}
                                        className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
                                    >
                                        View Medical History
                                    </button>
                                </div>
                            )}

                            {/* Medical Documents */}
                            {user?.role === 'user' && (
                                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                                    <div className="flex items-center mb-3 md:mb-4">
                                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-700 mr-2" />
                                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Medical Documents</h3>
                                    </div>

                                    <div className="text-center py-6 md:py-8">
                                        <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                                        <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">No medical documents uploaded yet.</p>
                                        <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 px-4">
                                            Securely store and share your reports.
                                        </p>
                                        <button className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base">
                                            + Upload your first document
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Activity History</h3>
                            <div className="text-center py-8 md:py-12">
                                <Activity className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                                <p className="text-sm md:text-base text-gray-600">Your recent activities will appear here</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Account Settings</h3>
                            
                            <form className="space-y-6 max-w-2xl">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={user?.name}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                {/* Contact */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email/Phone
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={user?.contact}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your email or phone"
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gender
                                    </label>
                                    <select
                                        defaultValue={user?.gender || ''}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Doctor-specific fields */}
                                {user?.role === 'doctor' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Speciality
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={user?.speciality}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter your medical speciality"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Age
                                            </label>
                                            <input
                                                type="number"
                                                min="18"
                                                max="100"
                                                defaultValue={user?.age}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter your age"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Qualification
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={user?.qualification}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., MBBS, MD, MS"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Professional Description
                                            </label>
                                            <textarea
                                                rows={4}
                                                maxLength={500}
                                                defaultValue={user?.description}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                placeholder="Brief description about your practice and expertise..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Maximum 500 characters</p>
                                        </div>
                                    </>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('profile')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            alert('Profile update functionality will be implemented soon!');
                                        }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <MedicalHistoryModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedPatientHistory(null);
                    setHistoryError(null);
                }}
                medicalHistory={selectedPatientHistory}
                isLoading={isLoadingHistory}
                error={historyError}
            />

            {showQRModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl p-3 md:p-6 max-w-md w-full my-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-3 md:mb-4 sticky top-0 bg-white pb-2 z-10">
                            <h3 className="text-base md:text-lg font-semibold">Patient QR Code</h3>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                            >
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="overflow-x-hidden [&_button]:text-xs [&_button]:md:text-sm [&_button]:px-2 [&_button]:md:px-4 [&_button]:py-1.5 [&_button]:md:py-2">
                            <UserQRCode userData={user} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
