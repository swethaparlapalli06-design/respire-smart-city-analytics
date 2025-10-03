"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRoutes = void 0;
const express_1 = require("express");
const alerts_1 = require("../services/alerts");
const aqi_1 = require("../services/aqi");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.alertsRoutes = router;
const alertsService = new alerts_1.AlertsService();
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
        const alerts = await alertsService.computeAlerts(aqiData.cells, aqiData.stations);
        const response = {
            alerts,
            updatedAt: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            error: 'Failed to fetch alerts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/high-priority', async (req, res) => {
    try {
        const { error, value } = bboxSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                error: 'Invalid bbox parameter',
                details: error.details[0].message
            });
        }
        const [minLat, minLng, maxLat, maxLng] = value.bbox.split(',').map(Number);
        const bbox = { minLat, minLng, maxLat, maxLng };
        const aqiData = await aqiService.getAqiData(bbox);
        const allAlerts = await alertsService.computeAlerts(aqiData.cells, aqiData.stations);
        const highPriorityAlerts = allAlerts.filter(alert => alert.severity === 'HIGH');
        const response = {
            alerts: highPriorityAlerts,
            updatedAt: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching high-priority alerts:', error);
        res.status(500).json({
            error: 'Failed to fetch high-priority alerts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const alert = {
            id,
            zoneId: id,
            zoneName: `Zone ${id.split('_')[1]}`,
            severity: 'HIGH',
            aqi: 220,
            topPollutant: 'PM2.5',
            populationExposed: 12000,
            location: {
                lat: 17.3850,
                lng: 78.4867
            },
            updatedAt: new Date().toISOString(),
            history: [
                { timestamp: new Date(Date.now() - 3600000).toISOString(), aqi: 210 },
                { timestamp: new Date(Date.now() - 7200000).toISOString(), aqi: 195 },
                { timestamp: new Date(Date.now() - 10800000).toISOString(), aqi: 225 }
            ],
            recommendations: [
                'Implement traffic signal retiming',
                'Create low emission zone',
                'Add green buffers'
            ]
        };
        res.json(alert);
    }
    catch (error) {
        console.error('Error fetching alert details:', error);
        res.status(500).json({
            error: 'Failed to fetch alert details',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=alerts.js.map