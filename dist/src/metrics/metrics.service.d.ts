export interface MetricLog {
    id: number;
    userId: string;
    action: string;
    timestamp: Date;
}
export declare class MetricsService {
    private logs;
    private nextId;
    record(userId: string, action: string): MetricLog;
    countByAction(action: string): number;
    all(): MetricLog[];
}
