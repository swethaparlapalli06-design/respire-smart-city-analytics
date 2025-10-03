import { TrafficSegment, Incident, BoundingBox } from '../types';
export declare class TomTomService {
    private baseUrl;
    private apiKey;
    getFlowSegmentData(lat: number, lng: number, radius?: number): Promise<any>;
    getIncidents(bbox: BoundingBox): Promise<any>;
    getTrafficData(bbox: BoundingBox): Promise<{
        segments: TrafficSegment[];
        incidents: Incident[];
    }>;
    private mapSeverity;
}
//# sourceMappingURL=tomtom.d.ts.map