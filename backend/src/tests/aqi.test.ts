import request from 'supertest';
import { app } from '../server';

describe('AQI API', () => {
  describe('GET /api/aqi', () => {
    it('should return AQI data for valid bbox', async () => {
      const response = await request(app)
        .get('/api/aqi')
        .query({ bbox: '17.2,78.3,17.6,78.6' })
        .expect(200);

      expect(response.body).toHaveProperty('cells');
      expect(response.body).toHaveProperty('stations');
      expect(response.body).toHaveProperty('updatedAt');
      expect(Array.isArray(response.body.cells)).toBe(true);
      expect(Array.isArray(response.body.stations)).toBe(true);
    });

    it('should return 400 for invalid bbox format', async () => {
      await request(app)
        .get('/api/aqi')
        .query({ bbox: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /api/aqi/stations', () => {
    it('should return all AQI stations', async () => {
      const response = await request(app)
        .get('/api/aqi/stations')
        .expect(200);

      expect(response.body).toHaveProperty('stations');
      expect(Array.isArray(response.body.stations)).toBe(true);
    });
  });

  describe('GET /api/aqi/stations/:id', () => {
    it('should return station details', async () => {
      const response = await request(app)
        .get('/api/aqi/stations/test-station')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('location');
      expect(response.body).toHaveProperty('aqi');
      expect(response.body).toHaveProperty('pollutants');
    });
  });
});
