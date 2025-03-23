import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles, permissions }) => {
    const { user } = useAuth(); // Obtén el usuario autenticado desde el contexto

    // Si el usuario no está autenticado, redirige al login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // Si el usuario no tiene el rol requerido, redirige a la página de inicio
    if (!roles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    // Verificar permisos específicos si se proporcionan
    if (permissions) {
        const hasPermission = permissions.every(permission => user[permission]);
        if (!hasPermission) {
            return <Navigate to="/" />;
        }
    }

    // Si el usuario tiene el rol requerido, permite el acceso a la ruta
    return children;
};

export default ProtectedRoute;