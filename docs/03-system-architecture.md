# Beekal — System Architecture

Patterns chosen for this business, with the reason each was chosen and what it
would cost to have chosen otherwise.

---

## 1. Architectural pattern: Modular Monolith with Hexagonal modules

**Chosen:** one deployable API, internally divided into modules with enforced
boundaries. Each module is structured as ports and adapters (hexagonal), with a
domain core that has no framework or database imports.

**Why this and not the alternatives:**

| Considered                                                         | Verdict                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Microservices                                                      | Wrong at this size. A one-to-three person team would spend its budget on network boundaries, distributed transactions and deployment topology instead of on the product. Master prompt section 28: do not build a huge internal platform before demand exists. |
| Layered monolith (controllers / services / repositories, app-wide) | Cheapest to start, and it always rots the same way: the `services` folder becomes one mutually-dependent mass, and by the time the client portal arrives nothing can be extracted.                                                                             |
| Serverless functions                                               | Violates the no-lock-in rule and fragments the domain logic across handlers.                                                                                                                                                                                   |
| **Modular monolith, hexagonal inside**                             | **Chosen.** One thing to deploy, one database, one transaction boundary — with real seams. Any module can later become a service by replacing its in-process adapter with an HTTP one, and nothing in its domain core changes.                                 |

The seams are what we are buying. Master prompt section 25 says Beekal will grow
into its own CRM, assessment, proposal and delivery system; section 9 says
repeated solutions should become products. Both require extraction later. Seams
now cost days; adding them later costs months.

### The modules

```
apps/api/src/modules/
  identity/      users, sessions, password reset
  access/        roles, permissions, policy evaluation      <- the RBAC engine
  content/       pages, sections, solutions, problems, case studies, FAQs, articles
  media/         uploads, variants, the storage port
  leads/         submissions, scoring, routing, CRM pipeline
  assessments/   score definitions, submissions, results, shareable reports
  messaging/     email templates, sequences, the send port
  analytics/     event ingestion, aggregates, dashboard reads
  platform/      settings, redirects, audit log, feature flags, health
```

### Inside one module

```
modules/leads/
  domain/          entities, value objects, domain events, invariants.
                   Zero imports from NestJS, Prisma or anything else.
  application/     use cases, one class per operation. Depends on ports only.
  ports/           interfaces this module needs: LeadRepository, EmailSender,
                   Clock, IdGenerator
  infrastructure/  Prisma repository, Nodemailer sender, BullMQ processors
  http/            controllers, DTOs, guards. The only layer that knows about HTTP.
  leads.module.ts  wiring: binds each port to an adapter
```

**Boundary rules, enforced by `eslint-plugin-boundaries` so they are not merely
documented:**

1. `domain` imports nothing outside itself
2. `application` imports `domain` and `ports`, never `infrastructure`
3. `http` imports `application`, never `domain` directly
4. A module reaches another module only through its published application service
   or a domain event — **never** through its Prisma models
5. No cross-module database joins. Composition happens in the application layer.

Rule 5 is the one that gets broken under deadline pressure, and it is the one that
makes extraction possible. CI enforces it.

---

## 2. Design patterns, and where each is used

Selected because a specific problem in this system needs them. Applying a pattern
with no problem to solve is how codebases get hard to read.

| Pattern                  | Applied to                                                      | The problem it solves                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository**           | Every aggregate                                                 | Domain code asks for a `Lead`, not a Prisma row. Makes the domain testable without a database.                                                                               |
| **Unit of Work**         | Multi-entity writes                                             | A lead submission writes the lead, an event and an audit row. All three commit or none do. Wrapped in one Prisma transaction.                                                |
| **Ports and Adapters**   | Email, storage, LLM, payments, search                           | **The no-lock-in rule made mechanical.** Swapping SMTP for SES is one new adapter and one env var.                                                                           |
| **Strategy**             | Lead scoring, score-level calculation, content publishing rules | These rules change with the business. As strategies they are swappable and, for scoring, configurable from the database.                                                     |
| **Specification**        | Admin list filtering                                            | Composable query predicates. Keeps eleven filter permutations out of one 200-line query method.                                                                              |
| **Policy / Guard**       | Every authorization check                                       | `@RequirePermission('case_study:publish')` plus a row-scoped policy. Authorization in one evaluable place, never scattered `if (user.role === 'admin')`.                     |
| **Decorator**            | Caching, logging, retries                                       | A `CachedContentRepository` wraps the real one. Caching added without touching query logic.                                                                                  |
| **Domain events**        | Cross-module reactions                                          | `LeadSubmitted` triggers an email and an analytics event without `leads` importing `messaging`.                                                                              |
| **Transactional outbox** | Event delivery                                                  | Events are written in the same transaction as the state change, then relayed by a worker. Without it, a crash between "lead saved" and "email queued" silently loses a lead. |
| **Factory**              | Aggregate creation                                              | Invariants enforced at construction. A `Lead` cannot exist without a valid source.                                                                                           |
| **Result type**          | Every use case return                                           | `Result<T, DomainError>` for expected failures; exceptions only for the genuinely exceptional. Expected failures become visible in the type signature.                       |
| **Template Method**      | Content publishing workflow                                     | Draft, review, publish, archive is the same skeleton for every content type with per-type validation hooks.                                                                  |
| **Adapter**              | The legacy-import path                                          | Reserved for Beekal Modernize work, where the product itself is adapters over old systems.                                                                                   |
| **Null Object**          | Optional content sections                                       | A missing section renders as nothing rather than throwing. Editors cannot break a page by deleting a record.                                                                 |

**Deliberately not used:** CQRS with separate write and read databases (one
Postgres is plenty; we use read _models_, not read _stores_), Event Sourcing (the
audit log gives us the history we need without the replay complexity), Saga
orchestration (nothing is distributed yet), an Abstract Factory over the
repositories (indirection with no payoff at this size).

---

## 3. Coding patterns

### Contracts are the single source of truth

`packages/contracts` holds the Zod schemas. Everything else is derived:

```
packages/contracts/src/leads/create-lead.ts
  -> LeadCreateSchema (zod)
  -> type LeadCreate = z.infer<...>       shared by both apps
  -> API validation pipe                   runtime, server side
  -> React Hook Form resolver              runtime, client side
  -> OpenAPI schema                        generated
  -> typed API client                      generated
```

One definition. A field added to a form that the API rejects becomes a
**compile error**, not a production bug. This is the highest-leverage decision in
the whole codebase and it is why the monorepo exists at all.

### Non-negotiables

- **TypeScript strict**, plus `noUncheckedIndexedAccess`. `any` is a lint error;
  `unknown` plus narrowing is the escape hatch.
- **No barrel files** on hot paths. They defeat tree-shaking and create cycles.
- **Functional core, imperative shell.** Business rules are pure functions over
  plain data; I/O lives at the edges. This is what makes the domain fast to test.
- **Errors are values** in the domain, exceptions at the boundary. One global
  filter maps `DomainError` subclasses to HTTP status codes in a single place.
- **Every mutation writes an audit row.** Not optional, not remembered — enforced
  by an interceptor on the write path.
- **Naming says what, not how.** `LeadScoringStrategy`, not `LeadHelper`. If
  "Manager", "Util" or "Helper" is in the name, the responsibility is undefined.
- **Files under 300 lines, functions under 50.** A warning, not a wall, but a
  reliable smell detector.
- **Conventional Commits**, trunk-based, short-lived branches, squash merge.
- **Every migration is reversible** and is tested against a seeded database in CI.

---

## 4. Frontend architecture — `apps/web`

### Stack

Next.js 15 App Router, React 19, TypeScript, Tailwind v4, Radix primitives for
behaviour, CVA plus `tailwind-merge` for variants, React Hook Form plus Zod,
TanStack Query for admin client state only, `next-intl`, `next-themes`.

### Rendering strategy

Chosen per route, because SEO and admin have opposite needs:

| Route                                                   | Strategy                                            | Why                                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/`, `/solutions/*`, `/problems/*`, `/method`, `/about` | Static, on-demand revalidated by tag                | Ship HTML from cache. Publishing in the admin purges the exact tag — fresh content without a rebuild. |
| `/work`, `/work/[slug]`, `/insights/*`, `/resources/*`  | Static plus `generateStaticParams`, tag-revalidated | Same, with new entries falling back to on-demand render                                               |
| `/score`                                                | Static shell, client-side interactivity             | The tool is client state; the shell must still be crawlable                                           |
| `/contact`                                              | Static shell, client form                           | —                                                                                                     |
| `/admin/*`                                              | Dynamic, `no-store`, `noindex`                      | Always current, never cached, never indexed                                                           |

**Portability note:** on-demand revalidation uses a **Redis-backed custom cache
handler**, not the filesystem. Filesystem ISR breaks the moment there are two
containers, and the fix must not be a hosting platform.

### Structure

```
apps/web/src/
  app/
    (marketing)/          public routes, shared marketing layout
    (admin)/admin/        admin routes, own layout, auth-gated in middleware
    api/                  BFF route handlers only. No business logic.
  features/               vertical slices: lead-form, score-tool, case-studies,
                          admin-users, admin-content
    <feature>/
      components/  hooks/  api/  schemas/  utils/
  components/
    ui/                   primitives: Button, Input, Card, Accordion
    patterns/             composed: SectionHeader, CTABlock, StatTile
    brand/                Logo, BeeMark, sprite
  lib/                    api client, auth helpers, formatters, cn()
  styles/                 tokens.css ported from the demo
```

**Why feature slices and not `components/ + pages/`:** flat folders force a
developer to open five directories to change one thing, and every file is a
candidate for reuse whether or not it should be. A slice is deletable, which is
the real test of a boundary.

### Component rules

- **Server Components by default.** `'use client'` only for state, effects,
  browser APIs or event handlers — and pushed as deep as possible so the
  interactive leaf is a client component and its parents are not.
- **Presentational components take data, never fetch it.** Fetching happens in
  server components or in feature-level hooks.
- **Every visual primitive is CVA-variant driven.** No one-off Tailwind strings
  for something that already exists as a variant.
- **Tokens, never literal colours.** `text-ink-2`, never `text-[#44507E]`. The
  demo's token system is already correct; a lint rule bans hex literals in
  component files.
- **No layout shift by construction.** Every image has dimensions, every font is
  `display: swap` with a metric-matched fallback, every async region reserves its
  height.

### Porting the demo's JavaScript

The demo has roughly 450 lines of hand-written vanilla JS with genuinely careful
accessibility work. It is ported to React with behaviour preserved, not
re-imagined:

| Demo behaviour                     | React equivalent                                     | Must preserve                                                     |
| ---------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Theme toggle, pre-paint, persisted | `next-themes` plus the existing inline script        | No flash on load                                                  |
| Hero before/after animation        | `useReducedMotion` plus an IntersectionObserver hook | Plays once, honours `prefers-reduced-motion`, has the 6s fallback |
| Case study tabs                    | Radix Tabs                                           | Arrow-key roving tabindex, correct ARIA                           |
| Score sliders, radar, live results | Feature slice with local state                       | `aria-valuetext`, the live region, the "not answered" state       |
| Form validation                    | React Hook Form plus the shared Zod schema           | Inline errors, focus to first error, `role="alert"`               |
| Accordions                         | Radix Accordion or native `<details>`                | Works with JavaScript disabled                                    |
| Sticky mobile dock                 | Scroll hook                                          | `aria-hidden` when off                                            |

The no-JS fallbacks in the demo are kept. A marketing site that needs JavaScript
to show text is a marketing site that sometimes shows nothing.

---

## 5. Backend architecture — `apps/api`

### Stack

NestJS 11, Prisma 6, Postgres 16, Redis 7, BullMQ, Zod through
`nestjs-zod`, Pino, OpenTelemetry, Argon2id, Nodemailer, MinIO via the S3 client.

**Why NestJS over Express or Fastify:** the DI container is what makes ports and
adapters ergonomic rather than a hand-rolled wiring exercise, and module
boundaries, guards, interceptors and the validation pipeline are conventions the
team does not have to invent or defend. The cost is ceremony; the benefit is that
a second developer finds the structure where they expect it.

**Why Prisma over a query builder:** typed schema, sane migrations, good
introspection for the legacy-database work that Beekal Modernize will need. Raw
SQL stays available for the reporting queries where Prisma is the wrong tool.

### Request path

```
HTTP -> Helmet, CORS -> RateLimit -> AuthGuard (session cookie)
     -> PermissionGuard (policy evaluation)
     -> ZodValidationPipe (shared contract)
     -> Controller (thin: map DTO, call use case, map response)
     -> UseCase (application layer, returns Result<T, E>)
     -> Domain (pure rules)
     -> Repository port -> Prisma adapter -> Postgres
     -> AuditInterceptor (writes on every mutation)
     -> DomainEvents -> Outbox -> BullMQ worker -> side effects
```

Controllers stay thin on purpose. Business logic in a controller is business logic
that cannot be tested without HTTP and cannot be reused by a worker or a CLI.

### The BFF layer

The browser never holds an API token. The Next.js route handlers under
`app/api/*` proxy to the API, attaching the session cookie server-side. Benefits:
same-origin cookies (so `SameSite=Strict` is usable), no token in client
JavaScript, and a place to shape responses for the UI without polluting the API.

### Background jobs

BullMQ on Redis, in the same repo, run as a separate container from the same
image: outbox relay, email sending, PDF generation for score reports, image
variant generation, nurture sequence scheduling, search index refresh, nightly
aggregate rollups.

**Every job is idempotent** and keyed, because at-least-once delivery means every
job will eventually run twice.

---

## 6. Repository layout

```
beekal/
  apps/
    web/                  Next.js: public site + admin UI
    api/                  NestJS: REST API + workers
  packages/
    contracts/            Zod schemas, shared types, generated API client
    ui/                   shared React primitives (used by both route groups)
    config/               eslint, tsconfig, tailwind preset, prettier
    testing/              test factories, fixtures, MSW handlers
  infra/
    docker/               Dockerfiles, compose.yml, compose.prod.yml
    caddy/                reverse proxy config, TLS
    scripts/              backup, restore, seed, healthcheck
  docs/                   these documents
  .github/workflows/      CI
```

Turborepo for task orchestration and caching, pnpm workspaces for dependencies.
Node 22 LTS, pinned with Corepack so every machine and the CI runner agree.

### Infrastructure

```yaml
# infra/docker/compose.yml (shape, not final)
services:
  caddy: # TLS, reverse proxy, security headers, compression
  web: # Next.js standalone
  api: # NestJS
  worker: # same image as api, different command
  postgres: # 16, volume-mounted, healthchecked
  redis: # 7, appendonly
  minio: # S3-compatible object storage
  umami: # self-hosted analytics
  backup: # pg_dump on a schedule, retention, restore-tested
```

Every service is a standard open-source image. Nothing here is unavailable on a
different host, which is the whole point.

---

## 7. Configuration

### Rules

1. **Config comes from the environment**, validated by Zod at boot. An invalid
   config fails the process immediately rather than at 3am on the first request.
2. **No secrets in the repo.** `.env.example` documents every key with a comment;
   real values live on the server, out of the image.
3. **Three tiers**, and the distinction matters:
   - _Secrets_ (DB password, session key, SMTP credentials) — environment only
   - _Environment config_ (URLs, ports, feature flags) — environment
   - _Business settings_ (contact email, Assessment price, reply-time promise,
     social links) — **database**, edited in the admin

Tier three is why a founder can change the price without a deploy, and it is the
difference between a site that is maintained and a site that is out of date.

### Environment variables

```bash
# --- Core ---
NODE_ENV=production
APP_URL=https://beekal.com
API_URL=https://beekal.com/api
API_INTERNAL_URL=http://api:4000        # container-to-container

# --- Database ---
DATABASE_URL=postgresql://beekal:***@postgres:5432/beekal
DATABASE_POOL_MAX=10

# --- Cache / queue ---
REDIS_URL=redis://redis:6379

# --- Sessions ---
SESSION_SECRET=***                       # 32+ bytes
SESSION_TTL_HOURS=12
SESSION_COOKIE_NAME=bk_session

# --- Storage (port: S3-compatible) ---
STORAGE_DRIVER=s3
S3_ENDPOINT=http://minio:9000
S3_BUCKET=beekal-media
S3_ACCESS_KEY=***
S3_SECRET_KEY=***
S3_PUBLIC_URL=https://media.beekal.com

# --- Email (port: smtp | resend | ses) ---
MAIL_DRIVER=smtp
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=***
MAIL_FROM="Beekal <hello@beekal.com>"
MAIL_REPLY_TO=shakil@beekal.com

# --- AI (port: openai-compatible | anthropic | ollama) ---
AI_DRIVER=none                           # off until a feature needs it
AI_API_KEY=
AI_MODEL=

# --- Observability ---
LOG_LEVEL=info
OTEL_EXPORTER_OTLP_ENDPOINT=
SENTRY_DSN=

# --- Security ---
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
CORS_ORIGINS=https://beekal.com
```

`AI_DRIVER=none` is deliberate. Master prompt section 17: do not add AI because it
is fashionable. The port exists; the adapter stays off until a feature justifies it.

---

## 8. Testing strategy

| Level         | Tool                        | Covers                                                                    | Target                      |
| ------------- | --------------------------- | ------------------------------------------------------------------------- | --------------------------- |
| Unit          | Vitest                      | Domain logic, scoring, policy evaluation, formatters                      | 90% on `domain/`            |
| Integration   | Vitest plus Testcontainers  | Repositories, use cases against real Postgres                             | Every use case              |
| Contract      | Zod schema round-trips      | That both apps agree on every payload                                     | All contracts               |
| Component     | Vitest plus Testing Library | UI primitives, forms, the score tool                                      | Every interactive component |
| E2E           | Playwright                  | Lead submission, score completion, admin login, publish flow, RBAC denial | The critical paths          |
| Accessibility | axe-core in Playwright      | Every page, light and dark, 320px and 1920px                              | Zero violations             |
| Visual        | Playwright screenshots      | Key pages, both themes                                                    | No unreviewed diffs         |
| Performance   | Lighthouse CI               | Homepage, `/assessment`, one article                                      | See doc 05 budgets          |

**The RBAC denial test is not optional.** A permission system that has only ever
been tested by users who are allowed through is a permission system with unknown
behaviour. Every role gets a test asserting what it _cannot_ do.

`packages/testing` holds factories so a test can say `makeLead({ score: 80 })`
without knowing the shape of fourteen columns.

---

## 9. Decisions recorded, with their cost

| Decision                 | Cost accepted                          | Why it is worth it                                              |
| ------------------------ | -------------------------------------- | --------------------------------------------------------------- |
| Monorepo                 | More build tooling                     | Shared contracts eliminate a whole class of bug                 |
| NestJS                   | Ceremony, learning curve               | DI makes ports practical; structure is predictable              |
| Modular monolith         | Discipline required to keep boundaries | One deployment now, extractable later                           |
| Hexagonal domain         | More files per feature                 | Domain testable with no database; no-lock-in becomes mechanical |
| Content in Postgres      | Editor UI must be built                | The admin panel requirement demands it                          |
| Self-hosted everything   | Ops work is ours                       | The no-lock-in constraint                                       |
| Redis cache handler      | One more moving part                   | Multi-container ISR without a platform                          |
| Zod contracts everywhere | Schemas written once, deliberately     | Runtime validation and static types from one definition         |
| Audit on every mutation  | A little write overhead                | Multi-user admin without it is unaccountable                    |
| Outbox pattern           | A relay worker to run                  | Lost leads are unacceptable; at-least-once needs it             |
