import { SimulationRequest, SimulationResult, Alert } from '../types';
export declare class SimulatorService {
    runSimulation(request: SimulationRequest, baselineData: any): Promise<SimulationResult>;
    private calculateImpactFactors;
    private calculateConfidenceBand;
    private generateRecommendations;
    generateBaselineData(alert: Alert): any;
    private estimatePm25FromAqi;
    private estimatePm10FromAqi;
    private estimateNo2FromAqi;
    private estimateO3FromAqi;
}
//# sourceMappingURL=simulator.d.ts.map