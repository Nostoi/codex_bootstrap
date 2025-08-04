import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketServer,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface NotificationPayload {
  type:
    | 'task-update'
    | 'calendar-sync'
    | 'plan-regeneration'
    | 'deadline-reminder'
    | 'conflict-alert'
    | 'connection-confirmed'
    | 'task-created'
    | 'task-deleted';
  data: any;
  userId: string;
  timestamp: Date;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  sessionId?: string;
}

@Injectable()
@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket[]>();
  private offlineNotifications = new Map<string, NotificationPayload[]>();

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized on port 8001');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log('Client attempting to connect');

    // Extract user ID from handshake query
    const userId = client.handshake.query.userId as string;
    const sessionId = client.handshake.query.sessionId as string;

    if (!userId) {
      this.logger.warn('Client connection rejected: No userId provided');
      client.disconnect();
      return;
    }

    client.userId = userId;
    client.sessionId = sessionId || this.generateSessionId();

    // Add client to user's connection list
    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, []);
    }
    this.connectedClients.get(userId)!.push(client);

    this.logger.log(`Client connected: userId=${userId}, sessionId=${client.sessionId}`);

    // Send any queued offline notifications
    this.sendOfflineNotifications(userId);

    // Send connection confirmation
    this.sendToClient(client, {
      type: 'connection-confirmed',
      data: { sessionId: client.sessionId },
      userId,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userClients = this.connectedClients.get(client.userId);
      if (userClients) {
        const index = userClients.indexOf(client);
        if (index > -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          this.connectedClients.delete(client.userId);
        }
      }
      this.logger.log(
        `Client disconnected: userId=${client.userId}, sessionId=${client.sessionId}`
      );
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, notification: Omit<NotificationPayload, 'userId' | 'timestamp'>) {
    const payload: NotificationPayload = {
      ...notification,
      userId,
      timestamp: new Date(),
    };

    const userClients = this.connectedClients.get(userId);

    if (!userClients || userClients.length === 0) {
      this.logger.log(`User ${userId} not connected, queueing notification`);
      this.queueOfflineNotification(userId, payload);
      return;
    }

    userClients.forEach(client => {
      if (client.connected) {
        this.sendToClient(client, payload);
      }
    });
  }

  // Send notification to all connected users
  broadcast(notification: Omit<NotificationPayload, 'userId' | 'timestamp'>) {
    const payload: NotificationPayload = {
      ...notification,
      userId: 'broadcast',
      timestamp: new Date(),
    };

    this.connectedClients.forEach((clients, userId) => {
      clients.forEach(client => {
        if (client.connected) {
          this.sendToClient(client, { ...payload, userId });
        }
      });
    });
  }

  // Task-specific notification methods
  notifyTaskUpdate(userId: string, taskData: any) {
    this.sendToUser(userId, {
      type: 'task-update',
      data: {
        action: 'updated',
        task: taskData,
      },
    });
  }

  notifyTaskCreated(userId: string, taskData: any) {
    this.sendToUser(userId, {
      type: 'task-update',
      data: {
        action: 'created',
        task: taskData,
      },
    });
  }

  notifyTaskDeleted(userId: string, taskId: string) {
    this.sendToUser(userId, {
      type: 'task-update',
      data: {
        action: 'deleted',
        taskId,
      },
    });
  }

  // Calendar-specific notification methods
  notifyCalendarSync(userId: string, syncData: any) {
    this.sendToUser(userId, {
      type: 'calendar-sync',
      data: {
        status: 'synced',
        events: syncData.events,
        conflicts: syncData.conflicts || [],
      },
    });
  }

  notifyCalendarConflict(userId: string, conflictData: any) {
    this.sendToUser(userId, {
      type: 'conflict-alert',
      data: {
        conflicts: conflictData.conflicts,
        affectedTasks: conflictData.affectedTasks,
      },
    });
  }

  // Plan regeneration notifications
  notifyPlanRegeneration(userId: string, planData: any) {
    this.sendToUser(userId, {
      type: 'plan-regeneration',
      data: {
        plan: planData,
        optimizationScore: planData.optimizationScore,
      },
    });
  }

  // Deadline and reminder notifications
  notifyDeadlineReminder(userId: string, reminderData: any) {
    this.sendToUser(userId, {
      type: 'deadline-reminder',
      data: {
        task: reminderData.task,
        timeUntilDeadline: reminderData.timeUntilDeadline,
        urgencyLevel: reminderData.urgencyLevel,
      },
    });
  }

  // Private helper methods
  private sendToClient(client: AuthenticatedSocket, payload: NotificationPayload) {
    try {
      client.emit('notification', payload);
      this.logger.debug(`Sent notification to client: ${payload.type}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to client: ${error.message}`);
    }
  }

  private queueOfflineNotification(userId: string, notification: NotificationPayload) {
    if (!this.offlineNotifications.has(userId)) {
      this.offlineNotifications.set(userId, []);
    }

    const queue = this.offlineNotifications.get(userId)!;
    queue.push(notification);

    // Limit offline queue size to prevent memory issues
    if (queue.length > 50) {
      queue.shift(); // Remove oldest notification
    }
  }

  private sendOfflineNotifications(userId: string) {
    const notifications = this.offlineNotifications.get(userId);
    if (!notifications || notifications.length === 0) {
      return;
    }

    this.logger.log(`Sending ${notifications.length} offline notifications to user ${userId}`);

    notifications.forEach(notification => {
      this.sendToUser(userId, {
        type: notification.type,
        data: notification.data,
      });
    });

    // Clear the offline queue
    this.offlineNotifications.delete(userId);
  }

  private generateSessionId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  // Health check method
  getConnectionStats() {
    const totalConnections = Array.from(this.connectedClients.values()).reduce(
      (total, clients) => total + clients.length,
      0
    );

    return {
      connectedUsers: this.connectedClients.size,
      totalConnections,
      offlineQueues: this.offlineNotifications.size,
    };
  }
}
