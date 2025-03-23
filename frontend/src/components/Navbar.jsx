import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav style={styles.navbar}>
            <div style={styles.logo}>
                <Link to="/" style={styles.link}>Inversiones Pérez</Link>
            </div>
            <div style={styles.links}>
                <Link to="/" style={styles.link}>Inicio</Link>
                <Link to="/products" style={styles.link}>Productos</Link>
                <Link to="/promotions" style={styles.link}>Promociones</Link>
                {user ? (
                    <>
                        {(user.role === 'user' ||user.role === 'admin' || user.role === 'worker') && (
                            <Link to="/costeador" style={styles.link}>Costeador</Link>
                        )}
                        {(user.role === 'admin' || user.role === 'worker') && (
                            <Link to="/admin" style={styles.link}>Administración</Link>
                        )}
                        <span style={styles.userInfo}>
                            {user.name} ({user.role})
                        </span>
                        <button onClick={logout} style={styles.button}>Cerrar Sesión</button>
                    </>
                ) : (
                    <Link to="/login" style={styles.link}>Iniciar Sesión</Link>
                )}
            </div>
        </nav>
    );
};

const styles = {
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#333',
        color: '#fff',
    },
    logo: {
        fontSize: '24px',
        fontWeight: 'bold',
    },
    links: {
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
    },
    link: {
        color: '#fff',
        textDecoration: 'none',
        fontSize: '16px',
    },
    button: {
        backgroundColor: '#ff4d4d',
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    userInfo: {
        margin: '0 10px',
        fontSize: '16px',
    },
};

export default Navbar;