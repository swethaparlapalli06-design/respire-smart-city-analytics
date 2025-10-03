import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config';
import { trafficRoutes } from './routes/traffic';
import { aqiRoutes } from './routes/aqi';
import { alertsRoutes } from './routes/alerts';
import { simulationRoutes } from './routes/simulation';
import { exportRoutes } from './routes/export';
import { WebSocketService } from './services/websocket';
import { DataPoller } from './services/poller';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/traffic', trafficRoutes);
app.use('/api/aqi', aqiRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/simulate', simulationRoutes);
app.use('/api/export', exportRoutes);

// WebSocket setup
const wss = new WebSocketServer({ 
  server,
  path: '/realtime'
});

const wsService = new WebSocketService(wss);

// Data polling service
const dataPoller = new DataPoller(wsService);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: ${config.corsOrigin}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/realtime`);
  
  // Start data polling
  dataPoller.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  dataPoller.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  dataPoller.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
