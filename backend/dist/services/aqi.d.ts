import { AqiCell, AqiStation, BoundingBox } from '../types';
export declare class AqiService {
    private nasaApiKey;
    private cpcbBaseUrl;
    getCpcbData(bbox: BoundingBox): Promise<{
        cells: AqiCell[];
        stations: AqiStation[];
    }>;
    getOpenAqData(bbox: BoundingBox): Promise<{
        cells: AqiCell[];
        stations: AqiStation[];
    }>;
    getNasaData(bbox: BoundingBox): Promise<any>;
    getAqiData(bbox: BoundingBox): Promise<{
        cells: AqiCell[];
        stations: AqiStation[];
    }>;
    private findNearestStation;
    private calculateDistance;
    private calculateAqi;
}
//# sourceMappingURL=aqi.d.ts.map