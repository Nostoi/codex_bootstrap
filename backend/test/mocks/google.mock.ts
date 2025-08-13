import { faker } from '@faker-js/faker';

/**
 * Mock Google Services for testing Google Calendar and Gmail integration
 * Provides deterministic responses for Google API operations
 */
export class MockGoogleService {
  private static instance: MockGoogleService;
  private responses: Map<string, any> = new Map();
  private mockData: GoogleMockData = new GoogleMockData();

  static getInstance(): MockGoogleService {
    if (!MockGoogleService.instance) {
      MockGoogleService.instance = new MockGoogleService();
    }
    return MockGoogleService.instance;
  }

  /**
   * Mock Google Calendar events retrieval
   */
  async getCalendarEvents(
    userId: string,
    calendarId: string = 'primary',
    timeMin: Date,
    timeMax: Date
  ): Promise<GoogleCalendarEvent[]> {
    const cacheKey = `calendar:${userId}:${calendarId}:${timeMin.toISOString()}:${timeMax.toISOString()}`;

    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const events = this.mockData.generateCalendarEvents(timeMin, timeMax);
    this.responses.set(cacheKey, events);
    return events;
  }

  /**
   * Mock Gmail message analysis for task extraction
   */
  async getGmailMessages(
    userId: string,
    query: string = 'in:inbox',
    maxResults: number = 10
  ): Promise<GmailMessage[]> {
    const cacheKey = `gmail:${userId}:${query}:${maxResults}`;

    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const messages = this.mockData.generateGmailMessages(maxResults);
    this.responses.set(cacheKey, messages);
    return messages;
  }

  /**
   * Mock calendar event creation
   */
  async createCalendarEvent(
    userId: string,
    calendarId: string = 'primary',
    eventData: CreateGoogleEventData
  ): Promise<GoogleCalendarEvent> {
    const event = this.mockData.createCalendarEvent(eventData);
    return event;
  }

  /**
   * Mock calendar list retrieval
   */
  async getCalendarList(userId: string): Promise<GoogleCalendar[]> {
    const cacheKey = `calendars:${userId}`;

    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const calendars = this.mockData.generateCalendarList();
    this.responses.set(cacheKey, calendars);
    return calendars;
  }

  /**
   * Mock user profile information
   */
  async getUserProfile(userId: string): Promise<GoogleUserProfile> {
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
  async getFreeBusy(
    userId: string,
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ): Promise<GoogleFreeBusyResponse> {
    return this.mockData.generateFreeBusy(calendarIds, timeMin, timeMax);
  }

  /**
   * Mock Gmail thread analysis for task extraction
   */
  async analyzeGmailThread(userId: string, threadId: string): Promise<GmailThread> {
    const cacheKey = `thread:${userId}:${threadId}`;

    if (this.responses.has(cacheKey)) {
      return this.responses.get(cacheKey);
    }

    const thread = this.mockData.generateGmailThread(threadId);
    this.responses.set(cacheKey, thread);
    return thread;
  }

  /**
   * Mock calendar sync status
   */
  async getSyncStatus(userId: string): Promise<GoogleSyncStatus> {
    return {
      userId,
      lastSyncAt: faker.date.recent({ days: 1 }),
      status: 'SUCCESS',
      calendarsCount: faker.number.int({ min: 2, max: 5 }),
      eventsCount: faker.number.int({ min: 10, max: 50 }),
      conflictsCount: faker.number.int({ min: 0, max: 2 }),
      nextSyncAt: faker.date.future({ days: 1 }),
    };
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
   * Simulate API quota exceeded
   */
  simulateQuotaExceeded(): void {
    throw new Error('Google API quota exceeded');
  }

  /**
   * Simulate authentication error
   */
  simulateAuthError(): void {
    throw new Error('Google authentication failed');
  }
}

/**
 * Data generator for Google API mock responses
 */
class GoogleMockData {
  generateCalendarEvents(timeMin: Date, timeMax: Date): GoogleCalendarEvent[] {
    const events: GoogleCalendarEvent[] = [];
    const daysDiff = Math.ceil((timeMax.getTime() - timeMin.getTime()) / (1000 * 60 * 60 * 24));
    const eventCount = Math.min(daysDiff * 3, 30); // 3 events per day max

    for (let i = 0; i < eventCount; i++) {
      events.push(this.generateSingleEvent(timeMin, timeMax));
    }

    return events.sort(
      (a, b) =>
        new Date(a.start.dateTime || a.start.date || '').getTime() -
        new Date(b.start.dateTime || b.start.date || '').getTime()
    );
  }

  generateGmailMessages(count: number): GmailMessage[] {
    const messages: GmailMessage[] = [];

    for (let i = 0; i < count; i++) {
      messages.push({
        id: faker.string.uuid(),
        threadId: faker.string.uuid(),
        snippet: this.generateEmailSnippet(),
        payload: {
          headers: this.generateHeaders(),
          body: {
            data: this.generateBase64Body(),
            size: faker.number.int({ min: 500, max: 5000 }),
          },
          parts: faker.datatype.boolean({ probability: 0.3 })
            ? [
                {
                  mimeType: 'text/html',
                  body: {
                    data: this.generateBase64Body(),
                    size: faker.number.int({ min: 200, max: 2000 }),
                  },
                },
              ]
            : undefined,
        },
        internalDate: faker.date.recent({ days: 14 }).getTime().toString(),
        labelIds: this.generateLabelIds(),
        sizeEstimate: faker.number.int({ min: 1000, max: 10000 }),
      });
    }

    return messages;
  }

  generateCalendarList(): GoogleCalendar[] {
    const calendars: GoogleCalendar[] = [];
    const calendarCount = faker.number.int({ min: 2, max: 6 });

    // Always include primary calendar
    calendars.push({
      id: 'primary',
      summary: faker.internet.email(),
      description: 'Primary calendar',
      primary: true,
      accessRole: 'owner',
      colorId: '1',
      backgroundColor: '#1976d2',
      foregroundColor: '#ffffff',
      timeZone: 'America/Los_Angeles',
      conferenceProperties: {
        allowedConferenceSolutionTypes: ['hangoutsMeet'],
      },
    });

    // Add additional calendars
    for (let i = 1; i < calendarCount; i++) {
      calendars.push({
        id: faker.string.uuid(),
        summary: this.generateCalendarName(),
        description: faker.lorem.sentence(),
        primary: false,
        accessRole: faker.helpers.arrayElement(['owner', 'writer', 'reader']),
        colorId: faker.number.int({ min: 1, max: 24 }).toString(),
        backgroundColor: faker.color.rgb(),
        foregroundColor: '#ffffff',
        timeZone: 'America/Los_Angeles',
        conferenceProperties: {
          allowedConferenceSolutionTypes: ['hangoutsMeet'],
        },
      });
    }

    return calendars;
  }

  generateUserProfile(userId: string): GoogleUserProfile {
    return {
      id: userId,
      email: faker.internet.email(),
      verified_email: true,
      name: faker.person.fullName(),
      given_name: faker.person.firstName(),
      family_name: faker.person.lastName(),
      picture: faker.image.avatar(),
      locale: 'en',
      hd: faker.datatype.boolean({ probability: 0.3 }) ? faker.internet.domainName() : undefined,
    };
  }

  generateFreeBusy(calendarIds: string[], timeMin: Date, timeMax: Date): GoogleFreeBusyResponse {
    const calendars: Record<string, GoogleFreeBusyCalendar> = {};

    calendarIds.forEach(calendarId => {
      const busyTimes: GoogleBusyTime[] = [];
      const current = new Date(timeMin);

      while (current <= timeMax) {
        // Generate 1-3 busy periods per day
        const periodsPerDay = faker.number.int({ min: 1, max: 3 });

        for (let i = 0; i < periodsPerDay; i++) {
          if (faker.datatype.boolean({ probability: 0.7 })) {
            const startHour = faker.number.int({ min: 8, max: 16 });
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
        }

        current.setDate(current.getDate() + 1);
      }

      calendars[calendarId] = {
        busy: busyTimes,
        errors: [],
      };
    });

    return {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      calendars,
    };
  }

  generateGmailThread(threadId: string): GmailThread {
    const messageCount = faker.number.int({ min: 1, max: 5 });
    const messages: GmailMessage[] = [];

    for (let i = 0; i < messageCount; i++) {
      messages.push({
        id: faker.string.uuid(),
        threadId,
        snippet: this.generateEmailSnippet(),
        payload: {
          headers: this.generateHeaders(),
          body: {
            data: this.generateBase64Body(),
            size: faker.number.int({ min: 500, max: 3000 }),
          },
        },
        internalDate: faker.date.recent({ days: 7 }).getTime().toString(),
        labelIds: this.generateLabelIds(),
        sizeEstimate: faker.number.int({ min: 1000, max: 8000 }),
      });
    }

    return {
      id: threadId,
      snippet: messages[0].snippet,
      historyId: faker.string.numeric(10),
      messages,
    };
  }

  createCalendarEvent(eventData: CreateGoogleEventData): GoogleCalendarEvent {
    return {
      id: faker.string.uuid(),
      summary: eventData.summary,
      description: eventData.description,
      start: eventData.start,
      end: eventData.end,
      location: eventData.location,
      attendees: eventData.attendees?.map(email => ({
        email,
        displayName: faker.person.fullName(),
        responseStatus: 'needsAction',
      })),
      creator: {
        email: faker.internet.email(),
        displayName: faker.person.fullName(),
      },
      organizer: {
        email: faker.internet.email(),
        displayName: faker.person.fullName(),
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: 'confirmed',
      htmlLink: `https://calendar.google.com/event?eid=${faker.string.alphanumeric(50)}`,
      sequence: 0,
      reminders: {
        useDefault: true,
        overrides: [],
      },
      eventType: 'default',
    };
  }

  private generateSingleEvent(timeMin: Date, timeMax: Date): GoogleCalendarEvent {
    const eventStart = faker.date.between({ from: timeMin, to: timeMax });
    const duration = faker.number.int({ min: 30, max: 240 }); // 30min to 4hrs
    const eventEnd = new Date(eventStart.getTime() + duration * 60 * 1000);
    const isAllDay = faker.datatype.boolean({ probability: 0.1 });

    const eventTypes = [
      'Team Meeting',
      'Project Standup',
      'Client Presentation',
      'Code Review',
      'Sprint Planning',
      'Design Workshop',
      'Product Demo',
      'Training Session',
      'Team Building',
      'Conference Call',
    ];

    return {
      id: faker.string.uuid(),
      summary: faker.helpers.arrayElement(eventTypes),
      description: faker.lorem.paragraph(),
      start: isAllDay
        ? { date: eventStart.toISOString().split('T')[0] }
        : {
            dateTime: eventStart.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
      end: isAllDay
        ? { date: eventEnd.toISOString().split('T')[0] }
        : {
            dateTime: eventEnd.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
      location: faker.datatype.boolean({ probability: 0.6 })
        ? faker.helpers.arrayElement([
            'Conference Room A',
            'Google Meet',
            'Office Building',
            'Remote',
            faker.location.streetAddress(),
          ])
        : undefined,
      attendees: this.generateEventAttendees(),
      creator: {
        email: faker.internet.email(),
        displayName: faker.person.fullName(),
      },
      organizer: {
        email: faker.internet.email(),
        displayName: faker.person.fullName(),
      },
      created: faker.date.past({ years: 1 }).toISOString(),
      updated: faker.date.recent({ days: 7 }).toISOString(),
      status: 'confirmed',
      htmlLink: `https://calendar.google.com/event?eid=${faker.string.alphanumeric(50)}`,
      sequence: faker.number.int({ min: 0, max: 3 }),
      reminders: {
        useDefault: faker.datatype.boolean({ probability: 0.7 }),
        overrides: faker.datatype.boolean({ probability: 0.3 })
          ? [
              {
                method: 'popup',
                minutes: faker.helpers.arrayElement([5, 10, 15, 30]),
              },
            ]
          : [],
      },
      eventType: 'default',
    };
  }

  private generateEventAttendees(): GoogleEventAttendee[] {
    const attendeeCount = faker.number.int({ min: 0, max: 6 });
    const attendees: GoogleEventAttendee[] = [];

    for (let i = 0; i < attendeeCount; i++) {
      attendees.push({
        email: faker.internet.email(),
        displayName: faker.person.fullName(),
        responseStatus: faker.helpers.arrayElement([
          'needsAction',
          'accepted',
          'declined',
          'tentative',
        ]),
        optional: faker.datatype.boolean({ probability: 0.2 }),
      });
    }

    return attendees;
  }

  private generateCalendarName(): string {
    const names = [
      'Work Calendar',
      'Personal Events',
      'Project Deadlines',
      'Team Meetings',
      'Client Schedule',
      'Training & Development',
      'Travel Plans',
      'Family Events',
    ];

    return faker.helpers.arrayElement(names);
  }

  private generateEmailSnippet(): string {
    const snippets = [
      'Hi team, just wanted to follow up on the project status and next steps for the upcoming sprint.',
      'Please review the attached proposal and let me know your thoughts by end of week.',
      'Meeting rescheduled to next Tuesday at 2 PM. Please update your calendars accordingly.',
      'The client has provided feedback on the latest prototype. Key changes needed include...',
      'Reminder: Code review session tomorrow at 10 AM. Please have your changes ready.',
      "Action items from today's meeting have been distributed. Please check your assigned tasks.",
      'New feature specification has been finalized. Development can begin next week.',
      'Performance review schedule is now available. Please book your preferred time slot.',
    ];

    return faker.helpers.arrayElement(snippets);
  }

  private generateHeaders(): GoogleMessageHeader[] {
    return [
      { name: 'From', value: `${faker.person.fullName()} <${faker.internet.email()}>` },
      { name: 'To', value: faker.internet.email() },
      { name: 'Subject', value: this.generateEmailSubject() },
      { name: 'Date', value: faker.date.recent({ days: 7 }).toISOString() },
      { name: 'Message-ID', value: `<${faker.string.uuid()}@gmail.com>` },
    ];
  }

  private generateEmailSubject(): string {
    const subjects = [
      'Project Update - Sprint Planning',
      'Action Required: Document Review',
      'Meeting Follow-up: Next Steps',
      'Code Review: New Feature Branch',
      'Client Feedback Session',
      'Weekly Team Sync',
      'Product Demo Preparation',
      'Performance Review Schedule',
      'Budget Approval Request',
      'Training Session Reminder',
    ];

    return faker.helpers.arrayElement(subjects);
  }

  private generateBase64Body(): string {
    const content = faker.lorem.paragraphs(3);
    return Buffer.from(content).toString('base64');
  }

  private generateLabelIds(): string[] {
    const labels = ['INBOX', 'IMPORTANT', 'CATEGORY_PERSONAL', 'CATEGORY_PROMOTIONS', 'UNREAD'];
    return faker.helpers.arrayElements(labels, { min: 1, max: 3 });
  }
}

// Type definitions for Google API responses

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: GoogleEventAttendee[];
  creator: {
    email: string;
    displayName: string;
  };
  organizer: {
    email: string;
    displayName: string;
  };
  created: string;
  updated: string;
  status: string;
  htmlLink: string;
  sequence: number;
  reminders: {
    useDefault: boolean;
    overrides: GoogleReminder[];
  };
  eventType: string;
}

export interface GoogleEventAttendee {
  email: string;
  displayName: string;
  responseStatus: string;
  optional?: boolean;
}

export interface GoogleReminder {
  method: string;
  minutes: number;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  accessRole: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  timeZone: string;
  conferenceProperties: {
    allowedConferenceSolutionTypes: string[];
  };
}

export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  hd?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: GoogleMessageHeader[];
    body: {
      data: string;
      size: number;
    };
    parts?: GoogleMessagePart[];
  };
  internalDate: string;
  labelIds: string[];
  sizeEstimate: number;
}

export interface GoogleMessageHeader {
  name: string;
  value: string;
}

export interface GoogleMessagePart {
  mimeType: string;
  body: {
    data: string;
    size: number;
  };
}

export interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GoogleFreeBusyResponse {
  timeMin: string;
  timeMax: string;
  calendars: Record<string, GoogleFreeBusyCalendar>;
}

export interface GoogleFreeBusyCalendar {
  busy: GoogleBusyTime[];
  errors: any[];
}

export interface GoogleBusyTime {
  start: string;
  end: string;
}

export interface GoogleSyncStatus {
  userId: string;
  lastSyncAt: Date;
  status: 'SUCCESS' | 'ERROR' | 'PARTIAL';
  calendarsCount: number;
  eventsCount: number;
  conflictsCount: number;
  nextSyncAt: Date;
}

export interface CreateGoogleEventData {
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: string[];
}
