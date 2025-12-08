import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';
import { toast } from 'react-toastify';

const VideoCallRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  
  const roomId = searchParams.get('roomID') || 'general';
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    // Check if user is loaded
    if (user === undefined) {
      // Still loading, wait
      return;
    }
    
    if (!user) {
      toast.error('Please login to join video call');
      navigate('/login');
      return;
    }

    initializeCall();

    return () => {
      cleanup();
    };
  }, [user]);

  const initializeCall = async () => {
    try {
      // Connect to Socket.IO server - use current hostname for network compatibility
      // Use the main backend server (port 5000) which has Socket.IO built-in
      // For network access with HTTPS frontend, use HTTP backend
      const isHttps = window.location.protocol === 'https:';
      const hostname = window.location.hostname;
      
      // Always use HTTPS for secure connection
      const socketUrl = `https://${hostname}:4000`;
      
      console.log('🔌 Connecting to video call socket:', socketUrl);
      
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        secure: true,
        rejectUnauthorized: false // Allow self-signed certificates for localhost
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Connected to signaling server');
        setConnectionStatus('Connected to server');
        toast.success('Connected to server');
        
        // Send user information when joining room
        console.log(`📞 Joining room: ${roomId} as ${user.name} (${user.role})`);
        socketRef.current.emit('join-room', {
          roomId,
          userName: user.name,
          userRole: user.role
        });
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnectionStatus('Connection failed');
        toast.error('Failed to connect to server');
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        toast.info('Reconnected to server');
      });

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionStatus('Waiting for other participant...');

      // Setup WebRTC
      setupWebRTC(stream);

      // Socket event listeners
      socketRef.current.on('ready', () => {
        console.log('✅ Both users in room, creating offer');
        setConnectionStatus('Connecting to peer...');
        createOffer();
      });

      socketRef.current.on('offer', async (offer) => {
        console.log('📥 Received offer');
        await handleOffer(offer);
      });

      socketRef.current.on('answer', async (answer) => {
        console.log('📥 Received answer');
        await handleAnswer(answer);
      });

      socketRef.current.on('ice-candidate', async (candidate) => {
        console.log('📥 Received ICE candidate');
        await handleIceCandidate(candidate);
      });

      socketRef.current.on('room-full', () => {
        toast.error('Room is full. Please try another room.');
        setConnectionStatus('Room is full');
      });

      socketRef.current.on('user-left', (data) => {
        console.log('👋 User left:', data);
        toast.info(`${data?.userName || 'Other participant'} left the call`);
        setConnectionStatus('Other participant left');
        setRemoteStream(null);
      });

      socketRef.current.on('room-users', (data) => {
        console.log('👥 Room users:', data);
        const otherUser = data.users.find(u => u.userName !== user.name);
        if (otherUser) {
          toast.info(`${otherUser.userName} (${otherUser.userRole}) joined the call`);
        }
      });

    } catch (error) {
      console.error('❌ Error initializing call:', error);
      toast.error('Failed to access camera/microphone. Please check permissions.');
      setConnectionStatus('Failed to initialize');
    }
  };

  const setupWebRTC = (stream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, stream);
    });

    // Handle incoming remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('✅ Received remote stream');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setConnectionStatus('Connected');
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('📤 Sending ICE candidate');
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
      setConnectionStatus(peerConnectionRef.current.connectionState);
    };
  };

  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('📤 Sending offer');
      socketRef.current.emit('offer', { roomId, offer });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  const handleOffer = async (offer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('📤 Sending answer');
      socketRef.current.emit('answer', { roomId, answer });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        screenStreamRef.current = screenStream;
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(videoTrack);
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        // Handle screen share stop
        videoTrack.onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('❌ Error toggling screen share:', error);
      toast.error('Failed to share screen');
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Restore camera video
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
      sender.replaceTrack(videoTrack);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }
    
    setIsScreenSharing(false);
  };

  const endCall = () => {
    cleanup();
    navigate('/telemedicine');
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - Mobile Optimized */}
      <div className="bg-gray-800 px-3 py-2 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-white text-base sm:text-xl font-semibold truncate">Video Consultation</h1>
          <p className="text-gray-400 text-xs sm:text-sm truncate">Room: {roomId} • {connectionStatus}</p>
        </div>
        <div className="text-white text-xs sm:text-sm ml-2 truncate">
          {user?.name} ({user?.role})
        </div>
      </div>

      {/* Video Grid - Mobile First Layout */}
      <div className="flex-1 p-2 sm:p-4 flex flex-col lg:flex-row gap-2 sm:gap-4 min-h-0">
        {/* Remote Video - Main video on mobile, equal on desktop */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden flex-1 min-h-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Video size={48} className="sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Waiting for other participant...</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black bg-opacity-50 px-2 py-1 sm:px-3 sm:py-1 rounded text-white text-xs sm:text-sm">
            Remote User
          </div>
        </div>

        {/* Local Video - Picture-in-picture on mobile, equal on desktop */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden h-32 sm:h-48 lg:flex-1 lg:h-auto">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 lg:bottom-4 lg:left-4 bg-black bg-opacity-50 px-1.5 py-0.5 sm:px-2 sm:py-1 lg:px-3 lg:py-1 rounded text-white text-xs sm:text-sm">
            You {isScreenSharing && '(Screen Sharing)'}
          </div>
        </div>
      </div>

      {/* Controls - Mobile Optimized */}
      <div className="bg-gray-800 px-3 py-3 sm:px-6 sm:py-6 flex-shrink-0">
        <div className="flex items-center justify-center space-x-3 sm:space-x-4">
          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`p-2.5 sm:p-4 rounded-full transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video size={20} className="sm:w-6 sm:h-6" /> : <VideoOff size={20} className="sm:w-6 sm:h-6" />}
          </button>

          {/* Toggle Audio */}
          <button
            onClick={toggleAudio}
            className={`p-2.5 sm:p-4 rounded-full transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <Mic size={20} className="sm:w-6 sm:h-6" /> : <MicOff size={20} className="sm:w-6 sm:h-6" />}
          </button>

          {/* Toggle Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-2.5 sm:p-4 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorOff size={20} className="sm:w-6 sm:h-6" /> : <Monitor size={20} className="sm:w-6 sm:h-6" />}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="p-2.5 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="End call"
          >
            <PhoneOff size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default VideoCallRoom;
