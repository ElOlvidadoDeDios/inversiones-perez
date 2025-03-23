const cloudinary = require('cloudinary').v2;

// Configura Cloudinary con tus credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para subir un archivo a Cloudinary
const uploadFile = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto', // 'auto' detecta si es imagen o video
            folder: 'inversiones-perez', // Opcional: organiza los archivos en una carpeta
        });
        return result.secure_url; // Devuelve la URL pública del archivo
    } catch (error) {
        console.error('Error al subir el archivo a Cloudinary:', error);
        throw error;
    }
};

// Función para eliminar un archivo de Cloudinary
const deleteFile = async (url) => {
    try {
        // Extrae el public_id de la URL (último segmento antes de la extensión)
        const publicId = url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error al eliminar el archivo de Cloudinary:', error);
        throw error;
    }
};

module.exports = { uploadFile, deleteFile };