"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    tomtomApiKey: process.env.TOMTOM_API_KEY || '',
    nasaApiKey: process.env.NASA_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/urban_planning',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    highPriorityAqiThreshold: parseInt(process.env.HIGH_PRIORITY_AQI_THRESHOLD || '201', 10),
    mediumPriorityAqiThreshold: parseInt(process.env.MEDIUM_PRIORITY_AQI_THRESHOLD || '151', 10),
    trafficPollInterval: parseInt(process.env.TRAFFIC_POLL_INTERVAL || '60', 10),
    aqiPollInterval: parseInt(process.env.AQI_POLL_INTERVAL || '60', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
if (!exports.config.tomtomApiKey) {
    throw new Error('TOMTOM_API_KEY is required');
}
if (!exports.config.nasaApiKey) {
    throw new Error('NASA_API_KEY is required');
}
//# sourceMappingURL=index.js.map