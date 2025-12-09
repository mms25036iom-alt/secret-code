import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AshaEmergency.css';

const AshaEmergency = () => {
    const navigate = useNavigate();

    const emergencyContacts = [
        {
            category: 'Emergency Services',
            contacts: [
                { name: 'Ambulance (Free)', number: '108', icon: '🚑', color: '#ff5252' },
                { name: 'Women Helpline', number: '1091', icon: '👩', color: '#e91e63' },
                { name: 'Child Helpline', number: '1098', icon: '👶', color: '#9c27b0' },
                { name: 'Police Emergency', number: '100', icon: '🚓', color: '#3f51b5' }
            ]
        },
        {
            category: 'Hospitals',
            contacts: [
                { name: 'District Hospital Patiala', number: '0175-2212345', icon: '🏥', color: '#2196f3' },
                { name: 'Civil Hospital Nabha', number: '0175-2234567', icon: '🏥', color: '#03a9f4' },
                { name: 'Primary Health Center', number: '0175-2245678', icon: '🏥', color: '#00bcd4' },
                { name: 'Maternity Ward', number: '0175-2256789', icon: '🤰', color: '#009688' }
            ]
        },
        {
            category: 'Health Officials',
            contacts: [
                { name: 'District Health Officer', number: '0175-2267890', icon: '👨‍⚕️', color: '#4caf50' },
                { name: 'Block Medical Officer', number: '0175-2278901', icon: '👨‍⚕️', color: '#8bc34a' },
                { name: 'ASHA Supervisor', number: '9876543210', icon: '👩‍⚕️', color: '#cddc39' },
                { name: 'ANM Coordinator', number: '9876543211', icon: '👩‍⚕️', color: '#ffeb3b' }
            ]
        },
        {
            category: 'Specialists',
            contacts: [
                { name: 'Gynecologist On-Call', number: '9876543212', icon: '👨‍⚕️', color: '#ffc107' },
                { name: 'Pediatrician On-Call', number: '9876543213', icon: '👨‍⚕️', color: '#ff9800' },
                { name: 'Blood Bank', number: '0175-2289012', icon: '🩸', color: '#ff5722' },
                { name: 'Lab Services', number: '0175-2290123', icon: '🔬', color: '#795548' }
            ]
        }
    ];

    const quickActions = [
        { title: 'Call Ambulance', number: '108', icon: '🚑', color: '#ff5252' },
        { title: 'Nearest Hospital', number: '0175-2234567', icon: '🏥', color: '#2196f3' },
        { title: 'Blood Bank', number: '0175-2289012', icon: '🩸', color: '#ff5722' },
        { title: 'ASHA Supervisor', number: '9876543210', icon: '👩‍⚕️', color: '#4caf50' }
    ];

    const handleCall = (number) => {
        window.location.href = `tel:${number}`;
    };

    return (
        <div className="emergency-container">
            <div className="emergency-header">
                <button onClick={() => navigate('/asha/dashboard')} className="back-btn">
                    ← Back
                </button>
                <h1>Emergency Contacts</h1>
            </div>

            <div className="emergency-content">
                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h2>🚨 Quick Actions</h2>
                    <div className="quick-actions-grid">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className="quick-action-btn"
                                style={{ background: action.color }}
                                onClick={() => handleCall(action.number)}
                            >
                                <span className="action-icon">{action.icon}</span>
                                <span className="action-title">{action.title}</span>
                                <span className="action-number">{action.number}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Emergency Protocols */}
                <div className="protocols-section">
                    <h2>⚠️ Emergency Protocols</h2>
                    <div className="protocol-cards">
                        <div className="protocol-card danger">
                            <h3>🩸 Severe Bleeding</h3>
                            <ol>
                                <li>Call 108 immediately</li>
                                <li>Keep patient lying down</li>
                                <li>Apply pressure if external bleeding</li>
                                <li>Do not give anything by mouth</li>
                                <li>Monitor vital signs</li>
                            </ol>
                        </div>

                        <div className="protocol-card warning">
                            <h3>🤰 Severe Abdominal Pain</h3>
                            <ol>
                                <li>Call ambulance (108)</li>
                                <li>Note pain location and intensity</li>
                                <li>Check for bleeding</li>
                                <li>Keep patient comfortable</li>
                                <li>Prepare referral slip</li>
                            </ol>
                        </div>

                        <div className="protocol-card urgent">
                            <h3>🌡️ High Fever in Pregnancy</h3>
                            <ol>
                                <li>Check temperature</li>
                                <li>Give paracetamol if available</li>
                                <li>Sponge with lukewarm water</li>
                                <li>Refer to hospital if >101°F</li>
                                <li>Monitor for other symptoms</li>
                            </ol>
                        </div>

                        <div className="protocol-card critical">
                            <h3>👶 Premature Labor</h3>
                            <ol>
                                <li>Call 108 immediately</li>
                                <li>Keep patient lying on left side</li>
                                <li>Do not allow pushing</li>
                                <li>Prepare for hospital transfer</li>
                                <li>Inform receiving hospital</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Contact Directory */}
                {emergencyContacts.map((section, index) => (
                    <div key={index} className="contact-section">
                        <h2>{section.category}</h2>
                        <div className="contacts-grid">
                            {section.contacts.map((contact, idx) => (
                                <div key={idx} className="contact-card">
                                    <div className="contact-icon" style={{ background: contact.color }}>
                                        {contact.icon}
                                    </div>
                                    <div className="contact-info">
                                        <h3>{contact.name}</h3>
                                        <p>{contact.number}</p>
                                    </div>
                                    <button
                                        className="call-btn"
                                        onClick={() => handleCall(contact.number)}
                                    >
                                        📞 Call
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Important Notes */}
                <div className="notes-section">
                    <h2>📌 Important Notes</h2>
                    <div className="notes-content">
                        <div className="note-item">
                            <strong>Always call 108 first</strong> in case of emergency
                        </div>
                        <div className="note-item">
                            <strong>Keep referral slips ready</strong> with patient details
                        </div>
                        <div className="note-item">
                            <strong>Inform family members</strong> before hospital transfer
                        </div>
                        <div className="note-item">
                            <strong>Document everything</strong> - time, symptoms, actions taken
                        </div>
                        <div className="note-item">
                            <strong>Follow up</strong> after emergency to ensure patient safety
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AshaEmergency;
