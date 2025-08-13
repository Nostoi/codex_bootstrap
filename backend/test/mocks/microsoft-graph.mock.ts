import { faker } from '@faker-js/faker';

/**
 * Mock Microsoft Graph Service for testing calendar and email integration
 * Provides deterministic responses for Outlook calendar and email operations
 */
export class MockMicrosoftGraphService {
  private static instance: MockMicrosoftGraphService;
  private responses: Map<string, any> = new Map();
  private mockData: GraphMockData = new GraphMockData();

  static getInstance(): MockMicrosoftGraphService {
    if (!MockMicrosoftGraphService.instance) {
      MockMicrosoftGraphService.instance = new MockMicrosoftGraphService();
    }
    return MockMicrosoftGraphService.instance;
  }

  /**
   * Mock calendar events retrieval
   */
  async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GraphCalendarEvent[]> {
    const cacheKey = `calendar:${userId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const events = this.mockData.generateCalendarEvents(startDate, endDate);
    this.responses.set(cacheKey, events);
    return events;
  }

  /**
   * Mock email analysis for task extraction
   */
  async analyzeEmails(
    userId: string,
    folderName: string = 'inbox',
    maxResults: number = 10
  ): Promise<GraphEmail[]> {
    const cacheKey = `emails:${userId}:${folderName}:${maxResults}`;

    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const emails = this.mockData.generateEmails(maxResults);
    this.responses.set(cacheKey, emails);
    return emails;
  }

  /**
   * Mock calendar event creation
   */
  async createCalendarEvent(
    userId: string,
    eventData: CreateCalendarEventData
  ): Promise<GraphCalendarEvent> {
    const event = this.mockData.createCalendarEvent(eventData);
    return event;
  }

  /**
   * Mock calendar sync status
   */
  async getSyncStatus(userId: string): Promise<CalendarSyncStatus> {
    return {
      userId,
      lastSyncAt: faker.date.recent({ days: 1 }),
      status: 'SUCCESS',
      eventsCount: faker.number.int({ min: 5, max: 25 }),
      conflictsCount: faker.number.int({ min: 0, max: 3 }),
      nextSyncAt: faker.date.future({ days: 1 }),
    };
  }

  /**
   * Mock user profile information
   */
  async getUserProfile(userId: string): Promise<GraphUserProfile> {
    const cacheKey = `profile:${userId}`;

    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const profile = this.mockData.generateUserProfile(userId);
    this.responses.set(cacheKey, profile);
    return profile;
  }

  /**
   * Mock calendar free/busy information
   */
  async getFreeBusy(userId: string, startDate: Date, endDate: Date): Promise<FreeBusyResponse> {
    return this.mockData.generateFreeBusy(startDate, endDate);
  }

  /**
   * Set predefined response for testing
   */
  setMockResponse(key: string, response: any): void {
    this.responses.set(key, response);
  }

  /**
   * Clear all cached responses
   */
  clearMockResponses(): void {
    this.responses.clear();
  }

  /**
   * Simulate API rate limiting
   */
  simulateRateLimit(): void {
    throw new Error('Microsoft Graph API rate limit exceeded');
  }

  /**
   * Simulate authentication error
   */
  simulateAuthError(): void {
    throw new Error('Microsoft Graph authentication failed');
  }
}

/**
 * Data generator for Microsoft Graph mock responses
 */
class GraphMockData {
  generateCalendarEvents(startDate: Date, endDate: Date): GraphCalendarEvent[] {
    const events: GraphCalendarEvent[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const eventCount = Math.min(daysDiff * 2, 20); // 2 events per day max

    for (let i = 0; i < eventCount; i++) {
      events.push(this.generateSingleEvent(startDate, endDate));
    }

    return events.sort(
      (a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
    );
  }

  generateEmails(count: number): GraphEmail[] {
    const emails: GraphEmail[] = [];

    for (let i = 0; i < count; i++) {
      emails.push({
        id: faker.string.uuid(),
        subject: this.generateEmailSubject(),
        bodyPreview: this.generateEmailPreview(),
        body: {
          contentType: 'html',
          content: this.generateEmailBody(),
        },
        from: {
          emailAddress: {
            name: faker.person.fullName(),
            address: faker.internet.email(),
          },
        },
        receivedDateTime: faker.date.recent({ days: 7 }).toISOString(),
        importance: faker.helpers.arrayElement(['low', 'normal', 'high']),
        isRead: faker.datatype.boolean({ probability: 0.7 }),
        hasAttachments: faker.datatype.boolean({ probability: 0.3 }),
        categories: this.generateEmailCategories(),
        flag: faker.datatype.boolean({ probability: 0.2 })
          ? {
              flagStatus: 'flagged',
              dueDateTime: faker.date.future({ days: 7 }).toISOString(),
            }
          : null,
      });
    }

    return emails;
  }

  generateUserProfile(userId: string): GraphUserProfile {
    return {
      id: userId,
      displayName: faker.person.fullName(),
      givenName: faker.person.firstName(),
      surname: faker.person.lastName(),
      mail: faker.internet.email(),
      userPrincipalName: faker.internet.email(),
      officeLocation: faker.location.city(),
      jobTitle: faker.person.jobTitle(),
      department: faker.commerce.department(),
      businessPhones: [faker.phone.number()],
      mobilePhone: faker.phone.number(),
      preferredLanguage: 'en-US',
      timeZone: faker.location.timeZone(),
    };
  }

  generateFreeBusy(startDate: Date, endDate: Date): FreeBusyResponse {
    const busyTimes: BusyTime[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Generate 2-3 busy periods per day during work hours
      if (faker.datatype.boolean({ probability: 0.8 })) {
        const startHour = faker.number.int({ min: 9, max: 15 });
        const duration = faker.number.int({ min: 30, max: 120 }); // 30min to 2hrs

        const busyStart = new Date(current);
        busyStart.setHours(startHour, 0, 0, 0);

        const busyEnd = new Date(busyStart);
        busyEnd.setMinutes(busyEnd.getMinutes() + duration);

        busyTimes.push({
          start: busyStart.toISOString(),
          end: busyEnd.toISOString(),
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      userId: faker.string.uuid(),
      busyTimes,
      workingHours: {
        startTime: '09:00',
        endTime: '17:00',
        timeZone: 'Pacific Standard Time',
      },
    };
  }

  createCalendarEvent(eventData: CreateCalendarEventData): GraphCalendarEvent {
    return {
      id: faker.string.uuid(),
      subject: eventData.subject,
      body: {
        contentType: 'html',
        content: eventData.body || '',
      },
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'Pacific Standard Time',
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'Pacific Standard Time',
      },
      location: eventData.location
        ? {
            displayName: eventData.location,
          }
        : null,
      attendees:
        eventData.attendees?.map(email => ({
          emailAddress: {
            address: email,
            name: faker.person.fullName(),
          },
          status: {
            response: 'none',
            time: new Date().toISOString(),
          },
        })) || [],
      isAllDay: eventData.isAllDay || false,
      importance: 'normal',
      sensitivity: 'normal',
      showAs: 'busy',
      responseRequested: false,
      reminderMinutesBeforeStart: 15,
      categories: [],
    };
  }

  private generateSingleEvent(startDate: Date, endDate: Date): GraphCalendarEvent {
    const eventStart = faker.date.between({ from: startDate, to: endDate });
    const duration = faker.number.int({ min: 30, max: 180 }); // 30min to 3hrs
    const eventEnd = new Date(eventStart.getTime() + duration * 60 * 1000);

    const eventTypes = [
      { subject: 'Team Standup', category: 'meeting' },
      { subject: 'Project Review', category: 'review' },
      { subject: 'Client Call', category: 'client' },
      { subject: 'Development Sprint Planning', category: 'planning' },
      { subject: 'Code Review Session', category: 'technical' },
      { subject: 'Design Workshop', category: 'creative' },
      { subject: 'One-on-One Meeting', category: 'personal' },
      { subject: 'Product Demo', category: 'demo' },
    ];

    const eventType = faker.helpers.arrayElement(eventTypes);

    return {
      id: faker.string.uuid(),
      subject: eventType.subject,
      body: {
        contentType: 'html',
        content: `<p>Meeting about ${eventType.subject.toLowerCase()}</p>`,
      },
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: 'Pacific Standard Time',
      },
      end: {
        dateTime: eventEnd.toISOString(),
        timeZone: 'Pacific Standard Time',
      },
      location: faker.datatype.boolean({ probability: 0.6 })
        ? {
            displayName: faker.helpers.arrayElement([
              'Conference Room A',
              'Zoom Meeting',
              'Teams Call',
              'Office',
              'Remote',
            ]),
          }
        : null,
      attendees: this.generateAttendees(),
      isAllDay: duration >= 480, // All day if 8+ hours
      importance: faker.helpers.arrayElement(['low', 'normal', 'high']),
      sensitivity: 'normal',
      showAs: 'busy',
      responseRequested: faker.datatype.boolean({ probability: 0.3 }),
      reminderMinutesBeforeStart: faker.helpers.arrayElement([5, 10, 15, 30]),
      categories: [eventType.category],
    };
  }

  private generateAttendees(): GraphAttendee[] {
    const attendeeCount = faker.number.int({ min: 1, max: 5 });
    const attendees: GraphAttendee[] = [];

    for (let i = 0; i < attendeeCount; i++) {
      attendees.push({
        emailAddress: {
          name: faker.person.fullName(),
          address: faker.internet.email(),
        },
        status: {
          response: faker.helpers.arrayElement([
            'none',
            'accepted',
            'declined',
            'tentativelyAccepted',
          ]),
          time: faker.date.recent({ days: 1 }).toISOString(),
        },
      });
    }

    return attendees;
  }

  private generateEmailSubject(): string {
    const subjects = [
      'Project Update - Q4 Sprint Planning',
      'Action Required: Review Budget Proposal',
      'Meeting Reschedule Request',
      'Code Review: Authentication Module',
      'Weekly Team Sync Notes',
      'Client Feedback on Latest Prototype',
      'Urgent: Production Issue Needs Attention',
      'New Feature Specification Document',
      'Monthly Performance Review Schedule',
      'Conference Call Follow-up Tasks',
    ];

    return faker.helpers.arrayElement(subjects);
  }

  private generateEmailPreview(): string {
    const previews = [
      'Hi team, I wanted to follow up on our discussion about...',
      'Please review the attached documents and provide feedback by...',
      'The project timeline has been updated based on client requirements...',
      'I need your input on the technical approach for...',
      "Meeting notes from today's session are attached...",
      'Could we schedule a quick call to discuss...',
      'The deadline for this task has been moved to...',
      'Here are the action items from our planning session...',
    ];

    return faker.helpers.arrayElement(previews);
  }

  private generateEmailBody(): string {
    return `
      <p>Hi there,</p>
      <p>${this.generateEmailPreview()}</p>
      <p>Key points to consider:</p>
      <ul>
        <li>Timeline: ${faker.date.future({ days: 14 }).toLocaleDateString()}</li>
        <li>Priority: ${faker.helpers.arrayElement(['High', 'Medium', 'Low'])}</li>
        <li>Resources needed: ${faker.helpers.arrayElements(['Development', 'Design', 'QA', 'Product'], { min: 1, max: 3 }).join(', ')}</li>
      </ul>
      <p>Please let me know if you have any questions.</p>
      <p>Best regards,<br>${faker.person.fullName()}</p>
    `;
  }

  private generateEmailCategories(): string[] {
    const categories = ['Work', 'Projects', 'Meetings', 'Action Required', 'FYI', 'Urgent'];
    return faker.helpers.arrayElements(categories, { min: 0, max: 2 });
  }
}

// Type definitions for Microsoft Graph API responses

export interface GraphCalendarEvent {
  id: string;
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  } | null;
  attendees: GraphAttendee[];
  isAllDay: boolean;
  importance: string;
  sensitivity: string;
  showAs: string;
  responseRequested: boolean;
  reminderMinutesBeforeStart: number;
  categories: string[];
}

export interface GraphAttendee {
  emailAddress: {
    name: string;
    address: string;
  };
  status: {
    response: string;
    time: string;
  };
}

export interface GraphEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  receivedDateTime: string;
  importance: string;
  isRead: boolean;
  hasAttachments: boolean;
  categories: string[];
  flag?: {
    flagStatus: string;
    dueDateTime: string;
  } | null;
}

export interface GraphUserProfile {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
  officeLocation: string;
  jobTitle: string;
  department: string;
  businessPhones: string[];
  mobilePhone: string;
  preferredLanguage: string;
  timeZone: string;
}

export interface CalendarSyncStatus {
  userId: string;
  lastSyncAt: Date;
  status: 'SUCCESS' | 'ERROR' | 'PARTIAL';
  eventsCount: number;
  conflictsCount: number;
  nextSyncAt: Date;
}

export interface FreeBusyResponse {
  userId: string;
  busyTimes: BusyTime[];
  workingHours: {
    startTime: string;
    endTime: string;
    timeZone: string;
  };
}

export interface BusyTime {
  start: string;
  end: string;
}

export interface CreateCalendarEventData {
  subject: string;
  body?: string;
  start: string;
  end: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
}
