import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import Notification from '../components/Notification';
import './styles/Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/api/products');
                setProducts(response.data);
            } catch (error) {
                console.error("Error al cargar productos:", error);
                setNotification({ message: 'Error al cargar el catálogo', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const isVideo = (url) => {
        return url && url.match(/\.(mp4|webm|ogg)$/i);
    };

    return (
        <div className="products-container">
            <Notification message={notification.message} type={notification.type} />

            {/* CABECERA (Sin buscador, directa y limpia) */}
            <motion.div 
                className="products-hero"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1>Catálogo de Productos</h1>
                <p>Descubre nuestra calidad en cada impresión. Selecciona el producto que necesitas y cotízalo al instante con uno de nuestros asesores.</p>
            </motion.div>

            {/* GRILLA DE PRODUCTOS */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '1.2rem' }}>
                    Cargando catálogo...
                </div>
            ) : products.length > 0 ? (
                <motion.div 
                    className="products-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {products.map((product, index) => (
                        <motion.div 
                            key={product.id} 
                            className="product-card"
                            /* Efecto Cascada: Cada tarjeta entra un poquito después que la anterior */
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }} 
                        >
                            <div className="product-img-wrapper">
                                {isVideo(product.image_url) ? (
                                    <video controls className="product-img">
                                        <source src={product.image_url} type="video/mp4" />
                                    </video>
                                ) : (
                                    <img src={product.image_url} alt={product.title} className="product-img" />
                                )}
                            </div>
                            
                            <div className="product-content">
                                <h3 className="product-title">{product.title}</h3>
                                <p className="product-desc">{product.description}</p>
                                
                                <div className="product-price-row">
                                    <p className="product-price">S/ {product.price}</p>
                                    
                                    {/* Botón directo a WhatsApp con mensaje dinámico */}
                                    <a 
                                        href={`https://wa.me/51999999999?text=Hola, quiero cotizar el producto: *${encodeURIComponent(product.title)}* que cuesta S/ ${product.price}.`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn-quote"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        Cotizar
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                    <p style={{ fontSize: '1.2rem' }}>Aún no hay productos en el catálogo.</p>
                </div>
            )}
        </div>
    );
};

export default Products;