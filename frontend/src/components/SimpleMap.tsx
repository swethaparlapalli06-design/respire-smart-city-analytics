import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleMapProps {
  type: 'traffic' | 'pollution';
  onSimulateSolution?: (alert: any) => void;
}

const SimpleMap: React.FC<SimpleMapProps> = ({ type, onSimulateSolution }) => {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      if (!mapRef.current) {
        try {
          // Create map
          mapRef.current = L.map('map-container').setView([17.3850, 78.4867], 12);
          
          // Add tile layer
          tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapRef.current);
          
          // Add markers layer
          markersRef.current.addTo(mapRef.current);
          
          // Hide loading message
          const loadingElement = document.getElementById('map-loading');
          if (loadingElement) {
            loadingElement.style.display = 'none';
          }
          
          
          console.log('Map created successfully');
        } catch (error) {
          console.error('Error creating map:', error);
        }
      }

      // Clear existing markers
      if (markersRef.current) {
        markersRef.current.clearLayers();
      }
      loadMapData();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [type]);

  const loadMapData = async () => {
    const bbox = '17.2,78.3,17.6,78.6';
    console.log(`Loading ${type} data...`);
    
    try {
      if (type === 'traffic') {
        console.log('Fetching traffic data...');
        const response = await fetch(`http://localhost:5000/api/traffic?bbox=${bbox}`);
        console.log('Traffic response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Traffic data received:', data);
        
        if (data.segments && data.segments.length > 0) {
          data.segments.forEach((segment: any, index: number) => {
            console.log(`Adding traffic segment ${index}:`, segment);
            const color = segment.congestionLevel > 0.7 ? 'red' : segment.congestionLevel > 0.3 ? 'orange' : 'green';
                   L.circleMarker([segment.location.lat, segment.location.lng], {
                     radius: 8,
                     fillColor: color,
                     color: '#000',
                     weight: 1,
                     opacity: 1,
                     fillOpacity: 0.8
                   }).bindPopup(`
                     <div style="min-width: 200px;">
                       <h3><strong>${segment.roadName || segment.name}</strong></h3>
                       <p><strong>Congestion:</strong> ${(segment.congestionLevel * 100).toFixed(1)}%</p>
                       <p><strong>Road Type:</strong> ${segment.roadType}</p>
                       <p><strong>Travel Time:</strong> ${segment.travelTime} minutes</p>
                       <p><strong>Coordinates:</strong> ${segment.location.coordinates}</p>
                       <p><strong>Address:</strong> ${segment.location.address}</p>
                     </div>
                   `).addTo(markersRef.current);
          });
        } else {
          console.log('No traffic segments found');
        }

        if (data.incidents && data.incidents.length > 0) {
          data.incidents.forEach((incident: any, index: number) => {
            console.log(`Adding traffic incident ${index}:`, incident);
            L.marker([incident.location.lat, incident.location.lng])
              .bindPopup(`
                <div style="min-width: 200px;">
                  <h3><strong>${incident.type}</strong></h3>
                  <p><strong>Description:</strong> ${incident.description}</p>
                  <p><strong>Severity:</strong> ${incident.severity}</p>
                  <p><strong>Coordinates:</strong> ${incident.coordinates}</p>
                  <p><strong>Address:</strong> ${incident.address}</p>
                  <p><strong>Road:</strong> ${incident.roadName}</p>
                </div>
              `).addTo(markersRef.current);
          });
        } else {
          console.log('No traffic incidents found');
        }
      } else if (type === 'pollution') {
        console.log('Fetching pollution data...');
        const response = await fetch(`http://localhost:5000/api/aqi?bbox=${bbox}`);
        console.log('Pollution response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Pollution data received:', data);
        
               if (data.stations && data.stations.length > 0) {
                 data.stations.forEach((station: any, index: number) => {
                   console.log(`Adding AQI station ${index}:`, station);
                   const aqi = station.aqi || 0;
                   let color = 'green';
                   let pollutionLevel = 'Good';
                   if (aqi > 300) { color = 'purple'; pollutionLevel = 'Hazardous'; }
                   else if (aqi > 200) { color = 'red'; pollutionLevel = 'Very Unhealthy'; }
                   else if (aqi > 150) { color = 'orange'; pollutionLevel = 'Unhealthy'; }
                   else if (aqi > 100) { color = 'yellow'; pollutionLevel = 'Unhealthy for Sensitive Groups'; }
                   else if (aqi > 50) { color = 'lightgreen'; pollutionLevel = 'Moderate'; }

                   L.circleMarker([station.location.lat, station.location.lng], {
                     radius: 12,
                     fillColor: color,
                     color: '#000',
                     weight: 2,
                     opacity: 1,
                     fillOpacity: 0.8
                   }).bindPopup(`
                     <div style="min-width: 280px;">
                       <h3><strong>${station.name}</strong></h3>
                       <p><strong>Station Code:</strong> ${station.stationCode}</p>
                       <p><strong>AQI:</strong> ${aqi} (${pollutionLevel})</p>
                       <p><strong>PM2.5:</strong> ${station.pollutants.pm25} μg/m³</p>
                       <p><strong>PM10:</strong> ${station.pollutants.pm10} μg/m³</p>
                       <p><strong>NO₂:</strong> ${station.pollutants.no2} ppb</p>
                       <p><strong>Area:</strong> ${station.area}</p>
                       <p><strong>Coordinates:</strong> ${station.coordinates}</p>
                       <p><strong>Address:</strong> ${station.address}</p>
                     </div>
                   `).addTo(markersRef.current);
                 });
               } else {
                 console.log('No AQI stations found');
               }

        console.log('Fetching alerts data...');
        const alertsResponse = await fetch(`http://localhost:5000/api/alerts?bbox=${bbox}`);
        console.log('Alerts response status:', alertsResponse.status);
        
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          console.log('Alerts data received:', alertsData);
          
          if (alertsData.alerts && alertsData.alerts.length > 0) {
            alertsData.alerts.forEach((alert: any, index: number) => {
              console.log(`Adding alert ${index}:`, alert);
              L.marker([alert.location.lat, alert.location.lng])
                .bindPopup(`
                  <div style="min-width: 250px;">
                    <h3><strong>🚨 ${alert.zoneName}</strong></h3>
                    <p><strong>AQI:</strong> ${alert.aqi}</p>
                    <p><strong>Top Pollutant:</strong> ${alert.topPollutant}</p>
                    <p><strong>Population Exposed:</strong> ${alert.populationExposed.toLocaleString()}</p>
                    <p><strong>Coordinates:</strong> ${alert.location.lat.toFixed(6)}°N, ${alert.location.lng.toFixed(6)}°E</p>
                    <button onclick="window.simulateSolution && window.simulateSolution('${alert.zoneId}')" style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px;">
                      Simulate Solution
                    </button>
                  </div>
                `).addTo(markersRef.current);
            });
          } else {
            console.log('No alerts found');
          }
        }
      }
      
      console.log(`Finished loading ${type} data`);
    } catch (error) {
      console.error(`Error loading ${type} data:`, error);
      
      // Add fallback markers for testing
      console.log('Adding fallback markers for testing...');
      if (type === 'traffic') {
        // Add a test traffic marker
        L.circleMarker([17.3850, 78.4867], {
          radius: 8,
          fillColor: 'blue',
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`
          <div style="min-width: 200px;">
            <h3><strong>Test Traffic Segment</strong></h3>
            <p><strong>Speed:</strong> 45 km/h</p>
            <p><strong>Free Flow:</strong> 60 km/h</p>
            <p><strong>Congestion:</strong> 25%</p>
            <p><strong>Coordinates:</strong> 17.3850°N, 78.4867°E</p>
            <p><strong>Address:</strong> Abids Junction, Hyderabad</p>
          </div>
        `).addTo(markersRef.current);
      } else if (type === 'pollution') {
        // Add test AQI markers
        L.circleMarker([17.3850, 78.4867], {
          radius: 10,
          fillColor: 'red',
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`
          <div style="min-width: 250px;">
            <h3><strong>CPCB Station - Abids Junction</strong></h3>
            <p><strong>Station Code:</strong> HYD_ABD_001</p>
            <p><strong>AQI:</strong> 185</p>
            <p><strong>PM2.5:</strong> 85 μg/m³</p>
            <p><strong>PM10:</strong> 120 μg/m³</p>
            <p><strong>NO₂:</strong> 45 ppb</p>
            <p><strong>Coordinates:</strong> 17.3850°N, 78.4867°E</p>
            <p><strong>Address:</strong> Abids Junction, Hyderabad, Telangana 500001</p>
          </div>
        `).addTo(markersRef.current);
        
        // Add test alert marker
        L.marker([17.4399, 78.4983])
          .bindPopup(`
            <div style="min-width: 250px;">
              <h3><strong>🚨 Secunderabad Railway Area - High Priority Alert</strong></h3>
              <p><strong>AQI:</strong> 220</p>
              <p><strong>Top Pollutant:</strong> PM10</p>
              <p><strong>Population Exposed:</strong> 8,798</p>
              <p><strong>Coordinates:</strong> 17.4399°N, 78.4983°E</p>
              <button onclick="alert('Simulation started!')" style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px;">
                Simulate Solution
              </button>
            </div>
          `).addTo(markersRef.current);
      }
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div id="map-container" style={{ height: '100%', width: '100%' }}></div>
      <div id="map-loading" style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        Loading map...
      </div>
    </div>
  );
};

export default SimpleMap;