import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from '../axios';

const DebugAppointments = () => {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkAppointments = async () => {
    setLoading(true);
    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      console.log('🔑 Token check:', token ? 'Present' : 'Missing');
      
      const response = await axios.get('/appointment/debug/check');
      const data = response.data;
      setDebugData(data);
      console.log('🔍 Debug Data:', data);
      toast.success(`Found ${data.count} appointments`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch debug data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={checkAppointments}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
      >
        {loading ? 'Checking...' : '🔍 Debug Appointments'}
      </button>
      
      {debugData && (
        <div className="mt-4 bg-white rounded-lg shadow-2xl p-4 max-w-2xl max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Debug Info</h3>
            <button
              onClick={() => setDebugData(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <p><strong>User Role:</strong> {debugData.userRole}</p>
            <p><strong>User ID:</strong> {debugData.userId}</p>
            <p><strong>Total Appointments:</strong> {debugData.count}</p>
            
            <div className="mt-4">
              <strong>Appointments:</strong>
              <div className="mt-2 space-y-2">
                {debugData.appointments?.map((apt, idx) => (
                  <div key={apt.id} className="bg-gray-50 p-3 rounded border">
                    <p className="font-semibold">#{idx + 1} - {apt.status}</p>
                    <p className="text-xs text-gray-600">ID: {apt.id}</p>
                    <p className="text-xs">Date: {apt.day} at {apt.time}</p>
                    {apt.patient ? (
                      <div className="mt-1 text-green-700">
                        <p>✓ Patient: {apt.patient.name}</p>
                        <p className="text-xs">ID: {apt.patient.id}</p>
                        <p className="text-xs">Contact: {apt.patient.contact}</p>
                      </div>
                    ) : (
                      <p className="text-red-600">✗ No patient data!</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugAppointments;
