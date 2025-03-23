const { uploadFile, deleteFile } = require('../services/cloudinary'); // Asegúrate de tener deleteFile en tu servicio
const db = require('../db');

// Crear un producto
const createProduct = async (req, res) => {
    console.log('Usuario autenticado:', req.user);
    console.log('Archivo recibido:', req.file);

    const { title, description, price } = req.body;
    const image = req.file;

    // Validar campos obligatorios
    if (!title || !description || !price) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Verificar permisos del usuario
    if (!req.user.can_manage_products) {
        return res.status(403).json({ message: 'No tienes permisos para crear productos.' });
    }

    // Validar tipo de archivo
    if (image && !image.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: '    .' });
    }

    try {
        // Subir archivo a Google Drive, pero esta vez a cloudeinary
        const imageUrl = await uploadFile(image);

        // Insertar producto en la base de datos
        await db.promise().query(
            'INSERT INTO products (title, description, price, image_url) VALUES (?, ?, ?, ?)',
            [title, description, price, imageUrl]
        );

        res.status(201).json({ message: 'Producto creado exitosamente.' });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error al crear el producto.' });
    }
};

// Obtener todos los productos
const getProducts = async (req, res) => {
    try {
        const [products] = await db.promise().query('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error al obtener los productos.' });
    }
};

// Actualizar un producto
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { title, description, price } = req.body;
    const image = req.file;

    // Validar tipo de archivo
    if (image && !image.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'Solo se permiten archivos de imagen.' });
    }

    try {
        let imageUrl;
        if (image) {
            // Obtener la URL de la imagen actual para eliminarla después
            const [product] = await db.promise().query('SELECT image_url FROM products WHERE id = ?', [id]);
            const oldImageUrl = product[0]?.image_url;

            // Subir la nueva imagen
            imageUrl = await uploadFile(image);

            // Eliminar la imagen antigua de Google Drive
            if (oldImageUrl) {
                await deleteFile(oldImageUrl);
            }
        }

        // Actualizar el producto en la base de datos
        await db.promise().query(
            'UPDATE products SET title = ?, description = ?, price = ?, image_url = IFNULL(?, image_url) WHERE id = ?',
            [title, description, price, imageUrl, id]
        );

        res.json({ message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto.' });
    }
};

// Eliminar un producto
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener la URL de la imagen para eliminarla de Google Drive
        const [product] = await db.promise().query('SELECT image_url FROM products WHERE id = ?', [id]);
        const imageUrl = product[0]?.image_url;

        // Eliminar el producto de la base de datos
        await db.promise().query('DELETE FROM products WHERE id = ?', [id]);

        // Eliminar la imagen de Google Drive
        if (imageUrl) {
            await deleteFile(imageUrl);
        }

        res.json({ message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: 'Error al eliminar el producto.' });
    }
};

// Exportar las funciones
module.exports = { createProduct, getProducts, updateProduct, deleteProduct };