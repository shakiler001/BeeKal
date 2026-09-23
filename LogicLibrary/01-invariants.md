# Invariants

Things that must never be false. Several are promises made in public copy on
beekal.com; those are enforced by the schema rather than by remembering, because
a promise that depends on memory is a promise that will eventually be broken.

Grades are defined in [README.md](README.md#enforcement-strength).

---

## INV-01 — A case study cannot claim to be real without an approved, named client

**Grade:** Structural

**Rule.** For every row in `case_studies`:

```
is_illustrative = true
  OR (client_approved = true AND client_name IS NOT NULL AND approved_at IS NOT NULL)
```

**Why.** The founding brief forbids inventing client results. Every case study
on the site today is a worked example, not a client outcome, and says so. The
risk is not malice — it is someone flipping a flag during a content edit and
nobody noticing that a hypothetical is now presented as a delivered result.

**Enforced at.** Database check constraint `case_study_real_requires_approval`
(migration `20260922192000_case_study_integrity`). Mirrored in the API by
`validateCaseStudyClaim()` and in the contracts by
`CaseStudyPublishableSchema`, so the UI can explain the rule before Postgres
rejects the write rather than after.

**Violation.** A case study on `/work` without the "Example scenario" badge,
describing a client who never approved it. Unreachable: the insert or update
is rejected by Postgres regardless of which code path attempts it — API bug,
bad import, or a direct `psql` session.

**Verified.** A direct SQL insert of an unapproved real case was rejected in
testing. The badge itself renders from the same flag, so the page and the truth
cannot drift apart.

---

## INV-02 — The last Owner cannot be removed, suspended, or demoted

**Grade:** Guarded

**Rule.** An operation is refused if it would leave zero `ACTIVE`, non-deleted
users holding a role where `is_owner = true`.

**Why.** Total lockout is unrecoverable without direct database access. This is
the only hard-coded access rule in a system where every other access decision
is data.

**Enforced at.** `checkOwnerProtection()` in
`apps/api/src/modules/access/domain/effective-permissions.ts`, called from
`UsersController.update` and `UsersController.remove`. Related: the Owner
**role** cannot be deleted or lose `role:update` / `user:update`
(`canEditRole()`).

**Violation.** Nobody can sign in to `/admin`, and no permission can be granted
to fix it.

**Limitation, stated honestly.** This prevents removal, not forgotten
passwords. If every Owner forgets their password there is currently no CLI to
reset it — recovery is a manual `UPDATE users SET password_hash = NULL`. See
[FAI-06](07-failure-modes.md#fai-06--every-owner-has-lost-their-password).

---

## INV-03 — A session token is never stored

**Grade:** Structural

**Rule.** `sessions.token_hash` holds a SHA-256 hash. The raw token exists only
in the response cookie and in the client's browser.

**Why.** A database leak then yields no usable sessions. SHA-256 rather than
Argon2 is deliberate: the token is already 256 bits of entropy, so it needs no
stretching, and session lookup happens on every authenticated request.

**Enforced at.** `issueToken()` / `hashToken()` in
`apps/api/src/shared/crypto/tokens.ts`. The column is named `token_hash`
precisely so that storing a raw token would read as obviously wrong.

**Violation.** Anyone with a database dump could impersonate any signed-in
user until their session expired.

---

## INV-04 — A password is never logged, returned, or audited

**Grade:** Guarded

**Rule.** No response body, log line, or audit row contains a password, a
password hash, a session token, or an MFA secret.

**Why.** Credentials leak through diagnostics far more often than through
attacks.

**Enforced at.** Three places, because one is not enough:

- Pino `redact` list in `app.module.ts` removes `req.body.password`,
  `passwordHash`, `current`, `confirm`, and the `cookie` and `authorization`
  headers.
- `sanitize()` in `audit.interceptor.ts` strips any key containing `password`,
  `token`, `secret` or `mfaSecret` before writing the audit row.
- No controller selects `passwordHash` into a response type.

**Violation.** A credential recoverable from `/admin/audit` or from the
application log.

---

## INV-05 — Every mutating admin request writes an audit row

**Grade:** Guarded

**Rule.** Any endpoint that changes state carries `@Audit(action, entityType)`,
and the interceptor writes a row naming the actor, the action, the entity and
the time.

**Why.** A multi-user admin without an audit trail is shared, not accountable.
When several people can publish and edit, "who changed this" must be answerable
without asking.

**Enforced at.** `AuditInterceptor`, registered globally via `APP_INTERCEPTOR`.

**Violation.** A content change, role edit, or user suspension with no record
of who did it.

**Deliberate design.** An audit write failure is logged but never fails the
request. Losing one audit row is bad; rejecting a legitimate change because the
audit write hiccuped is worse.

---

## INV-06 — The audit log is append-only

**Grade:** Structural (by omission)

**Rule.** No code path updates or deletes `audit_logs`, and no permission to do
so exists.

**Why.** An editable audit log is a note, not evidence.

**Enforced at.** The permission catalog defines only `audit:read` — there is no
`audit:update` or `audit:delete` to grant. `AuditController` exposes only a
`GET`.

**Violation.** Someone covering their tracks, undetectably.

---

## INV-07 — Silence is never consent

**Grade:** Structural

**Rule.** `leads.marketing_consent` and `resource_downloads.marketing_consent`
default to `false`, are stored separately from `contact_consent`, and no
sequence may run against a record where the marketing flag is false.

**Why.** The privacy page says: _"we never add you to a mailing list because
you contacted us."_ One consent column would make that promise depend on
whoever writes the sequence runner remembering it. Two columns make it a
property of the schema.

**Enforced at.**

- Schema: two separate columns, both `DEFAULT false`.
- Contract: `LeadCreateSchema` requires `contactConsent: z.literal(true)` but
  gives `marketingConsent` a `false` default.
- UI: two separate, unticked checkboxes on the lead form and the score opt-in.
- Email: the founder's lead notification states the consent status in words, so
  a human acting manually also sees it.

**Violation.** Someone who asked a question receives marketing. Legally
exposed, and it breaks a promise printed on the site.

**Checked by.** `ui.spec.tsx` asserts the checkbox defaults;
`critical-paths.spec.ts` asserts both boxes render unticked.

---

## INV-08 — Every published image has alt text

**Grade:** Guarded

**Rule.** `media.alt_text` is nullable in storage but required by the publish
validator. A record referencing an image without alt text cannot reach
`PUBLISHED`.

**Why.** Nullable so an upload can complete before the editor writes the text.
Required at publish so it cannot be skipped. Leaving it to a reviewer's memory
is how it gets skipped.

**Enforced at.** `validateForPublish()` in
`apps/api/src/modules/content/domain/publishing.ts`.

**Violation.** A screen-reader user encounters an unlabelled image.

---

## INV-09 — Configuration is validated before the process serves traffic

**Grade:** Guarded

**Rule.** The API validates its entire environment at boot and exits on any
problem, including cross-field rules (`STORAGE_DRIVER=s3` requires `S3_BUCKET`;
`MAIL_DRIVER=smtp` requires `SMTP_HOST`; any `AI_DRIVER` other than `none`
requires `AI_API_KEY`).

**Why.** A misconfiguration should fail at deploy, loudly, with the field named
— not at 3am on the first request that happens to need it.

**Enforced at.** `loadEnv()` in `apps/api/src/config/env.ts`, called first in
`bootstrap()`.

**Violation.** A container that starts, passes its health check, and then fails
on the one code path that needed the missing variable.

**Checked by.** 8 tests in `env.spec.ts`, one per rule.

---

## INV-10 — Business settings never require a deploy

**Grade:** Conventional

**Rule.** Facts that change with the business — the Assessment price, the
contact email, the reply-time promise, the WhatsApp number, the legal entity —
live in the `settings` table, not in code or environment variables.

**Why.** A fact that needs a deploy to correct is a fact that stays wrong. The
price in particular is expected to rise as case studies accumulate.

**Enforced at.** The `settings` table and `/admin/settings`. Graded
Conventional because nothing stops a developer hard-coding a price in a
component — review is the only guard.

**Violation.** The founder asks a developer to change a number.

---

## INV-11 — An endpoint with no declared permission is refused

**Grade:** Guarded

**Rule.** A route carrying neither `@RequirePermission(...)` nor `@Public()` is
rejected with 403, not allowed.

**Why.** Opt-out beats opt-in. The failure mode of forgetting should be a
locked door, not an open one.

**Enforced at.** `AuthGuard.canActivate` in
`apps/api/src/modules/access/http/auth.guard.ts`, registered globally via
`APP_GUARD`, throwing `NO_PERMISSION_DECLARED`.

**Violation.** A new endpoint ships readable by anyone because its author
forgot a decorator.

---

## INV-12 — Module boundaries hold

**Grade:** Guarded (lint)

**Rule.** Within `apps/api`:

1. `domain/` imports nothing outside itself — no NestJS, no Prisma.
2. `application/` imports `domain` and `ports`, never `infrastructure`.
3. `http/` imports `application`, never `domain` directly.
4. No module imports another module's `domain/` or `infrastructure/`.

**Why.** These are the seams that let a module become a service later without
rewriting its core. They are also the first thing to erode under deadline
pressure, which is why they are lint rules rather than documentation.

**Enforced at.** `eslint-plugin-boundaries` config in
`packages/config/eslint/api.js`, plus `no-restricted-imports` patterns.

**Violation.** The `modules/` folder becomes one mutually-dependent mass and
nothing can be extracted.

**Proven.** This rule caught a real design mistake during Phase 3: the auth
guard was importing across two module boundaries. Rather than weaken the rule,
the guard moved into the `access` module and token crypto moved to `shared`.
See [DEC-11](06-decision-log.md#dec-11--the-auth-guard-belongs-to-the-access-module).
