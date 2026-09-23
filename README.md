<div align="center">
  <img src="brand/logos/beekal-horizontal-tagline.svg" alt="Beekal — Better Tomorrow" width="360">
</div>

# Beekal

> Better systems. Better work. Better tomorrow.

The website, admin panel and business spine for **Beekal**, a business technology
transformation company. Not a brochure site — a sales and qualification system.

---

## What this is

Three systems, built in this order:

1. **Public site** — turns a stranger with an operations problem into a qualified
   Business System Assessment request
2. **Admin panel** — multi-user, role-configurable; runs content and the funnel
   with no deploy
3. **Business spine** — the tables that later become the client portal

**Picking this up after a break?** Read [`ROADMAP.md`](ROADMAP.md) — it says what
is done, what is next and what is deliberately not being done yet.

Read [`docs/00-master-plan.md`](docs/00-master-plan.md) first. It is the source of
truth and it links to everything else.

## Stack

| Layer          | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router), React 19, Tailwind v4, TypeScript strict |
| Backend        | NestJS 11, Prisma 6, Postgres 16, Redis 7, BullMQ                 |
| Architecture   | Modular monolith, hexagonal modules, shared Zod contracts         |
| Infrastructure | Docker Compose, Caddy, MinIO, self-hosted analytics               |
| Repo           | Turborepo + pnpm workspaces                                       |

**Constraint: no vendor lock-in.** Every external capability sits behind a port we
own with a self-hosted default adapter. `docker compose up` on a bare Ubuntu box
must produce a fully working system. See
[`docs/00-master-plan.md`](docs/00-master-plan.md) section 3.

## Layout

```
apps/web/          Next.js — public site + /admin
apps/api/          NestJS — REST API + background workers
packages/
  contracts/       Zod schemas: the single source of truth for every payload
  ui/              shared React primitives
  config/          eslint, tsconfig, tailwind preset
  testing/         factories and fixtures
infra/             Docker, Caddy, ops scripts
brand/logos/       brand assets
legacy/            the original single-file demo — see legacy/README.md
docs/              the plan
```

## Documentation

| Doc                                                                   | Covers                                              |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| [00-master-plan.md](docs/00-master-plan.md)                           | Decisions, constraints, roadmap, definition of done |
| [01-strategy-offers-and-copy.md](docs/01-strategy-offers-and-copy.md) | Positioning, offer architecture, the copy system    |
| [02-information-architecture.md](docs/02-information-architecture.md) | Sitemap, page specs, content disposition            |
| [03-system-architecture.md](docs/03-system-architecture.md)           | Architectural, design and coding patterns           |
| [04-data-model-and-rbac.md](docs/04-data-model-and-rbac.md)           | Schema, the RBAC engine, admin panel                |
| [05-seo-performance-quality.md](docs/05-seo-performance-quality.md)   | SEO, performance budgets, a11y, security, ops       |
| [06-runbook.md](docs/06-runbook.md)                                   | Deploying, backups, restores, rollback              |
| [07-local-development.md](docs/07-local-development.md)               | Running it on your machine, and what bites          |
| [08-content-pipeline.md](docs/08-content-pipeline.md)                 | What is editable without a deploy, and the plan     |
| [brief/master-context.txt](docs/brief/master-context.txt)             | The original founder brief                          |

## Status

| Phase                       | State                                                    |
| --------------------------- | -------------------------------------------------------- |
| 0 — Foundation              | Done. `docker compose up` runs the full stack.           |
| 1 — Design system           | Done. Tokens, primitives and brand ported from the demo. |
| 2 — Public site             | Done. 31 pages; the lead form writes to Postgres.        |
| 3 — Backend and admin core  | Done. Auth, configurable RBAC, content and lead admin.   |
| 4 — Funnel instrumentation  | In progress.                                             |
| 5 — Content, copy and proof | Not started.                                             |
| 6 — Hardening and launch    | Not started.                                             |

Full roadmap in [`docs/00-master-plan.md`](docs/00-master-plan.md) section 8.

## Running it

```bash
cp .env.example .env          # then set SESSION_SECRET
pnpm install
pnpm docker:up                # postgres, redis, minio, api, web
```

The stack comes up on http://localhost:3000, the admin at `/admin`, the API on
:4000. Migrations and the seed run automatically before the API starts.

The seed prints a one-time setup link for the Owner account — there is no
default password anywhere.

---

Beekal · Dhaka, Bangladesh
