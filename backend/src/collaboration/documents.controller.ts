import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { CollaborationService } from "./collaboration.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto/document.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("documents")
@Controller("documents")
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly collaborationService: CollaborationService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new document" })
  @ApiResponse({ status: 201, description: "Document created successfully" })
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all documents" })
  @ApiQuery({
    name: "ownerId",
    required: false,
    description: "Filter by owner ID",
  })
  @ApiResponse({ status: 200, description: "List of documents" })
  findAll(@Query("ownerId") ownerId?: string) {
    return this.documentsService.findAll(ownerId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get document by ID" })
  @ApiResponse({ status: 200, description: "Document found" })
  @ApiResponse({ status: 404, description: "Document not found" })
  findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(":id/collaborators")
  @ApiOperation({ summary: "Get active collaborators for a document" })
  @ApiResponse({ status: 200, description: "List of active collaborators" })
  getActiveCollaborators(@Param("id") id: string) {
    return this.collaborationService.getActiveCollaborators(id);
  }

  @Get(":id/history")
  @ApiOperation({ summary: "Get collaboration history for a document" })
  @ApiResponse({ status: 200, description: "Collaboration history" })
  getCollaborationHistory(@Param("id") id: string) {
    return this.documentsService.getCollaborationHistory(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update document" })
  @ApiResponse({ status: 200, description: "Document updated successfully" })
  update(
    @Param("id") id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete document" })
  @ApiResponse({ status: 204, description: "Document deleted successfully" })
  remove(@Param("id") id: string) {
    return this.documentsService.remove(id);
  }
}
