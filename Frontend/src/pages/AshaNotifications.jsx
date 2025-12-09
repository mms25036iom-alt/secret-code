import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AshaNotifications.css';

const AshaNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('ashaToken');
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/notifications`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('ashaToken');
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/asha/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            overdue: '🔔',
            upcoming: '📅',
            highrisk: '⚠️',
            delivery: '👶',
            referral: '🏥',
            general: '📢'
        };
        return icons[type] || '📢';
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    if (loading) {
        return <div className="loading">Loading notifications...</div>;
    }

    return (
        <div className="notifications-container">
            <div className="notifications-header">
                <button onClick={() => navigate('/asha/dashboard')} className="back-btn">
                    ← Back
                </button>
                <h1>Notifications</h1>
            </div>

            <div className="notifications-content">
                <div className="notification-filters">
                    <button
                        className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={filter === 'unread' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('unread')}
                    >
                        Unread
                    </button>
                    <button
                        className={filter === 'overdue' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('overdue')}
                    >
                        Overdue Visits
                    </button>
                    <button
                        className={filter === 'highrisk' ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilter('highrisk')}
                    >
                        High Risk
                    </button>
                </div>

                <div className="notifications-list">
                    {filteredNotifications.length === 0 ? (
                        <div className="no-notifications">
                            <p>No notifications to display</p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification, index) => (
                            <div
                                key={index}
                                className={`notification-card ${!notification.read ? 'unread' : ''}`}
                                onClick={() => !notification.read && markAsRead(notification._id)}
                            >
                                <div className="notification-icon">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <h3>{notification.title}</h3>
                                    <p>{notification.message}</p>
                                    <span className="notification-time">
                                        {new Date(notification.createdAt).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                {!notification.read && (
                                    <div className="unread-indicator"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AshaNotifications;
