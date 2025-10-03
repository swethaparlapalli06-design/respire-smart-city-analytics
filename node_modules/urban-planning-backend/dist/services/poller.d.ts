import { WebSocketService } from './websocket';
export declare class DataPoller {
    private tomtomService;
    private aqiService;
    private alertsService;
    private wsService;
    private isRunning;
    private trafficJob;
    private aqiJob;
    constructor(wsService: WebSocketService);
    start(): void;
    stop(): void;
    private pollTrafficData;
    private pollAqiData;
    pollTrafficDataManually(bbox?: any): Promise<{
        segments: import("../types").TrafficSegment[];
        incidents: import("../types").Incident[];
    }>;
    pollAqiDataManually(bbox?: any): Promise<{
        aqiData: {
            cells: import("../types").AqiCell[];
            stations: import("../types").AqiStation[];
        };
        alerts: import("../types").Alert[];
    }>;
    getStatus(): {
        isRunning: boolean;
        trafficPollInterval: number;
        aqiPollInterval: number;
        connectedClients: number;
    };
}
//# sourceMappingURL=poller.d.ts.map