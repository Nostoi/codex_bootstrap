import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Post("log")
  log(@Body() body: { userId: string; action: string }) {
    return this.metrics.record(body.userId, body.action);
  }

  @Get("adoption")
  adoption(@Query("action") action = "login") {
    return { count: this.metrics.countByAction(action) };
  }

  @Get("bugs")
  bugs() {
    return { count: this.metrics.countByAction("bug") };
  }
}
