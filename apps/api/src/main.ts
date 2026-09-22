import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  // Validate configuration before anything else starts. A bad config should
  // fail the process now, not on the first request.
  const config = env();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({ contentSecurityPolicy: false })); // CSP is set at Caddy
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
