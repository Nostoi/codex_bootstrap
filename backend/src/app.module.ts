import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { CollaborationModule } from "./collaboration/collaboration.module";
import { GraphModule } from "./integrations/graph/graph.module";
import { GoogleModule } from "./integrations/google/google.module";
import { TasksModule } from "./tasks/tasks.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ProjectsModule } from "./projects/projects.module";
import { AuthModule } from "./auth/auth.module";
import { AiModule } from "./ai/ai.module";
import { MetricsModule } from "./metrics/metrics.module";
import { SecurityModule } from "./security/security.module";
import { PlanningModule } from "./planning/planning.module";
import { FeatureFlagsModule } from "./features/feature-flags.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    CollaborationModule,
    GraphModule,
    GoogleModule,
    ProjectsModule,
    TasksModule,
    NotificationsModule,
    AuthModule,
    AiModule,
    MetricsModule,
    SecurityModule,
    PlanningModule,
    FeatureFlagsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
