import { AppService } from "./app.service";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
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
