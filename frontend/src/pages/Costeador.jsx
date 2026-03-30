import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import Notification from '../components/Notification';
import './styles/Costeador.css';

const Costeador = () => {
    // Estados del formulario (Mantenidos intactos)
    const [file, setFile] = useState(null);
    const [numHojas, setNumHojas] = useState('');
    const [precio, setPrecio] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Estados con los valores exactos (Mantenidos intactos)
    const [tamano, setTamano] = useState('0.20'); 
    const [color, setColor] = useState('1');      
    const [impresion, setImpresion] = useState('1'); 
    const [reduccion, setReduccion] = useState('1'); 

    // Estados de UI (Mantenidos intactos)
    const [disableReduccion, setDisableReduccion] = useState(false);
    const [disableImpresion, setDisableImpresion] = useState(false);

    // Efecto para manejar las reglas de negocio (Mantenido intacto)
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

        setFile(selectedFile);
        setPrecio(''); 
        setNumHojas('Analizando documento...'); 

        const formData = new FormData();
        formData.append('pdfFile', selectedFile);
        formData.append('tamano', tamano);
        formData.append('color', color);
        formData.append('impresion', impresion);
        formData.append('reduccion', reduccion);

        try {
            const response = await api.post('http://localhost:4000/calcular-precio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNumHojas(response.data.numPaginas);
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
                {/* COLUMNA IZQUIERDA: Formulario con animación */}
                <motion.div 
                    className="form-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="form-header">
                        <h2>Cotizador Inteligente</h2>
                        <p>Calcula tu presupuesto de impresión al instante. Sin sorpresas.</p>
                    </div>

                    <div className="step-group">
                        <label className="step-title">1. Sube tu documento (PDF)</label>
                        <div className="file-upload-wrapper">
                            <input 
                                type="file" 
                                accept=".pdf" 
                                onChange={handleFileChange} 
                                className="input-file"
                            />
                            <span style={{color: file ? '#0f172a' : '#64748b', fontWeight: file ? '600' : '400'}}>
                                {file ? `📄 ${file.name}` : '📁 Haz clic aquí o arrastra tu PDF'}
                            </span>
                        </div>
                        {numHojas && (
                            <div className="hojas-detectadas">
                                <span>Total de páginas detectadas: <strong>{numHojas}</strong></span>
                            </div>
                        )}
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
                        {disableImpresion && <span className="helper-text">⚠️ El formato doble cara/folleto no está disponible para este tamaño.</span>}
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
                        {disableReduccion && <span className="helper-text">⚠️ La reducción no está disponible con las opciones actuales.</span>}
                    </div>
                </motion.div>

                {/* COLUMNA DERECHA: Tarjeta de Total con animación */}
                <motion.div 
                    className="total-card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="total-header">
                        <h3 className="total-title">Total a Pagar</h3>
                        <p className="total-price">S/ {precio ? Number(precio).toFixed(2) : "0.00"}</p>
                    </div>
                    
                    <button 
                        className="btn-calcular" 
                        onClick={handleCalcular}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : 'Calcular Presupuesto'}
                    </button>

                    <div className="divider"></div>
                    
                    <div className="whatsapp-section">
                        <p>
                            Toma una captura de esta pantalla y envíala por WhatsApp para agilizar tu pedido en tienda.
                        </p>
                        
                        <a 
                            href={`https://wa.me/51999999999?text=Hola, he cotizado mi documento en su web y el total es de S/ ${precio ? Number(precio).toFixed(2) : "0.00"}.`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`btn-whatsapp ${!precio ? 'disabled-link' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            Enviar por WhatsApp
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Costeador;