import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManager from '../components/admin/UserManager';
import ProductManager from '../components/admin/ProductManager';
import PromotionManager from '../components/admin/PromotionManager';
import PostManager from '../components/admin/PostManager'; // <--- NUEVO IMPORT
import BotManager from '../components/admin/BotManager';
import api from '../api/axios';
import Notification from '../components/Notification';
import './styles/AdminPanel.css';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('welcome');
    const [notification, setNotification] = useState({ message: '', type: '' });
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

    const tabStyle = (isActive) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#0f172a' : '#f8fafc', // Tonos Bellroy
        color: isActive ? 'white' : '#475569',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontWeight: isActive ? '600' : 'normal',
        transition: 'all 0.2s ease'
    });

    return (
        <div className="admin-panel-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
            <h1 style={{ color: '#0f172a' }}>Panel de Administración</h1>
            <p style={{ marginBottom: '30px' }}>Bienvenido, <strong>{user?.name}</strong></p>
            
            <Notification message={notification.message} type={notification.type} />

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
                {/* Nueva pestaña de Galería/Posts */}
                <button onClick={() => setActiveTab('posts')} style={tabStyle(activeTab === 'posts')}>
                    📸 Avisos (Inicio)
                </button>
                
                {user?.can_manage_products && (
                    <button onClick={() => setActiveTab('products')} style={tabStyle(activeTab === 'products')}>
                        📦 Productos
                    </button>
                )}
                {user?.can_manage_promotions && (
                    <button onClick={() => setActiveTab('promotions')} style={tabStyle(activeTab === 'promotions')}>
                        🏷️ Promociones
                    </button>
                )}
                <button onClick={() => setActiveTab('bot')} style={tabStyle(activeTab === 'bot')}>
                    🤖 Bot WhatsApp
                </button>
                <button onClick={() => setActiveTab('emails')} style={tabStyle(activeTab === 'emails')}>
                    ✉️ Correos
                </button>
                {user?.can_delete_users && (
                    <button onClick={() => setActiveTab('users')} style={tabStyle(activeTab === 'users')}>
                        👥 Usuarios
                    </button>
                )}
            </div>

            {/* CONTENIDO DE LA PESTAÑA */}
            <div className="tab-content" style={{ border: '1px solid #e2e8f0', padding: '30px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                {activeTab === 'welcome' && (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                        <h2>Elige una opción del menú superior</h2>
                        <p>Aquí podrás gestionar todo el contenido de Inversiones Pérez.</p>
                    </div>
                )}
                
                {activeTab === 'posts' && <PostManager />} {/* <--- AQUÍ RENDERIZAMOS EL NUEVO COMPONENTE */}
                {activeTab === 'products' && <ProductManager />}
                {activeTab === 'promotions' && <PromotionManager />}
                {activeTab === 'users' && <UserManager />}
                {activeTab === 'bot' && <BotManager />}
                
                {activeTab === 'emails' && (
                    <div className="email-section">
                        <h2>Enviar Correo a Clientes</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px', marginTop: '20px' }}>
                            <input type="email" placeholder="Correo del destinatario" value={emailData.email} onChange={e => setEmailData({...emailData, email: e.target.value})} style={{padding: '12px', borderRadius: '6px', border: '1px solid #ccc'}} />
                            <input type="text" placeholder="Asunto del correo" value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} style={{padding: '12px', borderRadius: '6px', border: '1px solid #ccc'}} />
                            <textarea placeholder="Escribe tu mensaje aquí..." value={emailData.text} onChange={e => setEmailData({...emailData, text: e.target.value})} style={{padding: '12px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '150px'}} />
                            <button onClick={handleSendEmail} style={{ padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar Correo</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;