/**
 * Password recovery, for the operator.
 *
 * This is the tool you need exactly when nobody is calm: the only Owner cannot
 * sign in, so nobody can reach the admin, so nobody can fix it from the admin.
 * Until this existed, recovery meant writing an UPDATE against the users table
 * by hand and hoping you got the WHERE clause right - at the worst possible
 * moment, under time pressure, with no audit trail.
 *
 * Two modes, both requiring an explicit email:
 *
 *   --email a@b.com              set a new password, read from stdin
 *   --email a@b.com --revoke     clear the password instead, returning the
 *                                account to INVITED so it can be set up again
 *
 * Deliberate choices:
 *
 *  - The password is read from stdin, never from an argument. Arguments land
 *    in shell history and are visible in `ps` to every other user on the box.
 *  - Every run revokes the account's sessions. A password reset that leaves
 *    existing sessions alive does not lock anybody out, which is usually the
 *    entire reason for running it.
 *  - Every run writes an audit row. A change to a credential that leaves no
 *    trace is indistinguishable from an intrusion.
 *  - It refuses to leave the last Owner unable to sign in, matching the rule
 *    the admin enforces (INV: the last Owner cannot be removed or suspended).
 *
 * Local:   pnpm --filter @beekal/api user:reset-password -- --email a@b.com
 * Docker:  docker compose exec api node dist/cli/reset-password.js --email a@b.com
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { ARGON2_OPTIONS, checkPassword } from '../modules/identity/domain/password.js';
import { issueToken, expiryFrom } from '../shared/crypto/index.js';

/**
 * Find a database connection before doing anything else.
 *
 * Without this the tool fails with a raw Prisma stack trace about an invalid
 * `findUnique` invocation, which says nothing about the actual problem. That
 * is a poor way to greet someone who is locked out of their own admin panel at
 * an unsociable hour.
 *
 * In a container the variable is already set by compose and nothing is read
 * from disk. Run through pnpm the working directory is `apps/api`, so the
 * repository root is two levels up.
 */
function ensureDatabaseUrl(): void {
  if (process.env['DATABASE_URL']) return;

  for (const candidate of ['.env', '../../.env']) {
    try {
      process.loadEnvFile(candidate);
      if (process.env['DATABASE_URL']) return;
    } catch {
      // No file there. Try the next one.
    }
  }

  throw new Error(
    'DATABASE_URL is not set and no .env was found.\n' +
      '  Run this from the repository root, or set it explicitly:\n' +
      '    DATABASE_URL=postgresql://... pnpm --filter @beekal/api user:reset-password -- --email a@b.com',
  );
}

const prisma = new PrismaClient();

interface Args {
  email: string;
  revoke: boolean;
}

function parseArgs(argv: string[]): Args {
  let email = '';
  let revoke = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--email') {
      email = argv[i + 1] ?? '';
      i += 1;
    } else if (arg === '--revoke') {
      revoke = true;
    }
  }

  if (!email) {
    throw new Error(
      'An email is required.\n\n' +
        '  --email a@b.com            set a new password\n' +
        '  --email a@b.com --revoke   clear the password instead\n',
    );
  }

  return { email: email.trim().toLowerCase(), revoke };
}

/**
 * Asks for each prompt in turn and returns the answers, without echoing them.
 *
 * Node has no portable "read a secret" primitive. The interface writes through
 * a stream that drops output while an answer is being typed, and the prompt
 * itself is written before muting, so it still appears.
 *
 * One interface for all the prompts, deliberately. Closing a readline
 * interface releases stdin, so a second one opened afterwards receives nothing
 * and never resolves - the process simply exits when the pipe ends, with no
 * error and no explanation. This function asks for everything it needs in one
 * pass for that reason.
 *
 * When stdin is a pipe rather than a terminal - CI, or `printf ... | node` -
 * there is no echo to suppress and the read is plain, which is correct.
 */
async function readSecrets(prompts: string[]): Promise<string[]> {
  const input = process.stdin;
  const isTty = input.isTTY === true;

  let muted = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!muted) process.stdout.write(chunk as Buffer);
      callback();
    },
  });

  const rl = createInterface({ input, output, terminal: isTty });

  // Consumed through the async iterator rather than question(). A piped stdin
  // delivers every line at once, and readline emits them as fast as it can, so
  // a second question() registered on the next tick has already missed its
  // line: the callback never fires and the process exits silently with status
  // 0. The iterator applies backpressure and hands over exactly one line per
  // request, which behaves the same way for a pipe and for a terminal.
  const lines = rl[Symbol.asyncIterator]();

  try {
    const answers: string[] = [];
    for (const prompt of prompts) {
      // Written straight to stdout so the prompt is not itself muted.
      process.stdout.write(prompt);
      muted = isTty;

      const next = await lines.next();

      muted = false;
      if (isTty) process.stdout.write('\n');
      if (next.done) throw new Error('Input ended before every answer was given.');
      answers.push(next.value);
    }
    return answers;
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  ensureDatabaseUrl();
  const args = parseArgs(process.argv.slice(2));

  const user = await prisma.user.findUnique({
    where: { email: args.email },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      deletedAt: true,
      roles: { select: { role: { select: { key: true, isOwner: true } } } },
    },
  });

  if (!user || user.deletedAt) {
    throw new Error(`No active account for ${args.email}`);
  }

  const isOwner = user.roles.some((r) => r.role.isOwner);

  // Mirrors the admin's own protection. Revoking the last Owner's password
  // leaves an account that cannot sign in and cannot be repaired from the UI.
  if (isOwner && args.revoke) {
    const owners = await prisma.user.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        roles: { some: { role: { isOwner: true } } },
      },
    });
    if (owners <= 1) {
      throw new Error(
        'Refusing to revoke the password of the only Owner.\n' +
          'Set a new one instead, or promote a second Owner first.',
      );
    }
  }

  console.info(`  ${user.name} <${user.email}> — ${user.status}${isOwner ? ' — Owner' : ''}`);

  const now = new Date();

  if (args.revoke) {
    const invitation = issueToken();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: null,
          status: 'INVITED',
          inviteTokenHash: invitation.hash,
          inviteExpiresAt: expiryFrom(now, 48),
        },
      }),
      prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'password.revoked_by_cli',
          entityType: 'User',
          entityId: user.id,
        },
      }),
    ]);

    console.info('');
    console.info('  Password cleared. The account is INVITED and has no password.');
    console.info('  Set one within 48 hours with this one-time link:');
    console.info('');
    console.info(`    /admin/setup?token=${invitation.raw}`);
    console.info('');
    return;
  }

  const [password = '', confirm = ''] = await readSecrets([
    '  New password (not echoed): ',
    '  Again: ',
  ]);

  if (password !== confirm) throw new Error('Those did not match. Nothing was changed.');

  // The same rules the API applies, from the same module, so the CLI cannot
  // become a way to set a password the API would have rejected.
  const check = checkPassword(password, user.email);
  if (!check.ok) throw new Error(`${check.reason}. Nothing was changed.`);

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  const [, revoked] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, status: 'ACTIVE', inviteTokenHash: null, inviteExpiresAt: null },
    }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password.reset_by_cli',
        entityType: 'User',
        entityId: user.id,
      },
    }),
  ]);

  console.info('');
  console.info(`  Password set. The account is ACTIVE.`);
  console.info(`  ${revoked.count} existing session(s) revoked — any other device is signed out.`);
  console.info('');
}

main()
  .catch((error: unknown) => {
    console.error('');
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    console.error('');
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
