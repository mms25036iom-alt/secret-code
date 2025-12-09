import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AshaLandingPage.css';

const AshaLandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="asha-landing">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-icon">🤰</span>
                        <span>Maternal Healthcare Initiative</span>
                    </div>
                    <h1 className="hero-title">
                        ASHA Worker Portal
                        <span className="title-highlight">Nabha Village</span>
                    </h1>
                    <p className="hero-subtitle">
                        Empowering ASHA workers to provide comprehensive maternal healthcare
                        and support for pregnant women in our community
                    </p>
                    <div className="hero-buttons">
                        <button 
                            className="btn-primary"
                            onClick={() => navigate('/asha/login')}
                        >
                            <span>ASHA Worker Login</span>
                            <span className="btn-icon">→</span>
                        </button>
                        <button 
                            className="btn-secondary"
                            onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Learn More
                        </button>
                    </div>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>500+</h3>
                            <p>Women Served</p>
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-icon">🏥</div>
                        <div className="stat-info">
                            <h3>95%</h3>
                            <p>Safe Deliveries</p>
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-icon">💚</div>
                        <div className="stat-info">
                            <h3>24/7</h3>
                            <p>Support Available</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">About Our Program</span>
                        <h2>Transforming Maternal Healthcare in Nabha</h2>
                        <p>Addressing critical challenges faced by pregnant women through dedicated ASHA worker support</p>
                    </div>

                    <div className="about-grid">
                        <div className="about-card">
                            <div className="card-icon problem">⚠️</div>
                            <h3>The Challenge</h3>
                            <p>Pregnant women in Nabha village face significant challenges during delivery, labor, and pregnancy phases including:</p>
                            <ul>
                                <li>Limited access to regular checkups</li>
                                <li>Lack of health monitoring</li>
                                <li>Delayed emergency response</li>
                                <li>Inadequate prenatal care</li>
                                <li>Poor nutrition awareness</li>
                            </ul>
                        </div>

                        <div className="about-card">
                            <div className="card-icon solution">✨</div>
                            <h3>Our Solution</h3>
                            <p>A comprehensive digital platform empowering ASHA workers to provide systematic care:</p>
                            <ul>
                                <li>Weekly follow-up tracking</li>
                                <li>Health status monitoring</li>
                                <li>Medicine management</li>
                                <li>Risk assessment alerts</li>
                                <li>Delivery planning support</li>
                            </ul>
                        </div>

                        <div className="about-card">
                            <div className="card-icon impact">🎯</div>
                            <h3>The Impact</h3>
                            <p>Real results from our maternal healthcare initiative:</p>
                            <ul>
                                <li>Reduced maternal complications</li>
                                <li>Improved prenatal care coverage</li>
                                <li>Better health outcomes</li>
                                <li>Increased institutional deliveries</li>
                                <li>Enhanced community awareness</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">Portal Features</span>
                        <h2>Comprehensive Tools for ASHA Workers</h2>
                        <p>Everything you need to provide excellent maternal healthcare</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📋</div>
                            <h3>Patient Registration</h3>
                            <p>Easy registration of pregnant women with complete medical history and pregnancy details</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📅</div>
                            <h3>Weekly Follow-ups</h3>
                            <p>Track regular checkups, monitor vitals, and schedule next visits systematically</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💊</div>
                            <h3>Medicine Management</h3>
                            <p>Record prescriptions, track dosages, and ensure medication compliance</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">⚠️</div>
                            <h3>Risk Assessment</h3>
                            <p>Automatic identification of high-risk pregnancies for priority care</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Health Monitoring</h3>
                            <p>Track weight, blood pressure, hemoglobin, and other vital parameters</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔔</div>
                            <h3>Visit Reminders</h3>
                            <p>Never miss a checkup with automated visit scheduling and alerts</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">💉</div>
                            <h3>Vaccination Tracking</h3>
                            <p>Maintain complete immunization records including TT vaccines</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">👶</div>
                            <h3>Delivery Records</h3>
                            <p>Document delivery details, baby information, and post-natal care</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h3>Mobile Friendly</h3>
                            <p>Access the portal anytime, anywhere from your smartphone</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="workflow-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">How It Works</span>
                        <h2>Simple Steps to Better Care</h2>
                        <p>A streamlined workflow designed for ASHA workers</p>
                    </div>

                    <div className="workflow-timeline">
                        <div className="timeline-item">
                            <div className="timeline-number">1</div>
                            <div className="timeline-content">
                                <h3>Login to Portal</h3>
                                <p>Access your account using your Government ID and password</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-number">2</div>
                            <div className="timeline-content">
                                <h3>Register Patient</h3>
                                <p>Add pregnant women with complete details and medical history</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-number">3</div>
                            <div className="timeline-content">
                                <h3>Schedule Visits</h3>
                                <p>Plan weekly follow-ups and track upcoming appointments</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-number">4</div>
                            <div className="timeline-content">
                                <h3>Conduct Checkups</h3>
                                <p>Record vitals, complaints, findings, and provide medical advice</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-number">5</div>
                            <div className="timeline-content">
                                <h3>Monitor Progress</h3>
                                <p>Track health status, manage medicines, and assess risks</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-number">6</div>
                            <div className="timeline-content">
                                <h3>Ensure Safe Delivery</h3>
                                <p>Coordinate with hospitals and document delivery outcomes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">Success Stories</span>
                        <h2>Voices from Our Community</h2>
                        <p>Real experiences from ASHA workers and beneficiaries</p>
                    </div>

                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <div className="testimonial-quote">"</div>
                            <p className="testimonial-text">
                                This portal has transformed how I manage my patients. I can now track every pregnant woman systematically and ensure no one misses their checkups.
                            </p>
                            <div className="testimonial-author">
                                <div className="author-avatar">👩‍⚕️</div>
                                <div className="author-info">
                                    <h4>Rajni Devi</h4>
                                    <p>ASHA Worker, Ward 1</p>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-card">
                            <div className="testimonial-quote">"</div>
                            <p className="testimonial-text">
                                The risk assessment feature helped me identify high-risk cases early. We were able to provide timely intervention and save lives.
                            </p>
                            <div className="testimonial-author">
                                <div className="author-avatar">👩‍⚕️</div>
                                <div className="author-info">
                                    <h4>Sunita Kumari</h4>
                                    <p>ASHA Worker, Ward 2</p>
                                </div>
                            </div>
                        </div>

                        <div className="testimonial-card">
                            <div className="testimonial-quote">"</div>
                            <p className="testimonial-text">
                                My ASHA worker visited me regularly and monitored my health throughout pregnancy. I had a safe delivery thanks to her care.
                            </p>
                            <div className="testimonial-author">
                                <div className="author-avatar">🤰</div>
                                <div className="author-info">
                                    <h4>Priya Sharma</h4>
                                    <p>Beneficiary, Nabha Village</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Make a Difference?</h2>
                    <p>Join us in transforming maternal healthcare in Nabha village</p>
                    <button 
                        className="cta-button"
                        onClick={() => navigate('/asha/login')}
                    >
                        Access ASHA Portal
                        <span className="btn-icon">→</span>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>ASHA Worker Portal</h3>
                        <p>Empowering community health workers to provide quality maternal healthcare</p>
                    </div>

                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#about">About Program</a></li>
                            <li><a href="#" onClick={() => navigate('/asha/login')}>ASHA Login</a></li>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#workflow">How It Works</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Contact</h4>
                        <ul>
                            <li>📍 Nabha Village, Patiala, Punjab</li>
                            <li>📞 Emergency: 108</li>
                            <li>📧 support@ashaworker.in</li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Support</h4>
                        <ul>
                            <li>District Health Office</li>
                            <li>Primary Health Center</li>
                            <li>Community Health Center</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2024 ASHA Worker Portal - Nabha Village. All rights reserved.</p>
                    <p>Developed for maternal healthcare excellence</p>
                </div>
            </footer>
        </div>
    );
};

export default AshaLandingPage;
