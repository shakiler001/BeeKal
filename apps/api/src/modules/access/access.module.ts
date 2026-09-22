import { Global, Module } from '@nestjs/common';
import { AccessController } from './http/access.controller.js';
import { PermissionsService } from './infrastructure/permissions.service.js';

/**
 * Global because the AuthGuard needs PermissionsService on every request.
 * This is the one module that legitimately crosses every boundary.
 */
@Global()
@Module({
  controllers: [AccessController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class AccessModule {}
