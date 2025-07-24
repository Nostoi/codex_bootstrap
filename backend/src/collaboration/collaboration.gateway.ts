import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

@WebSocketGateway({
  port: 8001,
  path: '/collaboration',
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);
  private documents = new Map<string, Y.Doc>();

  constructor(private collaborationService: CollaborationService) {}

  handleConnection(client: WebSocket, request: any) {
    this.logger.log('Client connected to collaboration server');
    
    // Parse URL to get document ID
    const url = new URL(request.url, `http://${request.headers.host}`);
    const documentId = url.searchParams.get('docId');
    
    if (documentId) {
      // Set up y-websocket connection for this document
      setupWSConnection(client, request, { gc: true });
      
      // Track the connection
      this.collaborationService.handleClientConnect(documentId, client);
    }
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Client disconnected from collaboration server');
    this.collaborationService.handleClientDisconnect(client);
  }

  @SubscribeMessage('sync-document')
  async handleDocumentSync(
    @MessageBody() data: { documentId: string; update: Uint8Array },
    @ConnectedSocket() client: WebSocket,
  ) {
    try {
      await this.collaborationService.syncDocument(data.documentId, data.update);
      
      // Broadcast to other clients
      this.server.clients.forEach((otherClient) => {
        if (otherClient !== client && otherClient.readyState === WebSocket.OPEN) {
          otherClient.send(JSON.stringify({
            type: 'document-update',
            documentId: data.documentId,
            update: Array.from(data.update),
          }));
        }
      });
    } catch (error) {
      this.logger.error('Error syncing document:', error);
    }
  }

  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @MessageBody() data: { documentId: string; userId: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    try {
      await this.collaborationService.joinDocument(data.documentId, data.userId);
      
      // Send current document state to the client
      const documentState = await this.collaborationService.getDocumentState(data.documentId);
      if (documentState) {
        client.send(JSON.stringify({
          type: 'document-state',
          documentId: data.documentId,
          state: Array.from(documentState),
        }));
      }
    } catch (error) {
      this.logger.error('Error joining document:', error);
    }
  }

  @SubscribeMessage('leave-document')
  async handleLeaveDocument(
    @MessageBody() data: { documentId: string; userId: string },
  ) {
    try {
      await this.collaborationService.leaveDocument(data.documentId, data.userId);
    } catch (error) {
      this.logger.error('Error leaving document:', error);
    }
  }
}
