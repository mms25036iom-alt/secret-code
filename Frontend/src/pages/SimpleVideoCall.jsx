import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const SimpleVideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('roomID');
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [status, setStatus] = useState('Connecting...');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId) {
      toast.error('No room ID provided');
      navigate('/appointments');
      return;
    }

    startCall();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const startCall = async () => {
    try {
      // Get camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to signaling server - use HTTPS for secure connection
      const hostname = window.location.hostname;
      const socketUrl = `https://${hostname}:4000`;
      
      console.log('🔌 Connecting to:', socketUrl);
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        secure: true,
        rejectUnauthorized: false // Allow self-signed certificates for localhost
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        setStatus('Connected - Waiting for other user...');
        socketRef.current.emit('join-room', roomId);
      });

      // Setup WebRTC
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      peerRef.current = peer;

      // Add local stream to peer
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      // Handle remote stream
      peer.ontrack = (event) => {
        console.log('Got remote stream');
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setStatus('Connected');
        toast.success('Call connected!');
      };

      // Handle ICE candidates
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            roomId,
            candidate: event.candidate
          });
        }
      };

      // Socket events
      socketRef.current.on('ready', async () => {
        console.log('Room ready, creating offer');
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('offer', { roomId, offer });
      });

      socketRef.current.on('offer', async (offer) => {
        console.log('Received offer');
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current.emit('answer', { roomId, answer });
      });

      socketRef.current.on('answer', async (answer) => {
        console.log('Received answer');
        await peer.setRemoteDescription(answer);
      });

      socketRef.current.on('ice-candidate', async (candidate) => {
        try {
          await peer.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      });

      socketRef.current.on('user-left', () => {
        toast.info('Other user left the call');
        setStatus('User disconnected');
        setRemoteStream(null);
      });

    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to access camera/microphone');
      setStatus('Failed to start call');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isAudioOn;
      setIsAudioOn(!isAudioOn);
    }
  };

  const endCall = () => {
    cleanup();
    navigate('/appointments');
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - Mobile Optimized */}
      <div className="bg-gray-800 px-3 py-2 sm:px-6 sm:py-4 flex-shrink-0">
        <h1 className="text-white text-base sm:text-xl font-semibold">Video Call</h1>
        <p className="text-gray-400 text-xs sm:text-sm truncate">Room: {roomId} • {status}</p>
      </div>

      {/* Videos - Mobile First Layout */}
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
                <p className="text-sm sm:text-base">Waiting for other user...</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black bg-opacity-50 px-2 py-1 sm:px-3 sm:py-1 rounded text-white text-xs sm:text-sm">
            Other User
          </div>
        </div>

        {/* Local Video - Picture-in-picture on mobile, equal on desktop */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden h-32 sm:h-48 lg:flex-1 lg:h-auto">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 lg:bottom-4 lg:left-4 bg-black bg-opacity-50 px-1.5 py-0.5 sm:px-2 sm:py-1 lg:px-3 lg:py-1 rounded text-white text-xs sm:text-sm">
            You
          </div>
        </div>
      </div>

      {/* Controls - Mobile Optimized */}
      <div className="bg-gray-800 px-3 py-3 sm:px-6 sm:py-6 flex-shrink-0">
        <div className="flex items-center justify-center space-x-3 sm:space-x-4">
          <button
            onClick={toggleVideo}
            className={`p-2.5 sm:p-4 rounded-full ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80 transition-all`}
          >
            {isVideoOn ? <Video size={20} className="sm:w-6 sm:h-6" /> : <VideoOff size={20} className="sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-2.5 sm:p-4 rounded-full ${isAudioOn ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80 transition-all`}
          >
            {isAudioOn ? <Mic size={20} className="sm:w-6 sm:h-6" /> : <MicOff size={20} className="sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={endCall}
            className="p-2.5 sm:p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <PhoneOff size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleVideoCall;
