import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddPatient.css';

const AddPatient = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        phone: '',
        address: {
            village: 'Nabha',
            houseNo: '',
            landmark: ''
        },
        husbandName: '',
        husbandPhone: '',
        pregnancyDetails: {
            lmp: '',
            edd: '',
            gravida: 1,
            para: 0,
            abortion: 0,
            living: 0
        },
        medicalHistory: {
            bloodGroup: 'Unknown',
            previousComplications: '',
            chronicDiseases: [],
            allergies: [],
            currentMedications: []
        },
        emergencyContact: {
            name: '',
            relation: '',
            phone: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const calculateEDD = (lmp) => {
        if (!lmp) return '';
        const lmpDate = new Date(lmp);
        lmpDate.setDate(lmpDate.getDate() + 280); // Add 40 weeks
        return lmpDate.toISOString().split('T')[0];
    };

    const handleLMPChange = (e) => {
        const lmp = e.target.value;
        const edd = calculateEDD(lmp);
        
        setFormData(prev => ({
            ...prev,
            pregnancyDetails: {
                ...prev.pregnancyDetails,
                lmp,
                edd
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('ashaToken');
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/patients`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                alert('Patient registered successfully!');
                navigate('/asha/patients');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-patient-container">
            <div className="add-patient-header">
                <button onClick={() => navigate('/asha/dashboard')} className="back-btn">
                    ← Back
                </button>
                <h1>Register New Pregnant Patient</h1>
            </div>

            <form onSubmit={handleSubmit} className="add-patient-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-section">
                    <h2>Personal Information</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Patient Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Age *</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                min="15"
                                max="50"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Village</label>
                            <input
                                type="text"
                                name="address.village"
                                value={formData.address.village}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>House No</label>
                            <input
                                type="text"
                                name="address.houseNo"
                                value={formData.address.houseNo}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Landmark</label>
                            <input
                                type="text"
                                name="address.landmark"
                                value={formData.address.landmark}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Family Information</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Husband Name *</label>
                            <input
                                type="text"
                                name="husbandName"
                                value={formData.husbandName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Husband Phone</label>
                            <input
                                type="tel"
                                name="husbandPhone"
                                value={formData.husbandPhone}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Pregnancy Details</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Last Menstrual Period (LMP) *</label>
                            <input
                                type="date"
                                name="pregnancyDetails.lmp"
                                value={formData.pregnancyDetails.lmp}
                                onChange={handleLMPChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Expected Delivery Date (EDD)</label>
                            <input
                                type="date"
                                name="pregnancyDetails.edd"
                                value={formData.pregnancyDetails.edd}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Gravida (Total Pregnancies)</label>
                            <input
                                type="number"
                                name="pregnancyDetails.gravida"
                                value={formData.pregnancyDetails.gravida}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>

                        <div className="form-group">
                            <label>Para (Live Births)</label>
                            <input
                                type="number"
                                name="pregnancyDetails.para"
                                value={formData.pregnancyDetails.para}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Abortion</label>
                            <input
                                type="number"
                                name="pregnancyDetails.abortion"
                                value={formData.pregnancyDetails.abortion}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Living Children</label>
                            <input
                                type="number"
                                name="pregnancyDetails.living"
                                value={formData.pregnancyDetails.living}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Medical History</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Blood Group</label>
                            <select
                                name="medicalHistory.bloodGroup"
                                value={formData.medicalHistory.bloodGroup}
                                onChange={handleChange}
                            >
                                <option value="Unknown">Unknown</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label>Previous Complications</label>
                            <textarea
                                name="medicalHistory.previousComplications"
                                value={formData.medicalHistory.previousComplications}
                                onChange={handleChange}
                                rows="3"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Emergency Contact</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Name</label>
                            <input
                                type="text"
                                name="emergencyContact.name"
                                value={formData.emergencyContact.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Relation</label>
                            <input
                                type="text"
                                name="emergencyContact.relation"
                                value={formData.emergencyContact.relation}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="emergencyContact.phone"
                                value={formData.emergencyContact.phone}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/asha/dashboard')} className="cancel-btn">
                        Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Registering...' : 'Register Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPatient;
