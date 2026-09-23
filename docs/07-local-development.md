# Local Development

How to run Beekal on your own machine, what to check, and what to do when it
misbehaves.

Everything here has been run. Where a command has a failure mode worth knowing
about, it is written down rather than left for you to rediscover at midnight.

---

## 1. What you need

| Need           | Version           | Check with         |
| -------------- | ----------------- | ------------------ |
| Node           | 24 or newer       | `node -v`          |
| pnpm           | 10.14.0           | `pnpm -v`          |
| Docker Desktop | any current build | `docker --version` |

Windows also needs **virtualization enabled in the BIOS**, or Docker Desktop
will install and then refuse to start. That is a firmware setting, not
something an installer can fix for you.

One first-time step:

```bash
pnpm install
cp .env.example .env
```

Then open `.env` and set `SESSION_SECRET` to something real:

```bash
openssl rand -base64 48
```

The API validates its configuration at boot and exits if that secret is
missing or shorter than 32 characters. That is deliberate — a process that
starts with a broken config fails later, somewhere less obvious.

---

## 2. Two ways to run it

### Path A — everything in Docker

Closest to production. Use it when you want to check the thing you will
actually deploy.

```bash
pnpm docker:up      # postgres, redis, minio, migrate, api, web, umami
pnpm docker:ps      # every row should read healthy
pnpm docker:logs    # follow; Ctrl-C stops following, not the containers
```

The `migrate` service runs `prisma migrate deploy` and must finish before the
API starts, so the schema is always applied for you.

| Command             | Does                                       |
| ------------------- | ------------------------------------------ |
| `pnpm docker:down`  | Stop everything, keep the data             |
| `pnpm docker:reset` | Stop everything and **delete the volumes** |

### Path B — infrastructure in Docker, apps with hot reload

What you will use most days.

```bash
docker compose --env-file .env -f infra/docker/compose.yml up -d postgres redis minio

pnpm db:generate    # Prisma client. The API will not start without it
pnpm db:migrate     # apply migrations to your local database
pnpm dev            # API on :4000 with watch, web on :3000 with Turbopack
```

`MAIL_DRIVER=console` means every email prints to the API log instead of
being sent. That is correct locally, and it is how you read the founder
notification and the lead acknowledgement.

> **Do not run `pnpm build` while `pnpm dev` is running.** Turbopack's dev
> server and `next build` share `apps/web/.next`, and they will fight over it.
> The usual symptom is the dev server suddenly returning 500 on every route.
> Recovery: stop the dev server, `rm -rf apps/web/.next`, start it again.

---

## 3. Seed the database

```bash
pnpm db:seed
```

Idempotent, so it is safe to re-run. It creates 82 permissions, 8 roles, the
settings, 5 solutions and 5 case studies, and one Owner account taken from
`SEED_OWNER_EMAIL`.

The Owner is created **INVITED, with no password**. There is no default
credential anywhere in this repository, because a default credential in a repo
is a default credential in production.

---

## 4. Getting into the admin

```bash
pnpm --filter @beekal/api user:reset-password -- --email shakil@beekal.com
```

It asks for the password twice and does not echo it. Requirements: at least 12
characters, no commonly-guessed word, and it must not contain your email's
local part.

Then sign in at <http://localhost:3000/admin/login>.

The same tool is how you recover a locked-out account, including inside a
running container:

```bash
docker compose --env-file .env -f infra/docker/compose.yml \
  exec api node dist/cli/reset-password.js --email shakil@beekal.com
```

| Flag       | Effect                                               |
| ---------- | ---------------------------------------------------- |
| _(none)_   | Set a new password and mark the account ACTIVE       |
| `--revoke` | Clear the password, returning the account to INVITED |

Both modes revoke that account's existing sessions and write an audit row.
The tool refuses to revoke the last Owner's password, because that produces an
account nobody can sign into and nobody can repair from the UI.

---

## 5. Where everything listens

| URL                                 | What                            |
| ----------------------------------- | ------------------------------- |
| <http://localhost:3000>             | The website                     |
| <http://localhost:3000/admin>       | Admin panel                     |
| <http://localhost:4000/health>      | Readiness — checks the database |
| <http://localhost:4000/health/live> | Liveness — no dependencies      |
| <http://localhost:4000/api/...>     | Everything else on the API      |
| <http://localhost:9001>             | MinIO console                   |
| <http://localhost:3001>             | Umami (Docker only)             |

**The browser never calls `:4000`.** Next.js route handlers proxy to the API
server-side so the session cookie stays `httpOnly` and `SameSite=Strict`.
Hitting `:4000` with curl is for your own diagnosis, not how the app works.

---

## 6. Worth checking by hand

- **`/` hero** — toggle Before and After. Scattered chips with dashed
  connectors become chips on the ring with solid lines into the hub, and amber
  pulses run inward.
- **`/score`** — nine sliders, instant result, no email asked. Leave a slider
  at its default 3 and submit: it still registers. That was a real bug once.
- **`/contact`** — submit, then read the API log for two plain-text emails.
- Submit that form **in under 4 seconds** — you get a success message and
  nothing is stored. Telling a bot it was caught teaches it to try again
  differently.
- **Request the score report twice with the same email** — one outbox event,
  not two.
- **Create a role in the admin** with a few permissions. It takes effect with
  no code change and no migration.
- **Stop the API while signed into the admin.** You get sent to the login page,
  not an error page. Break it some other way — a 500, a 429 — and you get a
  designed error card instead.

### One thing that will surprise you

The public site still renders from TypeScript modules, not the database.
Editing a Solution in the admin **will not** change the public page yet. The
admin CRUD, the schema and the publish lifecycle are all real; the read path on
the marketing pages has not been switched over. It is the largest gap between
the design and the code, and it is recorded in
[`LogicLibrary/07-failure-modes.md`](../LogicLibrary/07-failure-modes.md).

---

## 7. Tests

```bash
pnpm typecheck      # strict TS everywhere
pnpm lint           # includes the module boundary rules
pnpm format:check
pnpm test:unit      # 115 tests: 94 API, 15 web, 6 contracts
```

Browser tests need a production build, and Playwright's browsers once:

```bash
pnpm --filter @beekal/web exec playwright install --with-deps chromium
pnpm turbo build --filter=@beekal/web
pnpm --filter @beekal/web test:a11y   # 66 checks: 33 pages, mobile + desktop
pnpm --filter @beekal/web test:e2e    # 96 checks
```

The Playwright config starts its own server on **:3200**, so it does not
collide with your dev server. It builds nothing for you, though — a stale or
missing `.next` gives you _"Could not find a production build"_.

Two repo guards, both also run in CI:

```bash
bash infra/scripts/check-docker-paths.sh     # a Dockerfile COPY of an untracked path
bash infra/scripts/check-logic-library.sh    # the Logic Library still matches the code
```

---

## 8. When it goes wrong

| Symptom                                         | Cause and fix                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| API exits at boot complaining about config      | `.env` missing or `SESSION_SECRET` too short                                                                      |
| Prisma type errors, API will not start          | `pnpm db:generate`                                                                                                |
| `ECONNREFUSED` on 5432                          | Postgres container is not up                                                                                      |
| Dev server returns 500 on every route           | A `next build` ran against the live `.next`. Stop dev, delete `.next`, restart                                    |
| `EADDRINUSE :::3000`                            | An orphaned `next` process. Find it by port and stop it; stopping the pnpm wrapper does not always stop the child |
| Web build fails on symlinks                     | Expected on Windows. `output: 'standalone'` is Docker-only, via `BUILD_STANDALONE=1`                              |
| Docker hangs, or image builds fail oddly        | Check free disk. This has bitten us at 0.1 GB free on C:                                                          |
| Playwright: "Could not find a production build" | Build the web app first                                                                                           |
| API returns 429 during a test run               | You exceeded `RATE_LIMIT_MAX` (60/minute). It clears after 60 quiet seconds                                       |

### Windows notes

Use the **Bash** shell for the `infra/scripts/*.sh` guards. The rest of the
commands work in PowerShell.

Git is configured for LF in the repository; a `CRLF will be replaced by LF`
warning on commit is expected and harmless.

---

## 9. Configuration that matters beyond your machine

Two settings are harmless locally and important in production.

**`TRUST_PROXY_HOPS`** — defaults to `0`, which is right locally. Rate limiting
counts per client IP, and behind a reverse proxy every request appears to come
from the proxy, so the whole site would share one counter. Set it to the number
of proxies you actually operate — `1` for a single Caddy in front. It is a hop
count rather than a boolean on purpose: `X-Forwarded-For` is supplied by the
client, and trusting it blindly lets anyone forge an address and walk through
the limit.

**`RATE_LIMIT_MAX`** — 60 per minute per IP by default. Endpoints that need to
be stricter say so themselves; see `apps/api/src/shared/throttle/throttle.config.ts`,
which explains why exactly one bucket is registered globally and what happened
when three were.

Full deployment procedure is in [`06-runbook.md`](06-runbook.md).

---

## 10. Where to read next

| Doc                                                      | For                                    |
| -------------------------------------------------------- | -------------------------------------- |
| [`00-master-plan.md`](00-master-plan.md)                 | Why the project is shaped this way     |
| [`03-system-architecture.md`](03-system-architecture.md) | Module boundaries and the patterns     |
| [`04-data-model-and-rbac.md`](04-data-model-and-rbac.md) | Schema and how permissions resolve     |
| [`06-runbook.md`](06-runbook.md)                         | Deploying, backups, restores, rollback |
| [`../LogicLibrary/`](../LogicLibrary/README.md)          | The rules the code enforces, and why   |
