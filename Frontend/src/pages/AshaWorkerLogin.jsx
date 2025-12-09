import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AshaWorkerLogin.css';

const AshaWorkerLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        govtId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/login`,
                formData
            );

            if (response.data.success) {
                localStorage.setItem('ashaToken', response.data.token);
                localStorage.setItem('ashaWorker', JSON.stringify(response.data.ashaWorker));
                navigate('/asha/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="asha-login-container">
            <div className="asha-login-card">
                <div className="asha-login-header">
                    <h1>ASHA Worker Portal</h1>
                    <p>Maternal Healthcare - Nabha Village</p>
                </div>

                <form onSubmit={handleSubmit} className="asha-login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="govtId">Government ID</label>
                        <input
                            type="text"
                            id="govtId"
                            name="govtId"
                            value={formData.govtId}
                            onChange={handleChange}
                            placeholder="Enter your Govt ID"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="asha-login-footer">
                    <p>For support, contact your district coordinator</p>
                </div>
            </div>
        </div>
    );
};

export default AshaWorkerLogin;
