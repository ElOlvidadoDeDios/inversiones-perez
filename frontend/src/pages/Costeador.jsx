import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Notification from '../components/Notification';
// Nota: No necesitamos importar pdfjs-dist aquí para contar hojas si el backend ya lo hace,
// pero si quieres mostrar el conteo ANTES de enviar, mantenemos la lógica básica.

const Costeador = () => {
    const [file, setFile] = useState(null);
    const [numHojas, setNumHojas] = useState('');
    const [precio, setPrecio] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Estados del formulario
    const [tamano, setTamano] = useState('0.20'); // A4 por defecto
    const [color, setColor] = useState('1');      // B/N por defecto
    const [impresion, setImpresion] = useState('1'); // Una cara
    const [reduccion, setReduccion] = useState('1'); // Sin reducción (valor 1 para evitar NaN en backend si no se envía)

    // Estados de UI (deshabilitar campos)
    const [disableReduccion, setDisableReduccion] = useState(false);
    const [disableImpresion, setDisableImpresion] = useState(false);

    // Efecto para manejar las reglas de negocio (deshabilitar campos)
    useEffect(() => {
        // Regla: A3, A2, A1 deshabilitan reducción e impresión (fuerzan 1 cara)
        if (['0.80', '2.50', '3.00'].includes(tamano)) {
            setDisableReduccion(true);
            setReduccion('1'); // Reset reducción
            setDisableImpresion(true);
            setImpresion('1'); // Reset a una cara
        } else {
            setDisableReduccion(false);
            setDisableImpresion(false);
        }

        // Regla: Folleto deshabilita reducción
        if (impresion === '0.25') { // 0.25 es el valor de Folleto en tu HTML
            setDisableReduccion(true);
            setReduccion('1');
        } else if (!['0.80', '2.50', '3.00'].includes(tamano)) {
             // Solo reactivar si el tamaño lo permite
            setDisableReduccion(false);
        }
    }, [tamano, impresion]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setPrecio(''); // Limpiar precio anterior
        setNumHojas('Calculando en servidor...'); // Feedback
    };

    const handleCalcular = async () => {
        if (!file) {
            setNotification({ message: 'Por favor selecciona un archivo PDF', type: 'error' });
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('pdfFile', file);
        formData.append('tamano', tamano);
        formData.append('color', color);
        formData.append('impresion', impresion);
        formData.append('reduccion', reduccion);

        try {
            const response = await api.post('/api/calcular-precio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setPrecio(response.data.precio);
            setNumHojas(response.data.numPaginas); // El backend nos confirma las páginas reales
            setNotification({ message: 'Cálculo exitoso', type: 'success' });
        } catch (error) {
            console.error(error);
            setNotification({ message: 'Error al calcular el precio', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Estilos inline básicos para replicar Bootstrap layout visualmente
    const containerStyle = { maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' };
    const sectionStyle = { marginBottom: '20px' };
    const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold' };
    const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' };
    const radioGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };

    return (
        <div style={containerStyle}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Cálculo de Precio de Impresión</h1>
            <Notification message={notification.message} type={notification.type} />

            {/* Archivo */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Subir archivo PDF:</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} style={inputStyle} />
            </div>

            {/* Resultado Hojas (Solo lectura, viene del backend) */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Número de hojas (detectado):</label>
                <input type="text" value={numHojas} readOnly style={{ ...inputStyle, backgroundColor: '#e9ecef' }} />
            </div>

            {/* Tamaño */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Tamaño de papel:</label>
                <div style={radioGroupStyle}>
                    <label><input type="radio" name="tamano" value="0.10" checked={tamano === '0.10'} onChange={(e) => setTamano(e.target.value)} /> A5 (0.10)</label>
                    <label><input type="radio" name="tamano" value="0.20" checked={tamano === '0.20'} onChange={(e) => setTamano(e.target.value)} /> A4 (0.20)</label>
                    <label><input type="radio" name="tamano" value="0.80" checked={tamano === '0.80'} onChange={(e) => setTamano(e.target.value)} /> A3 (0.80)</label>
                    <label><input type="radio" name="tamano" value="2.50" checked={tamano === '2.50'} onChange={(e) => setTamano(e.target.value)} /> A2 (2.50)</label>
                    <label><input type="radio" name="tamano" value="3.00" checked={tamano === '3.00'} onChange={(e) => setTamano(e.target.value)} /> A1 (3.00)</label>
                </div>
            </div>

            {/* Color */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Color:</label>
                <div style={radioGroupStyle}>
                    <label><input type="radio" name="color" value="1" checked={color === '1'} onChange={(e) => setColor(e.target.value)} /> B/N</label>
                    <label><input type="radio" name="color" value="1.5" checked={color === '1.5'} onChange={(e) => setColor(e.target.value)} /> Colores</label>
                </div>
            </div>

            {/* Impresión */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Impresión:</label>
                <div style={radioGroupStyle}>
                    <label>
                        <input type="radio" name="impresion" value="1" checked={impresion === '1'} onChange={(e) => setImpresion(e.target.value)} disabled={disableImpresion} /> 
                        Una cara
                    </label>
                    <label>
                        <input type="radio" name="impresion" value="0.50" checked={impresion === '0.50'} onChange={(e) => setImpresion(e.target.value)} disabled={disableImpresion} /> 
                        Dúplex (0.50)
                    </label>
                    <label>
                        <input type="radio" name="impresion" value="0.25" checked={impresion === '0.25'} onChange={(e) => setImpresion(e.target.value)} disabled={disableImpresion} /> 
                        Folleto (0.25)
                    </label>
                </div>
            </div>

            {/* Reducción */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Reducción (Páginas por hoja):</label>
                <div style={radioGroupStyle}>
                    <label>
                        <input type="radio" name="reduccion" value="1" checked={reduccion === '1'} onChange={(e) => setReduccion(e.target.value)} disabled={disableReduccion} /> 
                        Sin reducción (1)
                    </label>
                    <label>
                        <input type="radio" name="reduccion" value="0.30" checked={reduccion === '0.30'} onChange={(e) => setReduccion(e.target.value)} disabled={disableReduccion} /> 
                        2 en 1 (0.30)
                    </label>
                    <label>
                        <input type="radio" name="reduccion" value="0.35" checked={reduccion === '0.35'} onChange={(e) => setReduccion(e.target.value)} disabled={disableReduccion} /> 
                        4 en 1 (0.35)
                    </label>
                    <label>
                        <input type="radio" name="reduccion" value="0.40" checked={reduccion === '0.40'} onChange={(e) => setReduccion(e.target.value)} disabled={disableReduccion} /> 
                        8 en 1 (0.40)
                    </label>
                    <label>
                        <input type="radio" name="reduccion" value="0.45" checked={reduccion === '0.45'} onChange={(e) => setReduccion(e.target.value)} disabled={disableReduccion} /> 
                        16 en 1 (0.45)
                    </label>
                </div>
            </div>

            <button 
                onClick={handleCalcular} 
                disabled={loading}
                style={{ width: '100%', padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', cursor: loading ? 'wait' : 'pointer' }}
            >
                {loading ? 'Procesando PDF...' : 'Calcular Precio'}
            </button>

            {/* Resultado Final */}
            <div style={{ marginTop: '20px' }}>
                <label style={labelStyle}>Precio Total Estimado:</label>
                <input 
                    type="text" 
                    value={precio ? `S/ ${precio}` : ''} 
                    readOnly 
                    style={{ ...inputStyle, fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745', textAlign: 'center' }} 
                />
            </div>
        </div>
    );
};

export default Costeador;