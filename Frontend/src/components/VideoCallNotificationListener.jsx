import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import VideoCallNotification from './VideoCallNotification';
import { toast } from 'react-toastify';

const VideoCallNotificationListener = () => {
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const [notification, setNotification] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Connect to Socket.IO server for notifications
    // Use the main backend server (port 4000) which has Socket.IO built-in
    const hostname = window.location.hostname;
    const socketUrl = `https://${hostname}:4000`;
    
    console.log('🔔 Connecting to notification socket:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      secure: true,
      rejectUnauthorized: false, // Allow self-signed certificates for localhost
      query: {
        userId: user._id,
        userName: user.name,
        userRole: user.role
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to notification server');
    });

    // Listen for video call notifications
    newSocket.on('user-joining', (data) => {
      console.log('📢 Received video call notification:', data);
      
      // Only show notification if user is not already in a video call
      if (!window.location.pathname.includes('/video-room')) {
        setNotification(data);
        toast.info(`${data.callerName} is joining the video call!`, {
          autoClose: 3000
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from notification server');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleJoinCall = () => {
    setNotification(null);
  };

  if (!notification) {
    return null;
  }

  return (
    <VideoCallNotification
      notification={notification}
      onClose={handleCloseNotification}
      onJoin={handleJoinCall}
    />
  );
};

export default VideoCallNotificationListener;
