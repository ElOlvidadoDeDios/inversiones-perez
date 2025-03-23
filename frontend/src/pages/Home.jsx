import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Notification from '../components/Notification';
import './styles/Home.css';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [notification, setNotification] = useState({ message: '', type: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productsResponse = await axios.get('http://localhost:5000/api/products');
                const promotionsResponse = await axios.get('http://localhost:5000/api/promotions');
                setProducts(productsResponse.data);
                setPromotions(promotionsResponse.data);
            } catch (error) {
                console.error(error);
                showNotification('Error al cargar los datos', 'error');
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

    return (
        <div className="home-page">
            <h1>Bienvenido a Inversiones Pérez</h1>

            <Notification message={notification.message} type={notification.type} />

            <div className="promotions-section">
                <h2>Promociones</h2>
                <div className="promotions-list">
                    <AnimatePresence>
                        {promotions.map((promotion) => (
                            <motion.div
                                key={promotion.id}
                                className="promotion-card"
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                transition={{ duration: 0.5 }}
                            >
                                <h3>{promotion.title}</h3>
                                <p>{promotion.description}</p>
                                {promotion.image_url && (
                                    isVideo(promotion.image_url) ? (
                                        <video controls width="100%">
                                            {/*<source src={decodeImageUrl(promotion.image_url)} type="video/mp4" />*/}
                                            <source src={promotion.image_url} type="video/mp4" />
                                            Tu navegador no soporta el elemento de video.
                                        </video>
                                    ) : (
                                        <img src={promotion.image_url} alt={promotion.title} />
                                    )
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="products-section">
                <h2>Productos</h2>
                <div className="products-list">
                    <AnimatePresence>
                        {products.map((product) => (
                            <motion.div
                                key={product.id}
                                className="product-card"
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                transition={{ duration: 0.5 }}
                            >
                                <h3>{product.title}</h3>
                                <p>{product.description}</p>
                                <p>Precio: S/{product.price}</p>
                                {product.image_url && (
                                    isVideo(product.image_url) ? (
                                        <video controls width="50%">
                                            {/*<source src={decodeImageUrl(product.image_url)} type="video/mp4" />*/}
                                            <source src={product.image_url} type="video/mp4" />
                                            Tu navegador no soporta el elemento de video.
                                        </video>
                                    ) : (
                                        <img src={product.image_url} alt={product.title} />
                                    )
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Home;