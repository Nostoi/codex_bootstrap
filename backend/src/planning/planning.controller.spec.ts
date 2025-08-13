import { Test, TestingModule } from '@nestjs/testing';
import { PlanningController } from './planning.controller';
import { DailyPlannerService } from './daily-planner.service';
import { CalendarEvent } from './types';

describe('PlanningController', () => {
  let controller: PlanningController;
  let plannerService: jest.Mocked<DailyPlannerService>;

  beforeEach(async () => {
    const mockPlannerService = {
      getCalendarEventsForDate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanningController],
      providers: [
        {
          provide: DailyPlannerService,
          useValue: mockPlannerService,
        },
      ],
    }).compile();

    controller = module.get<PlanningController>(PlanningController);
    plannerService = module.get(DailyPlannerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCalendarEvents', () => {
    it('should return calendar events for a given date', async () => {
      const userId = 'test-user-1';
      const date = '2024-01-15';
      const mockCalendarEvents: CalendarEvent[] = [
        {
          id: 'event-1',
          title: 'Team Meeting',
          description: 'Daily standup meeting',
          startTime: new Date('2024-01-15T09:00:00Z'),
          endTime: new Date('2024-01-15T09:30:00Z'),
          source: 'google' as const,
          isAllDay: false,
        },
        {
          id: 'event-2',
          title: 'Project Review',
          description: 'Quarterly project review',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          source: 'outlook' as const,
          isAllDay: false,
        },
      ];

      plannerService.getCalendarEventsForDate.mockResolvedValue(mockCalendarEvents);

      const req = { user: { id: userId } };
      const result = await controller.getCalendarEvents(date, req as any);

      expect(result).toEqual({
        date,
        events: mockCalendarEvents.map(event => ({
          id: event.id,
          title: event.title,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          source: event.source,
          description: event.description,
          energyLevel: event.energyLevel,
          focusType: event.focusType,
          isAllDay: event.isAllDay,
        })),
        totalEvents: mockCalendarEvents.length,
        sources: {
          google: 1,
          outlook: 1,
        },
      });

      expect(plannerService.getCalendarEventsForDate).toHaveBeenCalledWith(userId, new Date(date));
    });

    it('should handle errors gracefully', async () => {
      const userId = 'test-user-1';
      const date = '2024-01-15';

      plannerService.getCalendarEventsForDate.mockRejectedValue(
        new Error('Calendar service unavailable')
      );

      const req = { user: { id: userId } };

      await expect(controller.getCalendarEvents(date, req as any)).rejects.toThrow(
        'Calendar service unavailable'
      );

      expect(plannerService.getCalendarEventsForDate).toHaveBeenCalledWith(userId, new Date(date));
    });

    it('should return empty array when no events exist', async () => {
      const userId = 'test-user-1';
      const date = '2024-01-15';

      plannerService.getCalendarEventsForDate.mockResolvedValue([]);

      const req = { user: { id: userId } };
      const result = await controller.getCalendarEvents(date, req as any);

      expect(result).toEqual({
        date,
        events: [],
        totalEvents: 0,
        sources: {
          google: 0,
          outlook: 0,
        },
      });

      expect(plannerService.getCalendarEventsForDate).toHaveBeenCalledWith(userId, new Date(date));
    });
  });
});
