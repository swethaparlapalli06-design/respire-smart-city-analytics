import { Router } from 'express';
import { AqiService } from '../services/aqi';
import { AqiResponse } from '../types';
import Joi from 'joi';

const router = Router();
const aqiService = new AqiService();

// Validation schema for bbox parameter
const bboxSchema = Joi.object({
  bbox: Joi.string().pattern(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/).required()
});

// GET /api/aqi?bbox=minLat,minLng,maxLat,maxLng
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

    // Fetch AQI data
    const aqiData = await aqiService.getAqiData(bbox);

    const response: AqiResponse = {
      cells: aqiData.cells,
      stations: aqiData.stations,
      updatedAt: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching AQI data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AQI data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/aqi/stations - Get all AQI stations
router.get('/stations', async (req, res) => {
  try {
    // In a real implementation, you'd fetch this from your database
    const stations = [
      {
        id: 'station_001',
        name: 'Hyderabad Central',
        location: { lat: 17.3850, lng: 78.4867 },
        aqi: 185,
        pollutants: { pm25: 85, pm10: 120, no2: 45, o3: 25 },
        source: 'CPCB' as const,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'station_002',
        name: 'Secunderabad',
        location: { lat: 17.4399, lng: 78.4983 },
        aqi: 220,
        pollutants: { pm25: 105, pm10: 150, no2: 55, o3: 30 },
        source: 'CPCB' as const,
        updatedAt: new Date().toISOString()
      }
    ];

    res.json({ stations });
  } catch (error) {
    console.error('Error fetching AQI stations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AQI stations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/aqi/stations/:id - Get specific station details
router.get('/stations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd fetch this from your database
    const station = {
      id,
      name: 'Hyderabad Central',
      location: { lat: 17.3850, lng: 78.4867 },
      aqi: 185,
      pollutants: { pm25: 85, pm10: 120, no2: 45, o3: 25 },
      source: 'CPCB' as const,
      updatedAt: new Date().toISOString(),
      history: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), aqi: 190 },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), aqi: 175 },
        { timestamp: new Date(Date.now() - 10800000).toISOString(), aqi: 200 }
      ]
    };

    res.json(station);
  } catch (error) {
    console.error('Error fetching station details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch station details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as aqiRoutes };
