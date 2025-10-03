import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Users, Clock, Car, Gauge } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, icon: any) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
      <div style="color: white; font-size: 10px;">${icon}</div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const trafficIcon = createCustomIcon('#3b82f6', '🚗');
const incidentIcon = createCustomIcon('#dc2626', '⚠️');
const aqiGoodIcon = createCustomIcon('#10b981', '🟢');
const aqiModerateIcon = createCustomIcon('#f59e0b', '🟡');
const aqiUnhealthyIcon = createCustomIcon('#ff7e00', '🟠');
const aqiVeryUnhealthyIcon = createCustomIcon('#dc2626', '🔴');
const aqiHazardousIcon = createCustomIcon('#8f3f97', '🟣');
const alertIcon = createCustomIcon('#dc2626', '🚨');

interface LeafletMapProps {
  type: 'traffic' | 'pollution';
  onSimulateSolution?: (alert: any) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ type, onSimulateSolution }) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Hyderabad center coordinates
  const hyderabadCenter: [number, number] = [17.3850, 78.4867];

  // Mock data for demonstration
  const trafficData = {
    segments: [
      {
        id: 'segment_001',
        name: 'Main Road',
        speed: 25,
        freeflow: 50,
        congestion: 50,
        location: [17.3850, 78.4867] as [number, number]
      },
      {
        id: 'segment_002',
        name: 'Highway 1',
        speed: 35,
        freeflow: 60,
        congestion: 42,
        location: [17.3900, 78.4900] as [number, number]
      },
      {
        id: 'segment_003',
        name: 'Outer Ring Road',
        speed: 45,
        freeflow: 80,
        congestion: 44,
        location: [17.4000, 78.5000] as [number, number]
      }
    ],
    incidents: [
      {
        id: 'incident_001',
        type: 'Traffic Jam',
        severity: 'MEDIUM',
        description: 'Heavy traffic congestion on main road',
        location: [17.3850, 78.4867] as [number, number]
      },
      {
        id: 'incident_002',
        type: 'Accident',
        severity: 'HIGH',
        description: 'Vehicle collision on highway',
        location: [17.3900, 78.4900] as [number, number]
      }
    ]
  };

  const pollutionData = {
    stations: [
      {
        id: 'station_001',
        name: 'Hyderabad Central',
        aqi: 185,
        pollutants: { pm25: 85, pm10: 120, no2: 45 },
        location: [17.3850, 78.4867] as [number, number]
      },
      {
        id: 'station_002',
        name: 'Secunderabad',
        aqi: 220,
        pollutants: { pm25: 105, pm10: 150, no2: 55 },
        location: [17.4399, 78.4983] as [number, number]
      },
      {
        id: 'station_003',
        name: 'HITEC City',
        aqi: 195,
        pollutants: { pm25: 95, pm10: 135, no2: 50 },
        location: [17.4474, 78.3528] as [number, number]
      }
    ],
    alerts: [
      {
        zoneId: 'zone_001',
        zoneName: 'Central Business District',
        severity: 'HIGH',
        aqi: 220,
        topPollutant: 'PM2.5',
        populationExposed: 12000,
        location: [17.3850, 78.4867] as [number, number]
      },
      {
        zoneId: 'zone_002',
        zoneName: 'Industrial Area',
        severity: 'HIGH',
        aqi: 235,
        topPollutant: 'PM10',
        populationExposed: 8500,
        location: [17.4399, 78.4983] as [number, number]
      },
      {
        zoneId: 'zone_003',
        name: 'Tech Corridor',
        severity: 'MEDIUM',
        aqi: 180,
        topPollutant: 'NO2',
        populationExposed: 15000,
        location: [17.4474, 78.3528] as [number, number]
      }
    ]
  };

  const getAqiIcon = (aqi: number) => {
    if (aqi <= 50) return aqiGoodIcon;
    if (aqi <= 100) return aqiModerateIcon;
    if (aqi <= 150) return aqiUnhealthyIcon;
    if (aqi <= 200) return aqiVeryUnhealthyIcon;
    return aqiHazardousIcon;
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#f59e0b';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#dc2626';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const getCongestionColor = (congestion: number) => {
    if (congestion < 30) return '#10b981';
    if (congestion < 60) return '#f59e0b';
    return '#dc2626';
  };

  return (
    <div className="flex h-[600px] rounded-lg overflow-hidden shadow-lg">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={hyderabadCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {type === 'traffic' ? (
            <>
              {/* Traffic Segments */}
              {trafficData.segments.map((segment) => (
                <Marker
                  key={segment.id}
                  position={[segment.location.lat, segment.location.lng]}
                  icon={trafficIcon}
                >
                  <Popup>
                    <div className="p-3 min-w-[350px]">
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">{segment.roadName || segment.name}</h3>
                      <div className="space-y-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Location Details</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>Coordinates:</strong> {segment.location.coordinates}</div>
                            <div><strong>Address:</strong> {segment.location.address}</div>
                            <div><strong>Area:</strong> {segment.location.area}</div>
                            <div><strong>Road Type:</strong> {segment.roadType}</div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Traffic Data</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center space-x-1">
                              <Gauge className="h-3 w-3 text-blue-500" />
                              <span><strong>Current Speed:</strong> {segment.speedKmph} km/h</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Car className="h-3 w-3 text-blue-500" />
                              <span><strong>Free Flow:</strong> {segment.freeflowKmph} km/h</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getCongestionColor(segment.congestionLevel * 100) }}
                              ></div>
                              <span><strong>Congestion:</strong> {(segment.congestionLevel * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-blue-500" />
                              <span><strong>Travel Time:</strong> {segment.travelTime?.toFixed(1)} min</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <div><strong>Data Source:</strong> {segment.dataSource}</div>
                          <div><strong>Last Updated:</strong> {new Date(segment.lastUpdated).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Traffic Incidents */}
              {trafficData.incidents.map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.location.lat, incident.location.lng]}
                  icon={incidentIcon}
                >
                  <Popup>
                    <div className="p-3 min-w-[400px]">
                      <h3 className="font-bold text-red-900 mb-2 text-lg">{incident.type}</h3>
                      <div className="space-y-2">
                        <div className="bg-red-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Incident Details</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>Description:</strong> {incident.description}</div>
                            <div><strong>Severity:</strong> <span className={`px-2 py-1 rounded text-xs ${incident.severity === 'HIGH' ? 'bg-red-200 text-red-800' : incident.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>{incident.severity}</span></div>
                            <div><strong>Event Code:</strong> {incident.details?.eventCode}</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Location Information</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>Coordinates:</strong> {incident.coordinates}</div>
                            <div><strong>Address:</strong> {incident.address}</div>
                            <div><strong>Road:</strong> {incident.roadName}</div>
                            <div><strong>Area:</strong> {incident.locationName}</div>
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Impact Assessment</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><strong>Delay:</strong> {incident.impact?.delay || 0} minutes</div>
                            <div><strong>Length:</strong> {incident.impact?.length || 0} km</div>
                            <div><strong>Affected Lanes:</strong> {incident.impact?.affectedLanes || 0}</div>
                            <div><strong>Road Numbers:</strong> {incident.details?.roadNumbers?.join(', ') || 'N/A'}</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <div><strong>Data Source:</strong> {incident.dataSource}</div>
                          <div><strong>Start Time:</strong> {new Date(incident.startTime).toLocaleString()}</div>
                          <div><strong>Last Updated:</strong> {new Date(incident.lastUpdated).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          ) : (
            <>
              {/* AQI Stations */}
              {pollutionData.stations.map((station) => (
                <Marker
                  key={station.id}
                  position={[station.location.lat, station.location.lng]}
                  icon={getAqiIcon(station.aqi)}
                >
                  <Popup>
                    <div className="p-3 min-w-[400px]">
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">{station.name}</h3>
                      <div className="space-y-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Station Information</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>Station Code:</strong> {station.stationCode}</div>
                            <div><strong>Address:</strong> {station.address}</div>
                            <div><strong>Coordinates:</strong> {station.coordinates}</div>
                            <div><strong>Elevation:</strong> {station.elevation}</div>
                            <div><strong>Area:</strong> {station.area}</div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Air Quality Index</h4>
                          <div className="flex items-center space-x-2 mb-2">
                            <div 
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: getAqiColor(station.aqi) }}
                            ></div>
                            <span className="text-lg font-bold">AQI: {station.aqi}</span>
                            <span className={`px-2 py-1 rounded text-xs ${station.aqi >= 201 ? 'bg-red-200 text-red-800' : station.aqi >= 151 ? 'bg-orange-200 text-orange-800' : station.aqi >= 101 ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                              {station.aqi >= 201 ? 'Hazardous' : station.aqi >= 151 ? 'Unhealthy' : station.aqi >= 101 ? 'Moderate' : 'Good'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-2 rounded">
                          <h4 className="font-semibold text-sm text-gray-700 mb-1">Pollutant Concentrations</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><strong>PM2.5:</strong> {station.pollutants.pm25} μg/m³</div>
                            <div><strong>PM10:</strong> {station.pollutants.pm10} μg/m³</div>
                            <div><strong>NO₂:</strong> {station.pollutants.no2} ppb</div>
                            <div><strong>O₃:</strong> {station.pollutants.o3} ppb</div>
                            <div><strong>CO:</strong> {station.pollutants.co?.toFixed(1)} ppm</div>
                            <div><strong>SO₂:</strong> {station.pollutants.so2} ppb</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <div><strong>Data Source:</strong> {station.source}</div>
                          <div><strong>Data Quality:</strong> {station.dataQuality}</div>
                          <div><strong>Last Calibrated:</strong> {new Date(station.lastCalibrated).toLocaleDateString()}</div>
                          <div><strong>Last Updated:</strong> {new Date(station.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Alert Zones */}
              {pollutionData.alerts.map((alert) => (
                <Marker
                  key={alert.zoneId}
                  position={alert.location}
                  icon={alertIcon}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-semibold text-gray-900 mb-2">{alert.zoneName || alert.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">
                            High Priority Alert
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          AQI: {alert.aqi}
                        </div>
                        <div className="text-sm text-gray-600">
                          Top Pollutant: {alert.topPollutant}
                        </div>
                        {alert.populationExposed && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{alert.populationExposed.toLocaleString()} people exposed</span>
                          </div>
                        )}
                        {onSimulateSolution && (
                          <button
                            onClick={() => onSimulateSolution(alert)}
                            className="w-full mt-3 btn-primary text-sm"
                          >
                            Simulate Solution
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* AQI Coverage Areas */}
              {pollutionData.alerts.map((alert) => (
                <Circle
                  key={`circle-${alert.zoneId}`}
                  center={alert.location}
                  radius={1000}
                  pathOptions={{
                    color: getAqiColor(alert.aqi),
                    fillColor: getAqiColor(alert.aqi),
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />
              ))}
            </>
          )}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
          <div className="space-y-2">
            <button
              onClick={() => {
                const map = document.querySelector('.leaflet-container') as any;
                if (map && map._leaflet_id) {
                  const leafletMap = L.map.getMap(map);
                  leafletMap.setView(hyderabadCenter, 12);
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <span>📍</span>
              <span>Center on Hyderabad</span>
            </button>
            <button
              onClick={() => {
                const map = document.querySelector('.leaflet-container') as any;
                if (map && map._leaflet_id) {
                  const leafletMap = L.map.getMap(map);
                  leafletMap.setZoom(15);
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <span>🔍</span>
              <span>Zoom In</span>
            </button>
            <button
              onClick={() => {
                const map = document.querySelector('.leaflet-container') as any;
                if (map && map._leaflet_id) {
                  const leafletMap = L.map.getMap(map);
                  leafletMap.setZoom(10);
                }
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <span>🔍</span>
              <span>Zoom Out</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-3">
            {type === 'traffic' ? 'Traffic Legend' : 'Air Quality Legend'}
          </h3>
          
          {type === 'traffic' ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Traffic Segments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Traffic Incidents</span>
              </div>
            </div>
          ) : (
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
                <span className="text-sm text-gray-600">Unhealthy (101-150)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Very Unhealthy (151-200)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">Hazardous (201+)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="text-sm text-gray-600">Alert Zones</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Live</span>
            </div>
            <div>
              {type === 'traffic' ? 'Traffic' : 'Air Quality'} Data
            </div>
            <div>
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for Pollution Map */}
      {type === 'pollution' && (
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
            <div className="p-2">
              {pollutionData.alerts.map((alert) => (
                <div
                  key={alert.zoneId}
                  className="alert-card alert-high cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{alert.zoneName || alert.name}</h4>
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
                  
                  <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                    <Users className="h-4 w-4" />
                    <span>{alert.populationExposed.toLocaleString()} exposed</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    
                    <button
                      onClick={() => onSimulateSolution?.(alert)}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      Simulate Solution
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
