import React, { useState, useEffect, useRef } from 'react';

const BotManager = () => {
    const [sessions, setSessions] = useState([]);
    const [qrCode, setQrCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionName, setSessionName] = useState('InversionesPerez');
    const ws = useRef(null);

    useEffect(() => {
        // Conectar al servidor de WebSockets en el backend
        ws.current = new WebSocket('ws://localhost:4000');

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.action === 'qr') {
                setQrCode(data.qr);
                setLoading(false);
            } else if (data.action === 'ready') {
                setQrCode('');
                setLoading(false);
            } else if (data.action === 'sessions') {
                setSessions(data.sessions);
            } else if (data.action === 'sessionFailed') {
                setQrCode(data.qr);
                setLoading(false);
                alert('La sesión falló, por favor vuelve a escanear el QR.');
            }
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const handleStartBot = () => {
        if (!sessionName.trim()) return alert("Ingresa un nombre para la sesión");
        setLoading(true);
        setQrCode('');
        ws.current.send(JSON.stringify({ action: 'start', sessionId: sessionName }));
    };

    const handleStopBot = (id) => {
        if(window.confirm(`¿Seguro que deseas desconectar el bot de ${id}?`)) {
            ws.current.send(JSON.stringify({ action: 'stop', sessionId: id }));
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>🤖 Gestor del Bot de WhatsApp</h2>
            <p>Escanea el QR con el celular de la empresa para activar las respuestas automáticas.</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                    type="text" 
                    value={sessionName} 
                    onChange={(e) => setSessionName(e.target.value)} 
                    placeholder="Nombre de sesión (ej. Imprenta)"
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button 
                    onClick={handleStartBot}
                    disabled={loading}
                    style={{ padding: '10px 20px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Generando QR...' : 'Generar QR de Conexión'}
                </button>
            </div>

            {/* Mostrar QR si existe */}
            {qrCode && (
                <div style={{ textAlign: 'center', margin: '20px 0', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px' }}>
                    <h3>Escanea este código:</h3>
                    <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px' }} />
                </div>
            )}

            {/* Lista de sesiones activas */}
            <div style={{ marginTop: '30px' }}>
                <h3>📱 Dispositivos Conectados:</h3>
                {sessions.length === 0 ? (
                    <p style={{ color: '#666' }}>No hay ningún bot conectado en este momento.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {sessions.map(id => (
                            <li key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '10px', backgroundColor: '#f9f9f9' }}>
                                <span>🟢 <strong>{id}</strong> (Bot Activo)</span>
                                <button 
                                    onClick={() => handleStopBot(id)}
                                    style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Desconectar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default BotManager;