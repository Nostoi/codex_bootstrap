import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metrics;
    constructor(metrics: MetricsService);
    log(body: {
        userId: string;
        action: string;
    }): import("./metrics.service").MetricLog;
    adoption(action?: string): {
        count: number;
    };
    bugs(): {
        count: number;
    };
}
