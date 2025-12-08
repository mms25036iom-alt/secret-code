import { useEffect, useRef } from 'react';
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

    initVideoCall();
  }, [user, roomId]);

  const initVideoCall = async () => {
    try {
      const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      if (!appID || !serverSecret) {
        toast.error('Video call configuration missing');
        return;
      }

      // Generate Kit Token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        user._id,
        user.name
      );

      // Create instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);

      // Start call
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall, // 1-on-1 call
        },
        showScreenSharingButton: true,
        showPreJoinView: false, // Skip preview, join directly
        onLeaveRoom: () => {
          navigate('/appointments');
        },
      });

      toast.success('Joined video call!');
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error('Failed to start video call');
    }
  };

  return (
    <div className="w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default ZegoVideoCall;
