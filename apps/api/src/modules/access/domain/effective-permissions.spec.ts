import { describe, expect, it } from 'vitest';
import {
  can,
  canActOnRecord,
  canEditRole,
  checkOwnerProtection,
  resolveEffectivePermissions,
  scopeFor,
  type RoleGrants,
} from './effective-permissions.js';

/**
 * A permission system that has only ever been tested by users who are allowed
 * through is a permission system with unknown behaviour (docs/03 section 8).
 * Every role here gets a test asserting what it CANNOT do.
 */

const sales: RoleGrants = {
  roleKey: 'sales',
  isOwner: false,
  grants: [
    { permission: 'lead:read', scope: 'ASSIGNED' },
    { permission: 'lead:update', scope: 'ASSIGNED' },
    { permission: 'case_study:read', scope: 'ALL' },
  ],
};

const analyst: RoleGrants = {
  roleKey: 'analyst',
  isOwner: false,
  grants: [
    { permission: 'lead:read', scope: 'ALL' },
    { permission: 'lead:export', scope: 'ALL' },
  ],
};

const editor: RoleGrants = {
  roleKey: 'editor',
  isOwner: false,
  grants: [
    { permission: 'case_study:read', scope: 'ALL' },
    { permission: 'case_study:update', scope: 'ALL' },
    { permission: 'case_study:publish', scope: 'ALL' },
  ],
};

const delivery: RoleGrants = {
  roleKey: 'delivery',
  isOwner: false,
  grants: [
    { permission: 'case_study:read', scope: 'ALL' },
    { permission: 'case_study:create', scope: 'ALL' },
    { permission: 'case_study:update', scope: 'ALL' },
    // Deliberately no case_study:publish.
  ],
};

describe('resolveEffectivePermissions', () => {
  it('grants what a single role grants', () => {
    const p = resolveEffectivePermissions([sales]);
    expect(can(p, 'lead:read')).toBe(true);
    expect(scopeFor(p, 'lead:read')).toBe('ASSIGNED');
  });

  it('denies anything no role grants', () => {
    const p = resolveEffectivePermissions([sales]);
    expect(can(p, 'user:delete')).toBe(false);
    expect(can(p, 'case_study:publish')).toBe(false);
    expect(scopeFor(p, 'user:delete')).toBeUndefined();
  });

  it('unions several roles', () => {
    const p = resolveEffectivePermissions([sales, editor]);
    expect(can(p, 'lead:read')).toBe(true);
    expect(can(p, 'case_study:publish')).toBe(true);
  });

  it('widens the scope when a second role grants more', () => {
    // This is what makes the model composable: no combined role is needed.
    const p = resolveEffectivePermissions([sales, analyst]);
    expect(scopeFor(p, 'lead:read')).toBe('ALL');
  });

  it('does not narrow a scope when a second role grants less', () => {
    const p = resolveEffectivePermissions([analyst, sales]);
    expect(scopeFor(p, 'lead:read')).toBe('ALL');
  });

  it('grants nothing at all to a user with no roles', () => {
    const p = resolveEffectivePermissions([]);
    expect(p.byPermission.size).toBe(0);
    expect(can(p, 'lead:read')).toBe(false);
  });
});

describe('canActOnRecord', () => {
  const salesPerms = resolveEffectivePermissions([sales]);
  const analystPerms = resolveEffectivePermissions([analyst]);

  it('lets ALL scope act on any record', () => {
    expect(canActOnRecord(analystPerms, 'lead:read', { assigneeId: 'someone-else' }, 'me')).toBe(
      true,
    );
  });

  it('lets ASSIGNED scope act on their own assignment', () => {
    expect(canActOnRecord(salesPerms, 'lead:update', { assigneeId: 'me' }, 'me')).toBe(true);
  });

  it('BLOCKS ASSIGNED scope on someone else record', () => {
    expect(canActOnRecord(salesPerms, 'lead:update', { assigneeId: 'someone-else' }, 'me')).toBe(
      false,
    );
  });

  it('blocks ASSIGNED scope on an unassigned record', () => {
    expect(canActOnRecord(salesPerms, 'lead:update', { assigneeId: null }, 'me')).toBe(false);
  });

  it('blocks a permission the user does not hold at all', () => {
    expect(canActOnRecord(salesPerms, 'lead:delete', { assigneeId: 'me' }, 'me')).toBe(false);
  });
});

describe('role separation', () => {
  it('Delivery can write a case study but NOT publish it', () => {
    // This separation is the reason Editor and Delivery are different roles.
    const p = resolveEffectivePermissions([delivery]);
    expect(can(p, 'case_study:create')).toBe(true);
    expect(can(p, 'case_study:update')).toBe(true);
    expect(can(p, 'case_study:publish')).toBe(false);
  });

  it('Analyst can read and export but not change anything', () => {
    const p = resolveEffectivePermissions([analyst]);
    expect(can(p, 'lead:read')).toBe(true);
    expect(can(p, 'lead:export')).toBe(true);
    expect(can(p, 'lead:update')).toBe(false);
    expect(can(p, 'lead:delete')).toBe(false);
  });

  it('Sales cannot touch content', () => {
    const p = resolveEffectivePermissions([sales]);
    expect(can(p, 'case_study:read')).toBe(true);
    expect(can(p, 'case_study:update')).toBe(false);
  });
});

describe('owner protection', () => {
  it('allows deleting a non-owner', () => {
    expect(
      checkOwnerProtection({ targetIsOwner: false, remainingOwners: 1, action: 'delete' }),
    ).toEqual({ allowed: true });
  });

  it('refuses to delete the last Owner', () => {
    const verdict = checkOwnerProtection({
      targetIsOwner: true,
      remainingOwners: 1,
      action: 'delete',
    });
    expect(verdict.allowed).toBe(false);
  });

  it('refuses to deactivate the last Owner', () => {
    expect(
      checkOwnerProtection({ targetIsOwner: true, remainingOwners: 1, action: 'deactivate' })
        .allowed,
    ).toBe(false);
  });

  it('allows removing one Owner when another remains', () => {
    expect(
      checkOwnerProtection({ targetIsOwner: true, remainingOwners: 2, action: 'delete' }).allowed,
    ).toBe(true);
  });
});

describe('canEditRole', () => {
  const ownerRole = { isOwner: true, isSystem: true };
  const editorRole = { isOwner: false, isSystem: true };

  it('refuses to delete the Owner role', () => {
    expect(canEditRole(ownerRole, { removingPermissions: [], deleting: true }).allowed).toBe(false);
  });

  it('refuses to strip role management from the Owner role', () => {
    // Allowing this would lock every administrator out permanently.
    expect(
      canEditRole(ownerRole, { removingPermissions: ['role:update'], deleting: false }).allowed,
    ).toBe(false);
  });

  it('refuses to strip user management from the Owner role', () => {
    expect(
      canEditRole(ownerRole, { removingPermissions: ['user:update'], deleting: false }).allowed,
    ).toBe(false);
  });

  it('allows removing an unrelated permission from the Owner role', () => {
    expect(
      canEditRole(ownerRole, { removingPermissions: ['article:delete'], deleting: false }).allowed,
    ).toBe(true);
  });

  it('protects seeded system roles from deletion', () => {
    expect(
      canEditRole(editorRole, { removingPermissions: ['role:update'], deleting: true }).allowed,
    ).toBe(false);
  });

  it('allows editing a seeded non-Owner role and deleting a custom role', () => {
    expect(canEditRole(editorRole, { removingPermissions: [], deleting: false }).allowed).toBe(
      true,
    );
    expect(
      canEditRole({ isOwner: false, isSystem: false }, { removingPermissions: [], deleting: true })
        .allowed,
    ).toBe(true);
  });
});
