import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Notification from '../Notification';
import Pagination from '../Pagination';
import { motion, AnimatePresence } from 'framer-motion';

const PromotionManager = () => {
    const [promotions, setPromotions] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', image: null });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await api.get('/api/promotions');
            setPromotions(response.data);
        } catch (error) {
            console.error(error);
            showNotification('Error al cargar promociones', 'error');
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
        if (form.image) formData.append('image', form.image);

        try {
            if (isEditing) {
                await api.put(`/api/promotions/${editId}`, formData);
                showNotification('Promoción actualizada', 'success');
            } else {
                await api.post('/api/promotions', formData);
                showNotification('Promoción creada', 'success');
            }
            fetchPromotions();
            resetForm();
        } catch (error) {
            console.error(error);
            showNotification('Error al guardar promoción', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta promoción?')) return;
        try {
            await api.delete(`/api/promotions/${id}`);
            setPromotions(promotions.filter(p => p.id !== id));
            showNotification('Promoción eliminada', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al eliminar', 'error');
        }
    };

    const handleEdit = (promo) => {
        setForm({ 
            title: promo.title, 
            description: promo.description, 
            image: null 
        });
        setEditId(promo.id);
        setIsEditing(true);
    };

    const resetForm = () => {
        setForm({ title: '', description: '', image: null });
        setIsEditing(false);
        setEditId(null);
        document.getElementById('promo-file-input').value = "";
    };

    // Paginación lógica
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPromotions = promotions.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="promotion-manager">
            <h2>Gestión de Promociones</h2>
            <Notification message={notification.message} type={notification.type} />

            {/* Formulario */}
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>{isEditing ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
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
                        id="promo-file-input"
                        type="file" accept="image/*,video/*" 
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
                    {currentPromotions.map((promo) => (
                        <motion.li 
                            key={promo.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {promo.image_url && (
                                    promo.image_url.endsWith('.mp4') 
                                    ? <video src={promo.image_url} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                    : <img src={promo.image_url} alt={promo.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                )}
                                <div>
                                    <strong>{promo.title}</strong>
                                </div>
                            </div>
                            <div>
                                <button onClick={() => handleEdit(promo)} style={{ marginRight: '10px', cursor: 'pointer' }}>Editar</button>
                                <button onClick={() => handleDelete(promo.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
                            </div>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            <Pagination itemsPerPage={itemsPerPage} totalItems={promotions.length} paginate={setCurrentPage} currentPage={currentPage} />
        </div>
    );
};

export default PromotionManager;