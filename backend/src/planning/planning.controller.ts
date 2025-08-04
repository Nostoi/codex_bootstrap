import { Controller, Get, Query, Req, Logger } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DailyPlannerService } from './daily-planner.service';
import { DailyPlanResponseDto } from './dto/planning.dto';
import { TimeSlot } from './types';

@ApiTags('Planning')
@Controller('plans')
export class PlanningController {
  private readonly logger = new Logger(PlanningController.name);

  constructor(private readonly plannerService: DailyPlannerService) {}

  @Get('today')
  @ApiOperation({
    summary: 'Generate optimized daily plan',
    description:
      'Creates an energy-aware daily schedule based on task metadata, user energy patterns, and dependencies',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date for plan generation (YYYY-MM-DD). Defaults to today.',
    example: '2025-07-28',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated daily plan',
    type: DailyPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date format or plan generation failed',
  })
  async generateTodaysPlan(
    @Query('date') dateString?: string,
    @Req() req?: any // TODO: Replace with proper auth guard
  ): Promise<DailyPlanResponseDto> {
    // TODO: Extract user ID from authentication
    const userId = req?.user?.id || 'temp-user-id';

    const date = dateString ? new Date(dateString) : new Date();

    this.logger.log(`Generating plan for user ${userId} on ${date.toISOString()}`);

    return this.plannerService.generatePlan(userId, date);
  }

  @Get('calendar-events')
  @ApiOperation({
    summary: 'Get calendar events for a specific date',
    description:
      'Retrieves calendar events from integrated sources (Google Calendar, Outlook) for the specified date',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date for calendar events (YYYY-MM-DD). Defaults to today.',
    example: '2025-07-29',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved calendar events',
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date' },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              source: { type: 'string', enum: ['google', 'outlook'] },
              description: { type: 'string' },
              energyLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
              focusType: {
                type: 'string',
                enum: ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'],
              },
              isAllDay: { type: 'boolean' },
            },
          },
        },
        totalEvents: { type: 'number' },
        sources: {
          type: 'object',
          properties: {
            google: { type: 'number' },
            outlook: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date format or calendar access failed',
  })
  async getCalendarEvents(
    @Query('date') dateString?: string,
    @Req() req?: any // TODO: Replace with proper auth guard
  ) {
    // TODO: Extract user ID from authentication
    const userId = req?.user?.id || 'temp-user-id';

    const date = dateString ? new Date(dateString) : new Date();

    this.logger.log(`Retrieving calendar events for user ${userId} on ${date.toISOString()}`);

    try {
      const calendarEvents = await this.plannerService.getCalendarEventsForDate(userId, date);

      return {
        date: date.toISOString().split('T')[0],
        events: calendarEvents.map(event => ({
          id: event.id || `${event.source}-${event.startTime.getTime()}`,
          title: event.title,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          source: event.source,
          description: event.description,
          energyLevel: event.energyLevel,
          focusType: event.focusType,
          isAllDay: event.isAllDay || false,
        })),
        totalEvents: calendarEvents.length,
        sources: {
          google: calendarEvents.filter(e => e.source === 'google').length,
          outlook: calendarEvents.filter(e => e.source === 'outlook').length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve calendar events for user ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
