import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Phone, User } from 'lucide-react';
import axios from '../axios';
import { toast } from 'react-toastify';

const FamilyMembersManager = () => {
    const [familyMembers, setFamilyMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        relationship: 'spouse',
        age: '',
        gender: 'male',
        phone: '',
        medicalConditions: ''
    });

    useEffect(() => {
        fetchFamilyMembers();
    }, []);

    const fetchFamilyMembers = async () => {
        try {
            const response = await axios.get('/api/v1/family-members');
            if (response.data.success) {
                setFamilyMembers(response.data.familyMembers);
            }
        } catch (error) {
            console.error('Fetch family members error:', error);
            toast.error('Failed to load family members');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingMember) {
                // Update existing member
                const response = await axios.put(
                    `/api/v1/family-members/${editingMember._id}`,
                    formData
                );
                if (response.data.success) {
                    setFamilyMembers(response.data.familyMembers);
                    toast.success('Family member updated successfully');
                }
            } else {
                // Add new member
                const response = await axios.post('/api/v1/family-members', formData);
                if (response.data.success) {
                    setFamilyMembers(response.data.familyMembers);
                    toast.success('Family member added successfully');
                }
            }

            handleCloseModal();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this family member?')) {
            return;
        }

        try {
            const response = await axios.delete(`/api/v1/family-members/${memberId}`);
            if (response.data.success) {
                setFamilyMembers(response.data.familyMembers);
                toast.success('Family member removed successfully');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to remove family member');
        }
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            relationship: member.relationship,
            age: member.age || '',
            gender: member.gender || 'male',
            phone: member.phone || '',
            medicalConditions: member.medicalConditions || ''
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingMember(null);
        setFormData({
            name: '',
            relationship: 'spouse',
            age: '',
            gender: 'male',
            phone: '',
            medicalConditions: ''
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
                    <Users className="w-5 h-5 text-gray-700 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Family Members</h3>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Member
                </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Add family members to book appointments on their behalf.
            </p>

            {familyMembers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No family members added yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {familyMembers.map((member) => (
                        <div
                            key={member._id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                            <User className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{member.name}</h4>
                                            <p className="text-sm text-gray-500 capitalize">{member.relationship}</p>
                                        </div>
                                    </div>

                                    <div className="ml-13 space-y-1">
                                        {member.age && (
                                            <p className="text-sm text-gray-600">Age: {member.age} years</p>
                                        )}
                                        {member.gender && (
                                            <p className="text-sm text-gray-600 capitalize">Gender: {member.gender}</p>
                                        )}
                                        {member.phone && (
                                            <p className="text-sm text-gray-600 flex items-center">
                                                <Phone className="w-3 h-3 mr-1" />
                                                {member.phone}
                                            </p>
                                        )}
                                        {member.medicalConditions && (
                                            <p className="text-sm text-gray-600">
                                                Medical: {member.medicalConditions}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member._id)}
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
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="spouse">Spouse</option>
                                    <option value="parent">Parent</option>
                                    <option value="child">Child</option>
                                    <option value="sibling">Sibling</option>
                                    <option value="grandparent">Grandparent</option>
                                    <option value="grandchild">Grandchild</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="150"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Age"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gender
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    pattern="[0-9]{10}"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="10-digit phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Medical Conditions
                                </label>
                                <textarea
                                    value={formData.medicalConditions}
                                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows="3"
                                    placeholder="Any medical conditions or allergies"
                                    maxLength={500}
                                />
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
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    {editingMember ? 'Update' : 'Add'} Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyMembersManager;
