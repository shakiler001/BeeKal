import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { PrismaService } from '../prisma.service.js';
import type { AuthenticatedRequest } from '../auth/current-user.js';
import { AUDIT_KEY, type AuditMeta } from './audit.decorator.js';

/**
 * Writes an audit row for every mutating request.
 *
 * Not optional and not remembered: this runs on the write path, so an
 * administrator cannot change something without leaving a trace. That is what
 * makes a multi-user admin accountable rather than merely shared
 * (docs/04 section 2.2).
 *
 * Failures here are logged but never fail the request. Losing an audit row is
 * bad; rejecting a legitimate change because the audit write hiccuped is worse.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta | undefined>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle();

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return next.handle().pipe(
      tap((result) => {
        void this.record(meta, request, result);
      }),
    );
  }

  private async record(
    meta: AuditMeta,
    request: AuthenticatedRequest,
    result: unknown,
  ): Promise<void> {
    try {
      const paramId = request.params?.['id'];
      const entityId =
        typeof result === 'object' && result !== null && 'id' in result
          ? String(result.id)
          : typeof paramId === 'string'
            ? paramId
            : null;

      const sanitized = sanitizeAuditResult(result);

      await this.prisma.auditLog.create({
        data: {
          userId: request.user?.id ?? null,
          action: meta.action,
          entityType: meta.entityType,
          entityId,
          ...(sanitized ? { after: sanitized } : {}),
          ip: request.ip ?? null,
          // A header can legally arrive as an array; take the first.
          userAgent: headerValue(request.headers['user-agent']),
          requestId: headerValue(request.headers['x-request-id']),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit row for ${meta.action}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

function headerValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const REDACTED = [
  'password',
  'passwordHash',
  'token',
  'tokenHash',
  'setupUrl',
  'mfaSecret',
  'secret',
];

/** Never let a credential reach the audit log. */
export function sanitizeAuditResult(value: unknown): object | null {
  if (typeof value !== 'object' || value === null) return null;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (REDACTED.some((r) => key.toLowerCase().includes(r.toLowerCase()))) continue;
    out[key] = val;
  }
  return out;
}
