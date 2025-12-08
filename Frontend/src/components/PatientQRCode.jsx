import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, Eye, Copy, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from '../axios';

const UserQRCode = ({ userData }) => {
  const [showData, setShowData] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simple data format - just basic info
  const formatSimpleData = () => {
    if (!userData) return '';
    
    return JSON.stringify({
      id: userData._id,
      name: userData.name,
      email: userData.contact,
      role: userData.role,
      ...(userData.role === 'doctor' && { speciality: userData.speciality }),
      system: 'Cureon Healthcare'
    }, null, 2);
  };

  const qrData = formatSimpleData();

  const handleDownloadQR = () => {
    try {
      const svg = document.getElementById('patient-qr-code');
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${userData?.name?.replace(/\s+/g, '-') || 'user'}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      toast.success('QR Code downloaded successfully!');
    } catch (error) {
      console.error('Failed to download QR:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      toast.success('Data copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy data:', err);
      toast.error('Failed to copy data');
    }
  };

  const handleDownloadPDF = async () => {
    const loadingToast = toast.loading('Generating PDF...');
    
    try {
      const response = await axios.get('/patient/data-pdf', {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${userData?.name?.replace(/\s+/g, '-') || 'user'}-data.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.update(loadingToast, {
        render: 'PDF downloaded successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.update(loadingToast, {
        render: 'Failed to download PDF',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  if (!userData) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No user data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* QR Type Badge */}
      <div className="flex justify-center">
        <span className="px-4 py-2 bg-yellow-100 text-gray-800 rounded-full text-sm font-medium">
          Patient Data
        </span>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center">
        <div className="bg-white p-4 md:p-6 rounded-xl border-2 border-gray-200">
          <QRCode
            id="patient-qr-code"
            value={qrData}
            size={200}
            level="M"
          />
        </div>
      </div>

      {/* Action Buttons - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <button
          onClick={handleDownloadQR}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 md:px-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
        >
          <Download className="w-4 h-4" />
          <span>Download QR</span>
        </button>
        
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 md:px-4 md:py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm md:text-base"
        >
          <FileText className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
        
        <button
          onClick={handleCopyData}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 md:px-4 md:py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm md:text-base"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? 'Copied!' : 'Copy Data'}</span>
        </button>
        
        <button
          onClick={() => setShowData(!showData)}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 md:px-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
        >
          <Eye className="w-4 h-4" />
          <span>{showData ? 'Hide' : 'Show'} Data</span>
        </button>
      </div>

      {/* QR Code Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">QR Code Information</h4>
        <ul className="space-y-2 text-xs md:text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Contains basic patient information (ID, name, email, role)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Lightweight and fast to scan</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Safe for sharing with healthcare providers</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Can be scanned by any QR code reader</span>
          </li>
        </ul>
      </div>

      {/* Data Preview */}
      {showData && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">Data Preview</h4>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
            {qrData}
          </pre>
        </div>
      )}
    </div>
  );
};

export default UserQRCode;
