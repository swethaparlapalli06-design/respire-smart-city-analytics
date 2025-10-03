"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsService = void 0;
const config_1 = require("../config");
class AlertsService {
    async computeAlerts(cells, stations) {
        const alerts = [];
        const highPriorityCells = cells.filter(cell => cell.aqi >= config_1.config.highPriorityAqiThreshold);
        for (const cell of highPriorityCells) {
            const alert = await this.createAlertFromCell(cell);
            if (alert) {
                alerts.push(alert);
            }
        }
        const highPriorityStations = stations.filter(station => station.aqi >= config_1.config.highPriorityAqiThreshold);
        for (const station of highPriorityStations) {
            const alert = await this.createAlertFromStation(station);
            if (alert) {
                alerts.push(alert);
            }
        }
        const uniqueAlerts = this.deduplicateAlerts(alerts);
        return uniqueAlerts.sort((a, b) => b.aqi - a.aqi);
    }
    async createAlertFromCell(cell) {
        if (cell.aqi < config_1.config.highPriorityAqiThreshold) {
            return null;
        }
        const topPollutant = this.getTopPollutant(cell.pollutants);
        const severity = cell.aqi >= config_1.config.highPriorityAqiThreshold ? 'HIGH' : 'MEDIUM';
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
    async createAlertFromStation(station) {
        if (station.aqi < config_1.config.highPriorityAqiThreshold) {
            return null;
        }
        const topPollutant = this.getTopPollutant(station.pollutants);
        const severity = station.aqi >= config_1.config.highPriorityAqiThreshold ? 'HIGH' : 'MEDIUM';
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
    getTopPollutant(pollutants) {
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
                topPollutant = pollutantMap[key] || key.toUpperCase();
            }
        }
        return topPollutant;
    }
    estimatePopulationExposed(aqi, geom) {
        let basePopulation = 5000;
        if (aqi >= 300)
            basePopulation = 15000;
        else if (aqi >= 201)
            basePopulation = 10000;
        else if (aqi >= 151)
            basePopulation = 7500;
        const variation = 0.8 + Math.random() * 0.4;
        return Math.round(basePopulation * variation);
    }
    deduplicateAlerts(alerts) {
        const seen = new Set();
        return alerts.filter(alert => {
            const key = `${alert.location.lat.toFixed(4)}_${alert.location.lng.toFixed(4)}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    getAlertSeverityColor(severity) {
        switch (severity) {
            case 'HIGH':
                return '#dc2626';
            case 'MEDIUM':
                return '#f59e0b';
            default:
                return '#10b981';
        }
    }
    getAqiCategory(aqi) {
        if (aqi <= 50) {
            return { category: 'Good', color: '#00e400', description: 'Air quality is satisfactory' };
        }
        else if (aqi <= 100) {
            return { category: 'Moderate', color: '#ffff00', description: 'Air quality is acceptable' };
        }
        else if (aqi <= 150) {
            return { category: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Sensitive groups may experience health effects' };
        }
        else if (aqi <= 200) {
            return { category: 'Unhealthy', color: '#ff0000', description: 'Everyone may experience health effects' };
        }
        else if (aqi <= 300) {
            return { category: 'Very Unhealthy', color: '#8f3f97', description: 'Health warnings of emergency conditions' };
        }
        else {
            return { category: 'Hazardous', color: '#7e0023', description: 'Health alert: everyone may experience serious health effects' };
        }
    }
}
exports.AlertsService = AlertsService;
//# sourceMappingURL=alerts.js.map