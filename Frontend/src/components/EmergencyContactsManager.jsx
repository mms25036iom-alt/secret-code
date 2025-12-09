import { useState, useEffect } from 'react';
import { Phone, Plus, Edit2, Trash2, X, Star } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const EmergencyContactsManager = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        relationship: 'spouse',
        phone: '',
        isPrimary: false
    });

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await axios.get('/api/v1/emergency-contacts');
            if (response.data.success) {
                setContacts(response.data.emergencyContacts);
            }
        } catch (error) {
            console.error('Fetch contacts error:', error);
            toast.error('Failed to load emergency contacts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingContact) {
                const response = await axios.put(
                    `/api/v1/emergency-contacts/${editingContact._id}`,
                    formData
                );
                if (response.data.success) {
                    setContacts(response.data.emergencyContacts);
                    toast.success('Emergency contact updated successfully');
                }
            } else {
                const response = await axios.post('/api/v1/emergency-contacts', formData);
                if (response.data.success) {
                    setContacts(response.data.emergencyContacts);
                    toast.success('Emergency contact added successfully');
                }
            }

            handleCloseModal();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (contactId) => {
        if (!window.confirm('Are you sure you want to remove this emergency contact?')) {
            return;
        }

        try {
            const response = await axios.delete(`/api/v1/emergency-contacts/${contactId}`);
            if (response.data.success) {
                setContacts(response.data.emergencyContacts);
                toast.success('Emergency contact removed successfully');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to remove emergency contact');
        }
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
            isPrimary: contact.isPrimary || false
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingContact(null);
        setFormData({
            name: '',
            relationship: 'spouse',
            phone: '',
            isPrimary: false
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-700 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Emergency Contacts</h3>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Contact
                </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                These contacts will be notified during emergencies (SOS or ambulance requests).
            </p>

            {contacts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Phone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No emergency contacts added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add contacts who should be notified in emergencies</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contacts.map((contact) => (
                        <div
                            key={contact._id}
                            className={`border rounded-lg p-4 transition-colors ${
                                contact.isPrimary
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200 hover:border-red-300'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                            contact.isPrimary ? 'bg-red-200' : 'bg-gray-200'
                                        }`}>
                                            <Phone className={`w-5 h-5 ${
                                                contact.isPrimary ? 'text-red-600' : 'text-gray-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center">
                                                <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                                                {contact.isPrimary && (
                                                    <Star className="w-4 h-4 text-red-600 ml-2 fill-current" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 capitalize">{contact.relationship}</p>
                                        </div>
                                    </div>

                                    <div className="ml-13">
                                        <p className="text-sm text-gray-600 flex items-center">
                                            <Phone className="w-3 h-3 mr-1" />
                                            {contact.phone}
                                        </p>
                                        {contact.isPrimary && (
                                            <p className="text-xs text-red-600 mt-1">Primary Contact</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(contact)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(contact._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Enter name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Relationship *
                                </label>
                                <select
                                    required
                                    value={formData.relationship}
                                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="spouse">Spouse</option>
                                    <option value="parent">Parent</option>
                                    <option value="child">Child</option>
                                    <option value="sibling">Sibling</option>
                                    <option value="friend">Friend</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="10-digit phone number"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isPrimary"
                                    checked={formData.isPrimary}
                                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <label htmlFor="isPrimary" className="ml-2 text-sm text-gray-700">
                                    Set as primary contact
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    {editingContact ? 'Update' : 'Add'} Contact
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyContactsManager;
