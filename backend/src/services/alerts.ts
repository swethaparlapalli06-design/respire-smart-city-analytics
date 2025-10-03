import { Alert, AqiCell, AqiStation } from '../types';
import { config } from '../config';

export class AlertsService {
  async computeAlerts(cells: AqiCell[], stations: AqiStation[]): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Process grid cells for high-priority zones
    const highPriorityCells = cells.filter(cell => cell.aqi >= config.highPriorityAqiThreshold);
    
    for (const cell of highPriorityCells) {
      const alert = await this.createAlertFromCell(cell);
      if (alert) {
        alerts.push(alert);
      }
    }

    // Process stations for additional alerts
    const highPriorityStations = stations.filter(station => station.aqi >= config.highPriorityAqiThreshold);
    
    for (const station of highPriorityStations) {
      const alert = await this.createAlertFromStation(station);
      if (alert) {
        alerts.push(alert);
      }
    }

    // Remove duplicates and sort by AQI (highest first)
    const uniqueAlerts = this.deduplicateAlerts(alerts);
    return uniqueAlerts.sort((a, b) => b.aqi - a.aqi);
  }

  private async createAlertFromCell(cell: AqiCell): Promise<Alert | null> {
    if (cell.aqi < config.highPriorityAqiThreshold) {
      return null;
    }

    const topPollutant = this.getTopPollutant(cell.pollutants);
    const severity = cell.aqi >= config.highPriorityAqiThreshold ? 'HIGH' : 'MEDIUM';
    
    // Calculate center point of the cell
    const coordinates = cell.geom.coordinates[0];
    const centerLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    const centerLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;

    return {
      zoneId: cell.id,
      zoneName: `Zone ${cell.id.split('_')[1]}`,
      severity,
      aqi: cell.aqi,
      topPollutant,
      populationExposed: this.estimatePopulationExposed(cell.aqi, cell.geom),
      location: {
        lat: centerLat,
        lng: centerLng
      },
      updatedAt: cell.updatedAt
    };
  }

  private async createAlertFromStation(station: AqiStation): Promise<Alert | null> {
    if (station.aqi < config.highPriorityAqiThreshold) {
      return null;
    }

    const topPollutant = this.getTopPollutant(station.pollutants);
    const severity = station.aqi >= config.highPriorityAqiThreshold ? 'HIGH' : 'MEDIUM';

    return {
      zoneId: station.id,
      zoneName: station.name,
      severity,
      aqi: station.aqi,
      topPollutant,
      populationExposed: this.estimatePopulationExposed(station.aqi),
      location: station.location,
      updatedAt: station.updatedAt
    };
  }

  private getTopPollutant(pollutants: any): string {
    const pollutantMap = {
      pm25: 'PM2.5',
      pm10: 'PM10',
      no2: 'NO₂',
      o3: 'O₃',
      co: 'CO',
      so2: 'SO₂'
    };

    let topPollutant = 'PM2.5';
    let maxValue = pollutants.pm25 || 0;

    for (const [key, value] of Object.entries(pollutants)) {
      if (value && value > maxValue) {
        maxValue = value;
        topPollutant = pollutantMap[key as keyof typeof pollutantMap] || key.toUpperCase();
      }
    }

    return topPollutant;
  }

  private estimatePopulationExposed(aqi: number, geom?: any): number {
    // Simple estimation based on AQI level and area
    let basePopulation = 5000; // Base population for high AQI areas

    if (aqi >= 300) basePopulation = 15000; // Hazardous
    else if (aqi >= 201) basePopulation = 10000; // Very Unhealthy
    else if (aqi >= 151) basePopulation = 7500; // Unhealthy

    // Add some randomness to simulate real-world variation
    const variation = 0.8 + Math.random() * 0.4; // ±20% variation
    
    return Math.round(basePopulation * variation);
  }

  private deduplicateAlerts(alerts: Alert[]): Alert[] {
    const seen = new Set<string>();
    return alerts.filter(alert => {
      const key = `${alert.location.lat.toFixed(4)}_${alert.location.lng.toFixed(4)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Get alert severity color for UI
  getAlertSeverityColor(severity: 'HIGH' | 'MEDIUM'): string {
    switch (severity) {
      case 'HIGH':
        return '#dc2626'; // Red
      case 'MEDIUM':
        return '#f59e0b'; // Orange
      default:
        return '#10b981'; // Green
    }
  }

  // Get AQI category and color
  getAqiCategory(aqi: number): { category: string; color: string; description: string } {
    if (aqi <= 50) {
      return { category: 'Good', color: '#00e400', description: 'Air quality is satisfactory' };
    } else if (aqi <= 100) {
      return { category: 'Moderate', color: '#ffff00', description: 'Air quality is acceptable' };
    } else if (aqi <= 150) {
      return { category: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Sensitive groups may experience health effects' };
    } else if (aqi <= 200) {
      return { category: 'Unhealthy', color: '#ff0000', description: 'Everyone may experience health effects' };
    } else if (aqi <= 300) {
      return { category: 'Very Unhealthy', color: '#8f3f97', description: 'Health warnings of emergency conditions' };
    } else {
      return { category: 'Hazardous', color: '#7e0023', description: 'Health alert: everyone may experience serious health effects' };
    }
  }
}
