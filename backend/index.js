const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const http = require('http');         // Añadido para el Bot
const WebSocket = require('ws');      // Añadido para el Bot
const qrcode = require('qrcode');     // Añadido para el Bot
const fs = require('fs');             // Añadido para el Bot
const path = require('path');         // Añadido para el Bot

dotenv.config();

// Controladores de Inversiones Pérez
const db = require('./db');
const productController = require('./controllers/productController');
const promotionController = require('./controllers/promotionController');
const costeadorController = require('./controllers/costeadorController');

// Importamos TODO desde authController de forma limpia
const { 
    register, 
    login, 
    getUser, 
    changePassword, 
    verifyAdmin, 
    verifyPermissions 
} = require('./controllers/authController'); 
const { sendPromotionEmail } = require('./services/mailer');

// Clase de Sesión del Bot
const BotSession = require('./botSession');

const app = express();
const server = http.createServer(app); // Envolvemos Express en un servidor HTTP
const wss = new WebSocket.Server({ server }); // Iniciamos WebSockets en el mismo servidor

// Middlewares
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

// Conexión a DB
db.connect((err) => {
    if (err) console.error('Error conectando a la base de datos:', err);
    else console.log('Conectado a la base de datos MySQL');
});

// ==========================================
// RUTAS DE INVERSIONES PÉREZ (API)
// ==========================================
app.get('/api/user', getUser);
app.put('/api/users/:id/change-password', changePassword);
app.post('/api/register', register);
app.post('/api/login', login);

app.post('/api/products', verifyPermissions('can_manage_products'), upload.single('image'), productController.createProduct);
app.get('/api/products', productController.getProducts);
app.put('/api/products/:id', verifyPermissions('can_manage_products'), upload.single('image'), productController.updateProduct);
app.delete('/api/products/:id', verifyPermissions('can_manage_products'), productController.deleteProduct);

app.post('/api/promotions', verifyPermissions('can_manage_promotions'), upload.single('image'), promotionController.createPromotion);
app.get('/api/promotions', promotionController.getPromotions);
app.put('/api/promotions/:id', verifyPermissions('can_manage_promotions'), upload.single('image'), promotionController.updatePromotion);
app.delete('/api/promotions/:id', verifyPermissions('can_manage_promotions'), promotionController.deletePromotion);

app.get('/api/users', verifyAdmin, async (req, res) => {
    try {
        const [users] = await db.promise().query('SELECT id, name, email, role, can_delete_users, can_manage_promotions, can_manage_products FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

app.put('/api/users/:id/update-permissions', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { can_delete_users, can_manage_promotions, can_manage_products } = req.body;
    try {
        await db.promise().query('UPDATE users SET can_delete_users = ?, can_manage_promotions = ?, can_manage_products = ? WHERE id = ?', [can_delete_users, can_manage_promotions, can_manage_products, id]);
        res.json({ message: 'Permisos actualizados' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar permisos' });
    }
});

app.post('/api/send-promotion', async (req, res) => {
    const { email, subject, text } = req.body;
    try {
        await sendPromotionEmail(email, subject, text);
        res.json({ message: 'Correo enviado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al enviar correo' });
    }
});

app.post('/api/calcular-precio', upload.single('pdfFile'), costeadorController.calcularPrecio);

app.get('/', (req, res) => res.send('Backend de Inversiones Pérez + Bot WhatsApp'));

// ==========================================
// LÓGICA DEL BOT DE WHATSAPP (WEBSOCKETS)
// ==========================================
const sessions = {};
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');

function loadExistingSessions() {
    if (fs.existsSync(SESSION_DIR)) {
        const sessionDirs = fs.readdirSync(SESSION_DIR).filter(dir => dir.startsWith('session-'));
        sessionDirs.forEach(dir => {
            const sessionId = dir.replace('session-', '');
            if (!sessions[sessionId]) {
                sessions[sessionId] = new BotSession(
                    sessionId,
                    async (qr) => {
                        console.log(`📌 QR generado para ${sessionId}`);
                        const qrDataUrl = await qrcode.toDataURL(qr);
                        broadcastQR(sessionId, qrDataUrl);
                    },
                    () => {
                        console.log(`✅ Sesión ${sessionId} lista.`);
                        broadcastSessions();
                    },
                    () => {
                        console.log(`📴 Sesión ${sessionId} desconectada.`);
                        if (sessions[sessionId]) sessions[sessionId].cleanup();
                        delete sessions[sessionId];
                        broadcastSessions();
                    }
                );
            }
        });
    }
}

function broadcastQR(sessionId, qrDataUrl) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action: 'qr', sessionId, name: sessionId, qr: qrDataUrl }));
        }
    });
}

function broadcastSessions() {
    const activeSessions = Object.keys(sessions);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action: 'sessions', sessions: activeSessions }));
        }
    });
}

loadExistingSessions();

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ action: 'sessions', sessions: Object.keys(sessions) }));

    ws.on('message', async (message) => {
        try {
            const { action, sessionId } = JSON.parse(message);

            if (action === 'start') {
                if (!sessions[sessionId]) {
                    sessions[sessionId] = new BotSession(
                        sessionId,
                        async (qr) => {
                            console.log(`📌 QR para ${sessionId}`);
                            const qrDataUrl = await qrcode.toDataURL(qr);
                            ws.send(JSON.stringify({ action: 'qr', sessionId, name: sessionId, qr: qrDataUrl }));
                        },
                        () => {
                            console.log(`✅ ${sessionId} listo.`);
                            ws.send(JSON.stringify({ action: 'ready', sessionId }));
                            broadcastSessions();
                        },
                        () => {
                            console.log(`📴 ${sessionId} desconectado.`);
                            if (sessions[sessionId]) sessions[sessionId].cleanup();
                            delete sessions[sessionId];
                            broadcastSessions();
                        }
                    );
                    
                    sessions[sessionId].client.on('auth_failure', async (msg) => {
                        console.log(`⚠️ Fallo de auth en ${sessionId}.`);
                        ws.send(JSON.stringify({ action: 'sessionFailed', sessionId }));
                        try { await sessions[sessionId].logout(); } catch (e) {}
                        sessions[sessionId].cleanup();
                        delete sessions[sessionId];
                        broadcastSessions();
                    });
                }
            } else if (action === 'stop') {
                if (sessions[sessionId]) {
                    try {
                        await sessions[sessionId].logout();
                        console.log(`📴 Sesión ${sessionId} cerrada.`);
                    } catch (error) {}
                    sessions[sessionId].cleanup();
                    delete sessions[sessionId];
                    broadcastSessions();
                }
            }
        } catch (error) {
            console.error('Error procesando mensaje WS:', error);
        }
    });
});

// Limpieza al cerrar
process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor y sesiones...');
    process.exit();
});

// ==========================================
// INICIAR SERVIDOR UNIFICADO
// ==========================================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor y WebSockets corriendo en http://localhost:${PORT}`);
});