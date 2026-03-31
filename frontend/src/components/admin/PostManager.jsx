import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Notification from '../Notification';

const PostManager = () => {
    const [posts, setPosts] = useState([]);
    const [hoverText, setHoverText] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const fetchPosts = async () => {
        try {
            const response = await api.get('/api/posts');
            setPosts(response.data);
        } catch (error) {
            console.error(error);
            showNotification('Error al obtener las publicaciones', 'error');
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!hoverText || !image) {
            return showNotification('Por favor, ingresa un texto y selecciona una imagen', 'error');
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('hover_text', hoverText);
        formData.append('image', image);

        try {
            await api.post('/api/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showNotification('Publicación subida con éxito', 'success');
            setHoverText('');
            setImage(null);
            // Resetear el input file visualmente
            document.getElementById('postImageInput').value = '';
            fetchPosts();
        } catch (error) {
            console.error(error);
            showNotification('Error al crear la publicación', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este trabajo de la página principal?')) return;
        
        try {
            await api.delete(`/api/posts/${id}`);
            showNotification('Publicación eliminada', 'success');
            fetchPosts();
        } catch (error) {
            console.error(error);
            showNotification('Error al eliminar la publicación', 'error');
        }
    };

    return (
        <div>
            <Notification message={notification.message} type={notification.type} />
            <h2>Gestión de Trabajos (Galería Principal)</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Sube fotos de tus mejores impresiones. El texto aparecerá cuando el cliente pase el mouse sobre la imagen.
            </p>

            <form onSubmit={handleCreatePost} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
                    <input 
                        type="text" 
                        placeholder="Ej: Impresión en Lona para Campaña" 
                        value={hoverText}
                        onChange={(e) => setHoverText(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <input 
                        id="postImageInput"
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#fff' }}
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ padding: '10px', backgroundColor: loading ? '#ccc' : '#0f172a', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                        {loading ? 'Subiendo...' : 'Publicar Trabajo'}
                    </button>
                </div>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {posts.map((post) => (
                    <div key={post.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', textAlign: 'center' }}>
                        <img 
                            src={post.image_url} 
                            alt="Trabajo" 
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
                        />
                        <div style={{ padding: '15px' }}>
                            <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{post.hover_text}</p>
                            <button 
                                onClick={() => handleDeletePost(post.id)}
                                style={{ padding: '8px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {posts.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No hay trabajos publicados aún.</p>}
        </div>
    );
};

export default PostManager;