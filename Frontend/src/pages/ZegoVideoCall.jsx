import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { toast } from 'react-toastify';

// Platform detection
const isAndroid = /Android/i.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isMobile = isAndroid || isIOS;
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

const ZegoVideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const roomId = searchParams.get('roomID') || 'default-room';
  
  const containerRef = useRef(null);
  const zegoRef = useRef(null);
  
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Hide app navigation and set fullscreen
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';

    // Hide navigation elements
    const navElements = document.querySelectorAll('nav, footer, .navbar, .bottom-nav');
    navElements.forEach(el => {
      if (el) el.style.display = 'none';
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      navElements.forEach(el => {
        if (el) el.style.display = '';
      });
    };
  }, []);

  // Initialize ZegoCloud
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let mounted = true;
    let zp = null;

    const initZego = async () => {
      try {
        setStatus('initializing');
        console.log('🎥 Starting video call initialization...');
        console.log('📱 Platform:', { isAndroid, isCapacitor, isMobile });

        const userId = (user._id || `user_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, '_');
        const userName = user.name || 'User';

        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        console.log('🔑 Config:', { appID, roomId, userId });

        if (!appID || !serverSecret) {
          throw new Error('Video call not configured. Missing ZegoCloud credentials.');
        }

        // Generate token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          userId,
          userName
        );
        console.log('✅ Token generated');

        // Create instance
        zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoRef.current = zp;
        console.log('✅ ZegoUIKit instance created');

        if (!mounted || !containerRef.current) {
          console.log('⚠️ Component unmounted');
          return;
        }

        // Ensure container has dimensions
        containerRef.current.style.width = '100vw';
        containerRef.current.style.height = '100vh';

        // Configuration - simplified for Android compatibility
        const config = {
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          
          // IMPORTANT: Show pre-join view on Android - this helps initialize camera properly
          showPreJoinView: true,
          preJoinViewConfig: {
            title: 'Video Call',
          },
          
          // Video/Audio settings
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          useFrontFacingCamera: true,
          
          // Use lower resolution on mobile for better compatibility
          videoResolutionDefault: isMobile 
            ? ZegoUIKitPrebuilt.VideoResolution_180P 
            : ZegoUIKitPrebuilt.VideoResolution_360P,
          
          // UI Controls
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          showRoomTimer: true,
          showLayoutButton: false,
          showLeavingView: false,
          
          // Callbacks
          onJoinRoom: () => {
            console.log('✅ Joined room:', roomId);
            if (mounted) {
              setStatus('connected');
              toast.success('Connected!', { autoClose: 2000 });
            }
          },
          onLeaveRoom: () => {
            console.log('👋 Left room');
            if (mounted) {
              navigate('/telemedicine');
            }
          },
          onUserJoin: (users) => {
            if (users?.length > 0) {
              toast.success(`${users[0]?.userName || 'User'} joined`, { autoClose: 2000 });
            }
          },
          onUserLeave: () => {
            toast.info('Call ended', { autoClose: 2000 });
          },
        };

        console.log('🚀 Joining room...');
        zp.joinRoom(config);
        
        if (mounted) {
          setStatus('ready');
        }

      } catch (err) {
        console.error('❌ Video call error:', err);
        if (mounted) {
          setError(err.message || 'Failed to start video call');
          setStatus('error');
        }
      }
    };

    // Delay initialization slightly for DOM to be ready
    const timeout = setTimeout(initZego, 500);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (zegoRef.current) {
        try {
          zegoRef.current.destroy();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
        zegoRef.current = null;
      }
    };
  }, [user, roomId, navigate, retryCount]);

  const handleRetry = () => {
    setError(null);
    setStatus('initializing');
    setRetryCount(c => c + 1);
  };

  const handleGoBack = () => {
    if (zegoRef.current) {
      try { zegoRef.current.destroy(); } catch (e) {}
    }
    navigate('/telemedicine');
  };

  // Error Screen
  if (status === 'error') {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorCard}>
          <span style={{ fontSize: 48, marginBottom: 16 }}>📵</span>
          <h2 style={styles.errorTitle}>Connection Failed</h2>
          <p style={styles.errorText}>{error}</p>
          
          {isAndroid && (
            <div style={styles.helpBox}>
              <p style={{ color: '#60a5fa', fontWeight: 600, marginBottom: 8 }}>📱 Troubleshooting:</p>
              <p style={{ color: '#cbd5e1', fontSize: 13 }}>
                1. Go to Settings → Apps → Cureon<br/>
                2. Tap Permissions<br/>
                3. Enable Camera & Microphone<br/>
                4. Try again
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <button onClick={handleRetry} style={styles.primaryBtn}>🔄 Try Again</button>
            <button onClick={handleGoBack} style={styles.secondaryBtn}>← Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (status === 'initializing') {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner}></div>
        <h2 style={{ color: '#fff', marginTop: 24 }}>Starting Video Call...</h2>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>Please allow camera & microphone access</p>
        <button onClick={handleGoBack} style={{ ...styles.secondaryBtn, marginTop: 32 }}>
          ✕ Cancel
        </button>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Main Video Call UI
  return (
    <div style={styles.container}>
      <div ref={containerRef} style={styles.zegoContainer} />
      <button onClick={handleGoBack} style={styles.backButton}>←</button>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 999999,
  },
  zegoContainer: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    border: 'none',
    fontSize: 20,
    zIndex: 1000,
    cursor: 'pointer',
  },
  loadingPage: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    zIndex: 999999,
  },
  spinner: {
    width: 60,
    height: 60,
    border: '4px solid rgba(59, 130, 246, 0.2)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorPage: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    zIndex: 999999,
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    textAlign: 'center',
    maxWidth: 340,
    width: '100%',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 600,
    margin: '0 0 12px',
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 1.5,
    margin: '0 0 16px',
  },
  helpBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    textAlign: 'left',
  },
  primaryBtn: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '14px 24px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    padding: '14px 24px',
    borderRadius: 12,
    fontSize: 16,
    cursor: 'pointer',
    width: '100%',
  },
};

export default ZegoVideoCall;
