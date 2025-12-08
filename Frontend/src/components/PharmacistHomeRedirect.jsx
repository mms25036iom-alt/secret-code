import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleBasedHomeRedirect = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.user);

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      // Redirect based on user role
      if (user.role === 'pharmacist') {
        navigate('/pharmacist/dashboard', { replace: true });
      } else if (user.role === 'doctor') {
        navigate('/appointments', { replace: true });
      }
      // Patients (role === 'user') stay on landing page
    }
  }, [isAuthenticated, user, navigate]);

  // If pharmacist or doctor, show loading while redirecting
  if (isAuthenticated && (user?.role === 'pharmacist' || user?.role === 'doctor')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {user?.role === 'pharmacist' ? 'Redirecting to dashboard...' : 'Redirecting to appointments...'}
          </p>
        </div>
      </div>
    );
  }

  // For patients, show the normal landing page
  return children;
};

export default RoleBasedHomeRedirect;
