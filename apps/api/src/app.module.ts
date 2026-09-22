import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { SharedModule } from './shared/shared.module.js';
import { HealthModule } from './modules/platform/health/health.module.js';
import { env } from './config/env.js';

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
        // Spread rather than `transport: undefined` — exactOptionalPropertyTypes
        // treats an explicit undefined as different from an absent key.
        ...(env().NODE_ENV === 'development'
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
  ],
})
export class AppModule {}
