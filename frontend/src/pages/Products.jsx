import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';
import { motion, AnimatePresence } from 'framer-motion';
import './Products.css';

const Products = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [email, setEmail] = useState(user?.email || '');
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Función para decodificar la URL
    const decodeImageUrl = (url) => {
        if (!url) return url; // Si la URL es null o undefined, la devuelve tal cual
        return url.replace(/&amp;/g, '&'); // Reemplaza &amp; por &
    };

    // Obtener productos al cargar el componente
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/products');
                setProducts(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchProducts();
    }, []);

    // Mostrar notificaciones
    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    // Manejar la suscripción
    const handleSubscribe = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }
    
        try {
            await axios.post('http://localhost:5000/api/subscribe', { email }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            showNotification('Te has suscrito exitosamente.', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al suscribirse. Inténtalo de nuevo.', 'error');
        }
    };

    return (
        <div className="products-page">
            <h1>Productos</h1>

            {/* Notificación */}
            <Notification message={notification.message} type={notification.type} />

            {/* Formulario de suscripción */}
            <div className="subscribe-form">
                <h2>Suscríbete para recibir promociones</h2>
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleSubscribe}>Suscribirse</button>
            </div>

            {/* Lista de productos */}
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
                                <img src={decodeImageUrl(product.image_url)} alt={product.title} />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Products;