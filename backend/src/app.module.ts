import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
// import { UsersModule } from "./users/users.module"; // Temporarily disabled for WebSocket testing
// import { CollaborationModule } from "./collaboration/collaboration.module"; // Temporarily disabled for WebSocket testing
import { GraphModule } from './integrations/graph/graph.module';
import { GoogleModule } from './integrations/google/google.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
// import { ProjectsModule } from "./projects/projects.module"; // Temporarily disabled for WebSocket testing
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module'; // Re-enabled for email integration
import { EmailAiModule } from './integrations/email-ai.module'; // Email integration module
// import { MetricsModule } from "./metrics/metrics.module"; // Temporarily disabled for WebSocket testing
// import { SecurityModule } from "./security/security.module"; // Re-enabled security services
import { SecurityModule } from './security/security.module';
import { PlanningModule } from './planning/planning.module';
// import { FeatureFlagsModule } from "./features/feature-flags.module"; // Temporarily disabled for WebSocket testing

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    // UsersModule, // Temporarily disabled for WebSocket testing
    // CollaborationModule, // Temporarily disabled for WebSocket testing
    GraphModule,
    GoogleModule,
    // ProjectsModule, // Temporarily disabled for WebSocket testing
    TasksModule,
    NotificationsModule,
    AuthModule,
    AiModule, // Re-enabled for email integration
    EmailAiModule, // Email integration module
    // MetricsModule, // Temporarily disabled for WebSocket testing
    // SecurityModule, // Re-enabled security services
    SecurityModule,
    PlanningModule,
    // FeatureFlagsModule, // Temporarily disabled for WebSocket testing
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
