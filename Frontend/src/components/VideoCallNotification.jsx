import { useState, useEffect } from 'react';
import { Video, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const VideoCallNotification = ({ notification, onClose, onJoin }) => {
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available');
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleJoin = () => {
    onJoin();
    navigate(`/video-room?roomID=${notification.roomId}`);
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] animate-slideIn">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 p-6 max-w-md w-96">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Video Call Invitation</h3>
              <p className="text-sm text-gray-500">Incoming call...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">{notification.callerName}</span> is joining the video call
          </p>
          <p className="text-sm text-gray-600">
            {notification.callerRole === 'doctor' ? 'Doctor' : 'Patient'} • Room: {notification.roomId}
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Auto-dismiss in:</span>
            <span className="font-semibold text-blue-600">{countdown}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Dismiss
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Video className="w-4 h-4" />
            <span>Join Call</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VideoCallNotification;
