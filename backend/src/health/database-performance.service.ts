import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getErrorMessage } from '../common/utils/error.utils';

@Injectable()
export class DatabasePerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Test database connection and query performance
   */
  async testDatabasePerformance() {
    const tests = [];

    // Test 1: Basic connectivity
    const connectStart = Date.now();
    const isHealthy = await this.prisma.healthCheck();
    const connectTime = Date.now() - connectStart;

    tests.push({
      test: 'Database Connectivity',
      passed: isHealthy,
      duration: connectTime,
      threshold: 1000,
      details: isHealthy ? 'Connection successful' : 'Connection failed',
    });

    // Test 2: Simple query performance
    const queryStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      const queryTime = Date.now() - queryStart;
      tests.push({
        test: 'Simple Query Performance',
        passed: queryTime < 100,
        duration: queryTime,
        threshold: 100,
        details: `Query executed in ${queryTime}ms`,
      });
    } catch (error) {
      tests.push({
        test: 'Simple Query Performance',
        passed: false,
        duration: Date.now() - queryStart,
        threshold: 100,
        details: `Query failed: ${getErrorMessage(error)}`,
      });
    }

    // Test 3: Connection pool stats
    const poolStats = await this.prisma.getConnectionPoolStats();
    tests.push({
      test: 'Connection Pool Configuration',
      passed: !!poolStats,
      duration: 0,
      threshold: 0,
      details: poolStats ? JSON.stringify(poolStats, null, 2) : 'Pool stats not available',
    });

    // Test 4: Multiple concurrent connections
    const concurrentStart = Date.now();
    try {
      const promises = Array(5)
        .fill(0)
        .map(() => this.prisma.$queryRaw`SELECT pg_sleep(0.1), 1 as concurrent_test`);
      await Promise.all(promises);
      const concurrentTime = Date.now() - concurrentStart;

      tests.push({
        test: 'Concurrent Connections',
        passed: concurrentTime < 1000,
        duration: concurrentTime,
        threshold: 1000,
        details: `5 concurrent queries completed in ${concurrentTime}ms`,
      });
    } catch (error) {
      tests.push({
        test: 'Concurrent Connections',
        passed: false,
        duration: Date.now() - concurrentStart,
        threshold: 1000,
        details: `Concurrent test failed: ${getErrorMessage(error)}`,
      });
    }

    // Calculate overall performance score
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    const performanceScore = Math.round((passedTests / totalTests) * 100);

    return {
      overall: {
        score: performanceScore,
        passed: passedTests,
        total: totalTests,
        status: performanceScore >= 75 ? 'GOOD' : performanceScore >= 50 ? 'FAIR' : 'POOR',
      },
      tests,
      connectionPool: poolStats,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Test database index performance
   */
  async testIndexPerformance() {
    const indexTests = [];

    try {
      // Test indexed queries vs non-indexed (if applicable)
      const indexedQueryStart = Date.now();
      await this.prisma.$queryRaw`
        SELECT COUNT(*) FROM oauth_providers 
        WHERE user_id = 'test-user-id'
      `;
      const indexedTime = Date.now() - indexedQueryStart;

      indexTests.push({
        test: 'Indexed Query Performance (oauth_providers.user_id)',
        passed: indexedTime < 50,
        duration: indexedTime,
        threshold: 50,
        details: `Indexed query executed in ${indexedTime}ms`,
      });

      // Test user session lookup (should be fast due to indexes)
      const sessionQueryStart = Date.now();
      await this.prisma.$queryRaw`
        SELECT COUNT(*) FROM user_sessions 
        WHERE expires_at > NOW() AND is_active = true
      `;
      const sessionTime = Date.now() - sessionQueryStart;

      indexTests.push({
        test: 'Session Index Performance',
        passed: sessionTime < 50,
        duration: sessionTime,
        threshold: 50,
        details: `Session query executed in ${sessionTime}ms`,
      });
    } catch (error) {
      indexTests.push({
        test: 'Index Performance Test',
        passed: false,
        duration: 0,
        threshold: 50,
        details: `Index test failed: ${getErrorMessage(error)}`,
      });
    }

    return {
      indexTests,
      timestamp: new Date().toISOString(),
    };
  }
}
