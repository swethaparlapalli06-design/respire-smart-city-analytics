import { WebSocketServer } from 'ws';
import { WebSocketMessage } from '../types';
export declare class WebSocketService {
    private wss;
    private clients;
    constructor(wss: WebSocketServer);
    private setupWebSocketServer;
    private handleClientMessage;
    private sendToClient;
    broadcast(message: WebSocketMessage): void;
    broadcastTrafficUpdate(trafficData: any): void;
    broadcastAqiUpdate(aqiData: any): void;
    broadcastAlertUpdate(alerts: any): void;
    getConnectedClientsCount(): number;
    hasConnectedClients(): boolean;
}
//# sourceMappingURL=websocket.d.ts.map