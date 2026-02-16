import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Notification from '../Notification';
import Pagination from '../Pagination';
import Modal from '../Modal';
import { motion, AnimatePresence } from 'framer-motion';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [currentPage, setCurrentPage] = useState(1);
    
    // Estados para el Modal de Edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const itemsPerPage = 5;

    // Cargar usuarios al montar el componente
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error(error);
            showNotification('Error al cargar usuarios', 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    // Actualizar permisos (checkboxes)
    const handleUpdatePermissions = async (id, updatedFields) => {
        try {
            // Actualizamos localmente primero para UX rápida
            setUsers(users.map(u => u.id === id ? { ...u, ...updatedFields } : u));
            
            // Enviamos al backend (asegúrate de enviar todos los flags necesarios)
            // Nota: Aquí combinamos el usuario actual con los cambios para enviar el objeto completo si el backend lo requiere,
            // o solo los permisos. Ajustado a tu backend actual:
            const userToUpdate = users.find(u => u.id === id);
            const payload = { ...userToUpdate, ...updatedFields };

            await api.put(`/api/users/${id}/update-permissions`, payload);
            showNotification('Permisos actualizados', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al actualizar permisos', 'error');
            fetchUsers(); // Revertir cambios si falla
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/api/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            showNotification('Usuario eliminado', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al eliminar usuario', 'error');
        }
    };

    // --- Lógica del Modal ---
    const openEditModal = (user) => {
        setEditingUser({ ...user }); // Copia para no mutar directo
        setIsModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingUser.name || !editingUser.email || !editingUser.role) {
            showNotification('Completa todos los campos obligatorios', 'error');
            return;
        }
        try {
            const response = await api.put(`/api/users/${editingUser.id}`, editingUser);
            // Actualizar lista
            setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
            showNotification('Usuario actualizado', 'success');
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            showNotification('Error al guardar cambios', 'error');
        }
    };

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="user-manager">
            <h2>Gestión de Usuarios</h2>
            <Notification message={notification.message} type={notification.type} />
            
            <ul className="admin-list">
                <AnimatePresence>
                    {currentUsers.map((user) => (
                        <motion.li 
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="admin-list-item"
                            style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px', background: '#f9f9f9' }}
                        >
                            <div style={{ marginBottom: '10px' }}>
                                <strong>{user.name}</strong> ({user.email}) - <span style={{ color: '#007bff' }}>{user.role}</span>
                            </div>
                            
                            <div className="permissions" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!user.can_delete_users}
                                        onChange={(e) => handleUpdatePermissions(user.id, { can_delete_users: e.target.checked })}
                                    /> Eliminar Usuarios
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!user.can_manage_promotions}
                                        onChange={(e) => handleUpdatePermissions(user.id, { can_manage_promotions: e.target.checked })}
                                    /> Gestionar Promociones
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!user.can_manage_products}
                                        onChange={(e) => handleUpdatePermissions(user.id, { can_manage_products: e.target.checked })}
                                    /> Gestionar Productos
                                </label>
                            </div>

                            <div className="actions">
                                <button onClick={() => openEditModal(user)} style={{ marginRight: '10px' }}>Editar Datos</button>
                                <button onClick={() => handleDeleteUser(user.id)} style={{ background: '#dc3545', color: 'white' }}>Eliminar</button>
                            </div>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={users.length}
                paginate={setCurrentPage}
                currentPage={currentPage}
            />

            {/* Modal de Edición */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h3>Editar Usuario</h3>
                {editingUser && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            style={{ padding: '8px' }}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            style={{ padding: '8px' }}
                        />
                        <select
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            style={{ padding: '8px' }}
                        >
                            <option value="user">Usuario</option>
                            <option value="worker">Trabajador</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <button onClick={handleSaveEdit} style={{ background: '#28a745', color: 'white', padding: '10px' }}>
                            Guardar Cambios
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserManager;