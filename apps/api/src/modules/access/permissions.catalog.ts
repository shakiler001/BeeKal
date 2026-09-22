/**
 * The permission catalog.
 *
 * Permissions are defined in CODE because each one corresponds to something the
 * code can actually do — a permission with no enforcement point is a lie told to
 * an administrator. Roles, by contrast, are DATA: created and edited in the UI,
 * never in a migration. That split is the whole design (docs/04 section 1).
 *
 * New permissions arrive with new features and are upserted on boot by the seed.
 */

export const PERMISSION_GROUPS = ['Content', 'Funnel', 'Messaging', 'Insight', 'Platform'] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export interface PermissionDefinition {
  /** `resource:action` — the string used in @RequirePermission(). */
  key: string;
  resource: string;
  action: string;
  group: PermissionGroup;
  /** Plain English, shown in the role editor. */
  label: string;
}

function define(
  group: PermissionGroup,
  resource: string,
  actions: Array<[action: string, label: string]>,
): PermissionDefinition[] {
  return actions.map(([action, label]) => ({
    key: `${resource}:${action}`,
    resource,
    action,
    group,
    label,
  }));
}

const CRUD = (noun: string): Array<[string, string]> => [
  ['read', `View ${noun}`],
  ['create', `Create ${noun}`],
  ['update', `Edit ${noun}`],
  ['delete', `Delete ${noun}`],
];

const PUBLISHABLE = (noun: string): Array<[string, string]> => [
  ...CRUD(noun),
  ['publish', `Publish ${noun}`],
];

export const PERMISSIONS: PermissionDefinition[] = [
  // ---------- Content ----------
  ...define('Content', 'page', [
    ['read', 'View pages'],
    ['update', 'Edit pages'],
  ]),
  ...define('Content', 'section', [...CRUD('page sections'), ['reorder', 'Reorder page sections']]),
  ...define('Content', 'solution', PUBLISHABLE('solutions')),
  ...define('Content', 'problem', PUBLISHABLE('problem pages')),
  ...define('Content', 'case_study', PUBLISHABLE('case studies')),
  ...define('Content', 'faq', CRUD('FAQs')),
  ...define('Content', 'article', PUBLISHABLE('articles')),
  ...define('Content', 'resource', PUBLISHABLE('resources')),
  ...define('Content', 'media', [
    ['read', 'View the media library'],
    ['upload', 'Upload media'],
    ['delete', 'Delete media'],
  ]),

  // ---------- Funnel ----------
  ...define('Funnel', 'lead', [
    ['read', 'View leads'],
    ['update', 'Edit leads'],
    ['assign', 'Assign leads'],
    ['delete', 'Delete leads'],
    ['export', 'Export leads'],
  ]),
  ...define('Funnel', 'lead_note', [
    ['read', 'View lead notes'],
    ['create', 'Add lead notes'],
  ]),
  ...define('Funnel', 'pipeline', [
    ['read', 'View the pipeline'],
    ['update', 'Move leads through the pipeline'],
  ]),
  ...define('Funnel', 'score_submission', [
    ['read', 'View maturity score submissions'],
    ['export', 'Export score submissions'],
  ]),
  ...define('Funnel', 'score_config', [
    ['read', 'View the score configuration'],
    ['update', 'Edit score questions and levels'],
  ]),

  // ---------- Messaging ----------
  ...define('Messaging', 'email_template', CRUD('email templates')),
  ...define('Messaging', 'sequence', [
    ...CRUD('nurture sequences'),
    ['activate', 'Activate or pause sequences'],
  ]),

  // ---------- Insight ----------
  ...define('Insight', 'analytics', [['read', 'View analytics']]),
  ...define('Insight', 'report', [
    ['read', 'View reports'],
    ['export', 'Export reports'],
  ]),

  // ---------- Platform ----------
  ...define('Platform', 'user', [
    ['read', 'View users'],
    ['create', 'Invite users'],
    ['update', 'Edit users'],
    ['deactivate', 'Suspend users'],
    ['delete', 'Delete users'],
  ]),
  ...define('Platform', 'role', CRUD('roles')),
  ...define('Platform', 'setting', [
    ['read', 'View settings'],
    ['update', 'Edit settings'],
  ]),
  ...define('Platform', 'redirect', CRUD('redirects')),
  // Note: no update or delete. The audit log is append-only by design
  // (docs/04 section 2.2).
  ...define('Platform', 'audit', [['read', 'View the audit log']]),
  ...define('Platform', 'feature_flag', [
    ['read', 'View feature flags'],
    ['update', 'Toggle feature flags'],
  ]),
];

/** Permissions that force MFA on any role holding them (docs/05 section 4.1). */
export const MFA_REQUIRED_RESOURCES = new Set(['user', 'role']);

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** Guards against a typo silently creating a permission nothing grants. */
export function assertPermissionExists(key: string): void {
  if (!PERMISSION_KEYS.includes(key)) {
    throw new Error(
      `Unknown permission "${key}". Add it to PERMISSIONS in permissions.catalog.ts.`,
    );
  }
}
