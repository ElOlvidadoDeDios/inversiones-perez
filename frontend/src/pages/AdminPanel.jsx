import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';
import Modal from '../../src/components/Modal';
import SearchBar from '../../src/components/SearchBar';
import Notification from '../../src/components/Notification';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/AdminPanel1.css';

const AdminPanel = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [users, setUsers] = useState([]); // Nuevo estado para usuarios
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [filteredPromotions, setFilteredPromotions] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]); // Nuevo estado para usuarios filtrados
    const [product, setProduct] = useState({
        title: '',
        description: '',
        price: '',
        image: null,
    });
    const [promotion, setPromotion] = useState({
        title: '',
        description: '',
        image: null,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isEditingProduct, setIsEditingProduct] = useState(true);
    const [isEditingUser, setIsEditingUser] = useState(false); // Nuevo estado para editar usuarios
    const [emailData, setEmailData] = useState({
        email: '',
        subject: '',
        text: '',
    });
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const [changePasswordData, setChangePasswordData] = useState({
        currentPassword: '',
        newPassword: '',
    });

    const handleChangePassword = async () => {
        if (!changePasswordData.currentPassword || !changePasswordData.newPassword) {
            showNotification('Por favor, completa todos los campos.', 'error');
            return;
        }
    
        try {
            await axios.put(`http://localhost:5000/api/users/${user.id}/change-password`, changePasswordData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            showNotification('Contraseña cambiada exitosamente', 'success');
            setChangePasswordData({ currentPassword: '', newPassword: '' });
        } catch (error) {
            console.error(error);
            showNotification('Error al cambiar la contraseña', 'error');
        }
    };

    // Variantes de animación
    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
    };

    // Obtener productos, promociones y usuarios al cargar el componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    showNotification('No se encontró el token de autenticación', 'error');
                    return;
                }
    
                const [productsResponse, promotionsResponse, usersResponse] = await Promise.all([
                    axios.get('http://localhost:5000/api/products', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get('http://localhost:5000/api/promotions', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get('http://localhost:5000/api/users', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
    
                setProducts(productsResponse.data);
                setPromotions(promotionsResponse.data);
                setUsers(usersResponse.data);
                setFilteredProducts(productsResponse.data);
                setFilteredPromotions(promotionsResponse.data);
                setFilteredUsers(usersResponse.data);
            } catch (error) {
                console.error(error);
                showNotification('Error al cargar los datos', 'error');
            }
        };
        fetchData();
    }, []);


    // Manejar la búsqueda
    const handleSearch = (query) => {
        const lowerCaseQuery = query.toLowerCase();
        const filteredProducts = products.filter((product) =>
            product.title.toLowerCase().includes(lowerCaseQuery) ||
            product.description.toLowerCase().includes(lowerCaseQuery)
        );
        const filteredPromotions = promotions.filter((promotion) =>
            promotion.title.toLowerCase().includes(lowerCaseQuery) ||
            promotion.description.toLowerCase().includes(lowerCaseQuery)
        );
        const filteredUsers = users.filter((user) =>
            user.name.toLowerCase().includes(lowerCaseQuery) ||
            user.email.toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredProducts(filteredProducts);
        setFilteredPromotions(filteredPromotions);
        setFilteredUsers(filteredUsers);
    };

    // Mostrar notificaciones
    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    // Manejar la subida de productos
    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        if (!product.title || !product.description || !product.price) {
            showNotification('Por favor, completa todos los campos.', 'error');
            return;
        }
    
        const formData = new FormData();
        formData.append('title', product.title);
        formData.append('description', product.description);
        formData.append('price', parseFloat(product.price));
        formData.append('image', product.image);
    
        try {
            const response = await axios.post('http://localhost:5000/api/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Asegúrate de enviar el token
                },
            });
            setProducts([...products, response.data]);
            setFilteredProducts([...filteredProducts, response.data]);
            setProduct({ title: '', description: '', price: '', image: null });
            showNotification('Producto subido exitosamente', 'success');
        } catch (error) {
            console.error('Error al subir el producto:', error.response?.data || error.message);
            showNotification(`Error al subir el producto: ${error.response?.data?.message || error.message}`, 'error');
        }
    };

    // Manejar la edición de productos
    const handleEditProduct = async (id, updatedProduct) => {
        const formData = new FormData();
        formData.append('title', updatedProduct.title);
        formData.append('description', updatedProduct.description);
        formData.append('price', updatedProduct.price);
        if (updatedProduct.image) {
            formData.append('image', updatedProduct.image);
        }

        try {
            const response = await axios.put(`http://localhost:5000/api/products/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setProducts(products.map((product) => (product.id === id ? response.data : product)));
            setFilteredProducts(filteredProducts.map((product) => (product.id === id ? response.data : product)));
            showNotification('Producto actualizado exitosamente', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al editar el producto', 'error');
        }
    };

    // Manejar la eliminación de productos
    const handleDeleteProduct = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await axios.delete(`http://localhost:5000/api/products/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setProducts(products.filter((product) => product.id !== id));
                setFilteredProducts(filteredProducts.filter((product) => product.id !== id));
                showNotification('Producto eliminado exitosamente', 'success');
            } catch (error) {
                console.error(error);
                showNotification('Error al eliminar el producto', 'error');
            }
        }
    };

    // Manejar la subida de promociones
    const handleSubmitPromotion = async (e) => {
        e.preventDefault();
        if (!promotion.title || !promotion.description) {
            showNotification('Por favor, completa todos los campos.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', promotion.title);
        formData.append('description', promotion.description);
        formData.append('image', promotion.image);

        try {
            const response = await axios.post('http://localhost:5000/api/promotions', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setPromotions([...promotions, response.data]);
            setFilteredPromotions([...filteredPromotions, response.data]);
            setPromotion({ title: '', description: '', image: null });
            showNotification('Promoción subida exitosamente', 'success');
        } catch (error) {
            console.error('Error al subir la promoción:', error.response?.data || error.message);
            showNotification(`Error al subir la promoción: ${error.response?.data?.message || error.message}`, 'error');
        }
    };

    // Manejar la edición de promociones
    const handleEditPromotion = async (id, updatedPromotion) => {
        const formData = new FormData();
        formData.append('title', updatedPromotion.title);
        formData.append('description', updatedPromotion.description);
        if (updatedPromotion.image) {
            formData.append('image', updatedPromotion.image);
        }

        try {
            const response = await axios.put(`http://localhost:5000/api/promotions/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setPromotions(promotions.map((promotion) => (promotion.id === id ? response.data : promotion)));
            setFilteredPromotions(filteredPromotions.map((promotion) => (promotion.id === id ? response.data : promotion)));
            showNotification('Promoción actualizada exitosamente', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al editar la promoción', 'error');
        }
    };

    // Manejar la eliminación de promociones
    const handleDeletePromotion = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta promoción?')) {
            try {
                await axios.delete(`http://localhost:5000/api/promotions/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setPromotions(promotions.filter((promotion) => promotion.id !== id));
                setFilteredPromotions(filteredPromotions.filter((promotion) => promotion.id !== id));
                showNotification('Promoción eliminada exitosamente', 'success');
            } catch (error) {
                console.error(error);
                showNotification('Error al eliminar la promoción', 'error');
            }
        }
    };

    // Manejar la edición de usuarios
    const handleEditUser = async (id, updatedUser) => {
        try {
            const response = await axios.put(`http://localhost:5000/api/users/${id}`, updatedUser, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setUsers(users.map((user) => (user.id === id ? response.data : user)));
            setFilteredUsers(filteredUsers.map((user) => (user.id === id ? response.data : user)));
            showNotification('Usuario actualizado exitosamente', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al editar el usuario', 'error');
        }
    };

    // Manejar la eliminación de usuarios
    const handleDeleteUser = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            try {
                await axios.delete(`http://localhost:5000/api/users/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setUsers(users.filter((user) => user.id !== id));
                setFilteredUsers(filteredUsers.filter((user) => user.id !== id));
                showNotification('Usuario eliminado exitosamente', 'success');
            } catch (error) {
                console.error(error);
                showNotification('Error al eliminar el usuario', 'error');
            }
        }
    };

    // Abrir modal para editar
    const handleEditClick = (item, isProduct, isUser = false) => {
        setEditingItem(item);
        setIsEditingProduct(isProduct);
        setIsEditingUser(isUser);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    // Guardar cambios en el modal
    const handleSave = async () => {
        if (isEditingUser) {
            if (!editingItem.name || !editingItem.email || !editingItem.role) {
                showNotification('Por favor, completa todos los campos.', 'error');
                return;
            }
            await handleEditUser(editingItem.id, editingItem);
        } else if (isEditingProduct) {
            if (!editingItem.title || !editingItem.description || !editingItem.price) {
                showNotification('Por favor, completa todos los campos.', 'error');
                return;
            }
            await handleEditProduct(editingItem.id, editingItem);
        } else {
            if (!editingItem.title || !editingItem.description) {
                showNotification('Por favor, completa todos los campos.', 'error');
                return;
            }
            await handleEditPromotion(editingItem.id, editingItem);
        }
        handleModalClose();
    };

    // Enviar correo electrónico con promoción
    const handleSendPromotionEmail = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailData.email || !emailRegex.test(emailData.email)) {
            showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }

        if (!emailData.subject || !emailData.text) {
            showNotification('Por favor, completa todos los campos.', 'error');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/send-promotion', emailData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            showNotification('Correo enviado exitosamente', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al enviar el correo', 'error');
        }
    };

    const handleUpdatePermissions = async (id, permissions) => {
        try {
            await axios.put(`http://localhost:5000/api/users/${id}/update-permissions`, permissions, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            showNotification('Permisos actualizados exitosamente', 'success');
        } catch (error) {
            console.error(error);
            showNotification('Error al actualizar permisos', 'error');
        }
    };

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const currentPromotions = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const Pagination = ({ itemsPerPage, totalItems, paginate }) => {
        const pageNumbers = [];
    
        for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
            pageNumbers.push(i);
        }
    
        return (
            <nav>
                <ul style={{ display: 'flex', listStyle: 'none', padding: 0 }}>
                    {pageNumbers.map((number) => (
                        <li key={number} style={{ margin: '0 5px' }}>
                            <button onClick={() => paginate(number)}>{number}</button>
                        </li>
                    ))}
                </ul>
            </nav>
        );
    };

    return (
        <div className="admin-panel">
            <h1>Panel de Administración</h1>
            <p>Bienvenido, {user?.name}!</p>

            {/* Notificación */}
            <Notification message={notification.message} type={notification.type} />

            {/* Barra de búsqueda */}
            <SearchBar onSearch={handleSearch} />

            {/* Gestión de Usuarios */}
            {user?.can_delete_users && (
            <div>
                <h2>Gestión de Usuarios</h2>
                <ul>
                    <AnimatePresence>
                        {currentUsers.map((user) => (
                            <motion.li
                                key={user.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h3>{user.name}</h3>
                                <p>{user.email}</p>
                                <p>Rol: {user.role}</p>
                                <div className="permissions">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={user.can_delete_users}
                                            onChange={(e) => handleUpdatePermissions(user.id, { ...user, can_delete_users: e.target.checked })}
                                        />
                                        Puede gestionar usuarios
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={user.can_manage_promotions}
                                            onChange={(e) => handleUpdatePermissions(user.id, { ...user, can_manage_promotions: e.target.checked })}
                                        />
                                        Puede gestionar promociones
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={user.can_manage_products}
                                            onChange={(e) => handleUpdatePermissions(user.id, { ...user, can_manage_products: e.target.checked })}
                                        />
                                        Puede gestionar productos
                                    </label>
                                </div>
                                <button onClick={() => handleEditClick(user, false, true)}>Editar</button>
                                <button onClick={() => handleDeleteUser(user.id)}>Eliminar</button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
                <Pagination
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredUsers.length}
                    paginate={paginate}
                />
            </div>
            )}

            {/* Formulario para subir productos */}
            {user?.can_manage_products && (
            <div>
                <h2>Gestión de Productos</h2>
                <form onSubmit={handleSubmitProduct}>
                    <input
                        type="text"
                        placeholder="Título"
                        value={product.title}
                        onChange={(e) => setProduct({ ...product, title: e.target.value })}
                    />
                    <textarea
                        placeholder="Descripción"
                        value={product.description}
                        onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Precio"
                        value={product.price}
                        onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    />
                    <input
                        type="file"
                        onChange={(e) => setProduct({ ...product, image: e.target.files[0] })}
                    />
                    <button type="submit">Subir Producto</button>
                </form>
            </div>
            )}

            {/* Lista de productos con paginación */}
            {user?.can_manage_products && (
            <div>
                <h2>Productos</h2>
                <ul>
                    <AnimatePresence>
                        {currentProducts.map((product) => (
                            <motion.li
                                key={product.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h3>{product.title}</h3>
                                <p>{product.description}</p>
                                <p>Precio: S/{product.price}</p>
                                <img src={product.image_url} alt={product.title} width="100" />
                                <button onClick={() => handleEditClick(product, true)}>Editar</button>
                                <button onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
                <Pagination
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredProducts.length}
                    paginate={paginate}
                />
            </div>
            )}

            {/* Formulario para subir promociones */}
            {user?.can_manage_promotions && (
            <div>
                <h2>Gestión de Promociones</h2>
                <form onSubmit={handleSubmitPromotion}>
                    <input
                        type="text"
                        placeholder="Título"
                        value={promotion.title}
                        onChange={(e) => setPromotion({ ...promotion, title: e.target.value })}
                    />
                    <textarea
                        placeholder="Descripción"
                        value={promotion.description}
                        onChange={(e) => setPromotion({ ...promotion, description: e.target.value })}
                    />
                    <input
                        type="file"
                        onChange={(e) => setPromotion({ ...promotion, image: e.target.files[0] })}
                    />
                    <button type="submit">Subir Promoción</button>
                </form>
            </div>
            )}

            {/* Lista de promociones con paginación */}
            {user?.can_manage_promotions && (
            <div>
                <h2>Promociones</h2>
                <ul>
                    <AnimatePresence>
                        {currentPromotions.map((promotion) => (
                            <motion.li
                                key={promotion.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h3>{promotion.title}</h3>
                                <p>{promotion.description}</p>
                                <img src={promotion.image_url} alt={promotion.title} width="100" />
                                <button onClick={() => handleEditClick(promotion, false)}>Editar</button>
                                <button onClick={() => handleDeletePromotion(promotion.id)}>Eliminar</button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
                <Pagination
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredPromotions.length}
                    paginate={paginate}
                />
            </div>
            )}

            {/* Formulario para enviar promociones por correo */}
            <div className="email-form">
                <h2>Enviar Promoción por Correo</h2>
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={emailData.email}
                    onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Asunto"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                />
                <textarea
                    placeholder="Mensaje"
                    value={emailData.text}
                    onChange={(e) => setEmailData({ ...emailData, text: e.target.value })}
                />
                <button onClick={handleSendPromotionEmail}>Enviar Correo</button>
            </div>

            <div className="change-password-form">
                <h2>Cambiar Contraseña</h2>
                <input
                    type="password"
                    placeholder="Contraseña Actual"
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Nueva Contraseña"
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                />
                <button onClick={handleChangePassword}>Cambiar Contraseña</button>
            </div>

            {/* Modal para editar */}
            <Modal isOpen={isModalOpen} onClose={handleModalClose}>
                <h2>Editar {isEditingUser ? 'Usuario' : isEditingProduct ? 'Producto' : 'Promoción'}</h2>
                {isEditingUser ? (
                    <>
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={editingItem?.name || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        />
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={editingItem?.email || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                        />
                        <select
                            value={editingItem?.role || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                        >
                            <option value="admin">Administrador</option>
                            <option value="worker">Trabajador</option>
                            <option value="user">Usuario</option>
                        </select>
                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="Título"
                            value={editingItem?.title || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        />
                        <textarea
                            placeholder="Descripción"
                            value={editingItem?.description || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        />
                        {isEditingProduct && (
                            <input
                                type="number"
                                placeholder="Precio"
                                value={editingItem?.price || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                            />
                        )}
                        <input
                            type="file"
                            onChange={(e) => setEditingItem({ ...editingItem, image: e.target.files[0] })}
                        />
                    </>
                )}
                <button onClick={handleSave}>Guardar</button>
            </Modal>
        </div>
    );
};

export default AdminPanel;