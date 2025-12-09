import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Calendar, User, Pill } from 'lucide-react';
import axios from '../axios';

const VerifyPrescription = () => {
  const { id } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const { data } = await axios.get(`/prescription/${id}/verify`);
        if (data.success) {
          setPrescription(data.prescription);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to verify prescription');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPrescription();
    }
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying prescription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Verification Success Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Prescription Verified</h1>
            <p className="text-green-100">This is a valid prescription</p>
          </div>

          {/* Prescription Details */}
          <div className="p-6 space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Prescription #{prescription.prescriptionNumber}
                  </h2>
                  <p className="text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(prescription.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor & Patient Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Doctor Information
                </h3>
                <p className="text-gray-700"><strong>Name:</strong> Dr. {prescription.doctor?.name}</p>
                <p className="text-gray-700"><strong>Speciality:</strong> {prescription.doctor?.speciality || 'General Medicine'}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Patient Information
                </h3>
                <p className="text-gray-700"><strong>Name:</strong> {prescription.patient?.name}</p>
                <p className="text-gray-700"><strong>Contact:</strong> {prescription.patient?.contact}</p>
              </div>
            </div>

            {/* Diagnosis */}
            {prescription.diagnosis && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Diagnosis</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-gray-700">{prescription.diagnosis}</p>
                </div>
              </div>
            )}

            {/* Symptoms */}
            {prescription.symptoms && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Symptoms</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-700">{prescription.symptoms}</p>
                </div>
              </div>
            )}

            {/* Medications */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-green-600" />
                Prescribed Medications
              </h3>
              <div className="space-y-4">
                {prescription.medications.map((medication, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 text-lg mb-3">
                      {index + 1}. {medication.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <span className="font-medium text-gray-700">Dosage:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{medication.dosage}</span>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="font-medium text-gray-700">Frequency:</span>
                        <span className="ml-2 text-gray-900 font-semibold">{medication.frequency}</span>
                      </div>
                      {medication.duration && (
                        <div className="bg-white rounded-lg p-3">
                          <span className="font-medium text-gray-700">Duration:</span>
                          <span className="ml-2 text-gray-900 font-semibold">{medication.duration}</span>
                        </div>
                      )}
                      {medication.instructions && (
                        <div className="bg-white rounded-lg p-3 md:col-span-2">
                          <span className="font-medium text-gray-700">Instructions:</span>
                          <p className="mt-1 text-gray-900">{medication.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            {prescription.notes && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">{prescription.notes}</p>
                </div>
              </div>
            )}

            {/* Follow-up Instructions */}
            {prescription.followUpInstructions && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Follow-up Instructions</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-700">{prescription.followUpInstructions}</p>
                </div>
              </div>
            )}

            {/* Validity Notice */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 text-center border-2 border-blue-300">
              <p className="text-sm text-gray-800 font-semibold mb-1">
                ✓ This prescription is digitally verified and valid for 30 days from the date of issue.
              </p>
              <p className="text-xs text-gray-600">
                For any queries, please contact the prescribing doctor.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Print Prescription
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyPrescription;
