import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AshaReports.css';

const AshaReports = () => {
    const navigate = useNavigate();
    const [reportType, setReportType] = useState('monthly');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('ashaToken');
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/reports/${reportType}`,
                {
                    params: { month, year },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setReportData(response.data.report);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        // Create CSV or PDF download
        const csvContent = generateCSV(reportData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asha_report_${reportType}_${month}_${year}.csv`;
        a.click();
    };

    const generateCSV = (data) => {
        if (!data) return '';
        
        let csv = 'ASHA Worker Report\n\n';
        csv += `Report Type: ${reportType}\n`;
        csv += `Period: ${month}/${year}\n\n`;
        
        csv += 'Summary Statistics\n';
        csv += `Total Patients,${data.totalPatients || 0}\n`;
        csv += `Active Pregnancies,${data.activePatients || 0}\n`;
        csv += `High Risk Cases,${data.highRiskPatients || 0}\n`;
        csv += `Deliveries This Period,${data.deliveries || 0}\n`;
        csv += `Follow-ups Conducted,${data.followUps || 0}\n\n`;
        
        return csv;
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <button onClick={() => navigate('/asha/dashboard')} className="back-btn">
                    ← Back
                </button>
                <h1>Generate Reports</h1>
            </div>

            <div className="reports-content">
                <div className="report-controls">
                    <div className="control-group">
                        <label>Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                            <option value="monthly">Monthly Report</option>
                            <option value="quarterly">Quarterly Report</option>
                            <option value="annual">Annual Report</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Month</label>
                        <select value={month} onChange={(e) => setMonth(e.target.value)}>
                            {[...Array(12)].map((_, i) => (
                                <option key={i} value={i + 1}>
                                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Year</label>
                        <select value={year} onChange={(e) => setYear(e.target.value)}>
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={generateReport} className="generate-btn" disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>

                {reportData && (
                    <div className="report-display">
                        <div className="report-summary">
                            <h2>Report Summary</h2>
                            <div className="summary-grid">
                                <div className="summary-card">
                                    <span className="label">Total Patients</span>
                                    <span className="value">{reportData.totalPatients || 0}</span>
                                </div>
                                <div className="summary-card">
                                    <span className="label">Active Pregnancies</span>
                                    <span className="value">{reportData.activePatients || 0}</span>
                                </div>
                                <div className="summary-card">
                                    <span className="label">High Risk Cases</span>
                                    <span className="value">{reportData.highRiskPatients || 0}</span>
                                </div>
                                <div className="summary-card">
                                    <span className="label">Deliveries</span>
                                    <span className="value">{reportData.deliveries || 0}</span>
                                </div>
                                <div className="summary-card">
                                    <span className="label">Follow-ups</span>
                                    <span className="value">{reportData.followUps || 0}</span>
                                </div>
                                <div className="summary-card">
                                    <span className="label">Referrals</span>
                                    <span className="value">{reportData.referrals || 0}</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={downloadReport} className="download-btn">
                            📥 Download Report (CSV)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AshaReports;
