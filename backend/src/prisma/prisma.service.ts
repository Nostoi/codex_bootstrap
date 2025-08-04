import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    try {
      execSync('npx prisma migrate deploy', { stdio: 'ignore' });
      console.log('📜 Database migrations applied');
    } catch (e) {
      console.error('⚠️  Failed to apply migrations', e);
    }
    console.log('🗄️  Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}
