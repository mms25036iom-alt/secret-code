import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from '../actions/userActions';
import DoctorCallNotification from './DoctorCallNotification';
import { useFilter } from '../context/FilterContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.user);
  const { womenOnlyFilter, toggleWomenOnlyFilter } = useFilter();
  const { t } = useLanguage();
  const [showCallNotification, setShowCallNotification] = useState(false);

  // Role-based navigation items with translations
  const getNavItems = (userRole) => {
    const baseItems = [
      { path: '/', label: t('navbar.home') }
    ];
    
    if (userRole === 'doctor') {
      return [
        ...baseItems,
        { path: '/appointments', label: t('navbar.appointments') },
        { path: '/prescriptions', label: t('navbar.prescriptions') }
      ];
    }
    
    if (userRole === 'pharmacist') {
      return [
        { path: '/pharmacist/dashboard', label: t('navbar.dashboard') },
        { path: '/orders', label: 'Order History' }
      ];
    }
    
    if (userRole === 'admin') {
      return [
        ...baseItems,
        { path: '/admin/panel', label: 'Admin Panel' },
        { path: '/medicines', label: t('navbar.medicines') },
        { path: '/orders', label: 'Orders' }
      ];
    }
    
    // Default navigation for patients/users
    return [
      ...baseItems,
      { path: '/analysis', label: t('navbar.analysis') },
      { path: '/appointments', label: t('navbar.appointments') },
      { path: '/prescriptions', label: t('navbar.prescriptions') },
      { path: '/medicines', label: t('navbar.medicines') }
    ];
  };

  const navItems = getNavItems(user?.role);

  const logoutUser = async (e) => {
    e.preventDefault();
    dispatch(logout());
  };

  return (
    <div className="fixed top-0 z-50 w-full">
      <nav className="flex justify-between items-center p-2 md:p-5 bg-white shadow-lg">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-auto object-contain ml-4 md:ml-8 cursor-pointer transition-transform duration-300 hover:scale-105"
              />
            </div>
          </Link>
        </div>

        {/* Center - CureOn Name Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
          <img
            src="/cureon-name.png"
            alt="CureOn"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </div>

        {/* Mobile - Language Selector and Women Only Filter */}
        <div className="md:hidden flex items-center space-x-2 mr-2">
          {/* Women Only Filter - Mobile */}
          {isAuthenticated && user?.role === 'user' && (
            <button
              onClick={toggleWomenOnlyFilter}
              className={`flex items-center justify-center px-3 py-2 rounded-lg font-medium transition-all duration-300 transform active:scale-95 ${
                womenOnlyFilter
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md ring-2 ring-pink-300'
                  : 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-sm hover:shadow-md'
              }`}
              title="Filter to show only women doctors"
            >
              <svg 
                className="w-5 h-5" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C10.34 2 9 3.34 9 5s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {womenOnlyFilter && (
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          
          <LanguageSelector />
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center space-x-4 lg:space-x-9">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-gray-800 hover:text-blue-800 transition-colors duration-200"
            >
              <li className="text-lg font-semibold">{item.label}</li>
            </Link>
          ))}
        </ul>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center space-x-4 mr-2 md:mr-6">
          {/* Women Only Filter - Desktop */}
          {isAuthenticated && user?.role === 'user' && (
            <button
              onClick={toggleWomenOnlyFilter}
              className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 text-sm transform hover:scale-105 ${
                womenOnlyFilter
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/50 ring-2 ring-pink-300'
                  : 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md hover:shadow-lg'
              }`}
              title="Filter to show only women doctors"
            >
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C10.34 2 9 3.34 9 5s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="hidden lg:inline font-semibold">Women Only</span>
              {womenOnlyFilter && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
          
          {/* Language Selector */}
          <LanguageSelector />
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="bg-blue-800 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-blue-900 transition-colors duration-200 shadow-md"
            >
              {t('auth.login')}
            </Link>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Doctor Call Notification Button */}
              {user?.role === 'doctor' && (
                <button
                  onClick={() => setShowCallNotification(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-green-700 transition-colors duration-200 shadow-md"
                >
                  {t('appointment.actions.joinCall')}
                </button>
              )}
              
              {/* Role-specific dashboard links */}
              <div className="relative group">
                <button className="text-gray-800 hover:text-blue-800 transition-colors duration-200 font-medium">
                  {t('navbar.dashboard')} ▼
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('profile.title')}
                    </Link>
                    {user?.role === 'pharmacist' && (
                      <>
                        <Link
                          to="/pharmacist/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Pharmacist Dashboard
                        </Link>
                        <Link
                          to="/pharmacist/create-medicine"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Create Medicine
                        </Link>
                        <Link
                          to="/pharmacy/register"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Register Pharmacy
                        </Link>
                      </>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/panel"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={logoutUser}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-blue-900 transition-colors duration-200 shadow-md"
              >
                {t('auth.logout')}
              </button>
              
              <Link to="/account" className="transform hover:scale-110 transition-transform duration-200">
                <img
                  className="w-10 h-10 rounded-full border-2 border-blue-800"
                  src={user?.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                  alt="Profile"
                />
              </Link>
            </div>
          )}
        </div>
      </nav>


      
      {/* Doctor Call Notification Popup */}
      <DoctorCallNotification 
        show={showCallNotification} 
        onClose={() => setShowCallNotification(false)} 
      />
    </div>
  );
}