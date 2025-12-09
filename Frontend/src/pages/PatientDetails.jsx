import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './PatientDetails.css';

const PatientDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [showMedicineForm, setShowMedicineForm] = useState(false);

    const [followUpData, setFollowUpData] = useState({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        bloodPressure: { systolic: '', diastolic: '' },
        hemoglobin: '',
        complaints: '',
        findings: '',
        advice: '',
        nextVisitDate: '',
        referredToDoctor: false,
        referralReason: ''
    });

    const [medicineData, setMedicineData] = useState({
        name: '',
        dosage: '',
        frequency: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        prescribedBy: '',
        notes: ''
    });

    useEffect(() => {
        fetchPatientDetails();
    }, [id]);

    const fetchPatientDetails = async () => {
        try {
            const token = localStorage.getItem('ashaToken');
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/patients/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setPatient(response.data.patient);
            }
        } catch (error) {
            console.error('Error fetching patient:', error);
            alert('Failed to load patient details');
        } finally {
            setLoading(false);
        }
    };

    const handleFollowUpSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('ashaToken');
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/patients/${id}/followup`,
                followUpData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                alert('Follow-up added successfully!');
                setShowFollowUpForm(false);
                fetchPatientDetails();
                // Reset form
                setFollowUpData({
                    date: new Date().toISOString().split('T')[0],
                    weight: '',
                    bloodPressure: { systolic: '', diastolic: '' },
                    hemoglobin: '',
                    complaints: '',
                    findings: '',
                    advice: '',
                    nextVisitDate: '',
                    referredToDoctor: false,
                    referralReason: ''
                });
            }
        } catch (error) {
            alert('Failed to add follow-up');
        }
    };

    const handleMedicineSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('ashaToken');
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/patients/${id}/medicines`,
                medicineData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                alert('Medicine added successfully!');
                setShowMedicineForm(false);
                fetchPatientDetails();
                // Reset form
                setMedicineData({
                    name: '',
                    dosage: '',
                    frequency: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                    prescribedBy: '',
                    notes: ''
                });
            }
        } catch (error) {
            alert('Failed to add medicine');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN');
    };

    if (loading) {
        return <div className="loading">Loading patient details...</div>;
    }

    if (!patient) {
        return <div className="error">Patient not found</div>;
    }

    return (
        <div className="patient-details-container">
            <div className="patient-details-header">
                <button onClick={() => navigate('/asha/patients')} className="back-btn">
                    ← Back to Patients
                </button>
                <h1>{patient.name}</h1>
            </div>

            <div className="patient-summary-card">
                <div className="summary-row">
                    <div className="summary-item">
                        <span className="label">Age:</span>
                        <span className="value">{patient.age} years</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Phone:</span>
                        <span className="value">{patient.phone}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Current Week:</span>
                        <span className="value">Week {patient.pregnancyDetails.currentWeek || 'N/A'}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">EDD:</span>
                        <span className="value">{formatDate(patient.pregnancyDetails.edd)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Status:</span>
                        <span className={`status-badge ${patient.status.toLowerCase()}`}>
                            {patient.status}
                        </span>
                    </div>
                    {patient.riskFactors?.highRisk && (
                        <div className="summary-item high-risk">
                            <span className="value">⚠️ High Risk</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="tabs">
                <button
                    className={activeTab === 'overview' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={activeTab === 'followups' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('followups')}
                >
                    Follow-ups ({patient.followUps?.length || 0})
                </button>
                <button
                    className={activeTab === 'medicines' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('medicines')}
                >
                    Medicines ({patient.medicines?.length || 0})
                </button>
                <button
                    className={activeTab === 'medical' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('medical')}
                >
                    Medical History
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-content">
                        <div className="info-section">
                            <h3>Personal Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Village:</span>
                                    <span>{patient.address.village}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">House No:</span>
                                    <span>{patient.address.houseNo || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Husband:</span>
                                    <span>{patient.husbandName}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Husband Phone:</span>
                                    <span>{patient.husbandPhone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="info-section">
                            <h3>Pregnancy Details</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">LMP:</span>
                                    <span>{formatDate(patient.pregnancyDetails.lmp)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Gravida:</span>
                                    <span>{patient.pregnancyDetails.gravida}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Para:</span>
                                    <span>{patient.pregnancyDetails.para}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Living:</span>
                                    <span>{patient.pregnancyDetails.living}</span>
                                </div>
                            </div>
                        </div>

                        <div className="info-section">
                            <h3>Visit Schedule</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Last Visit:</span>
                                    <span>{formatDate(patient.lastVisitDate)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Next Visit:</span>
                                    <span className={patient.nextScheduledVisit && new Date(patient.nextScheduledVisit) < new Date() ? 'overdue' : ''}>
                                        {formatDate(patient.nextScheduledVisit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'followups' && (
                    <div className="followups-content">
                        <button
                            className="add-btn"
                            onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                        >
                            {showFollowUpForm ? 'Cancel' : '+ Add Follow-up'}
                        </button>

                        {showFollowUpForm && (
                            <form onSubmit={handleFollowUpSubmit} className="followup-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Visit Date *</label>
                                        <input
                                            type="date"
                                            value={followUpData.date}
                                            onChange={(e) => setFollowUpData({...followUpData, date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={followUpData.weight}
                                            onChange={(e) => setFollowUpData({...followUpData, weight: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>BP Systolic</label>
                                        <input
                                            type="number"
                                            value={followUpData.bloodPressure.systolic}
                                            onChange={(e) => setFollowUpData({
                                                ...followUpData,
                                                bloodPressure: {...followUpData.bloodPressure, systolic: e.target.value}
                                            })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>BP Diastolic</label>
                                        <input
                                            type="number"
                                            value={followUpData.bloodPressure.diastolic}
                                            onChange={(e) => setFollowUpData({
                                                ...followUpData,
                                                bloodPressure: {...followUpData.bloodPressure, diastolic: e.target.value}
                                            })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Hemoglobin (g/dL)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={followUpData.hemoglobin}
                                            onChange={(e) => setFollowUpData({...followUpData, hemoglobin: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Complaints</label>
                                    <textarea
                                        value={followUpData.complaints}
                                        onChange={(e) => setFollowUpData({...followUpData, complaints: e.target.value})}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Findings</label>
                                    <textarea
                                        value={followUpData.findings}
                                        onChange={(e) => setFollowUpData({...followUpData, findings: e.target.value})}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Advice</label>
                                    <textarea
                                        value={followUpData.advice}
                                        onChange={(e) => setFollowUpData({...followUpData, advice: e.target.value})}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Next Visit Date</label>
                                        <input
                                            type="date"
                                            value={followUpData.nextVisitDate}
                                            onChange={(e) => setFollowUpData({...followUpData, nextVisitDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={followUpData.referredToDoctor}
                                                onChange={(e) => setFollowUpData({...followUpData, referredToDoctor: e.target.checked})}
                                            />
                                            Referred to Doctor
                                        </label>
                                    </div>
                                </div>

                                {followUpData.referredToDoctor && (
                                    <div className="form-group">
                                        <label>Referral Reason</label>
                                        <textarea
                                            value={followUpData.referralReason}
                                            onChange={(e) => setFollowUpData({...followUpData, referralReason: e.target.value})}
                                            rows="2"
                                        />
                                    </div>
                                )}

                                <button type="submit" className="submit-btn">Save Follow-up</button>
                            </form>
                        )}

                        <div className="followups-list">
                            {patient.followUps && patient.followUps.length > 0 ? (
                                patient.followUps.slice().reverse().map((followUp, index) => (
                                    <div key={index} className="followup-card">
                                        <div className="followup-header">
                                            <h4>Week {followUp.weekOfPregnancy} - {formatDate(followUp.date)}</h4>
                                            {followUp.referredToDoctor && (
                                                <span className="referred-badge">Referred to Doctor</span>
                                            )}
                                        </div>
                                        <div className="followup-vitals">
                                            {followUp.weight && <span>Weight: {followUp.weight} kg</span>}
                                            {followUp.bloodPressure?.systolic && (
                                                <span>BP: {followUp.bloodPressure.systolic}/{followUp.bloodPressure.diastolic}</span>
                                            )}
                                            {followUp.hemoglobin && <span>Hb: {followUp.hemoglobin} g/dL</span>}
                                        </div>
                                        {followUp.complaints && (
                                            <div className="followup-detail">
                                                <strong>Complaints:</strong> {followUp.complaints}
                                            </div>
                                        )}
                                        {followUp.findings && (
                                            <div className="followup-detail">
                                                <strong>Findings:</strong> {followUp.findings}
                                            </div>
                                        )}
                                        {followUp.advice && (
                                            <div className="followup-detail">
                                                <strong>Advice:</strong> {followUp.advice}
                                            </div>
                                        )}
                                        {followUp.nextVisitDate && (
                                            <div className="followup-detail">
                                                <strong>Next Visit:</strong> {formatDate(followUp.nextVisitDate)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No follow-ups recorded yet</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'medicines' && (
                    <div className="medicines-content">
                        <button
                            className="add-btn"
                            onClick={() => setShowMedicineForm(!showMedicineForm)}
                        >
                            {showMedicineForm ? 'Cancel' : '+ Add Medicine'}
                        </button>

                        {showMedicineForm && (
                            <form onSubmit={handleMedicineSubmit} className="medicine-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Medicine Name *</label>
                                        <input
                                            type="text"
                                            value={medicineData.name}
                                            onChange={(e) => setMedicineData({...medicineData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Dosage</label>
                                        <input
                                            type="text"
                                            value={medicineData.dosage}
                                            onChange={(e) => setMedicineData({...medicineData, dosage: e.target.value})}
                                            placeholder="e.g., 500mg"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Frequency</label>
                                        <input
                                            type="text"
                                            value={medicineData.frequency}
                                            onChange={(e) => setMedicineData({...medicineData, frequency: e.target.value})}
                                            placeholder="e.g., Twice daily"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={medicineData.startDate}
                                            onChange={(e) => setMedicineData({...medicineData, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input
                                            type="date"
                                            value={medicineData.endDate}
                                            onChange={(e) => setMedicineData({...medicineData, endDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Prescribed By</label>
                                        <input
                                            type="text"
                                            value={medicineData.prescribedBy}
                                            onChange={(e) => setMedicineData({...medicineData, prescribedBy: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea
                                        value={medicineData.notes}
                                        onChange={(e) => setMedicineData({...medicineData, notes: e.target.value})}
                                        rows="2"
                                    />
                                </div>

                                <button type="submit" className="submit-btn">Add Medicine</button>
                            </form>
                        )}

                        <div className="medicines-list">
                            {patient.medicines && patient.medicines.length > 0 ? (
                                patient.medicines.map((medicine, index) => (
                                    <div key={index} className="medicine-card">
                                        <h4>{medicine.name}</h4>
                                        <div className="medicine-details">
                                            {medicine.dosage && <span>Dosage: {medicine.dosage}</span>}
                                            {medicine.frequency && <span>Frequency: {medicine.frequency}</span>}
                                            {medicine.prescribedBy && <span>Prescribed by: {medicine.prescribedBy}</span>}
                                        </div>
                                        <div className="medicine-dates">
                                            <span>From: {formatDate(medicine.startDate)}</span>
                                            {medicine.endDate && <span>To: {formatDate(medicine.endDate)}</span>}
                                        </div>
                                        {medicine.notes && (
                                            <div className="medicine-notes">
                                                <strong>Notes:</strong> {medicine.notes}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No medicines recorded yet</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="medical-content">
                        <div className="info-section">
                            <h3>Medical History</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Blood Group:</span>
                                    <span>{patient.medicalHistory?.bloodGroup || 'Unknown'}</span>
                                </div>
                            </div>
                            {patient.medicalHistory?.previousComplications && (
                                <div className="info-item full-width">
                                    <span className="label">Previous Complications:</span>
                                    <p>{patient.medicalHistory.previousComplications}</p>
                                </div>
                            )}
                        </div>

                        {patient.riskFactors?.highRisk && (
                            <div className="info-section risk-section">
                                <h3>⚠️ Risk Factors</h3>
                                <ul>
                                    {patient.riskFactors.reasons.map((reason, index) => (
                                        <li key={index}>{reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDetails;
