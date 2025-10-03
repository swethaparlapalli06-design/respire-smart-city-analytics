"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const ws_1 = require("ws");
const config_1 = require("./config");
const traffic_1 = require("./routes/traffic");
const aqi_1 = require("./routes/aqi");
const alerts_1 = require("./routes/alerts");
const simulation_1 = require("./routes/simulation");
const export_1 = require("./routes/export");
const websocket_1 = require("./services/websocket");
const poller_1 = require("./services/poller");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin,
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.use('/api/traffic', traffic_1.trafficRoutes);
app.use('/api/aqi', aqi_1.aqiRoutes);
app.use('/api/alerts', alerts_1.alertsRoutes);
app.use('/api/simulate', simulation_1.simulationRoutes);
app.use('/api/export', export_1.exportRoutes);
const wss = new ws_1.WebSocketServer({
    server,
    path: '/realtime'
});
const wsService = new websocket_1.WebSocketService(wss);
const dataPoller = new poller_1.DataPoller(wsService);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config_1.config.nodeEnv === 'development' ? err.message : 'Something went wrong'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = config_1.config.port;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: ${config_1.config.corsOrigin}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/realtime`);
    dataPoller.start();
});
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
//# sourceMappingURL=server.js.map