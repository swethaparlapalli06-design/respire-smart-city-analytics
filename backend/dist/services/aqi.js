"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AqiService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class AqiService {
    constructor() {
        this.nasaApiKey = config_1.config.nasaApiKey;
        this.cpcbBaseUrl = 'https://airquality.cpcb.gov.in/ccr/api';
    }
    async getCpcbData(bbox) {
        try {
            const stations = [];
            const cells = [];
            const mockStations = [
                {
                    id: 'cpcb_001',
                    name: 'Hyderabad Central',
                    location: { lat: 17.3850, lng: 78.4867 },
                    aqi: 185,
                    pollutants: { pm25: 85, pm10: 120, no2: 45, o3: 25 },
                    source: 'CPCB',
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'cpcb_002',
                    name: 'Secunderabad',
                    location: { lat: 17.4399, lng: 78.4983 },
                    aqi: 220,
                    pollutants: { pm25: 105, pm10: 150, no2: 55, o3: 30 },
                    source: 'CPCB',
                    updatedAt: new Date().toISOString()
                }
            ];
            stations.push(...mockStations);
            const cellSize = 0.01;
            for (let lat = bbox.minLat; lat < bbox.maxLat; lat += cellSize) {
                for (let lng = bbox.minLng; lng < bbox.maxLng; lng += cellSize) {
                    const cellId = `cell_${lat.toFixed(4)}_${lng.toFixed(4)}`;
                    const nearestStation = this.findNearestStation(lat, lng, stations);
                    const distance = this.calculateDistance(lat, lng, nearestStation.location.lat, nearestStation.location.lng);
                    const interpolationFactor = Math.max(0, 1 - (distance / 0.05));
                    const aqi = nearestStation.aqi * (0.8 + 0.4 * Math.random() * interpolationFactor);
                    cells.push({
                        id: cellId,
                        geom: {
                            type: 'Polygon',
                            coordinates: [[
                                    [lng, lat],
                                    [lng + cellSize, lat],
                                    [lng + cellSize, lat + cellSize],
                                    [lng, lat + cellSize],
                                    [lng, lat]
                                ]]
                        },
                        aqi: Math.round(aqi),
                        pollutants: {
                            pm25: Math.round(nearestStation.pollutants.pm25 * (0.8 + 0.4 * Math.random())),
                            pm10: Math.round(nearestStation.pollutants.pm10 * (0.8 + 0.4 * Math.random())),
                            no2: Math.round(nearestStation.pollutants.no2 * (0.8 + 0.4 * Math.random())),
                            o3: Math.round(nearestStation.pollutants.o3 * (0.8 + 0.4 * Math.random()))
                        },
                        source: 'CPCB',
                        updatedAt: new Date().toISOString()
                    });
                }
            }
            return { cells, stations };
        }
        catch (error) {
            console.error('Error fetching CPCB data:', error);
            return this.getOpenAqData(bbox);
        }
    }
    async getOpenAqData(bbox) {
        try {
            const url = 'https://api.openaq.org/v2/measurements';
            const response = await axios_1.default.get(url, {
                params: {
                    limit: 1000,
                    coordinates: `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`,
                    order_by: 'datetime',
                    sort: 'desc'
                }
            });
            const stations = [];
            const cells = [];
            const locationMap = new Map();
            response.data.results.forEach((measurement) => {
                const key = `${measurement.location}_${measurement.coordinates.latitude}_${measurement.coordinates.longitude}`;
                if (!locationMap.has(key)) {
                    locationMap.set(key, []);
                }
                locationMap.get(key).push(measurement);
            });
            locationMap.forEach((measurements, key) => {
                const firstMeasurement = measurements[0];
                const pollutants = {};
                measurements.forEach((m) => {
                    if (m.parameter === 'pm25')
                        pollutants.pm25 = m.value;
                    if (m.parameter === 'pm10')
                        pollutants.pm10 = m.value;
                    if (m.parameter === 'no2')
                        pollutants.no2 = m.value;
                    if (m.parameter === 'o3')
                        pollutants.o3 = m.value;
                });
                const aqi = this.calculateAqi(pollutants);
                stations.push({
                    id: `openaq_${key}`,
                    name: firstMeasurement.location,
                    location: {
                        lat: firstMeasurement.coordinates.latitude,
                        lng: firstMeasurement.coordinates.longitude
                    },
                    aqi,
                    pollutants,
                    source: 'OpenAQ',
                    updatedAt: firstMeasurement.date.utc
                });
            });
            return { cells, stations };
        }
        catch (error) {
            console.error('Error fetching OpenAQ data:', error);
            throw error;
        }
    }
    async getNasaData(bbox) {
        try {
            const centerLat = (bbox.minLat + bbox.maxLat) / 2;
            const centerLng = (bbox.minLng + bbox.maxLng) / 2;
            const url = 'https://api.nasa.gov/planetary/earth/assets';
            const response = await axios_1.default.get(url, {
                params: {
                    lon: centerLng,
                    lat: centerLat,
                    date: new Date().toISOString().split('T')[0],
                    dim: 0.1,
                    api_key: this.nasaApiKey
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching NASA data:', error);
            return null;
        }
    }
    async getAqiData(bbox) {
        try {
            const cpcbData = await this.getCpcbData(bbox);
            const nasaData = await this.getNasaData(bbox);
            if (nasaData) {
            }
            return cpcbData;
        }
        catch (error) {
            console.error('Error fetching AQI data:', error);
            throw error;
        }
    }
    findNearestStation(lat, lng, stations) {
        let nearest = stations[0];
        let minDistance = this.calculateDistance(lat, lng, nearest.location.lat, nearest.location.lng);
        for (const station of stations) {
            const distance = this.calculateDistance(lat, lng, station.location.lat, station.location.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = station;
            }
        }
        return nearest;
    }
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    calculateAqi(pollutants) {
        const pm25 = pollutants.pm25 || 0;
        if (pm25 <= 12)
            return Math.round(50 * (pm25 / 12));
        if (pm25 <= 35.4)
            return Math.round(50 + 50 * ((pm25 - 12) / 23.4));
        if (pm25 <= 55.4)
            return Math.round(100 + 50 * ((pm25 - 35.4) / 20));
        if (pm25 <= 150.4)
            return Math.round(150 + 50 * ((pm25 - 55.4) / 95));
        if (pm25 <= 250.4)
            return Math.round(200 + 100 * ((pm25 - 150.4) / 100));
        return Math.round(300 + 100 * ((pm25 - 250.4) / 149.6));
    }
}
exports.AqiService = AqiService;
//# sourceMappingURL=aqi.js.map