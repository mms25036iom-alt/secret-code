import { useState } from 'react';
import PropTypes from 'prop-types';
import { isMobile, takePicture, pickImage, requestCameraPermission } from '../utils/mobile.utils';
import { Camera, Image as ImageIcon } from 'lucide-react';

/**
 * Mobile-Compatible Image Upload Component
 * Works on both web and mobile (Capacitor)
 * 
 * Features:
 * - Camera capture on mobile
 * - Gallery picker on mobile
 * - File input fallback for web
 * - Image preview
 * - Permission handling
 */
const MobileImageUpload = ({ onImageSelect, label = "Upload Image", accept = "image/*" }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCapture = async () => {
    setError(null);
    setLoading(true);

    try {
      if (isMobile()) {
        // Mobile: Use Capacitor Camera
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setError('Camera permission is required');
          setLoading(false);
          return;
        }
        
        const imageData = await takePicture();
        setPreview(imageData);
        
        // Convert data URL to File object for consistency
        const response = await fetch(imageData);
        const blob = await response.blob();
        const file = new File([blob], 'camera-image.jpg', { type: 'image/jpeg' });
        
        onImageSelect(file, imageData);
      } else {
        // Web: Use file input with camera
        document.getElementById('camera-input').click();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to capture image');
    } finally {
      setLoading(false);
    }
  };

  const handleGallery = async () => {
    setError(null);
    setLoading(true);

    try {
      if (isMobile()) {
        // Mobile: Use Capacitor Photo Picker
        const imageData = await pickImage();
        setPreview(imageData);
        
        // Convert data URL to File object
        const response = await fetch(imageData);
        const blob = await response.blob();
        const file = new File([blob], 'gallery-image.jpg', { type: 'image/jpeg' });
        
        onImageSelect(file, imageData);
      } else {
        // Web: Use file input
        document.getElementById('gallery-input').click();
      }
    } catch (err) {
      console.error('Gallery error:', err);
      setError('Failed to select image');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setPreview(reader.result);
        onImageSelect(file, reader.result);
        setLoading(false);
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageSelect(null, null);
  };

  return (
    <div className="mobile-image-upload w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative mb-4 rounded-lg overflow-hidden border-2 border-gray-200">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-64 object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Upload Buttons */}
      {!preview && (
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Button */}
          <button
            onClick={handleCapture}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              {loading ? 'Opening...' : 'Take Photo'}
            </span>
          </button>

          {/* Gallery Button */}
          <button
            onClick={handleGallery}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              {loading ? 'Opening...' : 'Choose from Gallery'}
            </span>
          </button>
        </div>
      )}

      {/* Hidden File Inputs for Web Fallback */}
      <input
        id="camera-input"
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        id="gallery-input"
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-500">
        {isMobile() 
          ? 'Take a photo or choose from your gallery' 
          : 'Click to upload an image from your device'}
      </p>
    </div>
  );
};

MobileImageUpload.propTypes = {
  onImageSelect: PropTypes.func.isRequired,
  label: PropTypes.string,
  accept: PropTypes.string
};

export default MobileImageUpload;
