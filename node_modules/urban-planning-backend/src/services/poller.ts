import { TomTomService } from './tomtom';
import { AqiService } from './aqi';
import { AlertsService } from './alerts';
import { WebSocketService } from './websocket';
import { config } from '../config';
import * as cron from 'node-cron';

export class DataPoller {
  private tomtomService: TomTomService;
  private aqiService: AqiService;
  private alertsService: AlertsService;
  private wsService: WebSocketService;
  private isRunning: boolean = false;
  private trafficJob: cron.ScheduledTask | null = null;
  private aqiJob: cron.ScheduledTask | null = null;

  constructor(wsService: WebSocketService) {
    this.tomtomService = new TomTomService();
    this.aqiService = new AqiService();
    this.alertsService = new AlertsService();
    this.wsService = wsService;
  }

  start() {
    if (this.isRunning) {
      console.log('Data poller is already running');
      return;
    }

    console.log('Starting data poller...');
    this.isRunning = true;

    // Schedule traffic data polling every minute
    this.trafficJob = cron.schedule(`*/${config.trafficPollInterval} * * * * *`, async () => {
      await this.pollTrafficData();
    }, {
      scheduled: false
    });

    // Schedule AQI data polling every minute
    this.aqiJob = cron.schedule(`*/${config.aqiPollInterval} * * * * *`, async () => {
      await this.pollAqiData();
    }, {
      scheduled: false
    });

    // Start the jobs
    this.trafficJob.start();
    this.aqiJob.start();

    // Poll immediately
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

  private async pollTrafficData() {
    try {
      console.log('Polling traffic data...');
      
      // Use default city bounds for polling
      const bbox = config.defaultCity.bounds;
      
      const trafficData = await this.tomtomService.getTrafficData(bbox);
      
      // Broadcast to WebSocket clients if any are connected
      if (this.wsService.hasConnectedClients()) {
        this.wsService.broadcastTrafficUpdate(trafficData);
      }

      console.log(`Traffic data polled: ${trafficData.segments.length} segments, ${trafficData.incidents.length} incidents`);
    } catch (error) {
      console.error('Error polling traffic data:', error);
    }
  }

  private async pollAqiData() {
    try {
      console.log('Polling AQI data...');
      
      // Use default city bounds for polling
      const bbox = config.defaultCity.bounds;
      
      const aqiData = await this.aqiService.getAqiData(bbox);
      
      // Compute alerts
      const alerts = await this.alertsService.computeAlerts(aqiData.cells, aqiData.stations);
      
      // Broadcast to WebSocket clients if any are connected
      if (this.wsService.hasConnectedClients()) {
        this.wsService.broadcastAqiUpdate(aqiData);
        this.wsService.broadcastAlertUpdate(alerts);
      }

      console.log(`AQI data polled: ${aqiData.cells.length} cells, ${aqiData.stations.length} stations, ${alerts.length} alerts`);
    } catch (error) {
      console.error('Error polling AQI data:', error);
    }
  }

  // Manual polling methods for testing
  async pollTrafficDataManually(bbox?: any) {
    const bounds = bbox || config.defaultCity.bounds;
    return await this.tomtomService.getTrafficData(bounds);
  }

  async pollAqiDataManually(bbox?: any) {
    const bounds = bbox || config.defaultCity.bounds;
    const aqiData = await this.aqiService.getAqiData(bounds);
    const alerts = await this.alertsService.computeAlerts(aqiData.cells, aqiData.stations);
    return { aqiData, alerts };
  }

  // Get polling status
  getStatus() {
    return {
      isRunning: this.isRunning,
      trafficPollInterval: config.trafficPollInterval,
      aqiPollInterval: config.aqiPollInterval,
      connectedClients: this.wsService.getConnectedClientsCount()
    };
  }
}
