import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { HealthResponse } from '@beekal/contracts';
import { HealthService } from './health.service.js';
import { Public } from '../../../shared/auth/index.js';

/**
 * Health is exempt from rate limiting.
 *
 * The liveness probe runs every ten seconds, which is six requests a minute —
 * more than some of the tighter buckets allow. A rate limiter that can fail
 * your own health check can restart a container that was working perfectly,
 * so this endpoint is never the place to enforce volume limits.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * Readiness. Returns 503 when a dependency is down so the deploy gate and the
   * uptime check both see the failure without parsing the body.
   */
  @Public()
  @Get()
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const result = await this.health.check();
    res.status(result.status === 'down' ? 503 : 200);
    return result;
  }

  /** Liveness. Cheap, no dependencies: is the process up at all? */
  @Public()
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
