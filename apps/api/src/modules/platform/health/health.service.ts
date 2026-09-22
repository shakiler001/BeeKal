import { Injectable } from '@nestjs/common';
import type { HealthCheck, HealthResponse, HealthStatus } from '@beekal/contracts';
import { PrismaService } from '../../../shared/prisma.service.js';

const VERSION = process.env['APP_VERSION'] ?? '0.1.0';

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    const checks: HealthCheck[] = [await this.checkDatabase()];

    // Any failing dependency degrades the whole service. The deploy gate reads
    // this, so "mostly working" must not read as ok.
    const status: HealthStatus = checks.some((c) => c.status === 'down')
      ? 'down'
      : checks.some((c) => c.status === 'degraded')
        ? 'degraded'
        : 'ok';

    return {
      status,
      version: VERSION,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const started = Date.now();
    try {
      await this.prisma.ping();
      const latencyMs = Date.now() - started;
      return {
        name: 'database',
        // A reachable but slow database is a real signal, not a pass.
        status: latencyMs > 1000 ? 'degraded' : 'ok',
        latencyMs,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'down',
        latencyMs: Date.now() - started,
        message: error instanceof Error ? error.message : 'unreachable',
      };
    }
  }
}
