import React, { createContext, useContext, useState, useEffect } from 'react';
// 1. CAMBIO: Importamos nuestra instancia 'api' en lugar de 'axios' directo
import api from '../api/axios'; 
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Verificar si el usuario está autenticado al cargar la aplicación
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (token) {
            // 2. CAMBIO: Usamos 'api.get' y solo la ruta relativa
            // Ya no pasamos { headers: ... } porque el interceptor lo hace por nosotros
            api.get('/api/user')
                .then((response) => {
                    setUser(response.data);
                })
                .catch((error) => {
                    console.error("Error de autenticación:", error);
                    // Si el token no es válido o expiró (Error 401)
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        setUser(null);
                        navigate('/login');
                    }
                });
        }
    }, []); // El array vacío asegura que esto solo corra una vez al montar

    // ... (el resto de funciones login y logout siguen abajo)

    const login = async (email, password) => {
        try {
            // También actualizamos aquí para usar 'api'
            const response = await api.post('/api/login', { email, password });
            
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            navigate('/');
        } catch (error) {
            console.error(error);
            alert('Error: ' + (error.response?.data?.message || 'Algo salió mal'));
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);