import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocket } from 'ws';
import * as Y from 'yjs';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private documents = new Map<string, Y.Doc>();
  private clientConnections = new Map<WebSocket, string[]>(); // client -> documentIds

  constructor(private prisma: PrismaService) {}

  async handleClientConnect(documentId: string, client: WebSocket) {
    this.logger.log(`Client connected to document: ${documentId}`);
    
    if (!this.clientConnections.has(client)) {
      this.clientConnections.set(client, []);
    }
    this.clientConnections.get(client)?.push(documentId);
  }

  handleClientDisconnect(client: WebSocket) {
    const documentIds = this.clientConnections.get(client) || [];
    documentIds.forEach(docId => {
      this.logger.log(`Client disconnected from document: ${docId}`);
    });
    this.clientConnections.delete(client);
  }

  async syncDocument(documentId: string, update: Uint8Array): Promise<void> {
    try {
      // Get or create Yjs document
      let ydoc = this.documents.get(documentId);
      if (!ydoc) {
        ydoc = new Y.Doc();
        this.documents.set(documentId, ydoc);
        
        // Load existing state from database
        const document = await this.prisma.document.findUnique({
          where: { id: documentId },
        });
        
        if (document?.yjsState) {
          Y.applyUpdate(ydoc, document.yjsState);
        }
      }

      // Apply the update
      Y.applyUpdate(ydoc, update);

      // Save to database (debounced in production)
      const state = Y.encodeStateAsUpdate(ydoc);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { yjsState: Buffer.from(state) },
      });

    } catch (error) {
      this.logger.error(`Error syncing document ${documentId}:`, error);
      throw error;
    }
  }

  async getDocumentState(documentId: string): Promise<Uint8Array | null> {
    try {
      // Check in-memory first
      const ydoc = this.documents.get(documentId);
      if (ydoc) {
        return Y.encodeStateAsUpdate(ydoc);
      }

      // Load from database
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (document?.yjsState) {
        // Create and store in-memory document
        const newYdoc = new Y.Doc();
        Y.applyUpdate(newYdoc, document.yjsState);
        this.documents.set(documentId, newYdoc);
        
        return document.yjsState;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting document state ${documentId}:`, error);
      return null;
    }
  }

  async joinDocument(documentId: string, userId: string): Promise<void> {
    try {
      // Create or update collaboration session
      await this.prisma.collaborationSession.upsert({
        where: {
          userId_documentId: {
            userId,
            documentId,
          },
        },
        update: {
          isActive: true,
          leftAt: null,
        },
        create: {
          userId,
          documentId,
          isActive: true,
        },
      });

      this.logger.log(`User ${userId} joined document ${documentId}`);
    } catch (error) {
      this.logger.error(`Error joining document:`, error);
      throw error;
    }
  }

  async leaveDocument(documentId: string, userId: string): Promise<void> {
    try {
      await this.prisma.collaborationSession.updateMany({
        where: {
          userId,
          documentId,
          isActive: true,
        },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      this.logger.log(`User ${userId} left document ${documentId}`);
    } catch (error) {
      this.logger.error(`Error leaving document:`, error);
      throw error;
    }
  }

  async getActiveCollaborators(documentId: string) {
    return this.prisma.collaborationSession.findMany({
      where: {
        documentId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }
}
