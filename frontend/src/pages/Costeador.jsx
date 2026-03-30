import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Notification from '../components/Notification';
import './styles/Costeador.css';

const Costeador = () => {
    // Estados del formulario
    const [file, setFile] = useState(null);
    const [numHojas, setNumHojas] = useState('');
    const [precio, setPrecio] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Estados con los valores exactos de tu backend
    const [tamano, setTamano] = useState('0.20'); // A4 por defecto
    const [color, setColor] = useState('1');      // B/N por defecto
    const [impresion, setImpresion] = useState('1'); // Una cara
    const [reduccion, setReduccion] = useState('1'); // Sin reducción

    // Estados de UI (deshabilitar campos)
    const [disableReduccion, setDisableReduccion] = useState(false);
    const [disableImpresion, setDisableImpresion] = useState(false);

    // Efecto para manejar las reglas de negocio
    useEffect(() => {
        if (['0.80', '2.50', '3.00'].includes(tamano)) {
            setDisableReduccion(true);
            setReduccion('1');
            setDisableImpresion(true);
            setImpresion('1');
        } else {
            setDisableReduccion(false);
            setDisableImpresion(false);
        }

        if (impresion === '0.25') { 
            setDisableReduccion(true);
            setReduccion('1');
        } else if (!['0.80', '2.50', '3.00'].includes(tamano)) {
            setDisableReduccion(false);
        }
    }, [tamano, impresion]);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // 1. Guardamos el archivo en el estado visual
        setFile(selectedFile);
        setPrecio(''); // Limpiamos el precio viejo
        setNumHojas('Calculando...'); // Mostramos el estado de carga

        // 2. Preparamos el archivo para enviarlo en segundo plano
        const formData = new FormData();
        formData.append('pdfFile', selectedFile);
        
        // Enviamos los valores por defecto para que el backend no falle
        formData.append('tamano', tamano);
        formData.append('color', color);
        formData.append('impresion', impresion);
        formData.append('reduccion', reduccion);

        // 3. Hacemos la petición automática al backend
        try {
            const response = await api.post('http://localhost:4000/calcular-precio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // 4. Actualizamos el número de hojas detectadas inmediatamente
            setNumHojas(response.data.numPaginas);

            /* OPCIONAL: Si quieres que el precio también aparezca automáticamente 
               sin presionar el botón de "Calcular Presupuesto", descomenta la línea de abajo: */
            // setPrecio(response.data.precio);

        } catch (error) {
            console.error("Error al contar las hojas:", error);
            setNumHojas('Error al leer el PDF');
        }
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
            // ---> AQUÍ ESTÁ LA SOLUCIÓN MÁGICA <---
            // Forzamos la petición al puerto 4000 de Node.js
            const response = await api.post('http://localhost:4000/calcular-precio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setPrecio(response.data.precio);
            setNumHojas(response.data.numPaginas);
            setNotification({ message: 'Cálculo exitoso', type: 'success' });
        } catch (error) {
            console.error(error);
            setNotification({ message: 'Error al calcular el precio', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="costeador-wrapper">
            <Notification message={notification.message} type={notification.type} />
            
            <div className="costeador-container">
                {/* COLUMNA IZQUIERDA: Formulario */}
                <div className="form-card">
                    <h2>📄 Cotizador Inteligente</h2>
                    <p style={{color: '#6b7280', marginBottom: '25px'}}>Calcula tu presupuesto al instante. Sin esperas, sin sorpresas.</p>

                    <div className="step-group">
                        <label className="step-title">1. Sube tu documento (PDF)</label>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={handleFileChange} 
                            className="input-file"
                        />
                        {numHojas && <p className="hojas-detectadas">Hojas detectadas: <strong>{numHojas}</strong></p>}
                    </div>

                    <div className="step-group">
                        <label className="step-title">2. Tamaño de papel</label>
                        <div className="options-grid">
                            <div className={`option-box ${tamano === '0.10' ? 'selected' : ''}`} onClick={() => setTamano('0.10')}>A5</div>
                            <div className={`option-box ${tamano === '0.20' ? 'selected' : ''}`} onClick={() => setTamano('0.20')}>A4</div>
                            <div className={`option-box ${tamano === '0.80' ? 'selected' : ''}`} onClick={() => setTamano('0.80')}>A3</div>
                            <div className={`option-box ${tamano === '2.50' ? 'selected' : ''}`} onClick={() => setTamano('2.50')}>A2</div>
                            <div className={`option-box ${tamano === '3.00' ? 'selected' : ''}`} onClick={() => setTamano('3.00')}>A1</div>
                        </div>
                    </div>

                    <div className="step-group">
                        <label className="step-title">3. Calidad de Impresión</label>
                        <div className="options-grid">
                            <div className={`option-box ${color === '1' ? 'selected' : ''}`} onClick={() => setColor('1')}>Blanco y Negro</div>
                            <div className={`option-box ${color === '1.5' ? 'selected' : ''}`} onClick={() => setColor('1.5')}>A Color (Óptima)</div>
                        </div>
                    </div>

                    <div className="step-group">
                        <label className="step-title">4. Formato de Impresión</label>
                        <div className="options-grid">
                            <div 
                                className={`option-box ${disableImpresion ? 'disabled' : ''} ${impresion === '1' ? 'selected' : ''}`} 
                                onClick={() => !disableImpresion && setImpresion('1')}
                            >
                                Una Cara
                            </div>
                            <div 
                                className={`option-box ${disableImpresion ? 'disabled' : ''} ${impresion === '0.50' ? 'selected' : ''}`} 
                                onClick={() => !disableImpresion && setImpresion('0.50')}
                            >
                                Dúplex (Doble Cara)
                            </div>
                            <div 
                                className={`option-box ${disableImpresion ? 'disabled' : ''} ${impresion === '0.25' ? 'selected' : ''}`} 
                                onClick={() => !disableImpresion && setImpresion('0.25')}
                            >
                                Folleto (Revista)
                            </div>
                        </div>
                        {disableImpresion && <span className="helper-text">El formato doble cara/folleto no está disponible para este tamaño.</span>}
                    </div>

                    <div className="step-group">
                        <label className="step-title">5. Reducción (Páginas por hoja)</label>
                        <div className="options-grid">
                            <div className={`option-box ${disableReduccion ? 'disabled' : ''} ${reduccion === '1' ? 'selected' : ''}`} onClick={() => !disableReduccion && setReduccion('1')}>Sin Reducción</div>
                            <div className={`option-box ${disableReduccion ? 'disabled' : ''} ${reduccion === '0.30' ? 'selected' : ''}`} onClick={() => !disableReduccion && setReduccion('0.30')}>2 en 1</div>
                            <div className={`option-box ${disableReduccion ? 'disabled' : ''} ${reduccion === '0.35' ? 'selected' : ''}`} onClick={() => !disableReduccion && setReduccion('0.35')}>4 en 1</div>
                            <div className={`option-box ${disableReduccion ? 'disabled' : ''} ${reduccion === '0.40' ? 'selected' : ''}`} onClick={() => !disableReduccion && setReduccion('0.40')}>8 en 1</div>
                            <div className={`option-box ${disableReduccion ? 'disabled' : ''} ${reduccion === '0.45' ? 'selected' : ''}`} onClick={() => !disableReduccion && setReduccion('0.45')}>16 en 1</div>
                        </div>
                        {disableReduccion && <span className="helper-text">La reducción no está disponible con las opciones actuales.</span>}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Tarjeta de Total */}
                <div className="total-card">
                    <h3 className="total-title">Total Neto a Pagar</h3>
                    <p className="total-price">S/ {precio ? Number(precio).toFixed(2) : "0.00"}</p>
                    
                    <button 
                        className="btn-calcular" 
                        onClick={handleCalcular}
                        disabled={loading}
                    >
                        {loading ? 'Calculando...' : '⚙️ Calcular Presupuesto'}
                    </button>

                    <hr style={{margin: '25px 0', borderColor: '#e5e7eb', borderStyle: 'solid', borderWidth: '1px 0 0 0'}} />
                    
                    <p style={{fontSize: '0.9rem', color: '#6b7280', marginBottom: '15px'}}>
                        ¡Toma una captura de esta pantalla y envíala por WhatsApp para agilizar tu pedido!
                    </p>
                    
                    <a 
                        href={`https://wa.me/51999999999?text=Hola, he cotizado mi documento en su web y el total es de S/ ${precio ? Number(precio).toFixed(2) : "0.00"}.`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`btn-whatsapp ${!precio ? 'disabled-link' : ''}`}
                    >
                        💬 Enviar por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Costeador;