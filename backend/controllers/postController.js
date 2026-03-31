const { uploadFile } = require('../services/cloudinary');
const db = require('../db');

// Crear un nuevo Post (Imagen + Texto Hover)
const createPost = async (req, res) => {
    const { hover_text } = req.body;
    const image = req.file;

    // Validamos que venga el texto y la imagen
    if (!hover_text || !image) {
        return res.status(400).json({ message: 'La imagen y el texto son obligatorios.' });
    }

    try {
        const imageUrl = await uploadFile(image);
        await db.promise().query(
            'INSERT INTO posts (image_url, hover_text) VALUES (?, ?)',
            [imageUrl, hover_text]
        );
        res.status(201).json({ message: 'Publicación creada exitosamente' });
    } catch (error) {
        console.error('Error al crear el post:', error);
        res.status(500).json({ message: 'Error al guardar la publicación' });
    }
};

// Obtener todos los Posts (Ordenados del más nuevo al más viejo)
const getPosts = async (req, res) => {
    try {
        const [posts] = await db.promise().query('SELECT * FROM posts ORDER BY created_at DESC');
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las publicaciones' });
    }
};

// Eliminar un Post
const deletePost = async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().query('DELETE FROM posts WHERE id = ?', [id]);
        res.json({ message: 'Publicación eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la publicación' });
    }
};

module.exports = { createPost, getPosts, deletePost };