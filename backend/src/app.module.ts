import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module'; // Re-enabled for production readiness
// import { CollaborationModule } from "./collaboration/collaboration.module"; // Temporarily disabled for WebSocket testing
import { GraphModule } from './integrations/graph/graph.module';
import { GoogleModule } from './integrations/google/google.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module'; // Re-enabled for production readiness
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module'; // Re-enabled for email integration
import { EmailAiModule } from './integrations/email-ai.module'; // Email integration module
import { MetricsModule } from './metrics/metrics.module'; // Re-enabled for Phase 3
import { SecurityModule } from './security/security.module';
import { PlanningModule } from './planning/planning.module';
import { FeatureFlagsModule } from './features/feature-flags.module'; // Re-enabled for Phase 3
import { AnalyticsModule } from './analytics/analytics.module'; // Phase 3 Item 11: Analytics

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule, // Re-enabled for production readiness
    // CollaborationModule, // Temporarily disabled for WebSocket testing
    GraphModule,
    GoogleModule,
    ProjectsModule, // Re-enabled for production readiness
    TasksModule,
    NotificationsModule,
    AuthModule,
    AiModule, // Re-enabled for email integration
    EmailAiModule, // Email integration module
    MetricsModule, // Re-enabled for Phase 3
    SecurityModule,
    PlanningModule,
    FeatureFlagsModule, // Re-enabled for Phase 3
    AnalyticsModule, // Phase 3 Item 11: Advanced Analytics & Insights
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
