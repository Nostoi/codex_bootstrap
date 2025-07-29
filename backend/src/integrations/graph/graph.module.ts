import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphController } from "./graph.controller";
import { GraphService } from "./graph.service";
import { GraphConfigService } from "./config/graph-config.service";

@Module({
  imports: [ConfigModule],
  controllers: [GraphController],
  providers: [GraphService, GraphConfigService],
  exports: [GraphService, GraphConfigService],
})
export class GraphModule {}
