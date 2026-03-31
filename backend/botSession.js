'use strict';
const { Client, LocalAuth } = require('whatsapp-web.js');
const handleBotResponse = require('./BotResponses/botResponses.js');

class BotSession {
    constructor(sessionId, onQR, onReady, onDisconnected) {
        this.sessionId = sessionId;
        this.startTime = Math.floor(Date.now() / 1000);
        this.filtrarMensajesAntiguos = true;

        setTimeout(() => {
            this.filtrarMensajesAntiguos = false;
            console.log('⏰ Filtro de mensajes antiguos desactivado para ' + this.sessionId);
        }, 60000);

        // AQUÍ ESTÁ LA MAGIA: Argumentos para que no crashee
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionId }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            }
        });

        this.client.on('qr', qr => {
            console.log('🔹 QR generado para ' + sessionId + ':', qr);
            if (onQR) onQR(qr);
        });

        this.client.on('ready', () => {
            console.log('✅ ' + sessionId + ' conectado a WhatsApp.');
            if (onReady) onReady(sessionId);
        });

        this.client.on('message', async msg => {
            if (this.filtrarMensajesAntiguos && msg.timestamp < this.startTime) return;
            await handleBotResponse(this.sessionId, this.client, msg);
        });

        this.client.on('message_create', async msg => {
            if (msg.fromMe) {
                const bodyLowerCase = msg.body.toLowerCase();
                if (bodyLowerCase.includes('stop') || bodyLowerCase.includes('desconectado')) {
                    await handleBotResponse(this.sessionId, this.client, msg);
                }
            }
        });

        this.client.on('auth_failure', async msg => {
            console.log('❌ Fallo de autenticación: ' + msg);
            if (onDisconnected) onDisconnected(sessionId);
        });

        this.client.on('disconnected', reason => {
            console.error('⚠️ Desconectado: ', reason);
            if (onDisconnected) onDisconnected(sessionId);
        });

        this.client.initialize();
    }

    async logout() {
        console.log('🛑 Deteniendo cliente de WhatsApp...');
        try {
            // Intentamos cerrar sesión de forma segura si ya estaba escaneado
            await this.client.logout().catch(() => {});
        } catch (error) {
            console.error('⚠️ Aviso al cerrar sesión:', error.message);
        } finally {
            // EL SECRETO: SIEMPRE destruimos el cliente (mata el proceso Chromium), 
            // haya iniciado sesión o solo estuviera generando el QR.
            try {
                await this.client.destroy();
                console.log('✅ Cliente destruido correctamente.');
            } catch (e) {
                console.error('⚠️ Error al destruir cliente:', e.message);
            }
        }
    }

    cleanup() {
        if (this.client) {
            this.client.removeAllListeners();
        }
        this.client = null;
        this.sessionId = null;
    }
}

module.exports = BotSession;