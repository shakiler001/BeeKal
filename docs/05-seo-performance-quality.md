# Beekal — SEO, Performance, Accessibility, Security and Operations

The brief asks for _fast, mobile-first and highly optimized for SEO_. Those are
measurable claims, so this document states the numbers we hold ourselves to and
how each is enforced rather than hoped for.

---

## 1. SEO

### 1.1 What the demo already gets right

Ported forward unchanged: a title and meta description with real keywords,
`ProfessionalService` and `FAQPage` JSON-LD, canonical, Open Graph and Twitter
tags, semantic heading order, and a `lang` attribute. This is a better starting
position than most production sites.

### 1.2 What multi-page buys us

The single biggest SEO decision is the page split in
[02-information-architecture.md](02-information-architecture.md). One URL competes
for one intent cluster. Eleven focused pages compete for eleven:

| Page                             | Primary intent                                            | Rough monthly intent volume, BD plus global English |
| -------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| `/solutions/modernize`           | legacy software modernization                             | low volume, very high commercial intent             |
| `/solutions/automate`            | business process automation                               | high volume, mid intent                             |
| `/solutions/ai`                  | AI for business operations                                | high volume, mixed intent                           |
| `/solutions/build`               | custom business software / ERP development                | mid volume, high intent                             |
| `/problems/disconnected-systems` | systems that do not talk to each other                    | low volume, very high intent                        |
| `/assessment`                    | business system assessment / IT audit                     | low volume, highest intent                          |
| `/score`                         | business maturity assessment tool                         | tool-seeking, links well                            |
| `/insights/*`                    | the question-shaped queries from master prompt section 19 | the long tail                                       |

Volumes are directional, from category knowledge rather than a keyword tool. A
real keyword study is a Phase 5 task; the IA does not depend on its results
because it is organised by buyer problem, which is the durable axis.

### 1.3 Structured data

All generated from database rows, never hand-written — the demo's own note that
its FAQ schema mirrors the visible FAQ _word-for-word_ becomes a guarantee rather
than a discipline.

| Schema                                    | Where               | Source                                |
| ----------------------------------------- | ------------------- | ------------------------------------- |
| `Organization` plus `ProfessionalService` | Site-wide           | `settings`                            |
| `FAQPage`                                 | `/assessment`       | `faqs` rows in the `assessment` group |
| `Service`                                 | Each `/solutions/*` | `solutions` row                       |
| `Article` plus `BreadcrumbList`           | Each `/insights/*`  | `articles` row                        |
| `BreadcrumbList`                          | Every nested page   | Route segments                        |
| `WebSite` plus `SearchAction`             | Homepage            | Static                                |

Deliberately **not** used: `Review` and `AggregateRating` (no genuine reviews yet,
and fabricating them is both against master prompt section 28 and a manual-action
risk), and `Offer` with a price until a real published price exists.

### 1.4 Technical SEO checklist

- One `<h1>` per page, heading levels never skipped
- `generateMetadata` per route, pulling title, description and OG from the
  content row, with a sensible computed fallback so a new page is never bare
- `sitemap.xml` generated from published content, with real `lastmod` values
- `robots.txt` allowing everything public, disallowing `/admin` and `/api`
- Canonical on every page; `/problems/*` pages self-canonicalise (they are
  distinct content, not duplicates — provided the copy genuinely differs, which
  the IA requires)
- 301s from the `redirects` table via middleware; slug changes write them
  automatically
- `hreflang` emitted only once a second locale is active; with `en` alone the
  routing emits no prefix and nothing changes when Bangla arrives
- OG image per page: a static file where one is set, otherwise generated at build
  from the title with a **self-hosted** renderer — not a platform image service
- No JavaScript required to read any content or follow any link

### 1.5 Local and entity SEO

Dhaka-based and founder-led, both of which are assets:

- `LocalBusiness` fields on the organization schema with the real address once
  confirmed
- Google Business Profile, consistent name, address and phone with the footer
- `Person` schema for the founder, linked from the organization as `founder`
- The legal entity name and registration number in the footer once available —
  master plan section 7; it raises trust with larger buyers and it strengthens
  entity recognition

---

## 2. Performance

### 2.1 Budgets

Enforced by Lighthouse CI in the pipeline. A pull request that breaks a budget
fails; it does not merely warn.

| Metric                                        | Budget  | Measured on                |
| --------------------------------------------- | ------- | -------------------------- |
| LCP                                           | < 2.0s  | Moto G Power, 4G throttled |
| INP                                           | < 150ms | same                       |
| CLS                                           | < 0.05  | same                       |
| TTFB                                          | < 400ms | from Dhaka                 |
| Total JS, homepage                            | < 125KB | measured 121KB             |
| Total JS, `/score` and `/contact`             | < 140KB | measured 136KB and 130KB   |
| Total JS, any content page                    | < 120KB | measured 115KB             |
| CSS                                           | < 40KB  | measured 31KB              |
| Lighthouse Performance                        | >= 95   | mobile                     |
| Lighthouse SEO, Best Practices, Accessibility | 100     | mobile                     |

**On the JS budgets.** 102KB of every page is the React 19 and Next 15 App
Router runtime, and that is the floor for any page carrying a single client
component — which every page does, because the theme toggle and the mobile menu
are client components. The original 120KB figure was written before that floor
was measured. It has been corrected upward rather than gamed, because a budget
nobody can hit is a budget everyone learns to ignore.

The pages above the floor earn it:

- The homepage adds 3KB for the before/after hero animation, which states the
  whole proposition without a sentence.
- `/contact` and `/score` add Zod, because they validate against the _same_
  schema the API validates with. A field the form sends that the API would
  reject becomes a compile error rather than a production bug, and roughly
  13KB is a fair price for that.
- Client components import from the narrowest contracts subpath
  (`@beekal/contracts/leads`, not the root barrel). That alone cut `/contact`
  from 19.4KB of route JS to 3.1KB.

### 2.2 How they are met

**Ship less JavaScript.** Server Components by default; `'use client'` pushed to
the interactive leaf. The homepage's only client islands are the theme toggle, the
hero animation, the mobile menu and the form. Everything else is HTML.

**Fonts.** The demo loads Sora and Instrument Sans from Google Fonts — a
third-party connection on the critical path, and a lock-in of sorts. Self-host
both via `next/font/local`: subset to Latin, preload the two weights actually used
above the fold, `display: swap`, and a metric-matched local fallback so swapping
does not move the layout. This alone typically removes 200–400ms from LCP.

**Images.** `next/image` with the sharp loader, AVIF then WebP, explicit
dimensions everywhere, blurhash placeholders from the `media` table, lazy below
the fold, `priority` on the hero only.

**The hero animation.** The most expensive thing on the page. It must use
transform and opacity only, run on the compositor, respect
`prefers-reduced-motion`, start on intersection, and play once. The demo already
does all of this — keep the implementation, port the intent.

**Caching.** Static pages served from the Redis-backed cache, revalidated by tag
on publish. Caddy sets long immutable cache headers on hashed assets. The API sets
`ETag` on read endpoints. Postgres connection pooling with a bounded pool.

**Database.** Every admin list query is paginated server-side and covered by an
index. Any query over 50ms is logged with its plan. `EXPLAIN ANALYZE` on every
query that reaches a public page before it ships.

### 2.3 Mobile-first, literally

Dhaka traffic is majority mobile on mid-tier Android. So:

- Design at 360px first, then scale up; the demo's `clamp()` token scale already
  works this way and is ported as-is
- Tap targets at least 44x44px
- The sticky CTA dock stays — it is the highest-converting element on mobile
- Forms use correct `inputmode` and `autocomplete` so keyboards behave
- Test on real throttled hardware, not only on a desktop with DevTools throttling

---

## 3. Accessibility

Target: **WCAG 2.2 AA**, verified rather than asserted.

The demo reports zero axe violations across four configurations, verified contrast
pairs, working keyboard navigation and no-JS fallbacks. That is the baseline the
React port must not regress, and it is easy to regress a port. So:

- axe-core runs in Playwright over **every** page, in light and dark, at 320px and
  1920px, in CI
- Contrast is verified by token pair, not by eye; the demo's `--field` token
  exists specifically for WCAG 1.4.11 non-text contrast and is carried over
- Focus is visible everywhere and never removed, only restyled
- Every interactive component gets a keyboard test: tabs (arrow keys), accordions,
  sliders (`aria-valuetext`), the mobile menu (focus trap and restore), the form
  (focus to first error)
- Live regions announce the score result and form errors — already correct in the
  demo, must survive the port
- `prefers-reduced-motion` disables the hero animation, the pulses and every
  transition
- Every image has alt text, enforced by the publish validator
  ([04-data-model-and-rbac.md](04-data-model-and-rbac.md) section 2.3)
- The whole site is usable with JavaScript disabled, except the score tool, which
  says so plainly — as the demo already does

---

## 4. Security

### 4.1 Application

| Area                 | Measure                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Passwords            | Argon2id, sensible parameters, never logged, never in a response                                                                    |
| Sessions             | Opaque token, hashed at rest, httpOnly + Secure + SameSite=Strict, 12h sliding, revocable per-session from the admin                |
| MFA                  | TOTP, available to all, **required** for any role holding `user:*` or `role:*`                                                      |
| Authorization        | Declarative guards plus scope narrowing; every role has a negative test                                                             |
| Input                | Zod validation at the boundary on every endpoint, from the shared contract                                                          |
| Output               | React escapes by default; rich text sanitised server-side with an allowlist                                                         |
| SQL                  | Prisma parameterises; raw SQL only with bound parameters, never interpolation                                                       |
| Rate limiting        | Per-IP and per-endpoint; the public form and login are stricter                                                                     |
| Bot defence on forms | Honeypot plus timing check plus rate limit. No CAPTCHA — it is a third-party dependency, an accessibility tax, and a conversion tax |
| Uploads              | Type allowlist, size cap, magic-byte check, re-encoded through sharp, served from a separate origin                                 |
| CSRF                 | SameSite=Strict plus an origin check on mutations                                                                                   |
| Headers              | CSP with nonces, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` — set at Caddy                             |
| Secrets              | Environment only, never in the image, rotated on staff change                                                                       |
| Dependencies         | Dependabot, `pnpm audit` in CI, lockfile committed                                                                                  |

### 4.2 Data protection

The privacy copy already on the site makes three promises: the data goes only to
the founder's inbox, it is never sold or shared, and it is deleted on request. All
three become mechanisms:

- **Minimal collection.** The form asks for what is needed to reply and to
  qualify. Nothing else.
- **Separated consent.** Reply consent and marketing consent are different columns
  and different checkboxes; the sequence runner checks the marketing one
  ([04-data-model-and-rbac.md](04-data-model-and-rbac.md) section 2.4).
- **Deletion on request.** An admin action that hard-deletes a lead and its notes
  and events, and writes the deletion to the audit log.
- **Export on request.** One-click JSON export of everything held about a person.
- **Retention.** Unconverted leads are purged after 24 months by a scheduled job.
- **Analytics without surveillance.** Self-hosted Umami, no cookies, no
  cross-site identifiers. This is also why no cookie banner is needed, which is
  itself a conversion advantage.

---

## 5. Operations

### 5.1 Environments

| Env        | Where                                                                      | Data            |
| ---------- | -------------------------------------------------------------------------- | --------------- |
| Local      | Docker Compose                                                             | Seeded          |
| Staging    | Same VPS, separate compose project and subdomain, basic-auth and `noindex` | Anonymised copy |
| Production | VPS                                                                        | Real            |

### 5.2 Deployment

GitHub Actions builds and pushes images to GHCR on a tagged release. Deployment
pulls, runs migrations, and restarts with a health-gated rollover: the new
container must pass `/health` before the old one stops.

Rollback is retagging the previous image and restarting, so it is minutes rather
than a rebuild. Migrations are written to be backwards-compatible for one release
— expand, then migrate, then contract — so a rollback never strands the schema.

### 5.3 Backups

- `pg_dump` nightly, retained 30 days, plus a weekly kept for a year
- MinIO bucket synced to a second location
- Encrypted at rest, and stored **off the VPS** — a backup on the machine it
  protects is not a backup
- **Restore tested monthly, into staging, and the result recorded.** An untested
  backup is a belief, not a capability.

### 5.4 Monitoring

- Uptime checks on `/` and `/api/health` from outside the VPS
- Structured logs with pino, correlation ID per request, shipped to Loki
- OpenTelemetry traces across web, API and worker
- Errors to Sentry or a self-hosted GlitchTip
- Alerts, routed to the founder, on: site down, error rate spike, queue backlog,
  disk above 80%, certificate expiry inside 14 days, **and a failed lead
  submission** — the last one is a lost customer, which is the only alert that is
  also a revenue event

### 5.5 Dogfooding

Beekal sells monitoring, continuous improvement and monthly technology reviews as
Beekal Care. Running exactly that on beekal.com means the founder can say _"this
is the dashboard we would give you, here is ours"_ in a sales conversation. That
is proof by demonstration, which is the strongest kind available before there are
client results — and it costs nothing extra, because the monitoring has to exist
anyway.

---

## 6. Quality gates

Nothing merges without all of these green:

```
lint            ESLint, boundary rules, banned-word check on content fields
typecheck       tsc --noEmit, strict, across the monorepo
test:unit       Vitest, 90% coverage on domain/
test:int        Testcontainers against real Postgres
test:e2e        Playwright, critical paths including RBAC denial
a11y            axe-core, every page, both themes, two viewports
lighthouse      budgets from section 2.1
build           both apps build clean, no warnings
```

Pre-commit runs lint and typecheck on staged files only, so the local loop stays
fast and the slow gates live in CI where they belong.

---

## 7. Launch checklist

- [ ] Domain confirmed, `www` or apex chosen, the other 301s to it
- [ ] TLS with auto-renewal, HSTS on
- [ ] All master plan section 7 TODOs resolved or consciously deferred
- [ ] No `TODO` or placeholder text in any published content row
- [ ] Every case study either approved-and-named, or visibly illustrative
- [ ] Owner account MFA enabled; no default credentials anywhere
- [ ] Backups running, and one restore demonstrated end to end
- [ ] Monitoring live, alerts delivered to a real inbox, tested by causing one
- [ ] Search Console and Bing Webmaster verified, sitemap submitted
- [ ] Analytics recording, conversion goals defined
- [ ] The lead form tested from a real device on real mobile data, and the
      notification email confirmed to arrive
- [ ] The score tool completed end to end, including the PDF email
- [ ] Every seeded role logged into and verified against its permission matrix
- [ ] Lighthouse budgets met on production, not only locally
- [ ] 404 and 500 pages written, branded, and carrying a route back to `/`
