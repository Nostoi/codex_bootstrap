import { DailyPlannerService } from './daily-planner.service';
import { DailyPlanResponseDto } from './dto/planning.dto';
export declare class PlanningController {
    private readonly plannerService;
    private readonly logger;
    constructor(plannerService: DailyPlannerService);
    generateTodaysPlan(dateString?: string, req?: any): Promise<DailyPlanResponseDto>;
}
