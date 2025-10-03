"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const ws_1 = require("ws");
class WebSocketService {
    constructor(wss) {
        this.clients = new Set();
        this.wss = wss;
        this.setupWebSocketServer();
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws) => {
            console.log('New WebSocket client connected');
            this.clients.add(ws);
            this.sendToClient(ws, {
                type: 'connection',
                data: { message: 'Connected to Urban Planning Platform' },
                timestamp: new Date().toISOString()
            });
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(ws, data);
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.clients.delete(ws);
            });
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }
    handleClientMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                console.log('Client subscribed to:', data.channels);
                break;
            case 'ping':
                this.sendToClient(ws, {
                    type: 'pong',
                    data: {},
                    timestamp: new Date().toISOString()
                });
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    sendToClient(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(messageStr);
            }
            else {
                this.clients.delete(client);
            }
        });
    }
    broadcastTrafficUpdate(trafficData) {
        this.broadcast({
            type: 'traffic_update',
            data: trafficData,
            timestamp: new Date().toISOString()
        });
    }
    broadcastAqiUpdate(aqiData) {
        this.broadcast({
            type: 'aqi_update',
            data: aqiData,
            timestamp: new Date().toISOString()
        });
    }
    broadcastAlertUpdate(alerts) {
        this.broadcast({
            type: 'alert_update',
            data: alerts,
            timestamp: new Date().toISOString()
        });
    }
    getConnectedClientsCount() {
        return this.clients.size;
    }
    hasConnectedClients() {
        return this.clients.size > 0;
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=websocket.js.map