import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from '../axios';

const AuthDebugger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { user, isAuthenticated } = useSelector(state => state.user);

  const runAuthTest = async () => {
    const results = {
      reduxAuth: isAuthenticated,
      reduxUser: user ? { name: user.name, role: user.role, id: user._id } : null,
      localStorageToken: !!localStorage.getItem('token'),
      localStorageUser: !!localStorage.getItem('user'),
      tokenValue: localStorage.getItem('token')?.substring(0, 30) + '...',
      apiTest: null
    };

    // Test API call
    try {
      const response = await axios.get('/appointment/my');
      results.apiTest = {
        success: true,
        status: response.status,
        appointmentsCount: response.data.appointments?.length || 0
      };
      toast.success('API test successful!');
    } catch (error) {
      results.apiTest = {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      };
      toast.error('API test failed!');
    }

    setTestResult(results);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors text-sm font-semibold"
      >
        🔐 Auth Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-2xl p-4 max-w-md w-full max-h-96 overflow-auto border-2 border-red-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-red-600">🔐 Authentication Debug</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      <button
        onClick={runAuthTest}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Run Auth Test
      </button>

      {testResult && (
        <div className="space-y-3 text-sm">
          <div className={`p-3 rounded ${testResult.reduxAuth ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="font-semibold mb-1">Redux Authentication:</p>
            <p className={testResult.reduxAuth ? 'text-green-700' : 'text-red-700'}>
              {testResult.reduxAuth ? '✓ Authenticated' : '✗ Not Authenticated'}
            </p>
          </div>

          <div className={`p-3 rounded ${testResult.reduxUser ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="font-semibold mb-1">Redux User:</p>
            {testResult.reduxUser ? (
              <div className="text-green-700">
                <p>✓ Name: {testResult.reduxUser.name}</p>
                <p>✓ Role: {testResult.reduxUser.role}</p>
                <p className="text-xs">ID: {testResult.reduxUser.id}</p>
              </div>
            ) : (
              <p className="text-red-700">✗ No user in Redux</p>
            )}
          </div>

          <div className={`p-3 rounded ${testResult.localStorageToken ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="font-semibold mb-1">LocalStorage Token:</p>
            <p className={testResult.localStorageToken ? 'text-green-700' : 'text-red-700'}>
              {testResult.localStorageToken ? '✓ Present' : '✗ Missing'}
            </p>
            {testResult.localStorageToken && (
              <p className="text-xs text-gray-600 mt-1 break-all">{testResult.tokenValue}</p>
            )}
          </div>

          <div className={`p-3 rounded ${testResult.apiTest?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className="font-semibold mb-1">API Test (/appointment/my):</p>
            {testResult.apiTest?.success ? (
              <div className="text-green-700">
                <p>✓ Success (Status: {testResult.apiTest.status})</p>
                <p>✓ Appointments: {testResult.apiTest.appointmentsCount}</p>
              </div>
            ) : (
              <div className="text-red-700">
                <p>✗ Failed (Status: {testResult.apiTest?.status})</p>
                <p className="text-xs mt-1">{testResult.apiTest?.message}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="font-semibold text-blue-900 mb-2">Diagnosis:</p>
            {!testResult.reduxAuth && (
              <p className="text-blue-800 text-xs mb-1">⚠️ Redux not authenticated - Try logging in again</p>
            )}
            {!testResult.localStorageToken && (
              <p className="text-blue-800 text-xs mb-1">⚠️ No token in localStorage - Login required</p>
            )}
            {testResult.apiTest && !testResult.apiTest.success && testResult.apiTest.status === 401 && (
              <p className="text-blue-800 text-xs mb-1">⚠️ 401 Error - Token invalid or expired</p>
            )}
            {testResult.reduxAuth && testResult.localStorageToken && testResult.apiTest?.success && (
              <p className="text-green-700 text-xs">✓ Everything looks good!</p>
            )}
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Clear Storage & Re-login
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;
