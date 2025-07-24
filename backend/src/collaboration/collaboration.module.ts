import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [DocumentsController],
  providers: [CollaborationGateway, CollaborationService, DocumentsService],
  exports: [CollaborationService, DocumentsService],
})
export class CollaborationModule {}
