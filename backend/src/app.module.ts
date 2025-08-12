import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
// import { UsersModule } from './users/users.module'; // Temporarily disabled for compilation fix
// import { CollaborationModule } from "./collaboration/collaboration.module"; // Temporarily disabled for WebSocket testing
// import { GraphModule } from './integrations/graph/graph.module'; // Temporarily disabled for compilation fix
// import { GoogleModule } from './integrations/google/google.module'; // Temporarily disabled for compilation fix
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
// AuthModule requires schema updates for oAuthProvider, userSession models
import { AiModule } from './ai/ai.module';
import { ProjectsModule } from './projects/projects.module';
import { FeatureFlagsModule } from './features/feature-flags.module';
import { MetricsModule } from './metrics/metrics.module';
import { AnalyticsModule } from './analytics/analytics.module';
// import { EmailAiModule } from './integrations/email-ai.module'; // Temporarily disabled for compilation fix
// import { SecurityModule } from './security/security.module'; // Temporarily disabled for compilation fix
// import { PlanningModule } from './planning/planning.module'; // Temporarily disabled for compilation fix

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    TasksModule,
    NotificationsModule,
    AiModule,
    ProjectsModule,
    FeatureFlagsModule,
    MetricsModule,
    AnalyticsModule,
    // EmailAiModule, // Temporarily disabled for compilation fix
    // MetricsModule, // Temporarily disabled for compilation fix
    // SecurityModule, // Temporarily disabled for compilation fix
    // PlanningModule, // Temporarily disabled for compilation fix
    // FeatureFlagsModule, // Temporarily disabled for compilation fix
    // AnalyticsModule, // Temporarily disabled for compilation fix
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
