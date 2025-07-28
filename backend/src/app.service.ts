import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getStatus(): { status: string; timestamp: string; version: string } {
    return {
      status: "running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }

  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
