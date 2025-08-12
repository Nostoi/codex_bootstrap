import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { Mem0Service } from './mem0.service';
import { RetryService } from './services/retry.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, Mem0Service, RetryService],
  exports: [AiService, Mem0Service],
})
export class AiModule {}
