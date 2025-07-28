import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  UsePipes,
} from "@nestjs/common";
import { AiService } from "./ai.service";
import {
  TaskGenerationDto,
  SuggestionRequestDto,
  SummarizationDto,
  OpenAIChatCompletionDto,
} from "./dto/openai.dto";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("tasks/generate")
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateTasks(@Body() dto: TaskGenerationDto) {
    return this.aiService.generateTasks(dto);
  }

  @Post("suggestions")
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSuggestions(@Body() dto: SuggestionRequestDto) {
    return this.aiService.getSuggestions(dto);
  }

  @Post("summarize")
  @UsePipes(new ValidationPipe({ transform: true }))
  async summarize(@Body() dto: SummarizationDto) {
    return this.aiService.summarize(dto);
  }

  @Post("chat")
  @UsePipes(new ValidationPipe({ transform: true }))
  async chatCompletion(@Body() dto: OpenAIChatCompletionDto) {
    return this.aiService.chatCompletion({
      messages: dto.messages,
      model: dto.model,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      stream: dto.stream,
      jsonMode: dto.jsonMode,
    });
  }
}
