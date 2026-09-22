import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { SettingsController } from './settings/settings.controller.js';
import { AuditController } from './audit/audit.controller.js';

@Module({
  imports: [HealthModule],
  controllers: [SettingsController, AuditController],
})
export class PlatformModule {}
