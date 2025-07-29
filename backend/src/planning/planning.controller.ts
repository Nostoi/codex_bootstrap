import { Controller, Get, Query, Req, Logger } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DailyPlannerService } from "./daily-planner.service";
import { DailyPlanResponseDto } from "./dto/planning.dto";

@ApiTags("Planning")
@Controller("plans")
export class PlanningController {
  private readonly logger = new Logger(PlanningController.name);

  constructor(private readonly plannerService: DailyPlannerService) {}

  @Get("today")
  @ApiOperation({
    summary: "Generate optimized daily plan",
    description:
      "Creates an energy-aware daily schedule based on task metadata, user energy patterns, and dependencies",
  })
  @ApiQuery({
    name: "date",
    required: false,
    description: "Date for plan generation (YYYY-MM-DD). Defaults to today.",
    example: "2025-07-28",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully generated daily plan",
    type: DailyPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid date format or plan generation failed",
  })
  async generateTodaysPlan(
    @Query("date") dateString?: string,
    @Req() req?: any, // TODO: Replace with proper auth guard
  ): Promise<DailyPlanResponseDto> {
    // TODO: Extract user ID from authentication
    const userId = req?.user?.id || "temp-user-id";

    const date = dateString ? new Date(dateString) : new Date();

    this.logger.log(
      `Generating plan for user ${userId} on ${date.toISOString()}`,
    );

    return this.plannerService.generatePlan(userId, date);
  }
}
