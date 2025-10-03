import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import { TrafficSegment, Incident, MapViewport } from '../types';
import { WebSocketService } from '../services/websocket';
import { trafficApi } from '../services/api';
import { Car, AlertTriangle, Clock, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';

// Set Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface TrafficMapProps {
  wsService: WebSocketService;
}

const TrafficMap: React.FC<TrafficMapProps> = ({ wsService }) => {
  const [viewport, setViewport] = useState<MapViewport>({
    latitude: 17.3850,
    longitude: 78.4867,
    zoom: 12
  });
  
  const [segments, setSegments] = useState<TrafficSegment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<TrafficSegment | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadTrafficData();
    
    // Subscribe to WebSocket updates
    wsService.on('traffic_update', handleTrafficUpdate);
    
    return () => {
      wsService.off('traffic_update', handleTrafficUpdate);
    };
  }, [wsService]);

  const loadTrafficData = async () => {
    try {
      setLoading(true);
      const bbox = formatBbox(viewport);
      const data = await trafficApi.getTrafficData(bbox);
      
      setSegments(data.segments);
      setIncidents(data.incidents);
      setLastUpdated(data.updatedAt);
      
      toast.success('Traffic data updated');
    } catch (error) {
      console.error('Error loading traffic data:', error);
      toast.error('Failed to load traffic data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrafficUpdate = (data: any) => {
    setSegments(data.segments || []);
    setIncidents(data.incidents || []);
    setLastUpdated(new Date().toISOString());
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

  const getCongestionColor = (congestionLevel: number): string => {
    if (congestionLevel < 0.3) return '#10b981'; // Green
    if (congestionLevel < 0.6) return '#f59e0b'; // Yellow
    return '#dc2626'; // Red
  };

  const getIncidentColor = (severity: string): string => {
    switch (severity) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleMapClick = (event: any) => {
    // Reset selections
    setSelectedSegment(null);
    setSelectedIncident(null);
  };

  const handleSegmentClick = (segment: TrafficSegment) => {
    setSelectedSegment(segment);
    setSelectedIncident(null);
  };

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setSelectedSegment(null);
  };

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden shadow-lg">
      {/* Map */}
      <Map
        ref={mapRef}
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Traffic Segments */}
        {segments.length > 0 && (
          <Source
            id="traffic-segments"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: segments.map(segment => ({
                type: 'Feature',
                geometry: segment.geom,
                properties: {
                  id: segment.id,
                  speedKmph: segment.speedKmph,
                  freeflowKmph: segment.freeflowKmph,
                  congestionLevel: segment.congestionLevel,
                  color: getCongestionColor(segment.congestionLevel)
                }
              }))
            }}
          >
            <Layer
              id="traffic-segments-layer"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 4,
                'line-opacity': 0.8
              }}
              onClick={(e) => {
                const feature = e.features?.[0];
                if (feature) {
                  const segment = segments.find(s => s.id === feature.properties.id);
                  if (segment) handleSegmentClick(segment);
                }
              }}
            />
          </Source>
        )}

        {/* Incidents */}
        {incidents.length > 0 && (
          <Source
            id="incidents"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: incidents.map(incident => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [incident.location.lng, incident.location.lat]
                },
                properties: {
                  id: incident.id,
                  type: incident.type,
                  severity: incident.severity,
                  description: incident.description,
                  color: getIncidentColor(incident.severity)
                }
              }))
            }}
          >
            <Layer
              id="incidents-layer"
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
                  const incident = incidents.find(i => i.id === feature.properties.id);
                  if (incident) handleIncidentClick(incident);
                }
              }}
            />
          </Source>
        )}

        {/* Popups */}
        {selectedSegment && (
          <Popup
            longitude={selectedSegment.geom.coordinates[0][0]}
            latitude={selectedSegment.geom.coordinates[0][1]}
            onClose={() => setSelectedSegment(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-2">Traffic Segment</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Gauge className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Speed: {selectedSegment.speedKmph} km/h
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Free Flow: {selectedSegment.freeflowKmph} km/h
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Congestion: {Math.round(selectedSegment.congestionLevel * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {selectedIncident && (
          <Popup
            longitude={selectedIncident.location.lng}
            latitude={selectedIncident.location.lat}
            onClose={() => setSelectedIncident(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-2">Traffic Incident</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{selectedIncident.type}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedIncident.description}
                </div>
                <div className="text-xs text-gray-500">
                  Severity: {selectedIncident.severity}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-gray-900 mb-3">Traffic Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Free Flow</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Moderate</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Congested</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Incidents</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Low</span>
            </div>
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
            Segments: {segments.length}
          </div>
          <div>
            Incidents: {incidents.length}
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
        onClick={loadTrafficData}
        disabled={loading}
        className="absolute top-4 left-4 btn-primary disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  );
};

export default TrafficMap;
