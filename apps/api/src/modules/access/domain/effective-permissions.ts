/**
 * Effective permission resolution.
 *
 * A user may hold several roles. Their effective permission set is the UNION
 * of those roles, with the WIDEST scope winning — that is what makes the model
 * composable: the founder never needs a "Marketing plus Sales" role, they
 * assign both (docs/04 section 2.1).
 *
 * Pure functions over plain data, so the rules are testable without a database
 * and the same logic can run in a guard, a worker or a CLI.
 */

export type Scope = 'ALL' | 'OWN' | 'ASSIGNED';

/** Widest first. ALL sees everything; ASSIGNED sees the least. */
const SCOPE_WIDTH: Record<Scope, number> = { ALL: 3, OWN: 2, ASSIGNED: 1 };

export interface Grant {
  permission: string;
  scope: Scope;
}

export interface RoleGrants {
  roleKey: string;
  isOwner: boolean;
  grants: Grant[];
}

export interface EffectivePermissions {
  /** permission key -> widest scope held for it. */
  readonly byPermission: ReadonlyMap<string, Scope>;
  readonly isOwner: boolean;
  readonly roleKeys: readonly string[];
}

export function resolveEffectivePermissions(roles: RoleGrants[]): EffectivePermissions {
  const byPermission = new Map<string, Scope>();

  for (const role of roles) {
    for (const grant of role.grants) {
      const existing = byPermission.get(grant.permission);
      if (!existing || SCOPE_WIDTH[grant.scope] > SCOPE_WIDTH[existing]) {
        byPermission.set(grant.permission, grant.scope);
      }
    }
  }

  return {
    byPermission,
    isOwner: roles.some((r) => r.isOwner),
    roleKeys: roles.map((r) => r.roleKey),
  };
}

export function can(permissions: EffectivePermissions, permission: string): boolean {
  return permissions.byPermission.has(permission);
}

export function scopeFor(permissions: EffectivePermissions, permission: string): Scope | undefined {
  return permissions.byPermission.get(permission);
}

/**
 * Whether a user may act on a specific row, given their scope for that
 * permission.
 *
 * Note this is a SECOND line of defence. The first is that a scoped query never
 * loads rows the user cannot see, so there is nothing to leak in a response or
 * a log (docs/04 section 3). This check exists for writes, where the id arrives
 * from the client.
 */
export function canActOnRecord(
  permissions: EffectivePermissions,
  permission: string,
  record: { ownerId?: string | null; assigneeId?: string | null },
  userId: string,
): boolean {
  const scope = scopeFor(permissions, permission);
  if (!scope) return false;

  switch (scope) {
    case 'ALL':
      return true;
    case 'OWN':
      return record.ownerId === userId;
    case 'ASSIGNED':
      return record.assigneeId === userId || record.ownerId === userId;
  }
}

/**
 * The only hard-coded access rules in the system. They exist to make lockout
 * impossible, and nothing else in the model is special-cased.
 */
export interface OwnerProtectionInput {
  targetIsOwner: boolean;
  /** How many Owner accounts remain ACTIVE, including the target. */
  remainingOwners: number;
  action: 'delete' | 'deactivate' | 'remove-owner-role';
}

export type ProtectionVerdict = { allowed: true } | { allowed: false; reason: string };

export function checkOwnerProtection(input: OwnerProtectionInput): ProtectionVerdict {
  if (!input.targetIsOwner) return { allowed: true };

  if (input.remainingOwners <= 1) {
    return {
      allowed: false,
      reason:
        'This is the last Owner account. Promote another user to Owner before changing this one.',
    };
  }

  return { allowed: true };
}

/** The Owner role itself cannot lose the ability to manage roles. */
export function canEditRole(
  role: { isOwner: boolean; isSystem: boolean },
  change: { removingPermissions: string[]; deleting: boolean },
): ProtectionVerdict {
  if (role.isOwner) {
    if (change.deleting) {
      return { allowed: false, reason: 'The Owner role cannot be deleted' };
    }
    if (change.removingPermissions.some((p) => p === 'role:update' || p === 'user:update')) {
      return {
        allowed: false,
        reason: 'The Owner role cannot lose user or role management — that would lock everyone out',
      };
    }
  }
  return { allowed: true };
}
