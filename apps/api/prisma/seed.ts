/**
 * Idempotent seed. Safe to re-run on every deploy.
 *
 * Deliberately absent: a default password. The Owner account is created with a
 * one-time setup link instead, because a default credential in a repo is a
 * default credential in production (docs/04 section 5).
 */
import { PrismaClient, type Scope } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PERMISSIONS } from '../src/modules/access/permissions.catalog.js';
import { ROLES, resolveGrants } from '../src/modules/access/roles.catalog.js';
import { seedContent } from './seed-content.js';

const prisma = new PrismaClient();

async function seedPermissions(): Promise<void> {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: {
        key: p.key,
        resource: p.resource,
        action: p.action,
        group: p.group,
        label: p.label,
      },
      update: { resource: p.resource, action: p.action, group: p.group, label: p.label },
    });
  }
  console.info(`  permissions: ${PERMISSIONS.length}`);
}

async function seedRoles(): Promise<void> {
  for (const definition of ROLES) {
    const role = await prisma.role.upsert({
      where: { key: definition.key },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        isSystem: true,
        isOwner: definition.isOwner ?? false,
      },
      // Do not overwrite name/description: an administrator may have renamed
      // the role, and a redeploy should not undo that.
      update: { isSystem: true, isOwner: definition.isOwner ?? false },
    });

    const grants = resolveGrants(definition);
    const permissions = await prisma.permission.findMany({
      where: { key: { in: grants.map((g) => g.permission) } },
      select: { id: true, key: true },
    });
    const idByKey = new Map(permissions.map((p) => [p.key, p.id]));

    for (const grant of grants) {
      const permissionId = idByKey.get(grant.permission);
      if (!permissionId) {
        throw new Error(`Role "${definition.key}" grants unknown permission "${grant.permission}"`);
      }
      const scope: Scope = grant.scope ?? 'ALL';
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        create: { roleId: role.id, permissionId, scope },
        update: { scope },
      });
    }

    console.info(`  role ${definition.key}: ${grants.length} grants`);
  }
}

async function seedOwner(): Promise<void> {
  const email = process.env['SEED_OWNER_EMAIL'];
  const name = process.env['SEED_OWNER_NAME'] ?? 'Owner';

  if (!email) {
    console.info('  owner: skipped (set SEED_OWNER_EMAIL to create one)');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.info(`  owner: ${email} already exists`);
    return;
  }

  const ownerRole = await prisma.role.findFirstOrThrow({ where: { isOwner: true } });

  const user = await prisma.user.create({
    data: {
      email,
      name,
      status: 'INVITED',
      passwordHash: null,
      roles: { create: { roleId: ownerRole.id } },
    },
  });

  const setupToken = randomBytes(32).toString('base64url');

  console.info(`  owner: ${email} created (INVITED)`);
  console.info('');
  console.info('  ┌─────────────────────────────────────────────────────────────');
  console.info('  │ One-time setup link — set a password, then enable MFA.');
  console.info(`  │ /admin/setup?token=${setupToken}`);
  console.info('  │ Shown once. No default password exists for this account.');
  console.info('  └─────────────────────────────────────────────────────────────');
  console.info('');

  // Phase 3 wires this token into the sessions table with an expiry. Until the
  // auth module exists, the link is printed for the operator and nothing
  // consumes it yet.
  void user;
}

const SETTINGS: Array<{
  key: string;
  value: unknown;
  group: string;
  label: string;
  helpText?: string;
}> = [
  {
    key: 'contact.email',
    value: 'shakil@beekal.com',
    group: 'Contact',
    label: 'Contact email',
    helpText: 'Shown in the header, footer and on every contact link.',
  },
  {
    key: 'contact.whatsapp',
    value: '',
    group: 'Contact',
    label: 'WhatsApp number',
    helpText: 'Leave empty to hide the WhatsApp links. Format: 8801XXXXXXXXX',
  },
  {
    key: 'contact.location',
    value: 'Dhaka, Bangladesh',
    group: 'Contact',
    label: 'Location',
  },
  {
    key: 'promise.reply_time',
    value: 'within one working day',
    group: 'Promises',
    label: 'Reply-time promise',
    helpText: 'Appears in the hero trust strip and under the form. Only promise what you can keep.',
  },
  {
    key: 'assessment.price_range',
    value: '',
    group: 'Assessment',
    label: 'Assessment price range',
    helpText:
      'Publishing a range lets buyers self-qualify without a call. Empty shows "Fixed, agreed first".',
  },
  {
    key: 'assessment.duration',
    value: '2 to 3 weeks',
    group: 'Assessment',
    label: 'Duration',
  },
  {
    key: 'assessment.client_hours',
    value: 'About 6 hours',
    group: 'Assessment',
    label: 'Client time required',
  },
  {
    key: 'legal.entity_name',
    value: '',
    group: 'Legal',
    label: 'Registered entity name',
    helpText: 'Raises trust with larger buyers. Leave empty until registered.',
  },
  {
    key: 'legal.registration_number',
    value: '',
    group: 'Legal',
    label: 'Registration number',
  },
];

async function seedSettings(): Promise<void> {
  for (const s of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      // Never overwrite a value the founder has edited.
      create: {
        key: s.key,
        value: s.value as object,
        group: s.group,
        label: s.label,
        helpText: s.helpText ?? null,
      },
      update: { group: s.group, label: s.label, helpText: s.helpText ?? null },
    });
  }
  console.info(`  settings: ${SETTINGS.length}`);
}

async function main(): Promise<void> {
  console.info('Seeding Beekal…');
  await seedPermissions();
  await seedRoles();
  await seedSettings();
  await seedContent(prisma);
  await seedOwner();
  console.info('Done.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
