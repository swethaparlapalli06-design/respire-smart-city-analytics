import request from 'supertest';
import { app } from '../server';

describe('Simulation API', () => {
  describe('POST /api/simulate', () => {
    it('should run simulation with valid request', async () => {
      const simulationRequest = {
        zoneId: 'test-zone',
        interventions: {
          trafficSignalRetiming: 0.5,
          lowEmissionZone: 0.3,
          bikeLaneModalShift: 0.2,
          greenBuffer: 0.4,
          rerouting: 0.1
        }
      };

      const response = await request(app)
        .post('/api/simulate')
        .send(simulationRequest)
        .expect(200);

      expect(response.body).toHaveProperty('zoneId');
      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('predicted');
      expect(response.body).toHaveProperty('impact');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('interventions');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 400 for invalid request', async () => {
      await request(app)
        .post('/api/simulate')
        .send({})
        .expect(400);
    });

    it('should return 400 for invalid intervention values', async () => {
      const invalidRequest = {
        zoneId: 'test-zone',
        interventions: {
          trafficSignalRetiming: 1.5 // Invalid: > 1
        }
      };

      await request(app)
        .post('/api/simulate')
        .send(invalidRequest)
        .expect(400);
    });
  });

  describe('GET /api/simulate/baseline/:zoneId', () => {
    it('should return baseline data', async () => {
      const response = await request(app)
        .get('/api/simulate/baseline/test-zone')
        .expect(200);

      expect(response.body).toHaveProperty('zoneId');
      expect(response.body).toHaveProperty('aqi');
      expect(response.body).toHaveProperty('pollutants');
      expect(response.body).toHaveProperty('populationExposed');
    });
  });

  describe('GET /api/simulate/history/:zoneId', () => {
    it('should return simulation history', async () => {
      const response = await request(app)
        .get('/api/simulate/history/test-zone')
        .expect(200);

      expect(response.body).toHaveProperty('zoneId');
      expect(response.body).toHaveProperty('history');
      expect(Array.isArray(response.body.history)).toBe(true);
    });
  });
});
