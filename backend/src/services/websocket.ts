import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from '../types';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection',
        data: { message: 'Connected to Urban Planning Platform' },
        timestamp: new Date().toISOString()
      });

      // Handle client messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'subscribe':
        // Handle subscription to specific data types
        console.log('Client subscribed to:', data.channels);
        break;
      case 'ping':
        // Respond to ping with pong
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

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast message to all connected clients
  broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      } else {
        // Remove closed connections
        this.clients.delete(client);
      }
    });
  }

  // Broadcast traffic update
  broadcastTrafficUpdate(trafficData: any) {
    this.broadcast({
      type: 'traffic_update',
      data: trafficData,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast AQI update
  broadcastAqiUpdate(aqiData: any) {
    this.broadcast({
      type: 'aqi_update',
      data: aqiData,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast alert update
  broadcastAlertUpdate(alerts: any) {
    this.broadcast({
      type: 'alert_update',
      data: alerts,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  // Check if any clients are connected
  hasConnectedClients(): boolean {
    return this.clients.size > 0;
  }
}
