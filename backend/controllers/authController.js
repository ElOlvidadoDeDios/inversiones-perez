const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Conexión a la base de datos

// 1. PRIMERO DEFINIMOS LOS MIDDLEWARES
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permisos para acceder a esta ruta' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

const verifyPermissions = (requiredPermission) => async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [user] = await db.promise().query(
            'SELECT id, role, can_delete_users, can_manage_promotions, can_manage_products FROM users WHERE id = ?',
            [decoded.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const userData = user[0];

        if (userData.role === 'admin' || userData[requiredPermission]) {
            req.user = userData;
            next();
        } else {
            return res.status(403).json({ message: `No tienes permisos para ${requiredPermission}` });
        }
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

// 2. LUEGO DEFINIMOS LOS CONTROLADORES PRINCIPALES
const getUser = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [user] = await db.promise().query('SELECT id, name, email, role, can_delete_users, can_manage_promotions, can_manage_products FROM users WHERE id = ?', [decoded.id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user[0]);
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

const register = async (req, res) => {
    const { name, email, password, role = 'user' } = req.body;

    try {
        const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.promise().query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al registrar' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Generar el token
        const token = jwt.sign(
            {
                id: user[0].id,
                role: user[0].role,
                can_delete_users: user[0].can_delete_users,
                can_manage_promotions: user[0].can_manage_promotions,
                can_manage_products: user[0].can_manage_products,
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: user[0].id,
                name: user[0].name,
                email: user[0].email,
                role: user[0].role,
                can_delete_users: user[0].can_delete_users,
                can_manage_promotions: user[0].can_manage_promotions,
                can_manage_products: user[0].can_manage_products,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
    }
};

const changePassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        const [user] = await db.promise().query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }
};

// 3. EXPORTAMOS TODO AL FINAL DE FORMA ORDENADA
module.exports = { 
    verifyAdmin, 
    verifyPermissions,
    register, 
    login, 
    getUser, 
    changePassword 
};