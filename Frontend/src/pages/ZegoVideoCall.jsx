import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { toast } from 'react-toastify';

const ZegoVideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const roomId = searchParams.get('roomID');
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to join video call');
      navigate('/login');
      return;
    }

    if (!roomId) {
      toast.error('No room ID provided');
      navigate('/appointments');
      return;
    }

    // Prevent double initialization
    if (initAttempted.current) return;
    initAttempted.current = true;

    // Initialize video call after container is ready
    const initTimeout = setTimeout(() => {
      initVideoCall();
    }, 500);

    return () => {
      clearTimeout(initTimeout);
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, [user, roomId, navigate]);

  const initVideoCall = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify container is ready
      if (!containerRef.current) {
        console.error('Container not ready, retrying...');
        setTimeout(() => initVideoCall(), 500);
        return;
      }

      const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      console.log('🎥 Initializing video call...');
      console.log('📍 Room ID:', roomId);
      console.log('👤 User:', user?.name);
      console.log('🔑 App ID:', appID);

      if (!appID || !serverSecret) {
        setError('Video call configuration missing.');
        setIsLoading(false);
        return;
      }

      // Generate unique user ID
      const odUserId = user._id || `user_${Date.now()}`;
      const userName = user.name || 'User';

      // Generate Kit Token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        odUserId,
        userName
      );

      // Create instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      // Join room with proper video configuration
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: true,
        showTextChat: true,
        showUserList: true,
        maxUsers: 10,
        layout: "Auto",
        showLayoutButton: true,
        showNonVideoUser: true,
        showOnlyAudioUser: true,
        showPreJoinView: true,
        preJoinViewConfig: {
          title: "Video Consultation",
        },
        onJoinRoom: () => {
          console.log('✅ Joined room successfully');
          setIsLoading(false);
          toast.success('Joined video call!');
        },
        onLeaveRoom: () => {
          console.log('👋 Left room');
          navigate('/telemedicine');
        },
        onUserJoin: (users) => {
          if (users?.length > 0) {
            toast.info(`${users[0]?.userName || 'Someone'} joined`);
          }
        },
        onUserLeave: (users) => {
          if (users?.length > 0) {
            toast.info(`${users[0]?.userName || 'Someone'} left`);
          }
        },
      });

      // Fallback to hide loading
      setTimeout(() => setIsLoading(false), 3000);

    } catch (error) {
      console.error('❌ Error:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/telemedicine')}
              className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                initAttempted.current = false;
                setError(null);
                initVideoCall();
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-page">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Connecting...</p>
        </div>
      )}
      <div ref={containerRef} className="video-container" />
      
      <style>{`
        .video-call-page {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: #000;
          overflow: hidden;
        }
        
        .video-container {
          width: 100%;
          height: 100%;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          color: white;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ZegoVideoCall;
