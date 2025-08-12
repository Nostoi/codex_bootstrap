import { Module } from '@nestjs/common';
import { EmailAiController } from './email-ai.controller';
import { GoogleModule } from './google/google.module';
import { GraphModule } from './graph/graph.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [GoogleModule, GraphModule, AiModule],
  controllers: [EmailAiController],
  providers: [],
  exports: [],
})
export class EmailAiModule {}
