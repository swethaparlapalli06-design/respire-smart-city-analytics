import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Map, MapPin, AlertTriangle, Download, Settings, Car, Lightbulb, Star } from 'lucide-react';
import SimpleMap from './components/SimpleMap';
import Simulator from './components/Simulator';
import LandingPage from './components/LandingPage';
import { WebSocketService } from './services/websocket';
import { Alert } from './types';

function App() {
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [activeTab, setActiveTab] = useState<'traffic' | 'pollution'>('traffic');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [wsService] = useState(() => new WebSocketService());

  useEffect(() => {
    // Initialize WebSocket connection
    wsService.connect();
    
    return () => {
      wsService.disconnect();
    };
  }, [wsService]);

  const handleSimulateSolution = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsSimulatorOpen(true);
  };

  const handleCloseSimulator = () => {
    setIsSimulatorOpen(false);
    setSelectedAlert(null);
  };

  const handleGetStarted = () => {
    setShowLandingPage(false);
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/export/summary?zoneId=${selectedAlert?.zoneId || 'default'}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `urban-planning-summary-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Realistic pollution rankings based on research
  const pollutionRankings = [
    {
      id: 'kukatpally',
      rank: 1,
      name: 'Kukatpally Industrial',
      aqi: 320,
      pm25: 145,
      color: 'bg-purple-100 text-purple-800',
      pollutionLevel: 'CRITICAL'
    },
    {
      id: 'secunderabad',
      rank: 2,
      name: 'Secunderabad Railway',
      aqi: 280,
      pm25: 125,
      color: 'bg-red-100 text-red-800',
      pollutionLevel: 'VERY_HIGH'
    },
    {
      id: 'charminar',
      rank: 3,
      name: 'Charminar Heritage',
      aqi: 265,
      pm25: 115,
      color: 'bg-red-100 text-red-800',
      pollutionLevel: 'VERY_HIGH'
    },
    {
      id: 'abids',
      rank: 4,
      name: 'Abids Junction',
      aqi: 245,
      pm25: 105,
      color: 'bg-red-100 text-red-800',
      pollutionLevel: 'HIGH'
    },
    {
      id: 'gachibowli',
      rank: 5,
      name: 'Gachibowli Financial',
      aqi: 195,
      pm25: 85,
      color: 'bg-orange-100 text-orange-800',
      pollutionLevel: 'MEDIUM_HIGH'
    },
    {
      id: 'hitech',
      rank: 6,
      name: 'HITEC City',
      aqi: 185,
      pm25: 80,
      color: 'bg-orange-100 text-orange-800',
      pollutionLevel: 'MEDIUM_HIGH'
    },
    {
      id: 'punjagutta',
      rank: 7,
      name: 'Punjagutta',
      aqi: 175,
      pm25: 75,
      color: 'bg-orange-100 text-orange-800',
      pollutionLevel: 'MEDIUM_HIGH'
    },
    {
      id: 'kondapur',
      rank: 8,
      name: 'Kondapur IT',
      aqi: 145,
      pm25: 65,
      color: 'bg-yellow-100 text-yellow-800',
      pollutionLevel: 'MEDIUM'
    },
    {
      id: 'banjara',
      rank: 9,
      name: 'Banjara Hills',
      aqi: 135,
      pm25: 60,
      color: 'bg-yellow-100 text-yellow-800',
      pollutionLevel: 'MEDIUM'
    },
    {
      id: 'jubilee',
      rank: 10,
      name: 'Jubilee Hills',
      aqi: 125,
      pm25: 55,
      color: 'bg-yellow-100 text-yellow-800',
      pollutionLevel: 'MEDIUM'
    },
    {
      id: 'madhapur',
      rank: 11,
      name: 'Madhapur IT',
      aqi: 95,
      pm25: 45,
      color: 'bg-green-100 text-green-800',
      pollutionLevel: 'LOW'
    },
    {
      id: 'mehdipatnam',
      rank: 12,
      name: 'Mehdipatnam',
      aqi: 85,
      pm25: 40,
      color: 'bg-green-100 text-green-800',
      pollutionLevel: 'LOW'
    }
  ];

  // Show landing page first
  if (showLandingPage) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Respire</h1>
              <p className="text-xs text-gray-500">Smart City Analytics</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('traffic')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'traffic' 
                ? 'bg-blue-50 text-blue-600 shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Car className="h-5 w-5" />
            <span className="font-medium">Traffic Monitor</span>
          </button>
          
          <button
            onClick={() => setActiveTab('pollution')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'pollution' 
                ? 'bg-green-50 text-green-600 shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Air Quality</span>
          </button>
          
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'traffic' ? 'Traffic Monitor' : 'Air Quality Monitor'}
          </h2>
          <p className="text-gray-600 mt-1">
            {activeTab === 'traffic' 
              ? 'Real-time traffic conditions and congestion analysis' 
              : 'Real-time air quality monitoring and pollution tracking'
            }
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {activeTab === 'traffic' ? (
            <div className="h-full">
              <SimpleMap type="traffic" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Polluted Areas Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Top Polluted Areas</h3>
                <p className="text-gray-600 mb-6">
                  Click "Solution Simulator" to test different interventions and see instant results before spending any budget.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pollutionRankings.map((area) => (
                    <div key={area.id} className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl font-bold text-gray-900">#{area.rank}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${area.color}`}>
                          AQI {area.aqi}
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-bold text-gray-900 mb-1">{area.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">PM2.5: {area.pm25} µg/m³</p>
                      <p className={`text-xs font-medium mb-3 ${
                        area.pollutionLevel === 'CRITICAL' ? 'text-purple-600' :
                        area.pollutionLevel === 'VERY_HIGH' ? 'text-red-600' :
                        area.pollutionLevel === 'HIGH' ? 'text-orange-600' :
                        area.pollutionLevel === 'MEDIUM_HIGH' ? 'text-yellow-600' :
                        area.pollutionLevel === 'MEDIUM' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {area.pollutionLevel.replace('_', ' ')}
                      </p>
                      
                      <button
                        onClick={() => handleSimulateSolution({
                          id: area.id,
                          zoneId: area.id,
                          zoneName: area.name,
                          aqi: area.aqi,
                          topPollutant: 'PM2.5',
                          populationExposed: 10000,
                          severity: area.pollutionLevel === 'CRITICAL' ? 'CRITICAL' : 
                                   area.pollutionLevel === 'VERY_HIGH' ? 'HIGH' : 'MEDIUM',
                          area: area.name,
                          coordinates: '17.4399°N, 78.4983°E',
                          address: `${area.name}, Hyderabad, Telangana`,
                          nasaData: { aerosolIndex: 0.65, windSpeed: 8.2, temperature: 32.5, predictionConfidence: 0.92 },
                          dataSource: 'NASA Historical + Predictive Modeling',
                          lastUpdated: new Date().toISOString(),
                          recommendations: []
                        })}
                        className="w-full flex items-center justify-center space-x-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-xl border border-green-200 transition-colors duration-200 text-xs"
                      >
                        <Star className="h-3 w-3" />
                        <span className="font-medium">Simulate</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Section */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="h-96">
                  <SimpleMap 
                    type="pollution"
                    onSimulateSolution={handleSimulateSolution}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Drawer */}
      {isSimulatorOpen && selectedAlert && (
        <Simulator
          alert={selectedAlert}
          onClose={handleCloseSimulator}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;
