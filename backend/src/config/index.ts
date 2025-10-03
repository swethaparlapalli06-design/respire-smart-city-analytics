import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Keys
  tomtomApiKey: process.env.TOMTOM_API_KEY || '',
  nasaApiKey: process.env.NASA_API_KEY || '',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/urban_planning',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Alert Thresholds
  highPriorityAqiThreshold: parseInt(process.env.HIGH_PRIORITY_AQI_THRESHOLD || '201', 10),
  mediumPriorityAqiThreshold: parseInt(process.env.MEDIUM_PRIORITY_AQI_THRESHOLD || '151', 10),
  
  // Polling Intervals
  trafficPollInterval: parseInt(process.env.TRAFFIC_POLL_INTERVAL || '60', 10),
  aqiPollInterval: parseInt(process.env.AQI_POLL_INTERVAL || '60', 10),
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Default city (Hyderabad, India)
  defaultCity: {
    name: 'Hyderabad',
    center: { lat: 17.3850, lng: 78.4867 },
    bounds: {
      minLat: 17.2,
      minLng: 78.3,
      maxLat: 17.6,
      maxLng: 78.6
    }
  }
};

// Validate required environment variables
if (!config.tomtomApiKey) {
  throw new Error('TOMTOM_API_KEY is required');
}

if (!config.nasaApiKey) {
  throw new Error('NASA_API_KEY is required');
}
