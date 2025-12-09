import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, QrCode } from 'lucide-react';
import { toast } from 'react-toastify';

const QRCodeScanner = ({ onScan, onClose }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Load jsQR library
  useEffect(() => {
    if (!window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      stopCamera();
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraReady(true);
            startScanning();
          }).catch(err => {
            console.error('Video play error:', err);
          });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Cannot access camera. Please check permissions.');
      setShowCamera(false);
    }
  }, [stopCamera]);

  const startScanning = useCallback(() => {
    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.paused || video.ended) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }
      
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        if (window.jsQR) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            stopCamera();
            setShowCamera(false);
            onScan(code.data);
            return;
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(scan);
    };
    
    animationRef.current = requestAnimationFrame(scan);
  }, [onScan, stopCamera]);

  // Start camera when showCamera becomes true
  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
  }, [showCamera, startCamera]);

  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setShowCamera(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  // Fullscreen camera view - rendered directly to body via portal
  if (showCamera) {
    return createPortal(
      <div
        id="qr-fullscreen-camera"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          zIndex: 2147483647,
          overflow: 'hidden',
          margin: 0,
          padding: 0
        }}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            backgroundColor: '#000000',
            maxWidth: 'none',
            maxHeight: 'none'
          }}
        />
        
        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Scanning frame overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              width: 250,
              height: 250,
              border: '4px solid #22c55e',
              borderRadius: 20,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}
          >
            {/* Corner markers */}
            <div style={{ position: 'absolute', top: -4, left: -4, width: 30, height: 30, borderTop: '6px solid #22c55e', borderLeft: '6px solid #22c55e', borderRadius: '8px 0 0 0' }} />
            <div style={{ position: 'absolute', top: -4, right: -4, width: 30, height: 30, borderTop: '6px solid #22c55e', borderRight: '6px solid #22c55e', borderRadius: '0 8px 0 0' }} />
            <div style={{ position: 'absolute', bottom: -4, left: -4, width: 30, height: 30, borderBottom: '6px solid #22c55e', borderLeft: '6px solid #22c55e', borderRadius: '0 0 0 8px' }} />
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 30, height: 30, borderBottom: '6px solid #22c55e', borderRight: '6px solid #22c55e', borderRadius: '0 0 8px 0' }} />
            
            {/* Scanning line animation */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 10,
                right: 10,
                height: 3,
                backgroundColor: '#22c55e',
                boxShadow: '0 0 10px #22c55e',
                animation: 'scanLine 2s ease-in-out infinite'
              }}
            />
          </div>
          
          {/* Instructions */}
          <div
            style={{
              position: 'absolute',
              bottom: 120,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 25,
              fontSize: 16,
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            {cameraReady ? 'Point camera at QR code' : 'Starting camera...'}
          </div>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleCloseCamera}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 56,
            height: 56,
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            zIndex: 2147483647
          }}
        >
          <X size={28} color="#ffffff" />
        </button>
        
        {/* CSS for scan animation */}
        <style>{`
          @keyframes scanLine {
            0%, 100% { top: 10px; opacity: 0.5; }
            50% { top: calc(100% - 13px); opacity: 1; }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  // Modal view (when camera is not active)
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647,
        padding: 16
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={28} color="#7c3aed" />
            <span style={{ fontWeight: 'bold', fontSize: 20, color: '#1f2937' }}>Scan QR Code</span>
          </div>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={24} color="#6b7280" />
          </button>
        </div>
        
        {/* Info banner */}
        <div
          style={{
            backgroundColor: '#dbeafe',
            padding: 14,
            borderRadius: 10,
            marginBottom: 20,
            borderLeft: '4px solid #3b82f6'
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: '#1e40af' }}>
            Scan the prescription QR code to quickly dispense medicines and update inventory.
          </p>
        </div>
        
        {/* Open Camera Button */}
        <button
          onClick={handleOpenCamera}
          style={{
            width: '100%',
            padding: 16,
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            fontSize: 17,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          <Camera size={24} />
          Open Camera
        </button>
        
        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
          <span style={{ padding: '0 12px', color: '#9ca3af', fontSize: 14 }}>or enter manually</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
        </div>
        
        {/* Manual Input Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter prescription ID"
            style={{
              width: '100%',
              padding: 14,
              border: '2px solid #e5e7eb',
              borderRadius: 10,
              fontSize: 16,
              marginBottom: 12,
              boxSizing: 'border-box',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#1f2937'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 14,
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Submit
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default QRCodeScanner;
