import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
// import { UsersModule } from "./users/users.module"; // Temporarily disabled for WebSocket testing
// import { CollaborationModule } from "./collaboration/collaboration.module"; // Temporarily disabled for WebSocket testing
// import { GraphModule } from "./integrations/graph/graph.module"; // Temporarily disabled due to compilation errors
// import { GoogleModule } from "./integrations/google/google.module"; // Temporarily disabled for WebSocket testing
import { TasksModule } from "./tasks/tasks.module";
import { NotificationsModule } from "./notifications/notifications.module";
// import { ProjectsModule } from "./projects/projects.module"; // Temporarily disabled for WebSocket testing
// import { AuthModule } from "./auth/auth.module"; // Temporarily disabled due to compilation errors
// import { AiModule } from "./ai/ai.module"; // Temporarily disabled for WebSocket testing
// import { MetricsModule } from "./metrics/metrics.module"; // Temporarily disabled for WebSocket testing
// import { SecurityModule } from "./security/security.module"; // Temporarily disabled for WebSocket testing
// import { PlanningModule } from "./planning/planning.module"; // Temporarily disabled for WebSocket testing
// import { FeatureFlagsModule } from "./features/feature-flags.module"; // Temporarily disabled for WebSocket testing

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    // UsersModule, // Temporarily disabled for WebSocket testing
    // CollaborationModule, // Temporarily disabled for WebSocket testing
    // GraphModule, // Temporarily disabled due to compilation errors
    // GoogleModule, // Temporarily disabled for WebSocket testing
    // ProjectsModule, // Temporarily disabled for WebSocket testing
    TasksModule,
    NotificationsModule,
    // AuthModule, // Temporarily disabled due to compilation errors
    // AiModule, // Temporarily disabled for WebSocket testing
    // MetricsModule, // Temporarily disabled for WebSocket testing
    // SecurityModule, // Temporarily disabled for WebSocket testing
    // PlanningModule, // Temporarily disabled for WebSocket testing
    // FeatureFlagsModule, // Temporarily disabled for WebSocket testing
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
