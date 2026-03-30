import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // Usamos tu configuración correcta

const Login = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [isLogin, setIsLogin] = useState(true);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isLogin ? '/api/login' : '/api/register';
        
        try {
            // Usamos 'api.post' y la ruta relativa (ya no dice localhost:5000)
            const response = await api.post(url, formData);
            
            if (isLogin) {
                // Pasamos los datos a tu contexto
                login(formData.email, formData.password);
                navigate('/admin'); // Te redirige al panel automáticamente al entrar
            } else {
                alert('Usuario registrado exitosamente. Por favor, inicia sesión.');
                setIsLogin(true);
            }
        } catch (error) {
            console.error("Detalle del error:", error);
            // Agregamos los paréntesis necesarios para que el || funcione bien
            alert('Error: ' + (error.response?.data?.message || 'Algo salió mal con el servidor'));
        }
    };

    return (
        <div>
            <h1>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>
            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Nombre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                )}
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="submit">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            </button>
        </div>
    );
};

export default Login;