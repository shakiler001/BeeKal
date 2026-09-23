# Decision Log

Architectural decisions, each with what it cost. A decision recorded without
its cost is an opinion; recorded with one, it can be argued against on the
evidence.

Read this before proposing to change an architectural choice.

**Status values:** Active · Superseded · Withdrawn

---

## DEC-01 — Modular monolith, not microservices

**Status:** Active · Phase 0

**Decision.** One deployable API, internally divided into modules with enforced
boundaries, each structured as ports and adapters.

**Alternatives.** Microservices — wrong at this size; a team of one to three
would spend its budget on network boundaries and deployment topology rather
than the product. A layered monolith — cheapest to start and it always rots the
same way, with `services/` becoming one mutually-dependent mass.

**Cost.** Discipline. The boundaries must be enforced or they erode, which is
why they are lint rules ([INV-12](01-invariants.md#inv-12--module-boundaries-hold))
rather than documentation.

**Bought.** The seams. The brief says Beekal will grow its own CRM, assessment
and delivery systems, and that repeated solutions should become products. Both
need extraction later. Seams now cost days; adding them later costs months.

---

## DEC-02 — No vendor lock-in, as a hard constraint

**Status:** Active · Phase 0

**Decision.** Every external capability sits behind a port we own, with a
self-hosted default adapter. Compliance test: `docker compose up` on a bare
Ubuntu box produces a working system.

**Cost.** Ops work is ours. MinIO instead of S3, our own sessions instead of
Auth0, Postgres full-text instead of Algolia, self-hosted Umami instead of GA.
Each is slightly more setup than the managed equivalent.

**Bought.** Beekal sells "we make your systems coherent and you own them". A
company that says that while running on someone else's platform is selling
something it does not practise. It also makes the stack portable between VPS
providers, which was the user's explicit requirement.

---

## DEC-03 — Roles are data, permissions are code

**Status:** Active · Phase 3

**Decision.** A fixed permission catalog in code; roles as database rows created
in the UI; a scope modifier for row-level narrowing.

**Alternative.** A `users.role` enum — what most projects ship. It fails on the
first real request, because a new role becomes a migration.

**Cost.** An admin UI had to be built, and permission resolution is more code
than an enum comparison.

**Bought.** The literal requirement. Verified by creating a role with five
permissions against the running API, with zero code changes.

---

## DEC-04 — The single page becomes a site

**Status:** Active · Phase 2

**Decision.** The demo's one 1,959-line page became 41 routes. The homepage is a
router that qualifies and sends; long-form content lives on the pages it
belongs to.

**Cost.** More pages to maintain, and the homepage now has a word budget that
someone has to respect.

**Bought.** Two things. The stated problem — too much text competing on one
scroll. And the unstated one: a single URL can rank for a single intent
cluster, while Beekal needs to rank for legacy modernization, process
automation, ERP replacement and AI for operations, which are four different
buyers searching four different things.

---

## DEC-05 — The demo is ported, not rewritten

**Status:** Active · Phase 1

**Decision.** The design tokens, dark theme, hero animation, radar chart,
accessibility work and copy were carried across as-is, with behaviour preserved
rather than reimagined.

**Cost.** Some inherited decisions we did not make ourselves, and the port took
longer than writing fresh components.

**Bought.** Contrast pairs already verified, a working `prefers-reduced-motion`
path, live regions in the right places, and no-JS fallbacks. That work is
easy to lose in a rewrite and expensive to redo.

**Evidence it was right.** The accessibility suite found only two contrast
bugs across 16 pages in both themes, and both were in code written fresh rather
than ported.

---

## DEC-06 — Plain-text transactional email

**Status:** Active · Phase 4

**Decision.** The founder notification and the lead acknowledgement are plain
text with no images, no tracking and no links to follow.

**Cost.** They look plain next to a designed template.

**Bought.** They look like a person wrote them, which is the entire promise the
site makes. An HTML template with a logo and a gradient would make the reply
read as marketing on the very first interaction.

---

## DEC-07 — The maturity score stays free and ungated

**Status:** Active · Phase 4

**Decision.** No email required to see a result. The ask comes after, in trade
for a report that genuinely contains more.

**Alternative.** Gate it. Standard practice, and it would capture more
addresses.

**Cost.** Fewer captured emails.

**Bought.** The page says "no email required". Gating it would break a promise
printed on the same screen, and a tool that promises and then asks trains
people to distrust the next thing. Give value first, then ask.

---

## DEC-08 — No money-back guarantee on the Assessment

**Status:** Active · Phase 1 (strategy)

**Decision.** Three risk-reversal lines, all defensible today. No guarantee.

**Why.** With no delivered track record, a guarantee reads as compensation for
doubt. The three existing lines — no obligation to build with us, the documents
are yours, we will say if an assessment is wrong for you — are stronger because
they are already true.

**Revisit.** After five completed Assessments.

---

## DEC-09 — `typedRoutes` disabled

**Status:** Active · Phase 2

**Decision.** Next's typed routes are off.

**Why.** From Phase 3 the content lives in Postgres, so slugs are runtime
values no compile-time check can validate. Keeping it would mean casting every
data-driven href, which removes the safety while adding noise.

**Cost.** A typo in a static route is not caught at compile time.

**Mitigation.** Link integrity is covered by the E2E crawl instead.

---

## DEC-10 — Contracts ship a dual CJS/ESM build

**Status:** Active · Phase 1

**Decision.** `@beekal/contracts` builds to both formats via tsup rather than
shipping raw TypeScript.

**Why.** The API is CommonJS because NestJS decorators need it; the web app is
ESM. Shipping raw TypeScript worked only while every import was type-only, and
broke the moment a Zod schema was used as a runtime value.

**Cost.** A build step on a package that previously had none.

---

## DEC-11 — The auth guard belongs to the access module

**Status:** Active · Phase 3

**Decision.** `AuthGuard` lives in `modules/access/http/`, and token crypto
lives in `shared/crypto/`.

**Why.** The lint boundaries caught the guard importing across two modules. The
guard _is_ access control, so it belongs to that module. Token crypto is needed
by identity (which issues tokens) and access (which verifies them), so neither
owns it and it belongs in `shared`.

**Notable.** The rule caught a real design mistake rather than merely enforcing
a convention. The response was to fix the structure, not to weaken the rule.

---

## DEC-12 — Standalone output only in Docker

**Status:** Active · Phase 1

**Decision.** `output: 'standalone'` is enabled by `BUILD_STANDALONE=1`, set
only in the web Dockerfile.

**Why.** Standalone traces dependencies by symlink, which Windows refuses
without Developer Mode. A local build does not need it.

**Cost.** One more environment variable, and the local build differs slightly
from the image.

---

## DEC-13 — The JS budget was raised rather than met

**Status:** Active · Phase 5

**Decision.** The homepage budget moved from 120KB to 125KB. It measures 121KB.

**Why.** The original figure was written before the floor was measured. 102KB
of every page is the React 19 and Next 15 runtime, irreducible for any page
carrying a client component — and every page does, because the theme toggle is
one.

**Alternative rejected.** Chase the last kilobyte, or quietly pass.

**Reasoning.** A budget nobody can hit is a budget everyone learns to ignore.
The honest move is to record the floor and state what each page above it buys.

---

## DEC-14 — CI builds one image per runner

**Status:** Active · Phase 6 (revised after run #11)

**Decision.** The docker job uses a matrix, reclaims the runner's unused
toolchains, and caches at `mode=min`.

**Why.** Two images in sequence on one runner exhausted the ~14GB free: the API
built, web failed immediately after.

**Correction.** This was the right fix for a real problem but it was _not_ the
cause of the web image failure. See [DEC-15](#dec-15--empty-directories-are-tracked-explicitly).
Diagnosing from a symptom pattern rather than a log produced a plausible theory
that turned out to be incomplete.

---

## DEC-15 — Empty directories are tracked explicitly

**Status:** Active · Phase 6

**Decision.** `apps/web/public` carries a `.gitkeep`, and
`infra/scripts/check-docker-paths.sh` fails the build when a Dockerfile
references a path that exists locally but is untracked.

**Why.** The directory was created empty, git does not track empty
directories, and the web Dockerfile copies it. The image built on every
developer machine and failed on every runner. The Dockerfile was correct; the
repository was missing a directory that only appeared to exist.

**Cost.** One more CI step, a few seconds.

**Bought.** A whole class of bug — builds locally, fails in CI, and the
Dockerfile looks right in review — now fails in seconds with the path named.

**Lesson recorded.** Two runs were spent on a theory built from the symptom
pattern because job logs need admin rights and were unreadable. Reproducing
against a fresh `git archive` found it in one step. Reproduce from a clean
checkout before theorising.

---

## DEC-16 — Unverifiable identity means signed out

**Status:** Active · Phase 6

**Decision.** In the admin, a 401, 403, 404 or unreachable API all redirect to
login. A 5xx reaches the error boundary.

**Why.** Showing an error page to someone not signed in leaks that an admin
exists and helps them not at all. But an administrator mid-task deserves to
know the difference between "sign in again" and "something is broken".

**Cost.** A brief API outage looks like a logout to an administrator.

**Found by.** The E2E suite, run the way CI runs it — with no API. The original
code only redirected on 401/403, so a connection failure rendered a framework
error page.
