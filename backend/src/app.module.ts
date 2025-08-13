import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
// import { UsersModule } from './users/users.module'; // Temporarily disabled for compilation fix
// import { CollaborationModule } from "./collaboration/collaboration.module"; // Temporarily disabled for WebSocket testing
import { GraphModule } from './integrations/graph/graph.module'; // Re-enabled with mock implementation
import { GoogleModule } from './integrations/google/google.module'; // Re-enabled with mock implementation
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
// AuthModule requires schema updates for oAuthProvider, userSession models
import { AiModule } from './ai/ai.module';
import { ProjectsModule } from './projects/projects.module';
import { FeatureFlagsModule } from './features/feature-flags.module';
import { MetricsModule } from './metrics/metrics.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PlanningModule } from './planning/planning.module'; // Re-enabled for ADHD daily planning
// import { EmailAiModule } from './integrations/email-ai.module'; // Temporarily disabled for compilation fix
// import { SecurityModule } from './security/security.module'; // Temporarily disabled for compilation fix

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
    GoogleModule, // Re-enabled with mock implementation
    GraphModule, // Re-enabled with mock implementation
    PlanningModule, // Re-enabled for ADHD daily planning
    // EmailAiModule, // Temporarily disabled for compilation fix
    // SecurityModule, // Temporarily disabled for compilation fix
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
