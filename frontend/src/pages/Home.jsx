import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Importamos tu configuración de seguridad
import api from '../api/axios'; 
// Importamos Swiper (Carrusel)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Notification from '../components/Notification';
import './styles/Home.css';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [products, setProducts] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    // Rotación automática suave si el usuario no está arrastrando
    useEffect(() => {
        if (isDragging) return;
        const interval = setInterval(() => {
            setRotation(prev => prev - 0.3); 
        }, 20);
        return () => clearInterval(interval);
    }, [isDragging]);

    // Funciones para arrastrar con mouse o dedo
    const handlePointerDown = (e) => {
        setIsDragging(true);
        setStartX(e.clientX || (e.touches && e.touches[0].clientX));
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const delta = currentX - startX;
        setRotation(prev => prev + delta * 0.4); // Multiplicador de sensibilidad
        setStartX(currentX);
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hacemos las 3 peticiones al mismo tiempo
                const [postsRes, productsRes, promosRes] = await Promise.all([
                    api.get('/api/posts').catch(() => ({ data: [] })), // Si falla, devuelve vacío
                    api.get('/api/products'),
                    api.get('/api/promotions')
                ]);
                
                setPosts(postsRes.data);
                setProducts(productsRes.data);
                setPromotions(promosRes.data);
            } catch (error) {
                console.error(error);
                showNotification('Error al cargar la información del servidor', 'error');
            }
        };
        fetchData();
    }, []);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const isVideo = (url) => {
        return url && url.match(/\.(mp4|webm|ogg)$/i);
    };

    // Configuración universal para los carruseles
    const carouselSettings = {
        modules: [Navigation, Pagination, Autoplay],
        spaceBetween: 25,
        slidesPerView: 1,
        navigation: true,
        pagination: { clickable: true },
        autoplay: { delay: 4000, disableOnInteraction: false },
        breakpoints: {
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 }
        }
    };

    return (
        <div className="home-page">
            <Notification message={notification.message} type={notification.type} />

            {/* SECCIÓN 1: NOVEDADES Y TRABAJOS (CARRUSEL 3D INTERACTIVO) */}
            <motion.div 
                className="section-container full-width-section" // <-- CLASE AGREGADA AQUÍ
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* El título se queda alineado a los 1200px gracias a su propio CSS */}
                <h2 className="section-title">Avisos</h2>
                
                {posts.length > 0 ? (
                    <div 
                        className="carousel-3d-wrapper"
                        onMouseDown={handlePointerDown}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={handlePointerUp}
                        onTouchStart={handlePointerDown}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={handlePointerUp}
                    >
                        <div className="carousel-3d-container">
                            <div 
                                className="carousel-3d"
                                style={{ transform: `rotateY(${rotation}deg)` }}
                            >
                                {posts.map((post, index) => {
                                    const numPosts = posts.length || 1;
                                    const theta = 360 / numPosts;
                                    const angle = index * theta;
                                    
                                    // NUEVA MATEMÁTICA: Basada en el nuevo ancho de 450px
                                    // El +80 final separa las tarjetas para que no se choquen en los bordes
                                    const radius = numPosts < 3 
                                        ? 450
                                        : Math.round((650 / 2) / Math.tan(Math.PI / numPosts)) + 80;

                                    return (
                                        <div 
                                            key={post.id} 
                                            className="carousel__face"
                                            style={{ transform: `rotateY(${angle}deg) translateZ(${radius}px)` }}
                                        >
                                            <div className="post-content-wrapper">
                                                <img src={post.image_url} alt="Trabajo" />
                                                <div className="post-caption">{post.hover_text}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="empty-state" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        Pronto subiremos nuestros nuevos trabajos...
                    </p>
                )}
            </motion.div>

            {/* SECCIÓN 2: PROMOCIONES (CARRUSEL) */}
            <motion.div 
                className="section-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <h2 className="section-title">Promociones Especiales</h2>
                {promotions.length > 0 ? (
                    <Swiper {...carouselSettings} className="mySwiper">
                        {promotions.map((promo) => (
                            <SwiperSlide key={promo.id}>
                                <div className="carousel-card">
                                    {isVideo(promo.image_url) ? (
                                        <video controls className="carousel-image">
                                            <source src={promo.image_url} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <img src={promo.image_url} alt={promo.title} className="carousel-image" />
                                    )}
                                    <h3 className="carousel-title">{promo.title}</h3>
                                    <p className="carousel-desc">{promo.description}</p>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <p className="empty-state">No hay promociones activas por el momento.</p>
                )}
            </motion.div>

            {/* SECCIÓN 3: PRODUCTOS (CARRUSEL) */}
            <motion.div 
                className="section-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                <h2 className="section-title">Nuestros Productos</h2>
                {products.length > 0 ? (
                    <Swiper {...carouselSettings} className="mySwiper">
                        {products.map((product) => (
                            <SwiperSlide key={product.id}>
                                <div className="carousel-card">
                                    {isVideo(product.image_url) ? (
                                        <video controls className="carousel-image">
                                            <source src={product.image_url} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <img src={product.image_url} alt={product.title} className="carousel-image" />
                                    )}
                                    <h3 className="carousel-title">{product.title}</h3>
                                    <p className="carousel-desc">{product.description}</p>
                                    
                                    {/* NUEVO: Envolvemos el precio para empujarlo al fondo elegantemente */}
                                    <div className="product-footer">
                                        <p className="carousel-price">S/ {product.price}</p>
                                    </div>
                                    
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <p className="empty-state">Estamos actualizando nuestro catálogo de productos...</p>
                )}
            </motion.div>
        </div>
    );
};

export default Home;