import { Controller, Get } from '@nestjs/common';
import { DatabasePerformanceService } from './database-performance.service';

@Controller('health')
export class DatabasePerformanceController {
  constructor(private readonly databasePerformanceService: DatabasePerformanceService) {}

  @Get('database-performance')
  async getDatabasePerformance() {
    return await this.databasePerformanceService.testDatabasePerformance();
  }

  @Get('database-indexes')
  async getDatabaseIndexPerformance() {
    return await this.databasePerformanceService.testIndexPerformance();
  }
}
