import { Alert, AqiCell, AqiStation } from '../types';
export declare class AlertsService {
    computeAlerts(cells: AqiCell[], stations: AqiStation[]): Promise<Alert[]>;
    private createAlertFromCell;
    private createAlertFromStation;
    private getTopPollutant;
    private estimatePopulationExposed;
    private deduplicateAlerts;
    getAlertSeverityColor(severity: 'HIGH' | 'MEDIUM'): string;
    getAqiCategory(aqi: number): {
        category: string;
        color: string;
        description: string;
    };
}
//# sourceMappingURL=alerts.d.ts.map