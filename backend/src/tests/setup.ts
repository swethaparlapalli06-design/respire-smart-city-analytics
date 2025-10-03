// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock external API calls
jest.mock('../services/tomtom');
jest.mock('../services/aqi');

// Global test timeout
jest.setTimeout(10000);
