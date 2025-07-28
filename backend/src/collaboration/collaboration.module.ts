import { Module } from "@nestjs/common";
import { CollaborationService } from "./collaboration.service";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";

@Module({
  controllers: [DocumentsController],
  providers: [CollaborationService, DocumentsService],
  exports: [CollaborationService, DocumentsService],
})
export class CollaborationModule {}
