# Beekal — Working TODO

This is the execution checklist for the next coding sessions. It supplements
`ROADMAP.md`: the roadmap records product order and shipped state; this file
records the business context, implementation scope, verification, and handoff
details needed to do the next work correctly.

Last reviewed: 2026-09-25. `ROADMAP.md` remains the source of truth for
priority and shipped state; this file is the detailed execution checklist.
Current work is on `codex/step6-resource-home-fidelity`; `main` remains at
`e96d40a`.

---

## 1. Context to preserve

### What Beekal sells

Beekal is a **business technology transformation company**, not a generic
software agency. It does not lead with developers, hours, frameworks, websites,
or a long service list. It sells a better-operating business.

Positioning:

> For growing organisations whose people, processes and software have stopped
> working as one system, Beekal diagnoses the operation before writing code.

The line that must survive rewrites:

> We build the business behind the business.

The ideal buyer is a founder, CEO, MD, COO, Head of Operations, or IT leader in
a growing organisation that has outgrown spreadsheets, WhatsApp coordination,
manual reporting, disconnected systems, repeated data entry, or legacy
software. Copy starts with their operational problem; technology appears only
when it helps explain the answer.

### The `$100M` offer ladder

The website supports one connected money model:

1. **Attraction — Business System Maturity Score**
   - Free, instant, and ungated.
   - Solves the narrow problem completely: the visitor learns their level,
     weakest dimensions, and where to look first.
   - The email ask comes only after the result, in exchange for a genuinely
     fuller report.
2. **Core — Business System Assessment**
   - Paid, fixed-scope diagnostic; never disguised as a free sales call.
   - The buyer receives eleven useful documents, a prioritised roadmap, and an
     investment-level view even if Beekal never builds the solution.
   - Value is raised through a clearer outcome, visible method, early signal,
     low client effort, and honest risk reversal—not artificial urgency.
3. **Upsell — Build / Modernize / Automate / AI**
   - Presented as business outcomes, not technologies.
   - Most projects should begin with the Assessment.
4. **Continuity — Beekal Care**
   - Continuous technology improvement, not “maintenance.”
   - This is the recurring-revenue layer and should produce a visible monthly
     review or improvement artefact.

The acquisition paths are the `$100M Leads` Core Four:

- Warm outreach needs sendable solution pages.
- Cold outreach and ads need problem-specific landing pages.
- Warm content needs publishable articles/resources and contextual CTAs.
- Paid traffic needs trustworthy UTM attribution through to the lead record.

### Method and proof

The operating method is:

> UNDERSTAND → SIMPLIFY → SYSTEMIZE → AUTOMATE → IMPROVE

Do not jump to building before the business, users, process, data, bottlenecks,
and unnecessary complexity are understood.

Beekal does not yet have a large proof library. Until real clients approve
named results, proof comes from:

- a demonstrated method;
- useful tools and sample deliverables;
- specific founder-led communication;
- case studies visibly labelled “Example scenario”;
- honest lessons about what would be done differently.

Never fabricate proof. The case-study integrity rule is enforced in the
database and must remain structural.

### Voice and conversion rules

- Sound like a senior operator: direct, concrete, calm, and specific.
- Use business language before technical language.
- Prefer numbers and observable situations over adjectives.
- Every claim must be checkable or visibly labelled.
- No fake scarcity, countdowns, pressure tactics, invented metrics, or generic
  “leading software company” language.
- Match the CTA to intent:
  - Cold: **Score your business in 2 minutes**
  - Warm: **Describe your problem**
  - Hot: **Request an assessment**
  - Not ready: **Get the checklist/resource**
- Never use “Submit” or an unexplained “Learn more.”
- Contact consent and marketing consent stay separate and unticked by default.

---

## 2. Product and technical context

- `apps/web`: Next.js public site, admin panel, and browser-facing BFF routes.
- `apps/api`: NestJS modular monolith with Prisma and PostgreSQL.
- `packages/contracts`: shared Zod contracts used by both applications.
- Browser → Next.js → NestJS → PostgreSQL. The browser never holds an API
  credential.
- Roles are configurable database records; permissions are a closed code
  catalog because every permission must have a real enforcement point.
- Public marketing pages are cacheable, database-backed, and revalidated by
  content tag. Repository content is the outage/build-time fallback.
- Admin pages are dynamic, `no-store`, `noindex`, and permission-shaped.
- Mutations are audited. Content deletion is soft. Suspension immediately
  revokes live sessions. The last active Owner cannot be removed, suspended,
  or demoted.
- Publishing is distinct from editing. Public queries return published rows
  only.
- The legacy HTML remains the behavioral reference for accessibility, theme,
  hero animation, score interaction, validation, reduced motion, and no-JS
  fallbacks.
- Preserve the cobalt/amber/navy brand, Sora/Instrument Sans typography, and
  theme-aware inline SVG logo system.

Source priority when records disagree:

1. Current code and tests
2. `ROADMAP.md`
3. `docs/08-content-pipeline.md`
4. Logic Library rules
5. Older planning documents for intent

Some older status prose is stale after the recent content-pipeline commits.
Update it when the related implementation is touched; do not use it to undo
working database-backed content.

---

## 3. Current handoff

- Branch: `codex/step6-resource-home-fidelity`; `main` remains at `e96d40a`.
- Step 6's initial implementation is pushed as `0634546`; final Step 6 and
  Step 7 changes are complete on this branch.
- Content-pipeline Steps 1–7 are implemented and browser-verified.
- The production build, API unit tests (109 passed), accessibility, and the
  cleanly exiting browser suite pass (100 passed, 4 credential-gated skips).
- A disposable Editor account completed the authenticated article/resource
  publishing walkthrough; its user and content records were removed.
- A disposable administrator completed the People invitation, role, suspension,
  deletion, and sign-out walkthrough; its users and role were removed.
- Next: P2/A1, the founder-reported admin chrome shift between screens.

---

## 4. Ordered work

### P0 — Verify Step 6 before building Step 7

- [x] Restore the lockfile-defined dependencies with pnpm.
- [x] Run `pnpm turbo build --filter=@beekal/web`.
- [x] Run the accessibility checks.
- [x] Run the browser suite with `E2E_BASE_URL=http://localhost:3000`.
- [x] Start the local stack and sign in as an account with article/resource
      create, update, and publish permissions.
- [x] Create a draft article using every supported block type.
- [x] Reopen the article and confirm text → blocks → text round-trips without
      rewriting content.
- [x] Publish it and confirm it appears on `/insights` and its detail route.
- [x] Edit and republish it; confirm `publishedAt` does not move.
- [x] Create and publish a resource with a valid file/external URL.
- [x] Confirm it appears on `/resources` and its gated/ungated behavior matches
      the saved value.
- [x] Confirm drafts remain absent from public routes and sitemap output.
- [x] Remove verification records after the walkthrough.
- [x] Fix failures before starting Step 7.

2026-09-25 verification note: the browser suite exits cleanly when pointed at
the existing Docker site (`$env:E2E_BASE_URL='http://localhost:3000'` then
`pnpm --filter @beekal/web exec playwright test --workers=2`). The separate
authenticated walkthrough found that article/resource update and delete
mistakenly checked the FAQ table; this is fixed and unit-tested. The disposable
Editor account and records were deleted. Existing Owner credentials were not
changed.

The paired Today/With Beekal rows and cobalt band are restored. A side-by-side
desktop comparison found the hero diagram and connector animation faithful to
the legacy HTML, with deliberate newer typography and spacing. Today/Tomorrow
interaction and reduced-motion state are covered by browser tests. Founder
visual review at desktop/mobile is still useful; preserve the deliberate
Today/Tomorrow labels from commit `bcebcd6`.

### P1 — Step 7: complete People management

Business reason: a configurable role system is incomplete if the founder still
needs a developer or database session to add a colleague or assign a role. A
second Owner is also the practical recovery path for account lockout.

#### Invitation and first-time setup

- [x] Replace the current email-as-setup-token behavior with a random,
      expiring, single-use invitation token.
- [x] Store only the token hash, never the raw invitation token.
- [x] Add a first-time password/setup page and its BFF route.
- [x] Deliver the invitation through the existing mail boundary, or
      provide a deliberately labelled local-development copy-link fallback.
- [x] Make expired, reused, missing, and already-completed invitations return
      safe, useful messages without revealing unrelated accounts.
- [x] Audit invitation creation and password setup without logging secrets.

#### User administration

- [x] Add `POST /api/admin/users` proxy route.
- [x] Add `PATCH` and `DELETE /api/admin/users/[id]` proxy routes.
- [x] Add an **Invite person** action gated by `user:create`.
- [x] Build an invite form for name, email, and one-or-more roles using shared
      contracts.
- [x] Make each user row open an editor/detail view.
- [x] Allow name and role assignment changes when `user:update` is present.
- [x] Allow suspension/reactivation with clear consequences.
- [x] Allow deletion only with explicit confirmation and `user:delete`.
- [x] Explain Owner protection before submission and render API refusals inline.
- [x] Prevent self-suspension and self-deletion in the UI as well as the API.
- [x] Show invited, active, and suspended states clearly.
- [x] Show last login and MFA state where useful, without making unfinished MFA
      controls look functional.
- [x] Refresh server-rendered data after successful mutations.

#### Finish the role workflow the documentation already promises

At the start of Step 7, the API supported role creation and deletion, but the
web app exposed only update/delete proxying and an edit screen.

- [x] Add the missing role-collection BFF route for creation.
- [x] Add **Create role** to People when `role:create` is present.
- [x] Reuse the permission matrix and plain-English summary for new roles.
- [x] Surface role deletion when `role:delete` is present.
- [x] Refuse protected/system roles and roles still assigned to users, showing
      the API’s reassignment guidance.
- [x] Decide whether seeded non-Owner system roles are intentionally deletable;
      make code, copy, and Logic Library agree.

#### Step 7 tests and acceptance

- [x] Unit-test invitation-token creation, hashing, expiry, and single use.
- [x] Test invite payload and user-update validation through shared contracts.
- [x] Test role assignment invalidates effective-permission caches.
- [x] Test suspension revokes live sessions immediately.
- [x] Test the last active Owner cannot be suspended, deleted, or demoted.
- [x] Test a user cannot suspend or delete themselves.
- [x] Test controls are absent—not merely disabled—without their permission.
- [x] Add authenticated browser coverage for invite → setup → login.
- [x] Add authenticated browser coverage for role assignment and suspension.
- [x] Verify the People workflow at tablet width and in both themes.
- [x] Run build, lint, typecheck, unit, accessibility, and E2E suites.
- [x] Update `ROADMAP.md`, `docs/08-content-pipeline.md`, and affected Logic
      Library entries in the same commit.

2026-09-26 verification: the disposable People browser flow passed end to end,
including role changes on an existing session, immediate suspension, custom
role deletion after user soft-delete, and revocation of the old session on
sign-out. The tablet header overflow and invalid `0.0.0.0` sign-out redirect
were fixed. The ordinary browser suite exited with 100 passed and four skipped
credential-gated entries. The authenticated content walkthrough passed again.
No temporary users, roles, content, or invitation URLs remain.

### P2 — A1: stabilise the admin chrome

Start only after Step 7, per the founder’s order recorded in `ROADMAP.md`.

- [ ] Reproduce the shift/flash and record viewport, route pair, and whether it
      occurs on client navigation, hard navigation, or both.
- [ ] Measure the header and content positions before and after navigation.
- [ ] Confirm the admin layout persists rather than remounting unexpectedly.
- [ ] Check active-nav width, scrollbar appearance, font loading, page-header
      height, and loading states as possible causes.
- [ ] Keep the topbar height and item positions stable across every admin page.
- [ ] Keep the current section visually obvious.
- [ ] Verify desktop, tablet, mobile menu, light theme, dark theme, keyboard
      navigation, and reduced motion.
- [ ] Add a regression test that compares chrome geometry across route changes.

---

## 5. Known later work — do not pull into the next step

- Media upload UI and image lifecycle
- Automatic redirect creation when a published slug changes
- Retry/queue behavior for leads submitted during an API outage
- Scheduled 24-month lead retention purge
- One-click personal-data export and deletion
- Redis-backed Next.js cache handler before running multiple web containers
- Score configuration editor
- Messaging templates and nurture-sequence administration
- Client portal, proposals, invoicing, Care ticketing, product experiments, and
  Bangla content until paying demand justifies them

These are real gaps, but they must not distract from Step 6 verification,
People management, and admin stability.

---

## 6. Founder inputs — useful but not blocking current engineering

- [ ] Choose canonical domain: apex or `www`.
- [ ] Provide the Assessment price or publishable range.
- [ ] Provide a real founder photograph and final bio.
- [ ] Provide WhatsApp number if it should appear.
- [ ] Provide LinkedIn URL if it should appear.
- [ ] Provide legal entity name and registration number when applicable.
- [ ] Approve or supply a 1200×630 social preview image.

Do not invent placeholder answers. Keep these editable as business settings or
content where the architecture already provides for that.

---

## 7. Completion rule for every task

A task is not done merely because code exists. It is done when:

- the real user journey works in a browser;
- permissions and failure paths behave correctly;
- accessibility and responsive behavior are verified;
- business claims remain honest;
- tests proportional to the risk pass;
- documentation no longer contradicts the implementation; and
- the change improves the path from operational problem → qualified lead →
  Assessment rather than adding technology for its own sake.
