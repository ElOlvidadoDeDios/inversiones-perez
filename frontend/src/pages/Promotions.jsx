import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/Promotions.css';

const Promotions = () => {
    const { user } = useAuth();
    const [promotions, setPromotions] = useState([]);
    const [email, setEmail] = useState(user?.email || '');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/promotions');
                setPromotions(response.data);
            } catch (error) {
                console.error(error);
                showNotification('Error al cargar las promociones', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPromotions();
    }, []);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const handleSubscribe = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }
    
        try {
            await axios.post('http://localhost:4000/api/subscribe', { email }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            showNotification('¡Te has suscrito exitosamente!', 'success');
            setEmail('');
        } catch (error) {
            console.error(error);
            showNotification('Error al suscribirse. Inténtalo de nuevo.', 'error');
        }
    };

    const isVideo = (url) => {
        return url && url.match(/\.(mp4|webm|ogg)$/i);
    };

    return (
        <div className="promotions-container">
            <Notification message={notification.message} type={notification.type} />

            {/* Cabecera */}
            <motion.div 
                className="promotions-hero"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1>Ofertas Especiales</h1>
                <p>Descubre promociones por tiempo limitado y descuentos exclusivos para tus proyectos de impresión.</p>
            </motion.div>

            {/* Banner de Suscripción Premium */}
            <motion.div 
                className="subscribe-banner"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <h2>No te pierdas ninguna oferta</h2>
                <p>Suscríbete a nuestro boletín y recibe descuentos directos en tu correo.</p>
                <div className="subscribe-form-row">
                    <input
                        type="email"
                        className="subscribe-input"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button className="subscribe-btn" onClick={handleSubscribe}>
                        Suscribirme
                    </button>
                </div>
            </motion.div>

            {/* Grilla de Promociones */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '1.2rem' }}>
                    Buscando las mejores ofertas...
                </div>
            ) : promotions.length > 0 ? (
                <div className="promotions-grid">
                    <AnimatePresence>
                        {promotions.map((promotion, index) => (
                            <motion.div
                                key={promotion.id}
                                className="promo-card"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div 
                                    className="promo-img-wrapper"
                                    onClick={() => !isVideo(promotion.image_url) && setSelectedImage(promotion.image_url)}
                                >
                                    {isVideo(promotion.image_url) ? (
                                        <video controls>
                                            <source src={promotion.image_url} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <img
                                            src={promotion.image_url}
                                            alt={promotion.title}
                                            className="promo-img"
                                        />
                                    )}
                                </div>
                                
                                <div className="promo-content">
                                    <h3 className="promo-title">{promotion.title}</h3>
                                    <p className="promo-desc">{promotion.description}</p>
                                    
                                    {/* Botón directo a WhatsApp para reclamar promo */}
                                    <a 
                                        href={`https://wa.me/51999999999?text=Hola, quiero aprovechar la promoción: *${encodeURIComponent(promotion.title)}*.`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn-claim-promo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        Consultar Promoción
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                    <p style={{ fontSize: '1.2rem' }}>No hay promociones activas en este momento.</p>
                </div>
            )}

            {/* Modal de ampliación con Blur */}
            {selectedImage && (
                <div className="promo-modal-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="promo-modal-content" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage} alt="Promoción Ampliada" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Promotions;