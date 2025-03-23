const { uploadFile } = require('../services/cloudinary');
const db = require('../db');

// Crear una promoción
const createPromotion = async (req, res) => {
    console.log('Usuario autenticado:', req.user); // Verifica que el usuario esté autenticado
    console.log('Archivo recibido:', req.file); // Verifica que el archivo se esté recibiendo
    const { title, description } = req.body;
    const image = req.file;

    if (!title || !description) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Verificar permisos del usuario
    if (!req.user.can_manage_promotions) {
        return res.status(403).json({ message: 'No tienes permisos para crear promociones' });
    }

    try {
        const imageUrl = await uploadFile(image);
        await db.promise().query(
            'INSERT INTO promotions (title, description, image_url) VALUES (?, ?, ?)', // Insertar en la tabla promotions
            [title, description, imageUrl]
        );
        res.status(201).json({ message: 'Promoción creada exitosamente' });
    } catch (error) {
        console.error('Error al crear la promoción:', error);
        res.status(500).json({ message: 'Error al crear la promoción' });
    }
};

// Obtener todas las promociones
const getPromotions = async (req, res) => {
    try {
        const [promotions] = await db.promise().query('SELECT * FROM promotions');
        res.json(promotions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las promociones' });
    }
};

// Actualizar una promoción
const updatePromotion = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const image = req.file;

    try {
        let imageUrl;
        if (image) {
            imageUrl = await uploadFile(image);
        }

        await db.promise().query(
            'UPDATE promotions SET title = ?, description = ?, image_url = IFNULL(?, image_url) WHERE id = ?',
            [title, description, imageUrl, id]
        );
        res.json({ message: 'Promoción actualizada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la promoción' });
    }
};

// Eliminar una promoción
const deletePromotion = async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().query('DELETE FROM promotions WHERE id = ?', [id]);
        res.json({ message: 'Promoción eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la promoción' });
    }
};

// Exportar las funciones
module.exports = { createPromotion, getPromotions, updatePromotion, deletePromotion };