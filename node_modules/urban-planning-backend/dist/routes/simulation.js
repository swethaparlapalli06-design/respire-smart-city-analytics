"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulationRoutes = void 0;
const express_1 = require("express");
const simulator_1 = require("../services/simulator");
const alerts_1 = require("../services/alerts");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.simulationRoutes = router;
const simulatorService = new simulator_1.SimulatorService();
const alertsService = new alerts_1.AlertsService();
const simulationSchema = joi_1.default.object({
    zoneId: joi_1.default.string().required(),
    interventions: joi_1.default.object({
        trafficSignalRetiming: joi_1.default.number().min(0).max(1).optional(),
        lowEmissionZone: joi_1.default.number().min(0).max(1).optional(),
        bikeLaneModalShift: joi_1.default.number().min(0).max(1).optional(),
        greenBuffer: joi_1.default.number().min(0).max(1).optional(),
        rerouting: joi_1.default.number().min(0).max(1).optional()
    }).required()
});
router.post('/', async (req, res) => {
    try {
        const { error, value } = simulationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Invalid simulation request',
                details: error.details[0].message
            });
        }
        const request = value;
        const baselineData = {
            aqi: 220,
            pollutants: {
                pm25: 105,
                pm10: 150,
                no2: 55,
                o3: 30
            },
            populationExposed: 12000,
            topPollutant: 'PM2.5'
        };
        const result = await simulatorService.runSimulation(request, baselineData);
        res.json(result);
    }
    catch (error) {
        console.error('Error running simulation:', error);
        res.status(500).json({
            error: 'Failed to run simulation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/baseline/:zoneId', async (req, res) => {
    try {
        const { zoneId } = req.params;
        const baselineData = {
            zoneId,
            aqi: 220,
            pollutants: {
                pm25: 105,
                pm10: 150,
                no2: 55,
                o3: 30
            },
            populationExposed: 12000,
            topPollutant: 'PM2.5',
            location: {
                lat: 17.3850,
                lng: 78.4867
            },
            updatedAt: new Date().toISOString()
        };
        res.json(baselineData);
    }
    catch (error) {
        console.error('Error fetching baseline data:', error);
        res.status(500).json({
            error: 'Failed to fetch baseline data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/history/:zoneId', async (req, res) => {
    try {
        const { zoneId } = req.params;
        const history = [
            {
                id: 'sim_001',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                interventions: {
                    trafficSignalRetiming: 0.8,
                    lowEmissionZone: 0.6
                },
                impact: {
                    deltaAqi: -35,
                    deltaPm25: -18,
                    deltaNo2: -12,
                    populationBenefiting: 8500,
                    confidenceBand: 0.85
                }
            },
            {
                id: 'sim_002',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                interventions: {
                    bikeLaneModalShift: 0.7,
                    greenBuffer: 0.5
                },
                impact: {
                    deltaAqi: -28,
                    deltaPm25: -15,
                    deltaNo2: -8,
                    populationBenefiting: 7200,
                    confidenceBand: 0.78
                }
            }
        ];
        res.json({ zoneId, history });
    }
    catch (error) {
        console.error('Error fetching simulation history:', error);
        res.status(500).json({
            error: 'Failed to fetch simulation history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/save', async (req, res) => {
    try {
        const { simulationResult } = req.body;
        const savedSimulation = {
            id: `sim_${Date.now()}`,
            ...simulationResult,
            savedAt: new Date().toISOString()
        };
        res.json(savedSimulation);
    }
    catch (error) {
        console.error('Error saving simulation:', error);
        res.status(500).json({
            error: 'Failed to save simulation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=simulation.js.map