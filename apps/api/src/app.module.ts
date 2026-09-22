import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { SharedModule } from './shared/shared.module.js';
import { HealthModule } from './modules/platform/health/health.module.js';
import { LeadsModule } from './modules/leads/leads.module.js';
import { env } from './config/env.js';

/**
 * True only when we are in development AND pino-pretty can be resolved.
 * Naming a transport target that is not installed makes pino throw during
 * construction, so this is checked rather than assumed.
 */
function prettyTransportAvailable(): boolean {
  if (env().NODE_ENV !== 'development') return false;
  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env().LOG_LEVEL,
        // One correlation id per request, carried into every log line and
        // returned to the client (docs/05 section 5.4).
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          const id = typeof existing === 'string' && existing ? existing : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        autoLogging: { ignore: (req) => req.url === '/health/live' },
        redact: {
          paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'req.body.password',
            'req.body.passwordHash',
          ],
          remove: true,
        },
        // Pretty logs only when pino-pretty is actually installed. It is a
        // devDependency, so a production image does not have it — and pino
        // fails to construct at all if it is named but missing, which takes
        // the whole process down at boot.
        //
        // Spread rather than `transport: undefined`, because
        // exactOptionalPropertyTypes treats an explicit undefined as different
        // from an absent key.
        ...(prettyTransportAvailable()
          ? {
              transport: {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              },
            }
          : {}),
      },
    }),
    SharedModule,
    HealthModule,
    LeadsModule,
  ],
})
export class AppModule {}
