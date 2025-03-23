import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Verificar si el usuario está autenticado al cargar la aplicación
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get('http://localhost:5000/api/user', {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => setUser(response.data))
            .catch((error) => {
                if (error.response?.status === 401) { // Token expirado o inválido
                    localStorage.removeItem('token');
                    setUser(null);
                    navigate('/login'); // Redirigir al login
                }
            });
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post('http://localhost:5000/api/login', { email, password });
            
            // Guardar el token en localStorage
            localStorage.setItem('token', response.data.token);
            
            // Guardar los datos del usuario en el estado
            setUser(response.data.user);
            
            // Redirigir a la página principal
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