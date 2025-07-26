import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { GraphModule } from './integrations/graph/graph.module';
import { GoogleModule } from './integrations/google/google.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    CollaborationModule,
    GraphModule,
    GoogleModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
