import { PERMISSION_KEYS } from './permissions.catalog.js';

/**
 * Seeded roles — starting points, all editable in the UI, none special-cased in
 * code except Owner.
 *
 * The Owner protections are the ONLY hard-coded access rules in the system. They
 * exist to make lockout impossible: the last Owner cannot be deleted,
 * deactivated, or stripped of role:update. Everything else is data
 * (docs/04 section 1).
 */

export type ScopeValue = 'ALL' | 'OWN' | 'ASSIGNED';

export interface RoleGrant {
  permission: string;
  scope?: ScopeValue;
}

export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  isOwner?: boolean;
  /** '*' grants everything in the catalog. */
  grants: RoleGrant[] | '*';
}

/** Every read permission for a resource list, at the given scope. */
const readOnly = (resources: string[], scope: ScopeValue = 'ALL'): RoleGrant[] =>
  PERMISSION_KEYS.filter(
    (k) => resources.includes(k.split(':')[0] ?? '') && k.endsWith(':read'),
  ).map((permission) => ({ permission, scope }));

/** Every permission for a resource list, at the given scope. */
const full = (resources: string[], scope: ScopeValue = 'ALL'): RoleGrant[] =>
  PERMISSION_KEYS.filter((k) => resources.includes(k.split(':')[0] ?? '')).map((permission) => ({
    permission,
    scope,
  }));

const CONTENT_RESOURCES = [
  'page',
  'section',
  'solution',
  'problem',
  'case_study',
  'faq',
  'article',
  'resource',
  'media',
];

export const ROLES: RoleDefinition[] = [
  {
    key: 'owner',
    name: 'Owner',
    description:
      'Full access. Cannot be deleted and cannot lose role management — this is what makes lockout impossible.',
    isOwner: true,
    grants: '*',
  },
  {
    key: 'admin',
    name: 'Admin',
    description: 'Everything except deleting the Owner or editing the Owner role.',
    grants: '*',
  },
  {
    key: 'editor',
    name: 'Editor',
    description: 'Full content and media, including publishing. Read-only analytics.',
    grants: [
      ...full(CONTENT_RESOURCES),
      { permission: 'analytics:read' },
      { permission: 'setting:read' },
    ],
  },
  {
    key: 'marketer',
    name: 'Marketer',
    description:
      'Content, resources and nurture sequences. Can read and export leads, but not edit them.',
    grants: [
      ...full(CONTENT_RESOURCES),
      ...full(['email_template', 'sequence']),
      { permission: 'lead:read' },
      { permission: 'lead:export' },
      { permission: 'score_submission:read' },
      { permission: 'score_submission:export' },
      { permission: 'analytics:read' },
      { permission: 'report:read' },
      { permission: 'report:export' },
    ],
  },
  {
    key: 'sales',
    name: 'Sales',
    description:
      'Works the leads assigned to them. Content is read-only — they sell it, they do not write it.',
    grants: [
      // Scope ASSIGNED: the query never loads rows they cannot see, so there is
      // nothing to accidentally leak in a response or a log.
      { permission: 'lead:read', scope: 'ASSIGNED' },
      { permission: 'lead:update', scope: 'ASSIGNED' },
      { permission: 'lead_note:read', scope: 'ASSIGNED' },
      { permission: 'lead_note:create', scope: 'ASSIGNED' },
      { permission: 'pipeline:read', scope: 'ASSIGNED' },
      { permission: 'pipeline:update', scope: 'ASSIGNED' },
      { permission: 'score_submission:read' },
      ...readOnly(CONTENT_RESOURCES),
    ],
  },
  {
    key: 'delivery',
    name: 'Delivery',
    description:
      'Writes case studies from real projects but cannot publish them — that separation is why Editor exists.',
    grants: [
      { permission: 'case_study:read' },
      { permission: 'case_study:create' },
      { permission: 'case_study:update' },
      { permission: 'media:read' },
      { permission: 'media:upload' },
      { permission: 'lead:read' },
      ...readOnly(CONTENT_RESOURCES),
    ],
  },
  {
    key: 'analyst',
    name: 'Analyst',
    description: 'Read-only everywhere, plus exports. Nothing else.',
    grants: [
      ...readOnly([...CONTENT_RESOURCES, 'lead', 'score_submission', 'pipeline']),
      { permission: 'analytics:read' },
      { permission: 'report:read' },
      { permission: 'report:export' },
      { permission: 'lead:export' },
      { permission: 'score_submission:export' },
    ],
  },
  {
    key: 'support',
    name: 'Support',
    description: 'Reserved for the Beekal Care ticket queue. Reads leads, adds notes.',
    grants: [
      { permission: 'lead:read' },
      { permission: 'lead_note:read' },
      { permission: 'lead_note:create' },
    ],
  },
];

export function resolveGrants(role: RoleDefinition): RoleGrant[] {
  if (role.grants === '*') {
    return PERMISSION_KEYS.map((permission) => ({ permission, scope: 'ALL' as const }));
  }
  return role.grants;
}
