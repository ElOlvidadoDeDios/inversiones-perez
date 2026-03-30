import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css'; // Importamos el CSS premium

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="premium-navbar">
            <div className="navbar-container">
                
                {/* 1. SECCIÓN LOGO */}
                <div className="nav-logo">
                    <Link to="/" className="logo-link">
                        Inversiones <strong>Pérez</strong>
                    </Link>
                </div>

                {/* 2. SECCIÓN ENLACES CENTRALES */}
                <div className="nav-links">
                    <Link to="/" className="nav-item">Inicio</Link>
                    <Link to="/products" className="nav-item">Productos</Link>
                    <Link to="/promotions" className="nav-item">Promociones</Link>
                    
                    {user && (user.role === 'user' || user.role === 'admin' || user.role === 'worker') && (
                        <Link to="/costeador" className="nav-item">Costeador</Link>
                    )}
                    
                    {user && (user.role === 'admin' || user.role === 'worker') && (
                        <Link to="/admin" className="nav-item admin-link">Administración</Link>
                    )}
                </div>

                {/* 3. SECCIÓN ACCIONES (Derecha) */}
                <div className="nav-actions">
                    {user ? (
                        <>
                            <div className="user-info">
                                <span>Hola, {user.name.split(' ')[0]}</span>
                                <span className="user-role-badge">
                                    {user.role === 'admin' ? 'Admin' : user.role === 'worker' ? 'Trabajador' : 'Cliente'}
                                </span>
                            </div>
                            <button onClick={logout} className="btn-logout">Salir</button>
                        </>
                    ) : (
                        <Link to="/login" className="btn-login">Iniciar Sesión</Link>
                    )}
                </div>

            </div>
        </nav>
    );
};

export default Navbar;