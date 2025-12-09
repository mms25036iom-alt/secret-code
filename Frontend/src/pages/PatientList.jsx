import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './PatientList.css';

const PatientList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter');

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active');

    useEffect(() => {
        fetchPatients();
    }, [filter, statusFilter]);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('ashaToken');
            let url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/patients`;

            if (filter === 'upcoming') {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/patients/upcoming-visits`;
            } else if (filter === 'overdue') {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/patients/overdue-visits`;
            } else if (filter === 'highrisk') {
                url += '?highRisk=true&status=Active';
            } else {
                url += `?status=${statusFilter}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setPatients(response.data.patients);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
    );

    const getStatusBadge = (status) => {
        const badges = {
            Active: 'status-active',
            Delivered: 'status-delivered',
            Referred: 'status-referred',
            Inactive: 'status-inactive'
        };
        return badges[status] || 'status-active';
    };

    const formatDate = (date) => {
        if (!date) return 'Not scheduled';
        return new Date(date).toLocaleDateString('en-IN');
    };

    const getWeekDisplay = (week) => {
        if (!week) return 'N/A';
        return `Week ${week}`;
    };

    if (loading) {
        return <div className="loading">Loading patients...</div>;
    }

    return (
        <div className="patient-list-container">
            <div className="patient-list-header">
                <button onClick={() => navigate('/asha/dashboard')} className="back-btn">
                    ← Back to Dashboard
                </button>
                <h1>
                    {filter === 'upcoming' && 'Upcoming Visits'}
                    {filter === 'overdue' && 'Overdue Visits'}
                    {filter === 'highrisk' && 'High Risk Patients'}
                    {!filter && 'All Patients'}
                </h1>
            </div>

            <div className="patient-list-controls">
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                {!filter && (
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter"
                    >
                        <option value="Active">Active</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Referred">Referred</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                )}
            </div>

            <div className="patient-count">
                Showing {filteredPatients.length} patient(s)
            </div>

            <div className="patient-grid">
                {filteredPatients.length === 0 ? (
                    <div className="no-patients">
                        <p>No patients found</p>
                    </div>
                ) : (
                    filteredPatients.map(patient => (
                        <div
                            key={patient._id}
                            className="patient-card"
                            onClick={() => navigate(`/asha/patients/${patient._id}`)}
                        >
                            <div className="patient-card-header">
                                <h3>{patient.name}</h3>
                                <span className={`status-badge ${getStatusBadge(patient.status)}`}>
                                    {patient.status}
                                </span>
                            </div>

                            <div className="patient-info">
                                <div className="info-row">
                                    <span className="info-label">Age:</span>
                                    <span>{patient.age} years</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Phone:</span>
                                    <span>{patient.phone}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Village:</span>
                                    <span>{patient.address.village}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Pregnancy:</span>
                                    <span>{getWeekDisplay(patient.pregnancyDetails.currentWeek)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">EDD:</span>
                                    <span>{formatDate(patient.pregnancyDetails.edd)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Next Visit:</span>
                                    <span className={patient.nextScheduledVisit && new Date(patient.nextScheduledVisit) < new Date() ? 'overdue-text' : ''}>
                                        {formatDate(patient.nextScheduledVisit)}
                                    </span>
                                </div>
                            </div>

                            {patient.riskFactors?.highRisk && (
                                <div className="high-risk-badge">
                                    ⚠️ High Risk
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PatientList;
