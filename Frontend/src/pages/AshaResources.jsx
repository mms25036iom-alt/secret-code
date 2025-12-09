import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AshaResources.css';

const AshaResources = () => {
    const navigate = useNavigate();

    const resources = [
        {
            category: 'Pregnancy Care Guidelines',
            items: [
                { title: 'Antenatal Care Checklist', description: 'Complete checklist for ANC visits', icon: '📋' },
                { title: 'High-Risk Pregnancy Identification', description: 'Signs and symptoms to watch for', icon: '⚠️' },
                { title: 'Nutrition Guidelines', description: 'Diet recommendations for pregnant women', icon: '🥗' },
                { title: 'Iron & Folic Acid Supplementation', description: 'IFA tablet distribution protocol', icon: '💊' }
            ]
        },
        {
            category: 'Emergency Protocols',
            items: [
                { title: 'Warning Signs in Pregnancy', description: 'When to refer immediately', icon: '🚨' },
                { title: 'Labor Complications', description: 'Identifying and managing complications', icon: '🏥' },
                { title: 'Postpartum Hemorrhage', description: 'Emergency response protocol', icon: '🩸' },
                { title: 'Neonatal Emergencies', description: 'Newborn danger signs', icon: '👶' }
            ]
        },
        {
            category: 'Training Videos',
            items: [
                { title: 'Blood Pressure Measurement', description: 'Step-by-step BP checking', icon: '🎥' },
                { title: 'Hemoglobin Testing', description: 'Using hemoglobin meter', icon: '🎥' },
                { title: 'Counseling Skills', description: 'Effective patient communication', icon: '🎥' },
                { title: 'Record Keeping', description: 'Maintaining patient records', icon: '🎥' }
            ]
        },
        {
            category: 'Government Schemes',
            items: [
                { title: 'Janani Suraksha Yojana (JSY)', description: 'Cash assistance for institutional delivery', icon: '💰' },
                { title: 'Pradhan Mantri Matru Vandana Yojana', description: 'Maternity benefit program', icon: '💰' },
                { title: 'Janani Shishu Suraksha Karyakram', description: 'Free delivery and transport', icon: '🚑' },
                { title: 'Mission Indradhanush', description: 'Immunization program', icon: '💉' }
            ]
        },
        {
            category: 'Forms & Documents',
            items: [
                { title: 'ANC Registration Form', description: 'Download blank form', icon: '📄' },
                { title: 'Referral Slip', description: 'Hospital referral template', icon: '📄' },
                { title: 'Birth Certificate Application', description: 'Birth registration form', icon: '📄' },
                { title: 'Monthly Report Format', description: 'Activity report template', icon: '📄' }
            ]
        },
        {
            category: 'Contact Directory',
            items: [
                { title: 'District Hospital', description: 'Emergency: 108, Main: 0175-2212345', icon: '📞' },
                { title: 'Primary Health Center', description: 'PHC Nabha: 0175-2234567', icon: '📞' },
                { title: 'Ambulance Service', description: '108 (Free Emergency)', icon: '🚑' },
                { title: 'District Health Officer', description: 'DHO Office: 0175-2245678', icon: '📞' }
            ]
        }
    ];

    return (
        <div className="resources-container">
            <div className="resources-header">
                <button onClick={() => navigate('/asha/dashboard')} className="back-btn">
                    ← Back
                </button>
                <h1>Resources & Training</h1>
            </div>

            <div className="resources-content">
                {resources.map((section, index) => (
                    <div key={index} className="resource-section">
                        <h2>{section.category}</h2>
                        <div className="resource-grid">
                            {section.items.map((item, idx) => (
                                <div key={idx} className="resource-card">
                                    <div className="resource-icon">{item.icon}</div>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                    <button className="view-btn">View</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AshaResources;
