import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { HealthResponse } from '@beekal/contracts';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * Readiness. Returns 503 when a dependency is down so the deploy gate and the
   * uptime check both see the failure without parsing the body.
   */
  @Get()
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const result = await this.health.check();
    res.status(result.status === 'down' ? 503 : 200);
    return result;
  }

  /** Liveness. Cheap, no dependencies: is the process up at all? */
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
