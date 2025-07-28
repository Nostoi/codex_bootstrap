import { IsOptional, IsString } from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";

export class CreateProjectDto {
  @ApiProperty({ description: "Project name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Project description", required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Owner user ID" })
  @IsString()
  ownerId: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
