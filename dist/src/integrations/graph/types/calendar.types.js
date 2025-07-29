"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CALENDAR_COLORS = exports.DEFAULT_CONFIG = exports.ALL_CALENDAR_SCOPES = exports.OPTIONAL_SCOPES = exports.REQUIRED_SCOPES = exports.GRAPH_ENDPOINTS = void 0;
exports.GRAPH_ENDPOINTS = {
    ME: '/me',
    CALENDARS: '/me/calendars',
    DEFAULT_CALENDAR: '/me/calendar',
    EVENTS: '/me/events',
    CALENDAR_EVENTS: (calendarId) => `/me/calendars/${calendarId}/events`,
    EVENT: (eventId) => `/me/events/${eventId}`,
    CALENDAR_EVENT: (calendarId, eventId) => `/me/calendars/${calendarId}/events/${eventId}`,
    CALENDAR_PERMISSIONS: (calendarId) => `/me/calendars/${calendarId}/calendarPermissions`,
    DEFAULT_CALENDAR_PERMISSIONS: '/me/calendar/calendarPermissions',
    EVENT_FORWARD: (eventId) => `/me/events/${eventId}/forward`,
    CALENDAR_EVENT_FORWARD: (calendarId, eventId) => `/me/calendars/${calendarId}/events/${eventId}/forward`,
    EVENT_INSTANCES: (eventId) => `/me/events/${eventId}/instances`,
    CALENDAR_VIEW: '/me/calendarView',
    BATCH: '/$batch',
    GET_SCHEDULE: '/me/calendar/getSchedule',
    FIND_MEETING_TIMES: '/me/findMeetingTimes',
};
exports.REQUIRED_SCOPES = [
    'https://graph.microsoft.com/Calendars.Read',
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'https://graph.microsoft.com/User.Read',
];
exports.OPTIONAL_SCOPES = [
    'https://graph.microsoft.com/Calendars.Read.Shared',
    'https://graph.microsoft.com/Calendars.ReadWrite.Shared',
    'https://graph.microsoft.com/offline_access',
];
exports.ALL_CALENDAR_SCOPES = [...exports.REQUIRED_SCOPES, ...exports.OPTIONAL_SCOPES];
exports.DEFAULT_CONFIG = {
    timeZone: 'UTC',
    maxResults: 50,
    orderBy: 'start',
    showDeleted: false,
};
exports.CALENDAR_COLORS = {
    auto: 'auto',
    lightBlue: 'lightBlue',
    lightGreen: 'lightGreen',
    lightOrange: 'lightOrange',
    lightGray: 'lightGray',
    lightYellow: 'lightYellow',
    lightTeal: 'lightTeal',
    lightPink: 'lightPink',
    lightBrown: 'lightBrown',
    lightRed: 'lightRed',
    maxColor: 'maxColor',
};
//# sourceMappingURL=calendar.types.js.map