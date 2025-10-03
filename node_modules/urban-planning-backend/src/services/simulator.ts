import { SimulationRequest, SimulationResult, Alert } from '../types';

export class SimulatorService {
  async runSimulation(request: SimulationRequest, baselineData: any): Promise<SimulationResult> {
    const { zoneId, interventions } = request;
    
    // Extract baseline metrics
    const baseline = {
      aqi: baselineData.aqi || 200,
      pm25: baselineData.pollutants?.pm25 || 85,
      no2: baselineData.pollutants?.no2 || 45,
      populationExposed: baselineData.populationExposed || 10000
    };

    // Calculate intervention impacts
    const impactFactors = this.calculateImpactFactors(interventions);
    
    // Apply interventions to predict outcomes
    const predicted = {
      aqi: Math.max(0, baseline.aqi * (1 - impactFactors.aqiReduction)),
      pm25: Math.max(0, baseline.pm25 * (1 - impactFactors.pm25Reduction)),
      no2: Math.max(0, baseline.no2 * (1 - impactFactors.no2Reduction)),
      populationExposed: Math.max(0, baseline.populationExposed * (1 - impactFactors.populationReduction))
    };

    // Calculate deltas
    const impact = {
      deltaAqi: baseline.aqi - predicted.aqi,
      deltaPm25: baseline.pm25 - predicted.pm25,
      deltaNo2: baseline.no2 - predicted.no2,
      populationBenefiting: baseline.populationExposed - predicted.populationExposed,
      confidenceBand: this.calculateConfidenceBand(interventions)
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(interventions, impact);

    return {
      zoneId,
      baseline,
      predicted,
      impact,
      recommendations,
      interventions,
      timestamp: new Date().toISOString()
    };
  }

  private calculateImpactFactors(interventions: SimulationRequest['interventions']) {
    const factors = {
      aqiReduction: 0,
      pm25Reduction: 0,
      no2Reduction: 0,
      populationReduction: 0
    };

    // Traffic signal retiming - improves flow, reduces congestion emissions
    if (interventions.trafficSignalRetiming) {
      const retimingImpact = interventions.trafficSignalRetiming * 0.15; // Up to 15% reduction
      factors.aqiReduction += retimingImpact;
      factors.pm25Reduction += retimingImpact * 0.8;
      factors.no2Reduction += retimingImpact * 0.6;
    }

    // Low Emission Zone - reduces high-emitter vehicles
    if (interventions.lowEmissionZone) {
      const lezImpact = interventions.lowEmissionZone * 0.25; // Up to 25% reduction
      factors.aqiReduction += lezImpact;
      factors.pm25Reduction += lezImpact * 0.9;
      factors.no2Reduction += lezImpact * 0.7;
    }

    // Bike lane modal shift - reduces vehicle trips
    if (interventions.bikeLaneModalShift) {
      const modalImpact = interventions.bikeLaneModalShift * 0.20; // Up to 20% reduction
      factors.aqiReduction += modalImpact;
      factors.pm25Reduction += modalImpact * 0.7;
      factors.no2Reduction += modalImpact * 0.8;
      factors.populationReduction += modalImpact * 0.3; // Some people benefit from cleaner air
    }

    // Green buffer - improves local dispersion
    if (interventions.greenBuffer) {
      const bufferImpact = interventions.greenBuffer * 0.10; // Up to 10% reduction
      factors.aqiReduction += bufferImpact;
      factors.pm25Reduction += bufferImpact * 0.6;
      factors.no2Reduction += bufferImpact * 0.4;
    }

    // Rerouting - reduces flow on hotspots
    if (interventions.rerouting) {
      const reroutingImpact = interventions.rerouting * 0.18; // Up to 18% reduction
      factors.aqiReduction += reroutingImpact;
      factors.pm25Reduction += reroutingImpact * 0.8;
      factors.no2Reduction += reroutingImpact * 0.7;
    }

    // Cap total reduction to realistic levels
    factors.aqiReduction = Math.min(factors.aqiReduction, 0.6); // Max 60% reduction
    factors.pm25Reduction = Math.min(factors.pm25Reduction, 0.5);
    factors.no2Reduction = Math.min(factors.no2Reduction, 0.4);
    factors.populationReduction = Math.min(factors.populationReduction, 0.3);

    return factors;
  }

  private calculateConfidenceBand(interventions: SimulationRequest['interventions']): number {
    // Higher confidence with more interventions
    const interventionCount = Object.values(interventions).filter(v => v && v > 0).length;
    const baseConfidence = 0.7; // 70% base confidence
    const interventionBonus = interventionCount * 0.05; // 5% per intervention
    
    return Math.min(baseConfidence + interventionBonus, 0.95); // Cap at 95%
  }

  private generateRecommendations(interventions: SimulationRequest['interventions'], impact: any): string[] {
    const recommendations: string[] = [];

    if (interventions.trafficSignalRetiming && interventions.trafficSignalRetiming > 0.5) {
      recommendations.push('Implement adaptive traffic signal timing at key intersections');
    }

    if (interventions.lowEmissionZone && interventions.lowEmissionZone > 0.3) {
      recommendations.push('Establish Low Emission Zone with vehicle restrictions');
    }

    if (interventions.bikeLaneModalShift && interventions.bikeLaneModalShift > 0.4) {
      recommendations.push('Create protected bike lanes and improve pedestrian infrastructure');
    }

    if (interventions.greenBuffer && interventions.greenBuffer > 0.3) {
      recommendations.push('Plant street trees and create green buffers along major roads');
    }

    if (interventions.rerouting && interventions.rerouting > 0.4) {
      recommendations.push('Implement dynamic traffic management and alternative routing');
    }

    // Impact-based recommendations
    if (impact.deltaAqi > 30) {
      recommendations.push('Significant AQI improvement expected - prioritize implementation');
    }

    if (impact.populationBenefiting > 5000) {
      recommendations.push('Large population benefit - consider phased rollout');
    }

    if (impact.confidenceBand > 0.8) {
      recommendations.push('High confidence in predicted outcomes');
    }

    return recommendations;
  }

  // Generate baseline data for a zone
  generateBaselineData(alert: Alert): any {
    return {
      aqi: alert.aqi,
      pollutants: {
        pm25: this.estimatePm25FromAqi(alert.aqi),
        pm10: this.estimatePm10FromAqi(alert.aqi),
        no2: this.estimateNo2FromAqi(alert.aqi),
        o3: this.estimateO3FromAqi(alert.aqi)
      },
      populationExposed: alert.populationExposed || 10000,
      topPollutant: alert.topPollutant
    };
  }

  private estimatePm25FromAqi(aqi: number): number {
    // Simplified conversion from AQI to PM2.5
    if (aqi <= 50) return aqi * 0.24;
    if (aqi <= 100) return 12 + (aqi - 50) * 0.47;
    if (aqi <= 150) return 35.4 + (aqi - 100) * 0.4;
    if (aqi <= 200) return 55.4 + (aqi - 150) * 1.9;
    if (aqi <= 300) return 150.4 + (aqi - 200) * 1.0;
    return 250.4 + (aqi - 300) * 1.67;
  }

  private estimatePm10FromAqi(aqi: number): number {
    return this.estimatePm25FromAqi(aqi) * 1.4; // Rough ratio
  }

  private estimateNo2FromAqi(aqi: number): number {
    return this.estimatePm25FromAqi(aqi) * 0.5; // Rough ratio
  }

  private estimateO3FromAqi(aqi: number): number {
    return this.estimatePm25FromAqi(aqi) * 0.3; // Rough ratio
  }
}
