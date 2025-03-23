const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../token.json');

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

const uploadFile = async (file) => {
    try {
        console.log('Iniciando subida del archivo a Google Drive...');
        console.log('Nombre del archivo:', file.originalname);
        console.log('Tipo MIME:', file.mimetype);
        console.log('Ruta temporal:', file.path);
        if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
            throw new Error('Solo se permiten archivos de tipo imagen o video');
        }

        const fileMetadata = {
            name: file.originalname,
            parents: ['1hAeNCachCVvxhPDTyUvnwWTZ-qo6C-lx'], // Cambia esto por el ID de tu carpeta en Drive
        };

        const media = {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path),
        };

        console.log('Subiendo archivo a Google Drive...');
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log('Archivo subido correctamente. ID:', response.data.id);
        const fileUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;
        console.log('URL del archivo:', fileUrl);

        return fileUrl;
    } catch (error) {
        console.error('Error al subir el archivo a Google Drive:', error);
        throw error;
    }
};

module.exports = { uploadFile };