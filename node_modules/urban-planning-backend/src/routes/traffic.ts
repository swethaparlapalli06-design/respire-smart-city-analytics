import { Router } from 'express';
import { TomTomService } from '../services/tomtom';
import { TrafficResponse } from '../types';
import Joi from 'joi';

const router = Router();
const tomtomService = new TomTomService();

// Validation schema for bbox parameter
const bboxSchema = Joi.object({
  bbox: Joi.string().pattern(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/).required()
});

// GET /api/traffic?bbox=minLat,minLng,maxLat,maxLng
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

    // Fetch traffic data
    const trafficData = await tomtomService.getTrafficData(bbox);

    const response: TrafficResponse = {
      segments: trafficData.segments,
      incidents: trafficData.incidents,
      updatedAt: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch traffic data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/traffic/segments/:id - Get specific segment details
router.get('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd fetch this from your database
    // For now, return mock data
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
  } catch (error) {
    console.error('Error fetching segment details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch segment details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/traffic/incidents/:id - Get specific incident details
router.get('/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd fetch this from your database
    const incident = {
      id,
      type: 'Traffic Jam',
      severity: 'MEDIUM' as const,
      description: 'Heavy traffic congestion',
      location: {
        lat: 17.3850,
        lng: 78.4867
      },
      startTime: new Date().toISOString(),
      endTime: undefined
    };

    res.json(incident);
  } catch (error) {
    console.error('Error fetching incident details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch incident details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as trafficRoutes };
