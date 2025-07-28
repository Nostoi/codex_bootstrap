import { Server } from 'ws';
export declare class NotificationsGateway {
    server: Server;
    sendReminder(message: string): void;
}
