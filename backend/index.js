const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const db = require('./db');
const productController = require('./controllers/productController');
const promotionController = require('./controllers/promotionController');
const authController = require('./controllers/authController');
const { verifyPermissions, verifyAdmin } = require('./controllers/authController'); // Importar verifyPermissions y verifyAdmin
const { sendPromotionEmail } = require('./services/mailer');
const costeadorController = require('./controllers/costeadorController');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar Multer para subida de archivos
const upload = multer({ dest: 'uploads/' });

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
    } else {
        console.log('Conectado a la base de datos MySQL');
    }
});

// Rutas de autenticación
app.get('/api/user', authController.getUser);
app.put('/api/users/:id/change-password', authController.changePassword);
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);

// Rutas de productos (con middleware de autenticación)
app.post('/api/products', verifyPermissions('can_manage_products'), upload.single('image'), productController.createProduct);
app.get('/api/products', productController.getProducts);
app.put('/api/products/:id', verifyPermissions('can_manage_products'), upload.single('image'), productController.updateProduct);
app.delete('/api/products/:id', verifyPermissions('can_manage_products'), productController.deleteProduct);

// Rutas de promociones (con middleware de autenticación)
app.post('/api/promotions', verifyPermissions('can_manage_promotions'), upload.single('image'), promotionController.createPromotion);
app.get('/api/promotions', promotionController.getPromotions);
app.put('/api/promotions/:id', verifyPermissions('can_manage_promotions'), upload.single('image'), promotionController.updatePromotion);
app.delete('/api/promotions/:id', verifyPermissions('can_manage_promotions'), promotionController.deletePromotion);

// Ruta para obtener todos los usuarios (solo para administradores)
app.get('/api/users', verifyAdmin, async (req, res) => {
    try {
        const [users] = await db.promise().query('SELECT id, name, email, role, can_delete_users, can_manage_promotions, can_manage_products FROM users');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
});

// Ruta para enviar correos electrónicos
app.post('/api/send-promotion', async (req, res) => {
    const { email, subject, text } = req.body;

    try {
        await sendPromotionEmail(email, subject, text);
        res.json({ message: 'Correo enviado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al enviar el correo' });
    }
});

// Ruta para suscribirse
app.post('/api/subscribe', async (req, res) => {
    const { email } = req.body;

    try {
        // Verificar si el usuario ya está suscrito
        const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar la suscripción
        await db.promise().query('UPDATE users SET is_subscribed = TRUE WHERE email = ?', [email]);

        res.json({ message: 'Suscripción exitosa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al suscribirse' });
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Backend de Inversiones Pérez');
});

// Ruta para actualizar permisos de usuario
app.put('/api/users/:id/update-permissions', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { can_delete_users, can_manage_promotions, can_manage_products } = req.body;

    try {
        await db.promise().query(
            'UPDATE users SET can_delete_users = ?, can_manage_promotions = ?, can_manage_products = ? WHERE id = ?',
            [can_delete_users, can_manage_promotions, can_manage_products, id]
        );
        res.json({ message: 'Permisos actualizados exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar permisos' });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.post('/api/calcular-precio', upload.single('pdfFile'), costeadorController.calcularPrecio);
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});