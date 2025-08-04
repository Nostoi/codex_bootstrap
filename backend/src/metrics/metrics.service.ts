import { Injectable } from '@nestjs/common';

export interface MetricLog {
  id: number;
  userId: string;
  action: string;
  timestamp: Date;
}

@Injectable()
export class MetricsService {
  private logs: MetricLog[] = [];
  private nextId = 1;

  record(userId: string, action: string): MetricLog {
    const log: MetricLog = {
      id: this.nextId++,
      userId,
      action,
      timestamp: new Date(),
    };
    this.logs.push(log);
    return log;
  }

  countByAction(action: string): number {
    return this.logs.filter(l => l.action === action).length;
  }

  all(): MetricLog[] {
    return [...this.logs];
  }
}
