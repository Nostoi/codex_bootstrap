import { IsString, IsOptional } from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";

export class CreateDocumentDto {
  @ApiProperty({ description: "Document title" })
  @IsString()
  title: string;

  @ApiProperty({ description: "Document content", required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: "Owner user ID" })
  @IsString()
  ownerId: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}
