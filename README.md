# Urban Planning Platform

A real-time urban planning platform that monitors traffic and air quality with a what-if simulator for testing intervention strategies.

## Features

- **Real-time Traffic Monitoring**: Live traffic data from TomTom API
- **Air Quality Tracking**: AQI monitoring with CPCB and NASA data sources
- **High-Priority Alert Zones**: Automatic detection of areas with harmful AQI levels
- **What-If Simulator**: Test intervention strategies and predict their impact
- **PDF Export**: Generate comprehensive reports of simulation results
- **WebSocket Updates**: Real-time data streaming to the frontend
- **Mobile-Responsive**: Optimized for desktop and mobile devices

## Architecture

### Backend (Node.js + TypeScript)
- **Express.js** REST API with WebSocket support
- **TomTom Traffic API** integration for real-time traffic data
- **CPCB/NASA Air Quality** data sources
- **PostgreSQL** for persistent data storage
- **Redis** for caching and session management
- **Puppeteer** for PDF generation

### Frontend (React + TypeScript)
- **React 18** with modern hooks and context
- **Mapbox GL** for interactive maps
- **Tailwind CSS** for responsive styling
- **WebSocket** client for real-time updates
- **React Hot Toast** for notifications

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Mapbox account (for map tiles)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd urban-planning-platform
   ```

2. **Set up environment variables**
   ```bash
   # Backend environment
   cp backend/env.example backend/.env
   
   # Edit backend/.env with your API keys:
   TOMTOM_API_KEY=upsqo2qgLjE0R6jfUZzJeRZQTHQmOsPV
   NASA_API_KEY=jtc80X6KQGhOoKGbhb4b03oqeOBqUt2gnZV0kw6z
   ```

3. **Frontend environment**
   ```bash
   # Create frontend/.env.local
   echo "VITE_MAPBOX_TOKEN=your_mapbox_token_here" > frontend/.env.local
   ```

### Development Mode

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API on http://localhost:5000
   - Frontend on http://localhost:3000
   - PostgreSQL on port 5432
   - Redis on port 6379

### Production Mode

1. **Build and start with Docker**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - WebSocket: ws://localhost:5000/realtime

## API Endpoints

### Traffic Data
- `GET /api/traffic?bbox=minLat,minLng,maxLat,maxLng` - Get traffic segments and incidents
- `GET /api/traffic/segments/:id` - Get specific segment details
- `GET /api/traffic/incidents/:id` - Get specific incident details

### Air Quality Data
- `GET /api/aqi?bbox=minLat,minLng,maxLat,maxLng` - Get AQI cells and stations
- `GET /api/aqi/stations` - Get all AQI stations
- `GET /api/aqi/stations/:id` - Get specific station details

### Alerts
- `GET /api/alerts?bbox=minLat,minLng,maxLat,maxLng` - Get all alerts
- `GET /api/alerts/high-priority?bbox=minLat,minLng,maxLat,maxLng` - Get high-priority alerts only
- `GET /api/alerts/:id` - Get specific alert details

### Simulation
- `POST /api/simulate` - Run what-if simulation
- `GET /api/simulate/baseline/:zoneId` - Get baseline data for a zone
- `GET /api/simulate/history/:zoneId` - Get simulation history
- `POST /api/simulate/save` - Save simulation results

### Export
- `GET /api/export/summary?zoneId=...` - Export PDF summary
- `GET /api/export/data?zoneId=...&format=json|csv` - Export data

### WebSocket
- `ws://localhost:5000/realtime` - Real-time data updates

## Data Sources

### Traffic Data (TomTom)
- **Flow Segment Data**: Real-time speed and congestion information
- **Incidents**: Traffic incidents, road closures, and events
- **Update Frequency**: Every 60 seconds

### Air Quality Data
- **Primary Source**: CPCB (Central Pollution Control Board) India
- **Fallback Source**: OpenAQ for global coverage
- **Satellite Data**: NASA Earth API for context and backfill
- **Update Frequency**: Every 60 seconds

## Alert System

### High-Priority Thresholds
- **AQI ≥ 201**: Very Unhealthy (High Priority)
- **AQI 151-200**: Unhealthy (Medium Priority)

### Alert Components
- Zone identification and location
- Current AQI and top pollutant
- Population exposure estimates
- Timestamp and update frequency

## What-If Simulator

### Intervention Types
1. **Traffic Signal Retiming**: Optimize signal timing for better flow
2. **Low Emission Zone (LEZ)**: Restrict high-emission vehicles
3. **Bike Lane Modal Shift**: Shift trips to non-motorized transport
4. **Green Buffer**: Plant trees for better air dispersion
5. **Traffic Rerouting**: Redirect traffic away from hotspots

### Impact Modeling
- **Baseline Emissions**: Current traffic and air quality conditions
- **Intervention Effects**: Predicted changes from interventions
- **Dispersion Modeling**: Simple Gaussian plume model
- **Population Impact**: Estimated people benefiting from improvements

### Output Metrics
- AQI improvement (ΔAQI)
- Pollutant reduction (PM2.5, NO₂)
- Population benefiting
- Confidence intervals
- Actionable recommendations

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## Performance

### Load Testing
- Target: 200 concurrent users
- Update frequency: 1Hz
- Response time: p95 < 500ms

### Caching Strategy
- Redis caching for API responses
- ETag support for conditional requests
- WebSocket connection pooling

## Security

### API Security
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

### Data Protection
- API keys stored server-side only
- No sensitive data exposed to client
- Secure WebSocket connections

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Environment Variables
- `TOMTOM_API_KEY`: TomTom Traffic API key
- `NASA_API_KEY`: NASA Earth API key
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CORS_ORIGIN`: Frontend URL for CORS

### Health Checks
- Backend: `GET /health`
- Database: Connection pool monitoring
- Redis: Connection status
- External APIs: Response time monitoring

## Monitoring

### Metrics
- API response times
- WebSocket connection count
- Data polling success rate
- Alert generation frequency

### Logging
- Structured logging with timestamps
- Error tracking and alerting
- Performance metrics collection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## Roadmap

### Phase 1 (Current)
- ✅ Real-time traffic and AQI monitoring
- ✅ What-if simulator with basic interventions
- ✅ PDF export functionality
- ✅ WebSocket real-time updates

### Phase 2 (Future)
- Historical data playback
- Advanced impact scoring
- Email/webhook alerts
- Multi-city support
- Advanced visualization options

### Phase 3 (Future)
- Machine learning predictions
- Integration with more data sources
- Mobile app development
- Advanced analytics dashboard
