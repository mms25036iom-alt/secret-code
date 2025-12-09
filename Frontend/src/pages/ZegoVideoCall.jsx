import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';

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
  const [portalContainer, setPortalContainer] = useState(null);

  // Create portal container and hide app UI
  useLayoutEffect(() => {
    // Create a container for the video call that renders at body level
    const container = document.createElement('div');
    container.id = 'video-call-portal';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:#000;';
    document.body.appendChild(container);
    setPortalContainer(container);

    // Hide navbar, footer, bottom nav
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');
    const bottomNav = document.querySelector('.bottom-nav, [class*="BottomNav"]');
    const mainContent = document.querySelector('.pt-20');
    
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    if (mainContent) mainContent.style.padding = '0';
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Cleanup: restore UI elements
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
      if (mainContent) mainContent.style.padding = '';
      document.body.style.overflow = '';
    };
  }, []);

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

    // Wait for portal container to be ready
    if (!portalContainer) return;

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
  }, [user, roomId, navigate, portalContainer]);

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

  // Render content
  const renderContent = () => {
    if (error) {
      return (
        <div className="error-container">
          <div className="error-box">
            <h2>Error</h2>
            <p>{error}</p>
            <div className="error-buttons">
              <button onClick={() => navigate('/telemedicine')} className="btn-secondary">
                Go Back
              </button>
              <button
                onClick={() => {
                  initAttempted.current = false;
                  setError(null);
                  initVideoCall();
                }}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Connecting to video call...</p>
            <p className="loading-hint">Please allow camera and microphone access</p>
          </div>
        )}
        <div 
          ref={containerRef} 
          className="video-container"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            minWidth: '100vw',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
      </>
    );
  };

  // Use portal to render outside the app layout
  if (!portalContainer) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        zIndex: 99999
      }}>
        <div className="spinner" style={{
          width: 50,
          height: 50,
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return createPortal(
    <div className="video-call-wrapper">
      {renderContent()}
      <style>{`
        .video-call-wrapper {
          width: 100vw;
          height: 100vh;
          position: relative;
          background: #000;
          overflow: hidden;
        }
        
        .video-container {
          width: 100% !important;
          height: 100% !important;
          min-height: 100vh !important;
        }
        
        /* Ensure ZegoCloud elements fill the container */
        .video-container > div {
          width: 100% !important;
          height: 100% !important;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          color: white;
        }
        
        .loading-hint {
          font-size: 14px;
          color: #888;
          margin-top: 8px;
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
        
        .error-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111;
        }
        
        .error-box {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 350px;
          margin: 16px;
          text-align: center;
        }
        
        .error-box h2 {
          color: #dc2626;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .error-box p {
          color: #666;
          margin-bottom: 16px;
        }
        
        .error-buttons {
          display: flex;
          gap: 8px;
        }
        
        .btn-secondary {
          flex: 1;
          padding: 10px 16px;
          background: #e5e7eb;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-primary {
          flex: 1;
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
      `}</style>
    </div>,
    portalContainer
  );
};

export default ZegoVideoCall;
