import axios from 'axios';
import { TrafficResponse, AqiResponse, AlertsResponse, SimulationRequest, SimulationResult } from '../types';

const API_BASE_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// Traffic API
export const trafficApi = {
  getTrafficData: async (bbox: string): Promise<TrafficResponse> => {
    const response = await api.get('/traffic', { params: { bbox } });
    return response.data;
  },

  getSegmentDetails: async (id: string) => {
    const response = await api.get(`/traffic/segments/${id}`);
    return response.data;
  },

  getIncidentDetails: async (id: string) => {
    const response = await api.get(`/traffic/incidents/${id}`);
    return response.data;
  },
};

// AQI API
export const aqiApi = {
  getAqiData: async (bbox: string): Promise<AqiResponse> => {
    const response = await api.get('/aqi', { params: { bbox } });
    return response.data;
  },

  getStations: async () => {
    const response = await api.get('/aqi/stations');
    return response.data;
  },

  getStationDetails: async (id: string) => {
    const response = await api.get(`/aqi/stations/${id}`);
    return response.data;
  },
};

// Alerts API
export const alertsApi = {
  getAlerts: async (bbox: string): Promise<AlertsResponse> => {
    const response = await api.get('/alerts', { params: { bbox } });
    return response.data;
  },

  getHighPriorityAlerts: async (bbox: string): Promise<AlertsResponse> => {
    const response = await api.get('/alerts/high-priority', { params: { bbox } });
    return response.data;
  },

  getAlertDetails: async (id: string) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },
};

// Simulation API
export const simulationApi = {
  runSimulation: async (request: SimulationRequest): Promise<SimulationResult> => {
    const response = await api.post('/simulate', request);
    return response.data;
  },

  getBaselineData: async (zoneId: string) => {
    const response = await api.get(`/simulate/baseline/${zoneId}`);
    return response.data;
  },

  getSimulationHistory: async (zoneId: string) => {
    const response = await api.get(`/simulate/history/${zoneId}`);
    return response.data;
  },

  saveSimulation: async (simulationResult: SimulationResult) => {
    const response = await api.post('/simulate/save', { simulationResult });
    return response.data;
  },
};

// Export API
export const exportApi = {
  exportSummary: async (zoneId: string, simulationResult?: SimulationResult) => {
    const params = new URLSearchParams({ zoneId });
    if (simulationResult) {
      params.append('simulationResult', JSON.stringify(simulationResult));
    }
    
    const response = await api.get(`/export/summary?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportData: async (zoneId: string, format: 'json' | 'csv' = 'json') => {
    const response = await api.get('/export/data', {
      params: { zoneId, format },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },
};

// Utility functions
export const formatBbox = (viewport: { latitude: number; longitude: number; zoom: number }): string => {
  // Calculate bounding box based on viewport
  const latRange = 0.1; // Approximate range for zoom level
  const lngRange = 0.1;
  
  const minLat = viewport.latitude - latRange;
  const maxLat = viewport.latitude + latRange;
  const minLng = viewport.longitude - lngRange;
  const maxLng = viewport.longitude + lngRange;
  
  return `${minLat},${minLng},${maxLat},${maxLng}`;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export default api;
