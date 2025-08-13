import { faker } from '@faker-js/faker';
import { BaseFactory, FactoryManager } from './base.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Project } from '@prisma/client';

/**
 * Project Factory for generating test projects with realistic collaboration patterns
 * Supports both individual and team project scenarios
 */
export class ProjectFactory extends BaseFactory<Project> {
  private factoryManager = FactoryManager.getInstance();

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Build a project with realistic defaults
   */
  build(overrides: Partial<Project> = {}): Project {
    const name = overrides.name || this.generateProjectName();

    return {
      id: this.generateTestId('project'),
      name,
      description: overrides.description || this.generateProjectDescription(name),
      color: overrides.color || this.generateProjectColor(),
      isArchived: overrides.isArchived || false,
      settings: overrides.settings || this.generateProjectSettings(),
      ownerId: overrides.ownerId || 'test-user-default',
      createdAt: overrides.createdAt || faker.date.past({ years: 1 }),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    } as Project;
  }

  /**
   * Create and persist a project to database
   */
  async create(overrides: Partial<Project> = {}): Promise<Project> {
    const projectData = this.build(overrides);

    // Remove id to let Prisma generate it
    const { id, ...createData } = projectData;

    const project = await this.prisma.project.create({
      data: createData,
    });

    this.factoryManager.trackEntity('project', project.id);
    return project;
  }

  /**
   * Create project with sample tasks
   */
  async createWithTasks(
    projectData: Partial<Project> = {},
    taskCount: number = 5
  ): Promise<{ project: Project; tasks: any[] }> {
    const project = await this.create(projectData);

    const tasks = [];
    for (let i = 0; i < taskCount; i++) {
      const taskData = {
        title: `${project.name} - Task ${i + 1}`,
        projectId: project.id,
        ownerId: project.ownerId,
        priority: faker.number.int({ min: 1, max: 10 }),
        energyLevel: this.generateEnergyLevel(),
        focusType: this.generateFocusType(),
      };

      const task = await this.prisma.task.create({
        data: taskData,
      });

      tasks.push(task);
    }

    return { project, tasks };
  }

  /**
   * Create ADHD-focused project scenarios
   */
  async createAdhdProjectScenarios(): Promise<{
    personalProject: Project;
    workProject: Project;
    learningProject: Project;
    creativeProject: Project;
    maintenanceProject: Project;
  }> {
    const [personalProject, workProject, learningProject, creativeProject, maintenanceProject] =
      await Promise.all([
        this.create({
          name: 'Personal Organization',
          description: 'Managing personal tasks and life admin',
          color: '#22c55e', // Green for personal
          settings: {
            ...this.generateProjectSettings(),
            defaultEnergyLevel: 'LOW',
            preferredFocusTypes: ['ADMINISTRATIVE'],
            reminderStyle: 'GENTLE',
          },
        }),
        this.create({
          name: 'Q4 Development Sprint',
          description: 'High-priority development work for quarterly goals',
          color: '#ef4444', // Red for high priority
          settings: {
            ...this.generateProjectSettings(),
            defaultEnergyLevel: 'HIGH',
            preferredFocusTypes: ['TECHNICAL'],
            deadlineTracking: true,
            burndownChart: true,
          },
        }),
        this.create({
          name: 'Learning React Advanced Patterns',
          description: 'Skill development and tutorial completion',
          color: '#3b82f6', // Blue for learning
          settings: {
            ...this.generateProjectSettings(),
            defaultEnergyLevel: 'MEDIUM',
            preferredFocusTypes: ['CREATIVE', 'TECHNICAL'],
            progressTracking: true,
            timeBlocking: true,
          },
        }),
        this.create({
          name: 'Blog Content Creation',
          description: 'Writing and creative content development',
          color: '#8b5cf6', // Purple for creative
          settings: {
            ...this.generateProjectSettings(),
            defaultEnergyLevel: 'MEDIUM',
            preferredFocusTypes: ['CREATIVE'],
            inspirationMode: true,
            flexibleDeadlines: true,
          },
        }),
        this.create({
          name: 'System Maintenance',
          description: 'Routine maintenance and administrative tasks',
          color: '#6b7280', // Gray for maintenance
          settings: {
            ...this.generateProjectSettings(),
            defaultEnergyLevel: 'LOW',
            preferredFocusTypes: ['ADMINISTRATIVE'],
            batchProcessing: true,
            automationSuggestions: true,
          },
        }),
      ]);

    return {
      personalProject,
      workProject,
      learningProject,
      creativeProject,
      maintenanceProject,
    };
  }

  /**
   * Create archived project for historical data testing
   */
  async createArchivedProject(overrides: Partial<Project> = {}): Promise<Project> {
    return this.create({
      isArchived: true,
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.past({ years: 1 }),
      name: `Completed Project - ${faker.company.buzzPhrase()}`,
      ...overrides,
    });
  }

  /**
   * Create projects for team collaboration testing
   */
  async createTeamProject(
    ownerUserId: string,
    collaboratorUserIds: string[] = []
  ): Promise<Project> {
    const project = await this.create({
      ownerId: ownerUserId,
      name: `Team Project - ${faker.company.buzzPhrase()}`,
      description: 'Collaborative project with multiple team members',
      settings: {
        ...this.generateProjectSettings(),
        teamCollaboration: true,
        sharedDeadlines: true,
        taskAssignment: true,
        progressSharing: true,
        commentingEnabled: true,
      },
    });

    // Note: ProjectMember model would be created here if it exists in schema
    // For now, we just create the project with collaboration settings

    return project;
  }

  /**
   * Cleanup created projects and related data
   */
  async cleanup(): Promise<void> {
    const projectIds = this.factoryManager.getCreatedEntities('project');

    if (projectIds.length > 0) {
      // Delete project-related data first
      await this.prisma.task.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      // Delete projects
      await this.prisma.project.deleteMany({
        where: { id: { in: projectIds } },
      });
    }

    this.factoryManager.clearTracking('project');
  }

  // Private helper methods

  private generateProjectName(): string {
    const projectTypes = [
      'Development',
      'Design',
      'Research',
      'Planning',
      'Implementation',
      'Analysis',
      'Optimization',
      'Migration',
      'Integration',
      'Documentation',
    ];

    const projectTargets = [
      'System',
      'Platform',
      'Application',
      'Website',
      'Dashboard',
      'API',
      'Database',
      'Interface',
      'Framework',
      'Infrastructure',
    ];

    const type = faker.helpers.arrayElement(projectTypes);
    const target = faker.helpers.arrayElement(projectTargets);
    const version = faker.datatype.boolean() ? ` ${faker.system.semver()}` : '';

    return `${type} ${target}${version}`;
  }

  private generateProjectDescription(name: string): string {
    const templates = [
      `Comprehensive ${name.toLowerCase()} initiative focused on delivering high-quality results.`,
      `Strategic project to enhance ${name.toLowerCase()} capabilities and user experience.`,
      `Cross-functional effort to implement ${name.toLowerCase()} improvements and optimizations.`,
      `Iterative development project for ${name.toLowerCase()} with emphasis on scalability.`,
      `Collaborative initiative to modernize ${name.toLowerCase()} architecture and workflows.`,
    ];

    return faker.helpers.arrayElement(templates);
  }

  private generateProjectColor(): string {
    // ADHD-friendly color palette with good contrast
    const colors = [
      '#ef4444', // Red - urgent/high priority
      '#f97316', // Orange - important
      '#eab308', // Yellow - attention needed
      '#22c55e', // Green - on track/personal
      '#06b6d4', // Cyan - creative
      '#3b82f6', // Blue - learning/research
      '#8b5cf6', // Purple - creative/design
      '#ec4899', // Pink - social/meetings
      '#6b7280', // Gray - maintenance
      '#64748b', // Slate - archive/low priority
    ];

    return faker.helpers.arrayElement(colors);
  }

  private generateProjectSettings(): Record<string, any> {
    return {
      // ADHD-specific project settings
      defaultEnergyLevel: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
      preferredFocusTypes: faker.helpers.arrayElements(
        ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'],
        { min: 1, max: 2 }
      ),

      // Task management settings
      autoTaskPrioritization: faker.datatype.boolean({ probability: 0.4 }),
      deadlineTracking: faker.datatype.boolean({ probability: 0.7 }),
      progressTracking: faker.datatype.boolean({ probability: 0.8 }),
      timeBlocking: faker.datatype.boolean({ probability: 0.3 }),

      // Notification settings
      reminderStyle: faker.helpers.arrayElement(['GENTLE', 'STANDARD', 'URGENT']),
      dailyDigest: faker.datatype.boolean({ probability: 0.5 }),
      milestoneAlerts: faker.datatype.boolean({ probability: 0.6 }),

      // Visualization settings
      kanbanView: faker.datatype.boolean({ probability: 0.7 }),
      timelineView: faker.datatype.boolean({ probability: 0.4 }),
      burndownChart: faker.datatype.boolean({ probability: 0.3 }),

      // Collaboration settings
      teamCollaboration: faker.datatype.boolean({ probability: 0.3 }),
      sharedDeadlines: faker.datatype.boolean({ probability: 0.4 }),
      taskAssignment: faker.datatype.boolean({ probability: 0.5 }),
      commentingEnabled: faker.datatype.boolean({ probability: 0.6 }),

      // ADHD-specific features
      batchProcessing: faker.datatype.boolean({ probability: 0.4 }),
      automationSuggestions: faker.datatype.boolean({ probability: 0.3 }),
      flexibleDeadlines: faker.datatype.boolean({ probability: 0.5 }),
      inspirationMode: faker.datatype.boolean({ probability: 0.2 }),
      progressSharing: faker.datatype.boolean({ probability: 0.3 }),
    };
  }
}
