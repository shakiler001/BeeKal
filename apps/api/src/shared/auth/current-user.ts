import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
/**
 * Structural types only, so `shared` does not depend on a module. The access
 * module supplies the real implementation; anything here just needs to read it.
 */
export type Scope = 'ALL' | 'OWN' | 'ASSIGNED';
export interface EffectivePermissions {
  readonly byPermission: ReadonlyMap<string, Scope>;
  readonly isOwner: boolean;
  readonly roleKeys: readonly string[];
}

/** What the guards attach to the request, and what handlers receive. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  permissions: EffectivePermissions;
  /** Widest scope this user holds for the given permission. */
  scopeFor(permission: string): Scope | undefined;
  can(permission: string): boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
