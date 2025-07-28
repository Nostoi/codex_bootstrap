export declare class AppService {
    getStatus(): {
        status: string;
        timestamp: string;
        version: string;
    };
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
}
