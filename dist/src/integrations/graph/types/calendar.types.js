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