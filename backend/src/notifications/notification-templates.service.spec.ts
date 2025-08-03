import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplatesService, TemplateContext, UserContext, TaskContext } from './notification-templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { EnergyLevel, FocusType, TaskStatus } from '@prisma/client';

describe('NotificationTemplatesService', () => {
  let service: NotificationTemplatesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    task: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTemplatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationTemplatesService>(NotificationTemplatesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMessage', () => {
    const mockUserContext: UserContext = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      currentEnergyLevel: EnergyLevel.HIGH,
      morningEnergyLevel: EnergyLevel.HIGH,
      afternoonEnergyLevel: EnergyLevel.MEDIUM,
      workStartTime: '09:00',
      workEndTime: '17:00',
    };

    const mockTaskContext: TaskContext = {
      id: 'task-1',
      title: 'Complete project documentation',
      status: TaskStatus.IN_PROGRESS,
      priority: 4,
      energyLevel: EnergyLevel.MEDIUM,
      focusType: FocusType.CREATIVE,
      estimatedMinutes: 120,
      dueDate: new Date('2025-08-03T15:00:00Z'),
    };

    const mockTemplateContext: TemplateContext = {
      user: mockUserContext,
      task: mockTaskContext,
      currentTime: new Date('2025-08-02T10:00:00Z'),
      timeOfDay: 'morning',
      urgencyLevel: 'medium',
    };

    beforeEach(() => {
      // Mock task aggregation for stats
      mockPrismaService.task.aggregate.mockResolvedValue({
        _count: { id: 5 },
      });
    });

    it('should generate personalized task-update message', async () => {
      const result = await service.generateMessage('task-update', mockTemplateContext);
      
      expect(result).toContain('John Doe');
      expect(result).toContain('Complete project documentation');
      expect(result).toContain('was updated'); // Generic update message
      expect(result).toMatch(/Good afternoon|afternoon/); // Time is 10:00 AM = afternoon
    });

    it('should generate task-created message with motivation', async () => {
      const context = {
        ...mockTemplateContext,
        task: { ...mockTaskContext, status: TaskStatus.TODO },
      };
      
      const result = await service.generateMessage('task-created', context);
      
      expect(result).toContain('John Doe');
      expect(result).toContain('Complete project documentation');
      expect(result).toContain('🎨 Creative Work'); // Focus type formatting
      expect(result).toContain('⚡ Medium Energy'); // Energy level formatting
    });

    it('should generate deadline-reminder with urgency indicators', async () => {
      const context = {
        ...mockTemplateContext,
        urgencyLevel: 'high' as const,
        task: {
          ...mockTaskContext,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
        },
      };
      
      const result = await service.generateMessage('deadline-reminder', context);
      
      expect(result).toContain('John Doe');
      expect(result).toContain('Complete project documentation');
      expect(result).toContain('📅'); // Deadline reminder emoji
      expect(result).toContain('due'); // Contains due date info
    });

    it('should handle missing user name gracefully', async () => {
      const contextWithoutName = {
        ...mockTemplateContext,
        user: { ...mockUserContext, name: undefined },
      };
      
      const result = await service.generateMessage('task-update', contextWithoutName);
      
      expect(result).toBeTruthy();
      expect(result).not.toContain('undefined');
    });

    it('should fallback to basic message on template error', async () => {
      const result = await service.generateMessage('nonexistent-template', mockTemplateContext);
      
      expect(result).toBe('Notification: nonexistent-template');
    });

    it('should generate fallback message format', async () => {
      const result = await service.generateMessage('task-update', mockTemplateContext, 'fallback');
      
      expect(result).toContain('Complete project documentation');
      expect(result).toContain('was updated');
    });

    it('should generate subject line format', async () => {
      const result = await service.generateMessage('task-created', mockTemplateContext, 'subject');
      
      expect(result).toContain('John Doe');
      expect(result).toContain('Complete project documentation');
      expect(result).toContain('ready');
    });
  });

  describe('template helpers', () => {
    it('should format energy levels correctly', () => {
      // Test the formatEnergyLevel helper through message generation
      const testCases = [
        { level: EnergyLevel.LOW, expected: '🔋 Low Energy' },
        { level: EnergyLevel.MEDIUM, expected: '⚡ Medium Energy' },
        { level: EnergyLevel.HIGH, expected: '🚀 High Energy' },
      ];

      testCases.forEach(({ level, expected }) => {
        // Access private method through service instance for testing
        const service_any = service as any;
        const helper = service_any.handlebars.helpers.formatEnergyLevel;
        expect(helper(level)).toBe(expected);
      });
    });

    it('should format focus types correctly', () => {
      const testCases = [
        { type: FocusType.CREATIVE, expected: '🎨 Creative Work' },
        { type: FocusType.TECHNICAL, expected: '⚙️ Technical Work' },
        { type: FocusType.ADMINISTRATIVE, expected: '📋 Administrative' },
        { type: FocusType.SOCIAL, expected: '👥 Social/Collaborative' },
      ];

      testCases.forEach(({ type, expected }) => {
        const service_any = service as any;
        const helper = service_any.handlebars.helpers.formatFocusType;
        expect(helper(type)).toBe(expected);
      });
    });

    it('should generate appropriate priority emojis', () => {
      const testCases = [
        { priority: 8, expected: '🔥' },
        { priority: 6, expected: '⭐' },
        { priority: 4, expected: '📝' },
        { priority: 2, expected: '📌' },
      ];

      testCases.forEach(({ priority, expected }) => {
        const service_any = service as any;
        const helper = service_any.handlebars.helpers.priorityEmoji;
        expect(helper(priority)).toBe(expected);
      });
    });
  });

  describe('context enrichment', () => {
    const mockContext: TemplateContext = {
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        currentEnergyLevel: EnergyLevel.HIGH,
      },
      currentTime: new Date('2025-08-02T14:00:00Z'),
      timeOfDay: 'afternoon',
    };

    it('should enrich context with user activity stats', async () => {
      mockPrismaService.task.aggregate
        .mockResolvedValueOnce({ _count: { id: 8 } }) // Total tasks
        .mockResolvedValueOnce({ _count: { id: 5 } }); // Completed tasks

      const service_any = service as any;
      const enriched = await service_any.enrichContext(mockContext);

      expect(enriched.user.completedTasksToday).toBe(5);
      expect(enriched.user.totalTasksToday).toBe(8);
      expect(enriched.encouragement).toBeTruthy();
      expect(enriched.motivation).toBeTruthy();
    });

    it('should generate appropriate encouragement based on progress', () => {
      const service_any = service as any;
      
      expect(service_any.generateEncouragement(8, 10, EnergyLevel.HIGH)).toContain('crushing it');
      expect(service_any.generateEncouragement(5, 10, EnergyLevel.MEDIUM)).toContain('Great progress');
      expect(service_any.generateEncouragement(2, 10, EnergyLevel.LOW)).toContain('Every step counts');
      expect(service_any.generateEncouragement(0, 5, EnergyLevel.LOW)).toContain('one step at a time');
    });

    it('should generate energy-appropriate motivation', () => {
      const service_any = service as any;
      
      expect(service_any.generateMotivation(EnergyLevel.HIGH, 'morning')).toContain('high energy');
      expect(service_any.generateMotivation(EnergyLevel.LOW, 'morning')).toContain('gentle');
      expect(service_any.generateMotivation(EnergyLevel.MEDIUM, 'evening')).toContain('Planning ahead');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully during context enrichment', async () => {
      mockPrismaService.task.aggregate.mockRejectedValue(new Error('Database error'));

      const result = await service.generateMessage('task-update', {
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        currentTime: new Date(),
        timeOfDay: 'morning',
      });

      expect(result).toBeTruthy();
      expect(result).toContain('Test User');
    });

    it('should return final fallback on complete template failure', async () => {
      // Force template compilation error by providing invalid context
      const invalidContext = null as any;

      const result = await service.generateMessage('task-update', invalidContext);
      
      expect(result).toContain('Task');
      expect(result).toContain('updated');
    });
  });
});
