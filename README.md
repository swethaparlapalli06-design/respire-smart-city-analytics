# 🌍 Respire - Smart City Analytics Platform

A real-time urban planning platform that monitors traffic patterns, air quality, and urban health. Built for urban planners, city officials, and environmental researchers.

## ✨ Features

### 🚦 Real-time Monitoring
- **Traffic Analysis**: Live traffic data with congestion levels and incident tracking
- **Air Quality Monitoring**: Real-time AQI measurements across multiple zones
- **Interactive Maps**: Leaflet-based maps with traffic and pollution overlays

### 🧪 What-If Simulator
- **18 Urban Interventions**: Test realistic urban planning solutions
- **Instant Results**: See AQI improvements immediately when selecting interventions
- **Professional Categories**: Traffic & Transport, Urban Design & Environment, Policy & Quick Fixes

### 📊 Analytics & Reports
- **PDF Report Generation**: Comprehensive urban planning reports
- **Zone-Specific Analysis**: Detailed insights for each monitoring zone
- **Population Impact**: Calculate how many people benefit from interventions

### 🎨 Professional UI
- **Clean Landing Page**: Minimalist design with clear value proposition
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Updates**: Live data streaming with WebSocket connections

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/respire-smart-city-analytics.git
   cd respire-smart-city-analytics
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Start the application**
   ```bash
   # Backend (Terminal 1)
   cd backend
   node server.js
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

4. **Open your browser**
   - Visit `http://localhost:3000` for the frontend
   - Backend API runs on `http://localhost:5000`

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **jsPDF** for report generation
- **Vite** for fast development

### Backend
- **Node.js** with Express
- **WebSocket** for real-time updates
- **RESTful API** design
- **Modular service architecture**

### Data Sources
- **NASA Earth Observation** for satellite validation
- **Realistic traffic patterns** based on research
- **Air quality monitoring** with predictive modeling

## 🎯 Use Cases

### For Urban Planners
- Test intervention scenarios before implementation
- Generate professional reports for stakeholders
- Monitor real-time city health metrics

### For City Officials
- Make data-driven policy decisions
- Track progress of urban initiatives
- Communicate impact to citizens

### For Researchers
- Access real-time urban data
- Test hypothesis with simulation tools
- Generate comprehensive analysis reports

## 🛠️ Development

### Project Structure
```
respire-smart-city-analytics/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API and WebSocket services
│   │   └── types/      # TypeScript type definitions
│   └── package.json
├── backend/            # Node.js backend server
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── services/   # Business logic services
│   │   └── types/      # TypeScript interfaces
│   └── package.json
└── README.md
```

### Key Components

#### Frontend Components
- **`LandingPage.tsx`**: Professional landing page
- **`SimpleMap.tsx`**: Interactive Leaflet map
- **`Simulator.tsx`**: What-if simulation interface
- **`App.tsx`**: Main application component

#### Backend Services
- **`server.js`**: Main Express server
- **Traffic Service**: Real-time traffic data
- **AQI Service**: Air quality monitoring
- **Simulator Service**: Intervention calculations

## 📈 Performance

- **Real-time Updates**: WebSocket connections for live data
- **Optimized Rendering**: React 18 with concurrent features
- **Efficient Maps**: Leaflet with optimized tile loading
- **Fast Builds**: Vite for rapid development

## 🔧 Configuration

### Environment Variables
Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure build settings:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Netlify
1. Connect GitHub repository
2. Set build directory to `frontend`
3. Build command: `npm run build`

### Railway (Full-stack)
1. Connect GitHub repository
2. Railway auto-detects both frontend and backend
3. Configure services for both directories

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA Earth Observation** for satellite data
- **OpenStreetMap** contributors for map tiles
- **Leaflet** for interactive mapping
- **React** and **Node.js** communities

## 📞 Support

For support, email support@respire-analytics.com or create an issue in this repository.

---

**Built with ❤️ for smarter cities and better urban planning**