import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Notification from '../Notification';
import Pagination from '../Pagination';
import Modal from '../Modal';
import { motion, AnimatePresence } from 'framer-motion';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', price: '', image: null });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/api/products');
            setProducts(response.data);
        } catch (error) {
            console.error(error);
            showNotification('Error al cargar productos', 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('price', form.price);
        if (form.image) formData.append('image', form.image);

        try {
            if (isEditing) {
                await api.put(`/api/products/${editId}`, formData);
                showNotification('Producto actualizado', 'success');
            } else {
                await api.post('/api/products', formData);
                showNotification('Producto creado', 'success');
            }
            fetchProducts();
            resetForm();
        } catch (error) {
            console.error(error);
            showNotification('Error al guardar producto', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este producto?')) return;
        try {
            await api.delete(`/api/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
            showNotification('Producto eliminado', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al eliminar', 'error');
        }
    };

    const handleEdit = (product) => {
        setForm({ 
            title: product.title, 
            description: product.description, 
            price: product.price, 
            image: null 
        });
        setEditId(product.id);
        setIsEditing(true);
    };

    const resetForm = () => {
        setForm({ title: '', description: '', price: '', image: null });
        setIsEditing(false);
        setEditId(null);
        // Limpiar input file manualmente si es necesario
        document.getElementById('product-file-input').value = "";
    };

    // Paginación lógica
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="product-manager">
            <h2>Gestión de Productos</h2>
            <Notification message={notification.message} type={notification.type} />

            {/* Formulario */}
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                        type="text" placeholder="Título" required 
                        value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                        style={{ padding: '8px' }}
                    />
                    <textarea 
                        placeholder="Descripción" required 
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        style={{ padding: '8px' }}
                    />
                    <input 
                        type="number" placeholder="Precio (S/)" required 
                        value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                        style={{ padding: '8px' }}
                    />
                    <input 
                        id="product-file-input"
                        type="file" accept="image/*" 
                        onChange={e => setForm({...form, image: e.target.files[0]})} 
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                            {isEditing ? 'Actualizar' : 'Crear'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} style={{ padding: '10px', background: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Lista */}
            <ul className="admin-list">
                <AnimatePresence>
                    {currentProducts.map((product) => (
                        <motion.li 
                            key={product.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img src={product.image_url} alt={product.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                dm<div>
                                    <strong>{product.title}</strong> - S/{product.price}
                                </div>
                            </div>
                            <div>
                                <button onClick={() => handleEdit(product)} style={{ marginRight: '10px', cursor: 'pointer' }}>Editar</button>
                                <button onClick={() => handleDelete(product.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
                            </div>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            <Pagination itemsPerPage={itemsPerPage} totalItems={products.length} paginate={setCurrentPage} currentPage={currentPage} />
        </div>
    );
};

export default ProductManager;