import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import { AqiCell, AqiStation, Alert, MapViewport } from '../types';
import { WebSocketService } from '../services/websocket';
import { aqiApi, alertsApi } from '../services/api';
import { AlertTriangle, MapPin, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

// Set Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface PollutionMapProps {
  wsService: WebSocketService;
  onSimulateSolution: (alert: Alert) => void;
}

const PollutionMap: React.FC<PollutionMapProps> = ({ wsService, onSimulateSolution }) => {
  const [viewport, setViewport] = useState<MapViewport>({
    latitude: 17.3850,
    longitude: 78.4867,
    zoom: 12
  });
  
  const [cells, setCells] = useState<AqiCell[]>([]);
  const [stations, setStations] = useState<AqiStation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedStation, setSelectedStation] = useState<AqiStation | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadAqiData();
    loadAlerts();
    
    // Subscribe to WebSocket updates
    wsService.on('aqi_update', handleAqiUpdate);
    wsService.on('alert_update', handleAlertUpdate);
    
    return () => {
      wsService.off('aqi_update', handleAqiUpdate);
      wsService.off('alert_update', handleAlertUpdate);
    };
  }, [wsService]);

  const loadAqiData = async () => {
    try {
      setLoading(true);
      const bbox = formatBbox(viewport);
      const data = await aqiApi.getAqiData(bbox);
      
      setCells(data.cells);
      setStations(data.stations);
      setLastUpdated(data.updatedAt);
      
      toast.success('Air quality data updated');
    } catch (error) {
      console.error('Error loading AQI data:', error);
      toast.error('Failed to load air quality data');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const bbox = formatBbox(viewport);
      const data = await alertsApi.getHighPriorityAlerts(bbox);
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    }
  };

  const handleAqiUpdate = (data: any) => {
    setCells(data.cells || []);
    setStations(data.stations || []);
    setLastUpdated(new Date().toISOString());
  };

  const handleAlertUpdate = (data: any) => {
    setAlerts(data.alerts || []);
  };

  const formatBbox = (viewport: MapViewport): string => {
    const latRange = 0.1;
    const lngRange = 0.1;
    
    const minLat = viewport.latitude - latRange;
    const maxLat = viewport.latitude + latRange;
    const minLng = viewport.longitude - lngRange;
    const maxLng = viewport.longitude + lngRange;
    
    return `${minLat},${minLng},${maxLat},${maxLng}`;
  };

  const getAqiColor = (aqi: number): string => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const getAqiCategory = (aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const handleMapClick = (event: any) => {
    setSelectedStation(null);
    setSelectedAlert(null);
  };

  const handleStationClick = (station: AqiStation) => {
    setSelectedStation(station);
    setSelectedAlert(null);
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setSelectedStation(null);
  };

  const handleSimulateClick = (alert: Alert) => {
    onSimulateSolution(alert);
  };

  return (
    <div className="flex h-[600px] rounded-lg overflow-hidden shadow-lg">
      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          onClick={handleMapClick}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          {/* AQI Cells */}
          {cells.length > 0 && (
            <Source
              id="aqi-cells"
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: cells.map(cell => ({
                  type: 'Feature',
                  geometry: cell.geom,
                  properties: {
                    id: cell.id,
                    aqi: cell.aqi,
                    color: getAqiColor(cell.aqi),
                    category: getAqiCategory(cell.aqi)
                  }
                }))
              }}
            >
              <Layer
                id="aqi-cells-layer"
                type="fill"
                paint={{
                  'fill-color': ['get', 'color'],
                  'fill-opacity': 0.6
                }}
              />
            </Source>
          )}

          {/* AQI Stations */}
          {stations.length > 0 && (
            <Source
              id="aqi-stations"
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: stations.map(station => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [station.location.lng, station.location.lat]
                  },
                  properties: {
                    id: station.id,
                    name: station.name,
                    aqi: station.aqi,
                    color: getAqiColor(station.aqi),
                    category: getAqiCategory(station.aqi)
                  }
                }))
              }}
            >
              <Layer
                id="aqi-stations-layer"
                type="circle"
                paint={{
                  'circle-color': ['get', 'color'],
                  'circle-radius': 8,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }}
                onClick={(e) => {
                  const feature = e.features?.[0];
                  if (feature) {
                    const station = stations.find(s => s.id === feature.properties.id);
                    if (station) handleStationClick(station);
                  }
                }}
              />
            </Source>
          )}

          {/* Alert Zones */}
          {alerts.length > 0 && (
            <Source
              id="alert-zones"
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: alerts.map(alert => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [alert.location.lng, alert.location.lat]
                  },
                  properties: {
                    id: alert.zoneId,
                    name: alert.zoneName,
                    aqi: alert.aqi,
                    severity: alert.severity,
                    color: alert.severity === 'HIGH' ? '#dc2626' : '#f59e0b'
                  }
                }))
              }}
            >
              <Layer
                id="alert-zones-layer"
                type="circle"
                paint={{
                  'circle-color': ['get', 'color'],
                  'circle-radius': 12,
                  'circle-stroke-width': 3,
                  'circle-stroke-color': '#ffffff',
                  'circle-opacity': 0.8
                }}
                onClick={(e) => {
                  const feature = e.features?.[0];
                  if (feature) {
                    const alert = alerts.find(a => a.zoneId === feature.properties.id);
                    if (alert) handleAlertClick(alert);
                  }
                }}
              />
            </Source>
          )}

          {/* Popups */}
          {selectedStation && (
            <Popup
              longitude={selectedStation.location.lng}
              latitude={selectedStation.location.lat}
              onClose={() => setSelectedStation(null)}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="p-3 min-w-[200px]">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedStation.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getAqiColor(selectedStation.aqi) }}
                    ></div>
                    <span className="text-sm font-medium">
                      AQI: {selectedStation.aqi} ({getAqiCategory(selectedStation.aqi)})
                    </span>
                  </div>
                  {selectedStation.pollutants.pm25 && (
                    <div className="text-sm text-gray-600">
                      PM2.5: {selectedStation.pollutants.pm25} μg/m³
                    </div>
                  )}
                  {selectedStation.pollutants.no2 && (
                    <div className="text-sm text-gray-600">
                      NO₂: {selectedStation.pollutants.no2} ppb
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}

          {selectedAlert && (
            <Popup
              longitude={selectedAlert.location.lng}
              latitude={selectedAlert.location.lat}
              onClose={() => setSelectedAlert(null)}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="p-3 min-w-[250px]">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedAlert.zoneName}</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600">
                      High Priority Alert
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    AQI: {selectedAlert.aqi} ({getAqiCategory(selectedAlert.aqi)})
                  </div>
                  <div className="text-sm text-gray-600">
                    Top Pollutant: {selectedAlert.topPollutant}
                  </div>
                  {selectedAlert.populationExposed && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{selectedAlert.populationExposed.toLocaleString()} people exposed</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleSimulateClick(selectedAlert)}
                    className="w-full mt-3 btn-primary text-sm"
                  >
                    Simulate Solution
                  </button>
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-3">Air Quality Index</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Good (0-50)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">Moderate (51-100)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Unhealthy for Sensitive (101-150)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Unhealthy (151-200)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">Very Unhealthy (201-300)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-800 rounded"></div>
              <span className="text-sm text-gray-600">Hazardous (301+)</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span>{loading ? 'Loading...' : 'Live'}</span>
            </div>
            <div>
              Stations: {stations.length}
            </div>
            <div>
              Alerts: {alerts.length}
            </div>
            {lastUpdated && (
              <div>
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => {
            loadAqiData();
            loadAlerts();
          }}
          disabled={loading}
          className="absolute top-4 left-4 btn-primary disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* High-Priority Alert Zones Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>High-Priority Alert Zones</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Areas with AQI ≥ 201 (Very Unhealthy)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No high-priority alerts</p>
              <p className="text-sm">Air quality is within acceptable limits</p>
            </div>
          ) : (
            <div className="p-2">
              {alerts.map((alert) => (
                <div
                  key={alert.zoneId}
                  className={`alert-card ${alert.severity === 'HIGH' ? 'alert-high' : 'alert-medium'} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{alert.zoneName}</h4>
                    <div className="flex items-center space-x-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getAqiColor(alert.aqi) }}
                      ></div>
                      <span className="text-sm font-medium">{alert.aqi}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Top Pollutant: {alert.topPollutant}
                  </div>
                  
                  {alert.populationExposed && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                      <Users className="h-4 w-4" />
                      <span>{alert.populationExposed.toLocaleString()} exposed</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(alert.updatedAt).toLocaleTimeString()}</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateClick(alert);
                      }}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      Simulate Solution
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollutionMap;
