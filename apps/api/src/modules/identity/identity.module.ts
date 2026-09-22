import { Module } from '@nestjs/common';
import { AuthController } from './http/auth.controller.js';
import { UsersController } from './http/users.controller.js';
import { AuthService } from './application/auth.service.js';

@Module({
  controllers: [AuthController, UsersController],
  providers: [AuthService],
  exports: [AuthService],
})
export class IdentityModule {}
