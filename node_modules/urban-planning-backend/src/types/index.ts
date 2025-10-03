// Traffic Data Types
export interface TrafficSegment {
  id: string;
  geom: {
    type: 'LineString';
    coordinates: number[][];
  };
  speedKmph: number;
  freeflowKmph: number;
  congestionLevel: number; // 0-1
  incidents: Incident[];
  updatedAt: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  startTime: string;
  endTime?: string;
}

// AQI Data Types
export interface AqiCell {
  id: string;
  geom: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  aqi: number;
  pollutants: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    o3?: number;
    co?: number;
    so2?: number;
  };
  source: 'CPCB' | 'OpenAQ' | 'NASA';
  updatedAt: string;
}

export interface AqiStation {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  aqi: number;
  pollutants: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    o3?: number;
    co?: number;
    so2?: number;
  };
  source: 'CPCB' | 'OpenAQ' | 'NASA';
  updatedAt: string;
}

// Alert Types
export interface Alert {
  zoneId: string;
  zoneName: string;
  severity: 'HIGH' | 'MEDIUM';
  aqi: number;
  topPollutant: string;
  populationExposed?: number;
  location: {
    lat: number;
    lng: number;
  };
  updatedAt: string;
}

// Simulation Types
export interface SimulationRequest {
  zoneId: string;
  interventions: {
    trafficSignalRetiming?: number; // 0-1 multiplier
    lowEmissionZone?: number; // 0-1 reduction in high-emitters
    bikeLaneModalShift?: number; // 0-1 shift to non-motorized
    greenBuffer?: number; // 0-1 dispersion improvement
    rerouting?: number; // 0-1 flow reduction on hotspots
  };
}

export interface SimulationResult {
  zoneId: string;
  baseline: {
    aqi: number;
    pm25: number;
    no2: number;
    populationExposed: number;
  };
  predicted: {
    aqi: number;
    pm25: number;
    no2: number;
    populationExposed: number;
  };
  impact: {
    deltaAqi: number;
    deltaPm25: number;
    deltaNo2: number;
    populationBenefiting: number;
    confidenceBand: number;
  };
  recommendations: string[];
  interventions: SimulationRequest['interventions'];
  timestamp: string;
}

// API Response Types
export interface TrafficResponse {
  segments: TrafficSegment[];
  incidents: Incident[];
  updatedAt: string;
}

export interface AqiResponse {
  cells: AqiCell[];
  stations: AqiStation[];
  updatedAt: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  updatedAt: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'traffic_update' | 'aqi_update' | 'alert_update' | 'connection' | 'pong';
  data: any;
  timestamp: string;
}

// Bounding Box Type
export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}
