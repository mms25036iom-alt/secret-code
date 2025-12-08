import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Calendar, MessageCircle, User, Stethoscope, Pill } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BottomNavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.user);
    const { t } = useLanguage();

    const isActive = (path) => {
        return location.pathname === path;
    };

    // Different navigation items based on user role with translations
    const getNavItems = () => {
        // Don't show navbar if user is not logged in (they'll be redirected to login)
        if (!user) return [];

        if (user.role === 'doctor') {
            return [
                { path: '/appointments', icon: Calendar, label: t('navbar.appointments') },
                { path: '/prescriptions', icon: Stethoscope, label: t('navbar.prescriptions') },
                { path: '/chat', icon: MessageCircle, label: t('navbar.chat') },
                { path: '/account', icon: User, label: t('navbar.profile') }
            ];
        } else if (user.role === 'pharmacist') {
            return [
                { path: '/pharmacist/dashboard', icon: Home, label: t('navbar.dashboard') },
                { path: '/medicines', icon: Pill, label: t('navbar.medicines') },
                { path: '/account', icon: User, label: t('navbar.profile') }
            ];
        } else {
            // Patient navigation
            return [
                { path: '/', icon: Home, label: t('navbar.home') },
                { path: '/chat', icon: MessageCircle, label: t('navbar.doctors') },
                { path: '/appointments', icon: Calendar, label: t('navbar.appointments') },
                { path: '/prescriptions', icon: Stethoscope, label: 'Rx' },
                { path: '/account', icon: User, label: t('navbar.profile') }
            ];
        }
    };

    const navItems = getNavItems();

    // Don't render if no nav items
    if (navItems.length === 0) return null;

    // Hide navbar on video call pages
    const hideOnPaths = ['/video-room', '/video-call', '/simple-video-call'];
    if (hideOnPaths.some(path => location.pathname.includes(path))) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden" style={{ position: 'fixed', zIndex: 9999 }}>
            <div className="bg-white border-t border-gray-300 px-2 py-3 shadow-lg">
                <div className="flex justify-around items-center relative">
                    {/* Active indicator line */}
                    <div 
                        className="absolute top-0 h-0.5 bg-black transition-all duration-300 ease-out"
                        style={{
                            width: `${100 / navItems.length}%`,
                            left: `${(navItems.findIndex(item => isActive(item.path)) * 100) / navItems.length}%`,
                        }}
                    />
                    
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="relative flex flex-col items-center justify-center transition-all duration-300 ease-out px-4"
                            >
                                {/* Icon */}
                                <div className={`
                                    relative transition-all duration-300 ease-out
                                    ${active ? 'mb-1' : 'mb-0'}
                                `}>
                                    <Icon 
                                        className={`
                                            w-6 h-6 transition-all duration-300 ease-out
                                            ${active 
                                                ? 'text-black scale-110' 
                                                : 'text-gray-600'
                                            }
                                        `}
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                </div>
                                
                                {/* Label */}
                                <span className={`
                                    text-[10px] font-medium transition-all duration-300 ease-out mt-1
                                    ${active 
                                        ? 'text-black opacity-100 translate-y-0' 
                                        : 'text-gray-600 opacity-0 -translate-y-1'
                                    }
                                `}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BottomNavBar;
