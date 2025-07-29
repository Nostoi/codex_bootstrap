import { DailyPlannerService } from "./daily-planner.service";
import { DailyPlanResponseDto } from "./dto/planning.dto";
export declare class PlanningController {
    private readonly plannerService;
    private readonly logger;
    constructor(plannerService: DailyPlannerService);
    generateTodaysPlan(dateString?: string, req?: any): Promise<DailyPlanResponseDto>;
    getCalendarEvents(dateString?: string, req?: any): Promise<{
        date: string;
        events: {
            id: string;
            title: string;
            startTime: string;
            endTime: string;
            source: "manual" | "google" | "outlook";
            description: string;
            energyLevel: import("@prisma/client").$Enums.EnergyLevel;
            focusType: import("@prisma/client").$Enums.FocusType;
            isAllDay: boolean;
        }[];
        totalEvents: number;
        sources: {
            google: number;
            outlook: number;
        };
    }>;
}
