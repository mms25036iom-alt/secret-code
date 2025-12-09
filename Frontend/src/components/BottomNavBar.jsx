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
        <div className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden bottom-nav" style={{ position: 'fixed', zIndex: 9999 }}>
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-2">
                <div className="flex justify-around items-center relative max-w-md mx-auto">
                    {/* Active indicator line - Material Design 3 style */}
                    <div
                        className="absolute top-0 h-1 bg-blue-500 rounded-b-full transition-all duration-300 ease-out"
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
                                className={`
                                    relative flex flex-col items-center justify-center
                                    transition-all duration-200 ease-out
                                    px-3 py-2 rounded-2xl min-w-[64px] min-h-[56px]
                                    hover:bg-gray-100 dark:hover:bg-gray-800
                                    active:scale-95
                                    ${active ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                `}
                                style={{
                                    WebkitTapHighlightColor: 'transparent'
                                }}
                            >
                                {/* Material Design 3 Container */}
                                <div className={`
                                    flex flex-col items-center justify-center gap-1
                                    transition-all duration-200 ease-out
                                `}>
                                    {/* Icon with Material Design 3 state layer */}
                                    <div className={`
                                        relative transition-all duration-200 ease-out
                                        ${active ? 'scale-110' : 'scale-100'}
                                    `}>
                                        {active && (
                                            <div className="absolute inset-0 bg-blue-500/10 rounded-full scale-150 -z-10" />
                                        )}
                                        <Icon
                                            className={`
                                                w-6 h-6 transition-all duration-200 ease-out
                                                ${active
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }
                                            `}
                                            strokeWidth={active ? 2.5 : 2}
                                        />
                                    </div>

                                    {/* Label - Material Design 3 style */}
                                    <span className={`
                                        text-[11px] font-medium transition-all duration-200 ease-out
                                        ${active
                                            ? 'text-blue-600 dark:text-blue-400 opacity-100 translate-y-0'
                                            : 'text-gray-600 dark:text-gray-400 opacity-80 translate-y-0'
                                        }
                                    `}>
                                        {item.label}
                                    </span>
                                </div>

                                {/* Material Design ripple effect */}
                                <span className="absolute inset-0 overflow-hidden rounded-2xl">
                                    <span className="absolute inset-0 bg-black opacity-0 active:opacity-10 transition-opacity duration-200" />
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
