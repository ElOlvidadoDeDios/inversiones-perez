import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManager from '../components/admin/UserManager';
import ProductManager from '../components/admin/ProductManager';
import PromotionManager from '../components/admin/PromotionManager';
import api from '../api/axios'; // Para el envío de correo y cambio de password si decides dejarlos aquí
import Notification from '../components/Notification';
import './styles/AdminPanel.css'; // Asegúrate de que este archivo exista, aunque sea básico

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('welcome');
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Estado para email rápido (opcional, si quieres mantenerlo aquí)
    const [emailData, setEmailData] = useState({ email: '', subject: '', text: '' });

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const handleSendEmail = async () => {
        if (!emailData.email || !emailData.subject) return showNotification('Datos incompletos', 'error');
        try {
            await api.post('/api/send-promotion', emailData);
            showNotification('Correo enviado', 'success');
            setEmailData({ email: '', subject: '', text: '' });
        } catch (error) {
            console.error(error);
            showNotification('Error al enviar correo', 'error');
        }
    };

    return (
        <div className="admin-panel-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Panel de Administración</h1>
            <p>Bienvenido, <strong>{user?.name}</strong></p>
            <Notification message={notification.message} type={notification.type} />

            {/* Navegación de Pestañas */}
            <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                
                {user?.can_delete_users && (
                    <button onClick={() => setActiveTab('users')} style={tabStyle(activeTab === 'users')}>
                        Usuarios
                    </button>
                )}
                
                {user?.can_manage_products && (
                    <button onClick={() => setActiveTab('products')} style={tabStyle(activeTab === 'products')}>
                        Productos
                    </button>
                )}

                {user?.can_manage_promotions && (
                    <button onClick={() => setActiveTab('promotions')} style={tabStyle(activeTab === 'promotions')}>
                        Promociones
                    </button>
                )}

                <button onClick={() => setActiveTab('emails')} style={tabStyle(activeTab === 'emails')}>
                    Correos
                </button>
            </div>

            {/* Contenido Dinámico */}
            <div className="tab-content" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                {activeTab === 'welcome' && <p>Selecciona una opción del menú para comenzar.</p>}
                {activeTab === 'users' && <UserManager />}
                {activeTab === 'products' && <ProductManager />}
                {activeTab === 'promotions' && <PromotionManager />}
                
                {activeTab === 'emails' && (
                    <div className="email-section">
                        <h3>Enviar Correo Rápido</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
                            <input type="email" placeholder="Para..." value={emailData.email} onChange={e => setEmailData({...emailData, email: e.target.value})} style={{padding: '8px'}} />
                            <input type="text" placeholder="Asunto" value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} style={{padding: '8px'}} />
                            <textarea placeholder="Mensaje..." value={emailData.text} onChange={e => setEmailData({...emailData, text: e.target.value})} style={{padding: '8px', minHeight: '100px'}} />
                            <button onClick={handleSendEmail} style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Enviar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Estilo simple para las pestañas
const tabStyle = (isActive) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontWeight: isActive ? 'bold' : 'normal',
});

export default AdminPanel;