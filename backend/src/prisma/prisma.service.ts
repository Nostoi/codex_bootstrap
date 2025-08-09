import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      // Performance optimization with connection pooling
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Optimize query logging for production
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['query', 'info', 'warn', 'error'],
      // Connection pool configuration
      __internal: {
        engine: {
          // Connection timeout settings
          connectTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
          // Pool timeout settings
          poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    try {
      execSync('npx prisma migrate deploy', { stdio: 'ignore' });
      console.log('📜 Database migrations applied');
    } catch (e) {
      console.error('⚠️  Failed to apply migrations', e);
    }
    console.log('🗄️  Connected to database with optimized connection pooling');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Disconnected from database');
  }

  // Performance optimization helpers
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // Connection pool statistics
  async getConnectionPoolStats() {
    if (process.env.NODE_ENV === 'development') {
      // Only available in development for debugging
      return {
        poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
        activeConnections: 'N/A - Enable with Prisma metrics',
        poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),
        connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
      };
    }
    return null;
  }
}
