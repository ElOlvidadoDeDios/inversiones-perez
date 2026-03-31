import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import Notification from '../components/Notification';
import './styles/Costeador.css';

const Costeador = () => {
    // Estados del formulario
    const [file, setFile] = useState(null);
    const [numHojas, setNumHojas] = useState('');
    const [precio, setPrecio] = useState(''); // Precio base (solo impresión)
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Estados con los valores exactos
    const [tamano, setTamano] = useState('0.20'); 
    const [color, setColor] = useState('1');      
    const [impresion, setImpresion] = useState('1'); 
    const [reduccion, setReduccion] = useState('1'); 

    // --- NUEVOS ESTADOS PARA ANILLADO ---
    const [wantsBinding, setWantsBinding] = useState(false);
    const [coverColor, setCoverColor] = useState('Transparente (Adelante) / Negro (Atrás)');

    // Estados de UI
    const [disableReduccion, setDisableReduccion] = useState(false);
    const [disableImpresion, setDisableImpresion] = useState(false);

    // Efecto para manejar las reglas de negocio
    useEffect(() => {
        if (['0.80', '2.50', '3.00'].includes(tamano)) { // A3, A2, A1
            setDisableReduccion(true);
            setReduccion('1');
            setDisableImpresion(true);
            setImpresion('1');
            setWantsBinding(false); // Desactiva el anillado si cambian a un tamaño no válido
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

    // --- LÓGICA EXPERTA DE ANILLADO ---
    const calculatePhysicalSheets = () => {
        const pages = parseInt(numHojas);
        if (isNaN(pages) || pages <= 0) return 0;

        let physicalSheets = pages;

        // 1. Calcular según modo de impresión
        if (impresion === '0.50') { // Dúplex
            physicalSheets = Math.ceil(pages / 2);
        } else if (impresion === '0.25') { // Folleto
            physicalSheets = Math.ceil(pages / 4);
        }

        // 2. Calcular reducciones
        let factorReduccion = 1;
        if (reduccion === '0.30') factorReduccion = 2; // 2 en 1
        else if (reduccion === '0.35') factorReduccion = 4; // 4 en 1
        else if (reduccion === '0.40') factorReduccion = 8; // 8 en 1
        else if (reduccion === '0.45') factorReduccion = 16; // 16 en 1

        if (factorReduccion > 1) {
            physicalSheets = Math.ceil(physicalSheets / factorReduccion);
        }

        return physicalSheets;
    };

    const calculateBindingCost = () => {
        const invalidSizes = ['0.80', '2.50', '3.00']; // Valores de A3, A2, A1
        if (!wantsBinding || invalidSizes.includes(tamano)) return 0;

        const sheets = calculatePhysicalSheets();
        if (sheets === 0) return 0;

        const baseCost = 1.50;
        const extraTiers = Math.floor((sheets - 1) / 20); 
        return baseCost + (extraTiers * 0.50);
    };

    // Calcula el precio final (Impresión Backend + Costo de Anillado Local)
    const finalPrice = (parseFloat(precio || 0) + calculateBindingCost()).toFixed(2);
    // ----------------------------------

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
            const response = await api.post('http://localhost:4000/api/calcular-precio', formData, {
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
            const response = await api.post('http://localhost:4000/api/calcular-precio', formData, {
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

    // Preparamos el mensaje de WhatsApp para que incluya los detalles del anillado
    const whatsappMessage = `Hola, he cotizado mi documento en su web y el total es de S/ ${finalPrice}.${wantsBinding ? ` (Incluye Anillado con tapas: ${coverColor}).` : ''}`;

    return (
        <div className="costeador-wrapper">
            <Notification message={notification.message} type={notification.type} />
            
            <div className="costeador-container">
                {/* COLUMNA IZQUIERDA: Formulario */}
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

                    {/* --- NUEVA SECCIÓN DE ANILLADO --- */}
                    <div className="step-group" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <label className="step-title" style={{ marginBottom: '15px' }}>6. Acabados y Encuadernación</label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: '#0f172a' }}>
                            <input 
                                type="checkbox" 
                                checked={wantsBinding}
                                disabled={['0.80', '2.50', '3.00'].includes(tamano)} // Deshabilita para A3, A2, A1
                                onChange={(e) => setWantsBinding(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                            />
                            Agregar Anillado Espiral
                        </label>

                        {/* Mensaje si el tamaño no lo permite */}
                        {['0.80', '2.50', '3.00'].includes(tamano) && (
                            <p style={{ fontSize: '0.85rem', color: '#ef4444', margin: '5px 0 0 28px' }}>
                                * El anillado no está disponible para tamaños grandes (A3, A2, A1).
                            </p>
                        )}

                        {/* Opciones que se despliegan si activa el anillado */}
                        {wantsBinding && !['0.80', '2.50', '3.00'].includes(tamano) && (
                            <div style={{ marginTop: '15px', marginLeft: '28px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Color de Tapas (Mica):</label>
                                    <select 
                                        value={coverColor}
                                        onChange={(e) => setCoverColor(e.target.value)}
                                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.95rem', color: '#0f172a', outline: 'none' }}
                                    >
                                        <option value="Transparente (Adelante) / Negro (Atrás)">Clásico: Transparente y Negro</option>
                                        <option value="Transparente (Ambos lados)">Transparente en ambos lados</option>
                                        <option value="Azul (Ambos lados)">Micas Azules</option>
                                        <option value="Rojo (Ambos lados)">Micas Rojas</option>
                                        <option value="Verde (Ambos lados)">Micas Verdes</option>
                                    </select>
                                </div>

                                {/* Resumen del cobro para transparencia con el cliente */}
                                {calculatePhysicalSheets() > 0 && (
                                    <div style={{ backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', color: '#0369a1', lineHeight: '1.4' }}>
                                        <strong>Resumen de Anillado:</strong> Se han calculado <strong>{calculatePhysicalSheets()} hojas físicas</strong> en base a tu configuración. 
                                        El costo adicional del anillo será de <strong>S/ {calculateBindingCost().toFixed(2)}</strong>.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* ---------------------------------- */}

                </motion.div>

                {/* COLUMNA DERECHA: Tarjeta de Total */}
                <motion.div 
                    className="total-card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="total-header">
                        <h3 className="total-title">Total a Pagar</h3>
                        {/* Se muestra el precio sumando la impresión + anillado */}
                        <p className="total-price">S/ {precio ? finalPrice : "0.00"}</p>
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
                            href={`https://wa.me/51999999999?text=${encodeURIComponent(whatsappMessage)}`} 
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