# Beekal — Master Plan

> Better systems. Better work. Better tomorrow.

This is the single source of truth for what we are building and why. Every other
document in `docs/` expands one section of this one. If a decision here conflicts
with something in a sub-document, this file wins until it is updated.

---

## 1. What we are actually building

Not a marketing website. Three things, in this order:

| # | System | Purpose | Who uses it |
|---|--------|---------|-------------|
| 1 | **Public site** | Turn a stranger with an operations problem into a qualified Assessment request | Prospects (CEO / MD / COO / Head of Ops / IT Manager) |
| 2 | **Admin panel** | Run the content, the funnel and the delivery pipeline without a deploy | Beekal staff, role-scoped |
| 3 | **Business spine** | The tables and workflows that later become the client portal and Beekal's own internal system | Beekal staff, then clients |

The master prompt (section 25) says Beekal must itself be highly systemized —
CRM, leads, discovery, assessments, proposals, contracts, projects, QA,
deployment, support, reporting. We are not building all of that now. We are
building #1 and #2 on a foundation that does not have to be thrown away when #3
arrives. That is the single most important architectural constraint.

---

## 2. Locked decisions

| Decision | Choice | Consequence |
|---|---|---|
| Repo shape | Turborepo monorepo: `apps/web` (Next.js) + `apps/api` (NestJS) | Shared contracts package; API survives the growth into a portal |
| Hosting | Self-hosted VPS, Docker Compose | Full control; we own the data |
| **Vendor lock-in** | **Forbidden** | See section 3 — a hard constraint, not a preference |
| Content storage | Postgres, edited in the admin panel | Editors publish without a deploy; makes the RBAC panel worth building |
| Language | English only at launch, i18n-ready schema | `locale` column plus `next-intl` routing from day one; Bangla later becomes a data-entry job, not a migration |
| Brand palette | Cobalt `#1F4FE0` / Amber `#FFB81C` / Navy `#0A1640` / White | See section 6 — resolves a conflict in the source material |
| Site shape | **Multi-page**, not the current single page | See section 5 — the biggest change from the demo |

---

## 3. The no-lock-in rule

"No vendor locking" rules out a long list of otherwise-convenient choices. Every
capability gets a **port** (an interface we own) and a **default self-hosted
adapter**. Swapping providers must be an env change plus one adapter file — never
a refactor.

| Capability | Default adapter (self-hosted) | Swappable to | What we must NOT use |
|---|---|---|---|
| Database | Postgres 16 in Compose | Any managed Postgres | Vendor-only extensions, Supabase client SDK |
| Cache / queue | Redis + BullMQ | Any Redis | Vercel KV, Upstash-only APIs |
| File storage | MinIO (S3 API) | S3, R2, Spaces, B2 | Vercel Blob, Firebase Storage |
| Email | SMTP via Nodemailer | Resend, SES, Postmark | Any provider SDK inside domain code |
| Auth | Our own sessions: Argon2id plus httpOnly cookies | — | Auth0, Clerk, hosted identity |
| Search | Postgres full-text (`tsvector`) | Meilisearch (also self-hosted) | Algolia |
| Analytics | Umami or Plausible, self-hosted | Any | Funnels we cannot export |
| Next.js caching | `output: 'standalone'` plus Redis cache handler | Any Node host | Vercel-only ISR behaviour, edge runtime |
| Images | `next/image` with the **sharp** loader | Any | Vercel image optimizer as the only path |
| Observability | pino to Loki/Grafana, OpenTelemetry SDK | Any OTLP backend | Vendor-only agents |

**Compliance test:** `docker compose up` on a bare Ubuntu box must produce a fully
working system. If a feature needs a SaaS account to function at all, it is built
wrong.

---

## 4. The strategy in one page

Derived from the 42-book library, dominated by the Hormozi `$100M` suite plus
Blue Ocean Strategy, The Personal MBA and Product Positioning. Full derivation in
[01-strategy-offers-and-copy.md](01-strategy-offers-and-copy.md).

**Positioning**

> For growing organisations whose people, processes and software have stopped
> working as one system, Beekal is the business technology transformation partner
> that diagnoses the operation before writing code — unlike software agencies,
> who sell build capacity for a problem nobody has defined yet.

**The money model** (four layers, from `$100M Money Models`)

```
  ATTRACTION          CORE                  UPSELL               CONTINUITY
  Maturity Score  ->  Business System   ->  Build / Modernize -> Beekal Care
  (free, instant)     Assessment            / Automate / AI      (monthly)
                      (paid, fixed)         (project)

  captures intent     de-risks the buy      the revenue          the compounding
  and the email       and proves skill      event                asset
```

The Assessment is the hinge. It is deliberately **paid** — a free consultation
signals that the diagnosis is worthless and attracts unqualified buyers. A paid
diagnostic converts an uncertain prospect into a defined opportunity while being
profitable on its own.

**The flywheel we are instrumenting**

```
great project -> measured result -> case study -> content -> trust
      ^                                                        |
      |                                                        v
  more work <- referral <- recurring client <- project <- assessment <- lead
```

Every arrow in that loop needs a table and an admin screen. That is why the data
model is larger than a marketing site needs.

---

## 5. The biggest change: one page becomes a site

The demo is a single 1,959-line page. It is well built, but it has two problems
the user already named — *"the demo contains so many text"* — and one they did
not:

1. **Density.** Everything competes for the same scroll. A COO who wants to know
   what the Assessment costs must scroll past five case studies.
2. **SEO ceiling.** One URL can rank for one intent cluster. Beekal needs to rank
   for *legacy software modernization*, *business process automation*, *ERP
   replacement* and *AI for business operations* — four different search intents,
   each deserving its own indexable page with its own structured data.

So the homepage becomes a **hub that qualifies and routes**, and the long-form
content moves to real pages that can rank and can be linked from a proposal.
Nothing is deleted — it is relocated and given a word budget. Full mapping in
[02-information-architecture.md](02-information-architecture.md).

The demo's engineering — the token system, the dark theme, the hero animation,
the radar chart, the accessibility work — is **kept and ported**, not rewritten.
It is the design system's first draft and it is good.

---

## 6. Conflicts in the source material, and how they are resolved

Three inputs contradict each other. Decisions taken, flagged here so they can be
overruled deliberately rather than by accident.

| Conflict | Resolution | Why |
|---|---|---|
| The master prompt names **teal/cyan** in the palette. Both the logo SVGs and the demo use cobalt, amber and navy, with no teal anywhere. | **Ship cobalt/amber/navy.** Teal is dropped. | The shipped assets have already converged and are contrast-verified. A third hue now weakens the mark. Revisit only if a named use case needs it. |
| The demo's case studies are labelled *"Example scenario"* and describe unnamed clients. | **Keep the label, verbatim, until a real client signs off.** Add an admin flag `is_illustrative` that renders the badge automatically. | Master prompt section 28: never invent client results. Making this a database flag means nobody can accidentally ship a fabricated case study. |
| The maturity score says *"Nothing is sent, no email required"* — honest, but it captures zero leads. | **Keep the score free and gate-free.** Add an optional *"email me the full report as a PDF"* step **after** the result is shown. | `$100M Leads`: give the value first, then ask. Gating it would contradict a promise already on the page and would cut completion sharply. |

Contact details in the demo (`shakil@beekal.com`, Dhaka, founder-led reply within
one working day) are treated as real and carried forward.

---

## 7. Open TODOs the demo already flagged

Content decisions only the founder can make. Every one becomes an admin field so
it is editable without a deploy — none of them blocks the build.

- [ ] Confirm the live domain (`www` vs apex) — affects canonical and hreflang
- [ ] Assessment price or range — currently "Fixed, agreed first"
- [ ] A real founder photo to replace the `SM` initials avatar
- [ ] The founder bio, in the founder's own words rather than a draft
- [ ] WhatsApp number (markup is already written and commented out)
- [ ] An `og:image` at 1200x630
- [ ] Legal entity name and registration number, if registered — raises trust with larger buyers

---

## 8. Roadmap

Sequenced so something is demonstrable at the end of every phase, and so the
highest-risk work (RBAC, content modelling) happens before the cosmetic work.

### Phase 0 — Foundation (est. 2–3 days)

Monorepo, Docker Compose, Postgres plus Prisma, NestJS skeleton with the module
structure, Next.js skeleton, the `contracts` package, CI running lint, typecheck
and tests.
**Exit:** `docker compose up` serves a styled placeholder on `:3000` and a healthy
`/api/health` on `:4000`.

### Phase 1 — Design system (est. 2–3 days)

Port the demo's tokens to Tailwind config, rebuild the primitives as typed React
components, Storybook, dark mode with no flash, the logo as an SVG sprite.
**Exit:** every visual primitive on the demo page exists as a component with a story.

### Phase 2 — Public site, static content (est. 4–5 days)

All pages from the IA, content still file-seeded. Hero animation, score tool,
radar, lead form wired to the real API.
**Exit:** the full site is navigable and the lead form writes a row to Postgres.

### Phase 3 — Backend and admin core (est. 5–7 days)

Auth, the configurable RBAC engine, audit log, user and role management, content
CRUD for every entity, media library on MinIO, the lead inbox.
**Exit:** an Editor account can change homepage copy and publish a case study with
no developer involved.

### Phase 4 — Funnel instrumentation (est. 3–4 days)

UTM capture, score submissions persisted, lead scoring and routing, email
notifications through the SMTP port, CRM pipeline stages, the resource gate,
self-hosted analytics.
**Exit:** a lead's whole path is visible in the admin.

### Phase 5 — Content, copy and proof (est. 4–5 days)

The copy rewrite executed against the word budgets, the resource library, the
first articles, structured data, the full SEO pass.
**Exit:** copy is final and Lighthouse targets are met on real content.

### Phase 6 — Hardening and launch (est. 3–4 days)

Security review, rate limiting, backups with a **tested restore**, monitoring and
alerting, load check, accessibility audit, launch runbook.
**Exit:** live.

**Deliberately deferred:** the client portal, proposal generation, invoicing, Care
ticketing, multi-tenant product experiments, Bangla content. Each has a seat
reserved in the data model and none is built until a paying customer needs it.
Master prompt section 28: do not build a huge internal platform before demand exists.

---

## 9. What "done" means

The site is not finished when it looks good. It is finished when these are true:

1. A visitor who does not know what Beekal does understands it in **8 seconds**.
2. A visitor can self-identify by **problem**, never by technology.
3. Booking an Assessment takes **two clicks** from anywhere on the site.
4. An Editor can publish a case study with **no developer involved**.
5. Roles and permissions are changed **in the UI**, not in code.
6. Lighthouse at or above 95 across the board on a mid-tier Android over 4G.
7. Zero axe violations in light and dark, at 320px and 1920px.
8. The entire stack runs on one VPS with `docker compose up`.
9. Every published claim is either true or visibly labelled illustrative.

---

## Index

| Doc | Covers |
|---|---|
| [01-strategy-offers-and-copy.md](01-strategy-offers-and-copy.md) | Book-derived strategy, offer architecture, the copy system, word budgets |
| [02-information-architecture.md](02-information-architecture.md) | Sitemap, page-by-page specs, where every line of demo text goes |
| [03-system-architecture.md](03-system-architecture.md) | Monorepo, architectural, design and coding patterns, both apps |
| [04-data-model-and-rbac.md](04-data-model-and-rbac.md) | Postgres schema, the configurable RBAC engine, admin panel spec |
| [05-seo-performance-quality.md](05-seo-performance-quality.md) | SEO, Core Web Vitals budgets, accessibility, testing, security, ops |
