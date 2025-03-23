import React from 'react';

const Notification = ({ message, type }) => {
    if (!message) return null;

    const notificationStyle = {
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        backgroundColor: type === 'success' ? '#d4edda' : '#f8d7da',
        color: type === 'success' ? '#155724' : '#721c24',
        border: `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
    };

    return (
        <div style={notificationStyle}>
            {message}
        </div>
    );
};

export default Notification;