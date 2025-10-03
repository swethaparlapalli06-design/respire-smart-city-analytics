"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aqiRoutes = void 0;
const express_1 = require("express");
const aqi_1 = require("../services/aqi");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.aqiRoutes = router;
const aqiService = new aqi_1.AqiService();
const bboxSchema = joi_1.default.object({
    bbox: joi_1.default.string().pattern(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/).required()
});
router.get('/', async (req, res) => {
    try {
        const { error, value } = bboxSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                error: 'Invalid bbox parameter',
                details: error.details[0].message
            });
        }
        const [minLat, minLng, maxLat, maxLng] = value.bbox.split(',').map(Number);
        if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) {
            return res.status(400).json({ error: 'Invalid coordinate values' });
        }
        if (minLat >= maxLat || minLng >= maxLng) {
            return res.status(400).json({ error: 'Invalid bounding box' });
        }
        const bbox = { minLat, minLng, maxLat, maxLng };
        const aqiData = await aqiService.getAqiData(bbox);
        const response = {
            cells: aqiData.cells,
            stations: aqiData.stations,
            updatedAt: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching AQI data:', error);
        res.status(500).json({
            error: 'Failed to fetch AQI data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/stations', async (req, res) => {
    try {
        const stations = [
            {
                id: 'station_001',
                name: 'Hyderabad Central',
                location: { lat: 17.3850, lng: 78.4867 },
                aqi: 185,
                pollutants: { pm25: 85, pm10: 120, no2: 45, o3: 25 },
                source: 'CPCB',
                updatedAt: new Date().toISOString()
            },
            {
                id: 'station_002',
                name: 'Secunderabad',
                location: { lat: 17.4399, lng: 78.4983 },
                aqi: 220,
                pollutants: { pm25: 105, pm10: 150, no2: 55, o3: 30 },
                source: 'CPCB',
                updatedAt: new Date().toISOString()
            }
        ];
        res.json({ stations });
    }
    catch (error) {
        console.error('Error fetching AQI stations:', error);
        res.status(500).json({
            error: 'Failed to fetch AQI stations',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/stations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const station = {
            id,
            name: 'Hyderabad Central',
            location: { lat: 17.3850, lng: 78.4867 },
            aqi: 185,
            pollutants: { pm25: 85, pm10: 120, no2: 45, o3: 25 },
            source: 'CPCB',
            updatedAt: new Date().toISOString(),
            history: [
                { timestamp: new Date(Date.now() - 3600000).toISOString(), aqi: 190 },
                { timestamp: new Date(Date.now() - 7200000).toISOString(), aqi: 175 },
                { timestamp: new Date(Date.now() - 10800000).toISOString(), aqi: 200 }
            ]
        };
        res.json(station);
    }
    catch (error) {
        console.error('Error fetching station details:', error);
        res.status(500).json({
            error: 'Failed to fetch station details',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=aqi.js.map