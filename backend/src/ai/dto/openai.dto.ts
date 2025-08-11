import { IsString, IsOptional, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class OpenAICompletionDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsString()
  model?: string = 'gpt-4o-mini';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.7;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  maxTokens?: number = 1000;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stop?: string[];

  @IsOptional()
  @IsBoolean()
  stream?: boolean = false;
}

export class OpenAIChatMessageDto {
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @IsString()
  content: string;
}

export class OpenAIChatCompletionDto {
  @IsArray()
  messages: OpenAIChatMessageDto[];

  @IsOptional()
  @IsString()
  model?: string = 'gpt-4o-mini';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.7;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  maxTokens?: number = 1000;

  @IsOptional()
  @IsBoolean()
  stream?: boolean = false;

  @IsOptional()
  jsonMode?: boolean = false;
}

export class TaskGenerationDto {
  @IsString()
  projectDescription: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxTasks?: number = 10;
}

export class SuggestionRequestDto {
  @IsString()
  context: string;

  @IsString()
  type: 'improvement' | 'feature' | 'optimization' | 'bug-fix';

  @IsOptional()
  @IsString()
  codebase?: string;
}

export class TaskExtractionDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxTasks?: number = 10;
}

export class SummarizationDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(500)
  maxLength?: number = 200;

  @IsOptional()
  @IsString()
  format?: 'paragraph' | 'bullet-points' | 'key-points' = 'paragraph';
}
