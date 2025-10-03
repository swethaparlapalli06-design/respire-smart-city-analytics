import request from 'supertest';
import { app } from '../server';

describe('Traffic API', () => {
  describe('GET /api/traffic', () => {
    it('should return traffic data for valid bbox', async () => {
      const response = await request(app)
        .get('/api/traffic')
        .query({ bbox: '17.2,78.3,17.6,78.6' })
        .expect(200);

      expect(response.body).toHaveProperty('segments');
      expect(response.body).toHaveProperty('incidents');
      expect(response.body).toHaveProperty('updatedAt');
      expect(Array.isArray(response.body.segments)).toBe(true);
      expect(Array.isArray(response.body.incidents)).toBe(true);
    });

    it('should return 400 for invalid bbox format', async () => {
      await request(app)
        .get('/api/traffic')
        .query({ bbox: 'invalid' })
        .expect(400);
    });

    it('should return 400 for missing bbox parameter', async () => {
      await request(app)
        .get('/api/traffic')
        .expect(400);
    });

    it('should return 400 for invalid coordinate values', async () => {
      await request(app)
        .get('/api/traffic')
        .query({ bbox: '91,181,92,182' }) // Invalid lat/lng
        .expect(400);
    });
  });

  describe('GET /api/traffic/segments/:id', () => {
    it('should return segment details', async () => {
      const response = await request(app)
        .get('/api/traffic/segments/test-segment')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('speedKmph');
      expect(response.body).toHaveProperty('freeflowKmph');
      expect(response.body).toHaveProperty('congestionLevel');
    });
  });

  describe('GET /api/traffic/incidents/:id', () => {
    it('should return incident details', async () => {
      const response = await request(app)
        .get('/api/traffic/incidents/test-incident')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('severity');
      expect(response.body).toHaveProperty('description');
    });
  });
});
