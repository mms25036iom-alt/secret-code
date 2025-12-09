import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AshaDashboard.css';

const AshaDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [ashaWorker, setAshaWorker] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('ashaToken');
        const worker = JSON.parse(localStorage.getItem('ashaWorker') || '{}');
        
        if (!token) {
            navigate('/asha/login');
            return;
        }

        setAshaWorker(worker);
        fetchDashboardStats(token);
    }, [navigate]);

    const fetchDashboardStats = async (token) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/dashboard/stats`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setStats(response.data.statistics);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('ashaToken');
        localStorage.removeItem('ashaWorker');
        navigate('/asha/login');
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="asha-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>Welcome, {ashaWorker?.name}</h1>
                        <p>{ashaWorker?.village}, {ashaWorker?.assignedArea}</p>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>{stats?.totalPatients || 0}</h3>
                            <p>Total Patients</p>
                        </div>
                    </div>

                    <div className="stat-card active">
                        <div className="stat-icon">🤰</div>
                        <div className="stat-info">
                            <h3>{stats?.activePatients || 0}</h3>
                            <p>Active Pregnancies</p>
                        </div>
                    </div>

                    <div className="stat-card high-risk">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-info">
                            <h3>{stats?.highRiskPatients || 0}</h3>
                            <p>High Risk Cases</p>
                        </div>
                    </div>

                    <div className="stat-card delivered">
                        <div className="stat-icon">👶</div>
                        <div className="stat-info">
                            <h3>{stats?.deliveredPatients || 0}</h3>
                            <p>Delivered</p>
                        </div>
                    </div>

                    <div className="stat-card upcoming">
                        <div className="stat-icon">📅</div>
                        <div className="stat-info">
                            <h3>{stats?.upcomingVisits || 0}</h3>
                            <p>Upcoming Visits (7 days)</p>
                        </div>
                    </div>

                    <div className="stat-card overdue">
                        <div className="stat-icon">🔔</div>
                        <div className="stat-info">
                            <h3>{stats?.overdueVisits || 0}</h3>
                            <p>Overdue Visits</p>
                        </div>
                    </div>
                </div>

                <div className="action-buttons">
                    <button 
                        className="action-btn primary"
                        onClick={() => navigate('/asha/patients/add')}
                    >
                        ➕ Add New Patient
                    </button>

                    <button 
                        className="action-btn secondary"
                        onClick={() => navigate('/asha/patients')}
                    >
                        📋 View All Patients
                    </button>

                    <button 
                        className="action-btn warning"
                        onClick={() => navigate('/asha/patients?filter=upcoming')}
                    >
                        📅 Upcoming Visits
                    </button>

                    <button 
                        className="action-btn danger"
                        onClick={() => navigate('/asha/patients?filter=overdue')}
                    >
                        🔔 Overdue Visits
                    </button>

                    <button 
                        className="action-btn info"
                        onClick={() => navigate('/asha/patients?filter=highrisk')}
                    >
                        ⚠️ High Risk Patients
                    </button>

                    <button 
                        className="action-btn success"
                        onClick={() => navigate('/asha/reports')}
                    >
                        📊 Generate Reports
                    </button>

                    <button 
                        className="action-btn purple"
                        onClick={() => navigate('/asha/notifications')}
                    >
                        🔔 Notifications
                    </button>

                    <button 
                        className="action-btn teal"
                        onClick={() => navigate('/asha/resources')}
                    >
                        📚 Resources & Training
                    </button>

                    <button 
                        className="action-btn orange"
                        onClick={() => navigate('/asha/emergency')}
                    >
                        🚨 Emergency Contacts
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AshaDashboard;
