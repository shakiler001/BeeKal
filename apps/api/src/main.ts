import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  // Validate configuration before anything else starts. A bad config should
  // fail the process now, not on the first request.
  const config = env();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Rate limiting counts per client IP, so the process has to know which
  // address is really the client's. Behind a reverse proxy every request
  // arrives from the proxy and the entire site ends up sharing one counter.
  // Only enabled when the deployment declares how many proxies it runs, since
  // trusting a forwarded header nobody set is how a limit gets spoofed.
  if (config.TRUST_PROXY_HOPS > 0) {
    app.set('trust proxy', config.TRUST_PROXY_HOPS);
  }

  app.use(helmet({ contentSecurityPolicy: false })); // CSP is set at Caddy
  // Sessions ride in an httpOnly cookie, so the guard needs them parsed.
  app.use(cookieParser());
  app.setGlobalPrefix('api', { exclude: ['health', 'health/live'] });

  app.enableCors({
    origin: config.CORS_ORIGINS.length > 0 ? config.CORS_ORIGINS : false,
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(config.PORT, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`Beekal API listening on :${config.PORT} (${config.NODE_ENV})`);
}

void bootstrap();
