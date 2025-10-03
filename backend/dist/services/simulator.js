"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorService = void 0;
class SimulatorService {
    async runSimulation(request, baselineData) {
        const { zoneId, interventions } = request;
        const baseline = {
            aqi: baselineData.aqi || 200,
            pm25: baselineData.pollutants?.pm25 || 85,
            no2: baselineData.pollutants?.no2 || 45,
            populationExposed: baselineData.populationExposed || 10000
        };
        const impactFactors = this.calculateImpactFactors(interventions);
        const predicted = {
            aqi: Math.max(0, baseline.aqi * (1 - impactFactors.aqiReduction)),
            pm25: Math.max(0, baseline.pm25 * (1 - impactFactors.pm25Reduction)),
            no2: Math.max(0, baseline.no2 * (1 - impactFactors.no2Reduction)),
            populationExposed: Math.max(0, baseline.populationExposed * (1 - impactFactors.populationReduction))
        };
        const impact = {
            deltaAqi: baseline.aqi - predicted.aqi,
            deltaPm25: baseline.pm25 - predicted.pm25,
            deltaNo2: baseline.no2 - predicted.no2,
            populationBenefiting: baseline.populationExposed - predicted.populationExposed,
            confidenceBand: this.calculateConfidenceBand(interventions)
        };
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
    calculateImpactFactors(interventions) {
        const factors = {
            aqiReduction: 0,
            pm25Reduction: 0,
            no2Reduction: 0,
            populationReduction: 0
        };
        if (interventions.trafficSignalRetiming) {
            const retimingImpact = interventions.trafficSignalRetiming * 0.15;
            factors.aqiReduction += retimingImpact;
            factors.pm25Reduction += retimingImpact * 0.8;
            factors.no2Reduction += retimingImpact * 0.6;
        }
        if (interventions.lowEmissionZone) {
            const lezImpact = interventions.lowEmissionZone * 0.25;
            factors.aqiReduction += lezImpact;
            factors.pm25Reduction += lezImpact * 0.9;
            factors.no2Reduction += lezImpact * 0.7;
        }
        if (interventions.bikeLaneModalShift) {
            const modalImpact = interventions.bikeLaneModalShift * 0.20;
            factors.aqiReduction += modalImpact;
            factors.pm25Reduction += modalImpact * 0.7;
            factors.no2Reduction += modalImpact * 0.8;
            factors.populationReduction += modalImpact * 0.3;
        }
        if (interventions.greenBuffer) {
            const bufferImpact = interventions.greenBuffer * 0.10;
            factors.aqiReduction += bufferImpact;
            factors.pm25Reduction += bufferImpact * 0.6;
            factors.no2Reduction += bufferImpact * 0.4;
        }
        if (interventions.rerouting) {
            const reroutingImpact = interventions.rerouting * 0.18;
            factors.aqiReduction += reroutingImpact;
            factors.pm25Reduction += reroutingImpact * 0.8;
            factors.no2Reduction += reroutingImpact * 0.7;
        }
        factors.aqiReduction = Math.min(factors.aqiReduction, 0.6);
        factors.pm25Reduction = Math.min(factors.pm25Reduction, 0.5);
        factors.no2Reduction = Math.min(factors.no2Reduction, 0.4);
        factors.populationReduction = Math.min(factors.populationReduction, 0.3);
        return factors;
    }
    calculateConfidenceBand(interventions) {
        const interventionCount = Object.values(interventions).filter(v => v && v > 0).length;
        const baseConfidence = 0.7;
        const interventionBonus = interventionCount * 0.05;
        return Math.min(baseConfidence + interventionBonus, 0.95);
    }
    generateRecommendations(interventions, impact) {
        const recommendations = [];
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
    generateBaselineData(alert) {
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
    estimatePm25FromAqi(aqi) {
        if (aqi <= 50)
            return aqi * 0.24;
        if (aqi <= 100)
            return 12 + (aqi - 50) * 0.47;
        if (aqi <= 150)
            return 35.4 + (aqi - 100) * 0.4;
        if (aqi <= 200)
            return 55.4 + (aqi - 150) * 1.9;
        if (aqi <= 300)
            return 150.4 + (aqi - 200) * 1.0;
        return 250.4 + (aqi - 300) * 1.67;
    }
    estimatePm10FromAqi(aqi) {
        return this.estimatePm25FromAqi(aqi) * 1.4;
    }
    estimateNo2FromAqi(aqi) {
        return this.estimatePm25FromAqi(aqi) * 0.5;
    }
    estimateO3FromAqi(aqi) {
        return this.estimatePm25FromAqi(aqi) * 0.3;
    }
}
exports.SimulatorService = SimulatorService;
//# sourceMappingURL=simulator.js.map