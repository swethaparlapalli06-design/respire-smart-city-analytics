import { Router } from 'express';
import { SimulatorService } from '../services/simulator';
import { AlertsService } from '../services/alerts';
import { SimulationRequest, SimulationResult } from '../types';
import Joi from 'joi';

const router = Router();
const simulatorService = new SimulatorService();
const alertsService = new AlertsService();

// Validation schema for simulation request
const simulationSchema = Joi.object({
  zoneId: Joi.string().required(),
  interventions: Joi.object({
    trafficSignalRetiming: Joi.number().min(0).max(1).optional(),
    lowEmissionZone: Joi.number().min(0).max(1).optional(),
    bikeLaneModalShift: Joi.number().min(0).max(1).optional(),
    greenBuffer: Joi.number().min(0).max(1).optional(),
    rerouting: Joi.number().min(0).max(1).optional()
  }).required()
});

// POST /api/simulate
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = simulationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid simulation request', 
        details: error.details[0].message 
      });
    }

    const request: SimulationRequest = value;

    // Get baseline data for the zone
    // In a real implementation, you'd fetch this from your database
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

    // Run simulation
    const result: SimulationResult = await simulatorService.runSimulation(request, baselineData);

    res.json(result);
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ 
      error: 'Failed to run simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/simulate/baseline/:zoneId - Get baseline data for a zone
router.get('/baseline/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    
    // In a real implementation, you'd fetch this from your database
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
  } catch (error) {
    console.error('Error fetching baseline data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch baseline data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/simulate/history/:zoneId - Get simulation history for a zone
router.get('/history/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    
    // In a real implementation, you'd fetch this from your database
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
  } catch (error) {
    console.error('Error fetching simulation history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch simulation history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/simulate/save - Save simulation results
router.post('/save', async (req, res) => {
  try {
    const { simulationResult } = req.body;
    
    // In a real implementation, you'd save this to your database
    const savedSimulation = {
      id: `sim_${Date.now()}`,
      ...simulationResult,
      savedAt: new Date().toISOString()
    };

    res.json(savedSimulation);
  } catch (error) {
    console.error('Error saving simulation:', error);
    res.status(500).json({ 
      error: 'Failed to save simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as simulationRoutes };
