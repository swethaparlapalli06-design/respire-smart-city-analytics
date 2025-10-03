import axios from 'axios';
import { config } from '../config';
import { AqiCell, AqiStation, BoundingBox } from '../types';

export class AqiService {
  private nasaApiKey = config.nasaApiKey;
  private cpcbBaseUrl = 'https://airquality.cpcb.gov.in/ccr/api';

  async getCpcbData(bbox: BoundingBox): Promise<{ cells: AqiCell[]; stations: AqiStation[] }> {
    try {
      // Try to fetch CPCB data - this is a fallback implementation
      // In production, you'd need to reverse engineer the actual CPCB API endpoints
      const stations: AqiStation[] = [];
      const cells: AqiCell[] = [];

      // Mock CPCB data for demonstration
      // In real implementation, you'd parse the actual CPCB dashboard data
      const mockStations = [
        {
          id: 'cpcb_001',
          name: 'Hyderabad Central',
          location: { lat: 17.3850, lng: 78.4867 },
          aqi: 185,
          pollutants: { pm25: 85, pm10: 120, no2: 45, o3: 25 },
          source: 'CPCB' as const,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cpcb_002',
          name: 'Secunderabad',
          location: { lat: 17.4399, lng: 78.4983 },
          aqi: 220,
          pollutants: { pm25: 105, pm10: 150, no2: 55, o3: 30 },
          source: 'CPCB' as const,
          updatedAt: new Date().toISOString()
        }
      ];

      stations.push(...mockStations);

      // Generate grid cells based on stations
      const cellSize = 0.01; // ~1km
      for (let lat = bbox.minLat; lat < bbox.maxLat; lat += cellSize) {
        for (let lng = bbox.minLng; lng < bbox.maxLng; lng += cellSize) {
          const cellId = `cell_${lat.toFixed(4)}_${lng.toFixed(4)}`;
          
          // Find nearest station for interpolation
          const nearestStation = this.findNearestStation(lat, lng, stations);
          const distance = this.calculateDistance(lat, lng, nearestStation.location.lat, nearestStation.location.lng);
          
          // Simple interpolation based on distance
          const interpolationFactor = Math.max(0, 1 - (distance / 0.05)); // 5km radius
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
            source: 'CPCB' as const,
            updatedAt: new Date().toISOString()
          });
        }
      }

      return { cells, stations };
    } catch (error) {
      console.error('Error fetching CPCB data:', error);
      // Fallback to OpenAQ
      return this.getOpenAqData(bbox);
    }
  }

  async getOpenAqData(bbox: BoundingBox): Promise<{ cells: AqiCell[]; stations: AqiStation[] }> {
    try {
      const url = 'https://api.openaq.org/v2/measurements';
      const response = await axios.get(url, {
        params: {
          limit: 1000,
          coordinates: `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`,
          order_by: 'datetime',
          sort: 'desc'
        }
      });

      const stations: AqiStation[] = [];
      const cells: AqiCell[] = [];

      // Group measurements by location
      const locationMap = new Map<string, any[]>();
      response.data.results.forEach((measurement: any) => {
        const key = `${measurement.location}_${measurement.coordinates.latitude}_${measurement.coordinates.longitude}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, []);
        }
        locationMap.get(key)!.push(measurement);
      });

      // Convert to stations
      locationMap.forEach((measurements, key) => {
        const firstMeasurement = measurements[0];
        const pollutants: any = {};
        
        measurements.forEach((m: any) => {
          if (m.parameter === 'pm25') pollutants.pm25 = m.value;
          if (m.parameter === 'pm10') pollutants.pm10 = m.value;
          if (m.parameter === 'no2') pollutants.no2 = m.value;
          if (m.parameter === 'o3') pollutants.o3 = m.value;
        });

        // Calculate AQI (simplified)
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
    } catch (error) {
      console.error('Error fetching OpenAQ data:', error);
      throw error;
    }
  }

  async getNasaData(bbox: BoundingBox): Promise<any> {
    try {
      // NASA Earth API for context/backfill
      const centerLat = (bbox.minLat + bbox.maxLat) / 2;
      const centerLng = (bbox.minLng + bbox.maxLng) / 2;
      
      const url = 'https://api.nasa.gov/planetary/earth/assets';
      const response = await axios.get(url, {
        params: {
          lon: centerLng,
          lat: centerLat,
          date: new Date().toISOString().split('T')[0],
          dim: 0.1,
          api_key: this.nasaApiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      return null;
    }
  }

  async getAqiData(bbox: BoundingBox): Promise<{ cells: AqiCell[]; stations: AqiStation[] }> {
    try {
      // Try CPCB first, fallback to OpenAQ
      const cpcbData = await this.getCpcbData(bbox);
      
      // Get NASA context data
      const nasaData = await this.getNasaData(bbox);
      
      // Enhance with NASA data if available
      if (nasaData) {
        // Add NASA-derived cells for areas with sparse ground data
        // This would involve processing satellite imagery for aerosol data
      }

      return cpcbData;
    } catch (error) {
      console.error('Error fetching AQI data:', error);
      throw error;
    }
  }

  private findNearestStation(lat: number, lng: number, stations: AqiStation[]): AqiStation {
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

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateAqi(pollutants: any): number {
    // Simplified AQI calculation based on PM2.5
    const pm25 = pollutants.pm25 || 0;
    
    if (pm25 <= 12) return Math.round(50 * (pm25 / 12));
    if (pm25 <= 35.4) return Math.round(50 + 50 * ((pm25 - 12) / 23.4));
    if (pm25 <= 55.4) return Math.round(100 + 50 * ((pm25 - 35.4) / 20));
    if (pm25 <= 150.4) return Math.round(150 + 50 * ((pm25 - 55.4) / 95));
    if (pm25 <= 250.4) return Math.round(200 + 100 * ((pm25 - 150.4) / 100));
    return Math.round(300 + 100 * ((pm25 - 250.4) / 149.6));
  }
}
