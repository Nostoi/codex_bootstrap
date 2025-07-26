import { Module } from '@nestjs/common'
import { AiService } from './ai.service'
import { Mem0Service } from './mem0.service'

@Module({
  providers: [AiService, Mem0Service],
  exports: [AiService],
})
export class AiModule {}
