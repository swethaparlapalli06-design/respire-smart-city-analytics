import { Router } from 'express';
import { AlertsService } from '../services/alerts';
import { AqiService } from '../services/aqi';
import { AlertsResponse } from '../types';
import Joi from 'joi';

const router = Router();
const alertsService = new AlertsService();
const aqiService = new AqiService();

// Validation schema for bbox parameter
const bboxSchema = Joi.object({
  bbox: Joi.string().pattern(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/).required()
});

// GET /api/alerts?bbox=minLat,minLng,maxLat,maxLng
router.get('/', async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = bboxSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid bbox parameter', 
        details: error.details[0].message 
      });
    }

    // Parse bbox
    const [minLat, minLng, maxLat, maxLng] = value.bbox.split(',').map(Number);
    
    // Validate coordinate ranges
    if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) {
      return res.status(400).json({ error: 'Invalid coordinate values' });
    }

    if (minLat >= maxLat || minLng >= maxLng) {
      return res.status(400).json({ error: 'Invalid bounding box' });
    }

    const bbox = { minLat, minLng, maxLat, maxLng };

    // Fetch AQI data first
    const aqiData = await aqiService.getAqiData(bbox);

    // Compute alerts from AQI data
    const alerts = await alertsService.computeAlerts(aqiData.cells, aqiData.stations);

    const response: AlertsResponse = {
      alerts,
      updatedAt: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/alerts/high-priority - Get only high-priority alerts
router.get('/high-priority', async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = bboxSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid bbox parameter', 
        details: error.details[0].message 
      });
    }

    // Parse bbox
    const [minLat, minLng, maxLat, maxLng] = value.bbox.split(',').map(Number);
    const bbox = { minLat, minLng, maxLat, maxLng };

    // Fetch AQI data
    const aqiData = await aqiService.getAqiData(bbox);

    // Compute all alerts
    const allAlerts = await alertsService.computeAlerts(aqiData.cells, aqiData.stations);

    // Filter for high-priority only
    const highPriorityAlerts = allAlerts.filter(alert => alert.severity === 'HIGH');

    const response: AlertsResponse = {
      alerts: highPriorityAlerts,
      updatedAt: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching high-priority alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch high-priority alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/alerts/:id - Get specific alert details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd fetch this from your database
    const alert = {
      id,
      zoneId: id,
      zoneName: `Zone ${id.split('_')[1]}`,
      severity: 'HIGH' as const,
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
  } catch (error) {
    console.error('Error fetching alert details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch alert details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as alertsRoutes };
