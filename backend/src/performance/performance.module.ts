/**
 * Performance Module for comprehensive performance monitoring
 * Provides database optimization and ADHD-specific performance insights
 */

import { Module } from '@nestjs/common';
import { DatabasePerformanceMonitor } from './database-performance.service';
import { PerformanceController } from './performance.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PerformanceController],
  providers: [DatabasePerformanceMonitor, PrismaService],
  exports: [DatabasePerformanceMonitor],
})
export class PerformanceModule {}
