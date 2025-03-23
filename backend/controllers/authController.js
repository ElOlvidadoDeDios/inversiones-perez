const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Conexión a la base de datos

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
    const { name, email, password, role = 'user' } = req.body; // Por defecto, el rol es 'user'

    // Verificar si el usuario ya existe
    const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length > 0) {
        return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el usuario
    await db.promise().query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Generar el token JWT con los permisos del usuario
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

    // Devolver el token y los datos del usuario
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
};

const changePassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        // Verificar si el usuario existe
        const [user] = await db.promise().query('SELECT * FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar la contraseña
        await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }
};

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

        // Obtener el usuario desde la base de datos
        const [user] = await db.promise().query(
            'SELECT id, role, can_delete_users, can_manage_promotions, can_manage_products FROM users WHERE id = ?',
            [decoded.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const userData = user[0];

        // Verificar si el usuario tiene el rol de administrador o el permiso específico
        if (userData.role === 'admin' || userData[requiredPermission]) {
            req.user = userData; // Asignar el usuario a req.user
            next();
        } else {
            return res.status(403).json({ message: `No tienes permisos para ${requiredPermission}` });
        }
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = { register, login, getUser, changePassword, verifyAdmin, verifyPermissions };