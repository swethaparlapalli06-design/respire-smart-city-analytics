"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TomTomService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class TomTomService {
    constructor() {
        this.baseUrl = 'https://api.tomtom.com/traffic/services';
        this.apiKey = config_1.config.tomtomApiKey;
    }
    async getFlowSegmentData(lat, lng, radius = 1000) {
        try {
            const url = `${this.baseUrl}/4/flowSegmentData/absolute/10/json`;
            const response = await axios_1.default.get(url, {
                params: {
                    point: `${lat},${lng}`,
                    unit: 'KMPH',
                    key: this.apiKey
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching TomTom flow data:', error);
            throw error;
        }
    }
    async getIncidents(bbox) {
        try {
            const url = `${this.baseUrl}/5/incidentDetails`;
            const response = await axios_1.default.get(url, {
                params: {
                    bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
                    fields: '{incidents{type,geometry,properties{iconCategory,iconCategory2,from,to,length,delay,roadNumbers,events{description,code,descriptionCode}}}}',
                    key: this.apiKey
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching TomTom incidents:', error);
            throw error;
        }
    }
    async getTrafficData(bbox) {
        try {
            const segments = [];
            const incidents = [];
            const latStep = (bbox.maxLat - bbox.minLat) / 5;
            const lngStep = (bbox.maxLng - bbox.minLng) / 5;
            const promises = [];
            for (let i = 0; i <= 5; i++) {
                for (let j = 0; j <= 5; j++) {
                    const lat = bbox.minLat + (i * latStep);
                    const lng = bbox.minLng + (j * lngStep);
                    promises.push(this.getFlowSegmentData(lat, lng));
                }
            }
            const flowResults = await Promise.allSettled(promises);
            const incidentsResult = await this.getIncidents(bbox);
            flowResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value?.flowSegmentData) {
                    const data = result.value.flowSegmentData;
                    const lat = bbox.minLat + (Math.floor(index / 6) * latStep);
                    const lng = bbox.minLng + ((index % 6) * lngStep);
                    segments.push({
                        id: `segment_${index}`,
                        geom: {
                            type: 'LineString',
                            coordinates: [[lng, lat], [lng + 0.001, lat + 0.001]]
                        },
                        speedKmph: data.currentSpeed || 0,
                        freeflowKmph: data.freeFlowSpeed || 0,
                        congestionLevel: data.currentSpeed && data.freeFlowSpeed
                            ? Math.max(0, 1 - (data.currentSpeed / data.freeFlowSpeed))
                            : 0,
                        incidents: [],
                        updatedAt: new Date().toISOString()
                    });
                }
            });
            if (incidentsResult?.incidents) {
                incidentsResult.incidents.forEach((incident, index) => {
                    incidents.push({
                        id: `incident_${index}`,
                        type: incident.properties?.iconCategory || 'Unknown',
                        severity: this.mapSeverity(incident.properties?.iconCategory),
                        description: incident.properties?.events?.[0]?.description || 'Traffic incident',
                        location: {
                            lat: incident.geometry?.coordinates?.[1] || 0,
                            lng: incident.geometry?.coordinates?.[0] || 0
                        },
                        startTime: new Date().toISOString(),
                        endTime: undefined
                    });
                });
            }
            return { segments, incidents };
        }
        catch (error) {
            console.error('Error fetching traffic data:', error);
            throw error;
        }
    }
    mapSeverity(iconCategory) {
        const severityMap = {
            'accident': 'HIGH',
            'roadwork': 'MEDIUM',
            'road-closed': 'HIGH',
            'traffic-jam': 'MEDIUM',
            'weather': 'MEDIUM',
            'other': 'LOW'
        };
        return severityMap[iconCategory] || 'LOW';
    }
}
exports.TomTomService = TomTomService;
//# sourceMappingURL=tomtom.js.map