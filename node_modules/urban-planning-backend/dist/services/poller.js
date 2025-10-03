"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataPoller = void 0;
const tomtom_1 = require("./tomtom");
const aqi_1 = require("./aqi");
const alerts_1 = require("./alerts");
const config_1 = require("../config");
const cron = __importStar(require("node-cron"));
class DataPoller {
    constructor(wsService) {
        this.isRunning = false;
        this.trafficJob = null;
        this.aqiJob = null;
        this.tomtomService = new tomtom_1.TomTomService();
        this.aqiService = new aqi_1.AqiService();
        this.alertsService = new alerts_1.AlertsService();
        this.wsService = wsService;
    }
    start() {
        if (this.isRunning) {
            console.log('Data poller is already running');
            return;
        }
        console.log('Starting data poller...');
        this.isRunning = true;
        this.trafficJob = cron.schedule(`*/${config_1.config.trafficPollInterval} * * * * *`, async () => {
            await this.pollTrafficData();
        }, {
            scheduled: false
        });
        this.aqiJob = cron.schedule(`*/${config_1.config.aqiPollInterval} * * * * *`, async () => {
            await this.pollAqiData();
        }, {
            scheduled: false
        });
        this.trafficJob.start();
        this.aqiJob.start();
        this.pollTrafficData();
        this.pollAqiData();
        console.log('Data poller started successfully');
    }
    stop() {
        if (!this.isRunning) {
            console.log('Data poller is not running');
            return;
        }
        console.log('Stopping data poller...');
        this.isRunning = false;
        if (this.trafficJob) {
            this.trafficJob.stop();
            this.trafficJob = null;
        }
        if (this.aqiJob) {
            this.aqiJob.stop();
            this.aqiJob = null;
        }
        console.log('Data poller stopped');
    }
    async pollTrafficData() {
        try {
            console.log('Polling traffic data...');
            const bbox = config_1.config.defaultCity.bounds;
            const trafficData = await this.tomtomService.getTrafficData(bbox);
            if (this.wsService.hasConnectedClients()) {
                this.wsService.broadcastTrafficUpdate(trafficData);
            }
            console.log(`Traffic data polled: ${trafficData.segments.length} segments, ${trafficData.incidents.length} incidents`);
        }
        catch (error) {
            console.error('Error polling traffic data:', error);
        }
    }
    async pollAqiData() {
        try {
            console.log('Polling AQI data...');
            const bbox = config_1.config.defaultCity.bounds;
            const aqiData = await this.aqiService.getAqiData(bbox);
            const alerts = await this.alertsService.computeAlerts(aqiData.cells, aqiData.stations);
            if (this.wsService.hasConnectedClients()) {
                this.wsService.broadcastAqiUpdate(aqiData);
                this.wsService.broadcastAlertUpdate(alerts);
            }
            console.log(`AQI data polled: ${aqiData.cells.length} cells, ${aqiData.stations.length} stations, ${alerts.length} alerts`);
        }
        catch (error) {
            console.error('Error polling AQI data:', error);
        }
    }
    async pollTrafficDataManually(bbox) {
        const bounds = bbox || config_1.config.defaultCity.bounds;
        return await this.tomtomService.getTrafficData(bounds);
    }
    async pollAqiDataManually(bbox) {
        const bounds = bbox || config_1.config.defaultCity.bounds;
        const aqiData = await this.aqiService.getAqiData(bounds);
        const alerts = await this.alertsService.computeAlerts(aqiData.cells, aqiData.stations);
        return { aqiData, alerts };
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            trafficPollInterval: config_1.config.trafficPollInterval,
            aqiPollInterval: config_1.config.aqiPollInterval,
            connectedClients: this.wsService.getConnectedClientsCount()
        };
    }
}
exports.DataPoller = DataPoller;
//# sourceMappingURL=poller.js.map