import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Eye, Download, Plus, X } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const MedicalDocuments = ({ userId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newDocument, setNewDocument] = useState({
        name: '',
        file: null,
        description: ''
    });

    useEffect(() => {
        fetchDocuments();
    }, [userId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/medical-documents/${userId}`);
            setDocuments(data.documents || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Failed to load medical documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size should not exceed 10MB');
                return;
            }
            setNewDocument({ ...newDocument, file });
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!newDocument.name || !newDocument.file) {
            toast.error('Please provide document name and file');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('name', newDocument.name);
            formData.append('description', newDocument.description);
            formData.append('document', newDocument.file);

            const { data } = await axios.post('/medical-documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Document uploaded successfully');
            setDocuments([...documents, data.document]);
            setShowUploadModal(false);
            setNewDocument({ name: '', file: null, description: '' });
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error(error.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            await axios.delete(`/medical-documents/${documentId}`);
            toast.success('Document deleted successfully');
            setDocuments(documents.filter(doc => doc._id !== documentId));
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error('Failed to delete document');
        }
    };

    const handleView = (documentUrl) => {
        window.open(documentUrl, '_blank');
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            return '🖼️';
        } else if (extension === 'pdf') {
            return '📄';
        } else if (['doc', 'docx'].includes(extension)) {
            return '📝';
        }
        return '📎';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Medical Documents
                </h2>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Upload Document</span>
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No medical documents uploaded yet</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Upload your first document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                        <div
                            key={doc._id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start space-x-3 flex-1">
                                    <span className="text-2xl">{getFileIcon(doc.fileName)}</span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{formatDate(doc.uploadedAt)}</p>
                                        {doc.description && (
                                            <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleView(doc.url)}
                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>View</span>
                                </button>
                                <a
                                    href={doc.url}
                                    download
                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download</span>
                                </a>
                                <button
                                    onClick={() => handleDelete(doc._id)}
                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Upload Medical Document</h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Document Name *
                                </label>
                                <input
                                    type="text"
                                    value={newDocument.name}
                                    onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                                    placeholder="e.g., Blood Test Report"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newDocument.description}
                                    onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                                    placeholder="Add any notes about this document"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload File *
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                        id="file-upload"
                                        required
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600">
                                            {newDocument.file ? newDocument.file.name : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                                        </p>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalDocuments;
