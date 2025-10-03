"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trafficRoutes = void 0;
const express_1 = require("express");
const tomtom_1 = require("../services/tomtom");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.trafficRoutes = router;
const tomtomService = new tomtom_1.TomTomService();
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
        const trafficData = await tomtomService.getTrafficData(bbox);
        const response = {
            segments: trafficData.segments,
            incidents: trafficData.incidents,
            updatedAt: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching traffic data:', error);
        res.status(500).json({
            error: 'Failed to fetch traffic data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/segments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const segment = {
            id,
            geom: {
                type: 'LineString',
                coordinates: [[78.4867, 17.3850], [78.4877, 17.3860]]
            },
            speedKmph: 25,
            freeflowKmph: 50,
            congestionLevel: 0.5,
            incidents: [],
            updatedAt: new Date().toISOString()
        };
        res.json(segment);
    }
    catch (error) {
        console.error('Error fetching segment details:', error);
        res.status(500).json({
            error: 'Failed to fetch segment details',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/incidents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const incident = {
            id,
            type: 'Traffic Jam',
            severity: 'MEDIUM',
            description: 'Heavy traffic congestion',
            location: {
                lat: 17.3850,
                lng: 78.4867
            },
            startTime: new Date().toISOString(),
            endTime: undefined
        };
        res.json(incident);
    }
    catch (error) {
        console.error('Error fetching incident details:', error);
        res.status(500).json({
            error: 'Failed to fetch incident details',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=traffic.js.map