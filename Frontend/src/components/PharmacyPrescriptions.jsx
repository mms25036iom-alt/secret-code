import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../axios';
import { FileText, CheckCircle, Clock, XCircle, QrCode, Package } from 'lucide-react';
import QRCodeScanner from './QRCodeScanner';

const PharmacyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, dispensed
  const [showScanner, setShowScanner] = useState(false);
  const [dispensing, setDispensing] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/prescriptions');
      if (response.data.success) {
        setPrescriptions(response.data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (prescriptionId) => {
    if (!window.confirm('⚠️ Confirm Dispensing\n\nThis will:\n• Mark prescription as dispensed\n• Deduct medicines from inventory\n• Update stock levels\n\nContinue?')) {
      return;
    }

    try {
      setDispensing(prescriptionId);
      const response = await axios.put(`/prescription/${prescriptionId}/dispense`);
      
      if (response.data.success) {
        // Success notification
        toast.success('✅ Prescription dispensed successfully!', {
          position: 'top-center',
          autoClose: 3000
        });
        
        // Show detailed stock updates
        if (response.data.stockUpdates && response.data.stockUpdates.length > 0) {
          const stockSummary = response.data.stockUpdates.map(update => 
            `• ${update.medicine}: -${update.quantityDispensed} (${update.remainingStock} left)`
          ).join('\n');
          
          toast.info(`📦 Inventory Updated:\n${stockSummary}`, {
            position: 'top-right',
            autoClose: 5000,
            style: { whiteSpace: 'pre-line' }
          });
        }
        
        // Refresh prescriptions list
        await fetchPrescriptions();
        
        // Play success sound (optional)
        if (window.Capacitor?.isNativePlatform()) {
          // Haptic feedback on mobile
          try {
            await window.Capacitor.Plugins.Haptics?.impact({ style: 'medium' });
          } catch (e) {
            console.log('Haptics not available');
          }
        }
      }
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      
      if (error.response?.data?.insufficientStock) {
        const insufficient = error.response.data.insufficientStock;
        
        // Create detailed error message
        const stockIssues = insufficient.map(item => {
          if (item.reason) {
            return `• ${item.name}: ${item.reason}`;
          }
          return `• ${item.name}: Need ${item.needed}, only ${item.available} available`;
        }).join('\n');
        
        toast.error(`❌ Insufficient Stock:\n\n${stockIssues}\n\nPlease restock before dispensing.`, {
          position: 'top-center',
          autoClose: 8000,
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to dispense prescription');
      }
    } finally {
      setDispensing(null);
    }
  };

  const handleQRScan = async (data) => {
    try {
      const prescriptionData = JSON.parse(data);
      const prescriptionId = prescriptionData.id;
      
      // Check if QR code is marked as invalid
      if (prescriptionData.isValid === false) {
        toast.error('❌ Invalid QR Code!\n\nThis prescription has already been dispensed and the QR code is no longer valid.', {
          position: 'top-center',
          autoClose: 5000,
          style: { whiteSpace: 'pre-line' }
        });
        setShowScanner(false);
        return;
      }
      
      // Find prescription in list
      const prescription = prescriptions.find(p => p._id === prescriptionId);
      
      if (!prescription) {
        toast.error('❌ Prescription not found in your pharmacy');
        setShowScanner(false);
        return;
      }
      
      if (prescription.pharmacyStatus === 'dispensed') {
        toast.error('⚠️ Already Dispensed!\n\nThis prescription was already dispensed on ' + 
          new Date(prescription.dispensedAt).toLocaleDateString() + 
          '. The QR code is no longer valid.', {
          position: 'top-center',
          autoClose: 6000,
          style: { whiteSpace: 'pre-line' }
        });
        setShowScanner(false);
        return;
      }
      
      // Dispense the prescription
      await handleDispense(prescriptionId);
      setShowScanner(false);
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast.error('Invalid QR code format');
      setShowScanner(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (filter === 'all') return true;
    return p.pharmacyStatus === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
          <p className="text-gray-600">Manage and dispense prescriptions</p>
        </div>
        
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
        >
          <QrCode className="w-6 h-6" />
          <span>Scan QR Code</span>
        </button>
      </div>

      {/* Floating QR Scanner Button - Mobile */}
      <button
        onClick={() => setShowScanner(true)}
        className="fixed bottom-20 right-4 md:hidden w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center z-20 animate-pulse hover:animate-none transform hover:scale-110 transition-all"
        aria-label="Scan QR Code"
      >
        <QrCode className="w-8 h-8" />
      </button>

      {/* Quick Guide Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <QrCode className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-purple-900 mb-1">Quick Dispensing with QR Code</h3>
            <p className="text-xs text-purple-700">
              Click "Scan QR Code" button → Scan prescription QR → Automatically dispense & update inventory
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-800 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">
                {prescriptions.filter(p => p.pharmacyStatus === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 text-sm font-medium">Dispensed</p>
              <p className="text-2xl font-bold text-green-900">
                {prescriptions.filter(p => p.pharmacyStatus === 'dispensed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 text-sm font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{prescriptions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('dispensed')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'dispensed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Dispensed
        </button>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No prescriptions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <div key={prescription._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Prescription #{prescription.prescriptionNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Created: {formatDate(prescription.createdAt)}
                  </p>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prescription.pharmacyStatus === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : prescription.pharmacyStatus === 'dispensed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {prescription.pharmacyStatus.charAt(0).toUpperCase() + prescription.pharmacyStatus.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-medium text-gray-900">{prescription.patient?.name}</p>
                  <p className="text-sm text-gray-600">{prescription.patient?.contact}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <p className="font-medium text-gray-900">Dr. {prescription.doctor?.name}</p>
                  <p className="text-sm text-gray-600">{prescription.doctor?.speciality}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Medications:</p>
                <div className="space-y-2">
                  {prescription.medications.map((med, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="font-medium text-blue-900">{idx + 1}. {med.name}</p>
                      <p className="text-sm text-blue-700">
                        {med.dosage} | {med.frequency} | {med.duration}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {prescription.pharmacyStatus === 'pending' && (
                <button
                  onClick={() => handleDispense(prescription._id)}
                  disabled={dispensing === prescription._id}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {dispensing === prescription._id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Dispensing...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      <span>Dispense Prescription</span>
                    </>
                  )}
                </button>
              )}

              {prescription.pharmacyStatus === 'dispensed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">
                    <strong>Dispensed on:</strong> {formatDate(prescription.dispensedAt)}
                  </p>
                  {prescription.dispensedBy && (
                    <p className="text-green-700 text-sm">
                      <strong>By:</strong> {prescription.dispensedBy.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default PharmacyPrescriptions;
