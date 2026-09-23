# Enforcement Index

Every rule, mapped to the file that enforces it. This is the page to check when
you change something and want to know which rules you might have broken — and
the page to update when you move code.

If a path here does not exist, this file is out of date and that is a bug.

---

## By file

### Database

| Path                                                | Enforces                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                     | [INV-03](01-invariants.md#inv-03--a-session-token-is-never-stored), [INV-07](01-invariants.md#inv-07--silence-is-never-consent), [INV-08](01-invariants.md#inv-08--every-published-image-has-alt-text)  |
| `…/migrations/20260922192000_case_study_integrity/` | [INV-01](01-invariants.md#inv-01--a-case-study-cannot-claim-to-be-real-without-an-approved-named-client), [LIF-07](04-content-lifecycle.md#lif-07--a-case-study-cannot-claim-a-client-it-does-not-have) |

### API — domain (pure, no framework)

| Path                                                          | Enforces                                                                                                                                                                                                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/access/domain/effective-permissions.ts` | [ACC-03](02-access-logic.md#acc-03--effective-permissions-are-the-union-widest-scope-wins), [INV-02](01-invariants.md#inv-02--the-last-owner-cannot-be-removed-suspended-or-demoted)                                                           |
| `apps/api/src/modules/leads/domain/lead-score.ts`             | [SCO-01](03-scoring-logic.md#sco-01--every-point-is-explained) – [SCO-04](03-scoring-logic.md#sco-04--above-70-is-hot)                                                                                                                         |
| `apps/api/src/modules/leads/domain/lead.ts`                   | [SCO-05](03-scoring-logic.md#sco-05--source-is-derived-never-trusted), contact-consent invariant                                                                                                                                               |
| `apps/api/src/modules/leads/domain/spam-check.ts`             | [FLW-09](05-data-flow.md#flw-09--anti-spam-without-a-captcha)                                                                                                                                                                                  |
| `apps/api/src/modules/assessments/domain/scoring.ts`          | [SCO-06](03-scoring-logic.md#sco-06--at-least-six-of-nine-answers) – [SCO-08](03-scoring-logic.md#sco-08--ties-break-toward-the-heavier-dimension), [SCO-11](03-scoring-logic.md#sco-11--share-codes-are-short-unambiguous-and-not-the-row-id) |
| `apps/api/src/modules/content/domain/publishing.ts`           | [LIF-01](04-content-lifecycle.md#lif-01--archived-content-returns-as-a-draft), [LIF-03](04-content-lifecycle.md#lif-03--publication-is-validated-not-assumed), [INV-08](01-invariants.md#inv-08--every-published-image-has-alt-text)           |
| `apps/api/src/modules/identity/domain/password.ts`            | Password rules                                                                                                                                                                                                                                 |
| `apps/api/src/modules/messaging/domain/templates.ts`          | [DEC-06](06-decision-log.md#dec-06--plain-text-transactional-email)                                                                                                                                                                            |

### API — enforcement points

| Path                                              | Enforces                                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/access/http/auth.guard.ts`  | [ACC-07](02-access-logic.md#acc-07--authorization-is-declared-never-hand-written), [ACC-09](02-access-logic.md#acc-09--a-suspended-or-deleted-users-live-sessions-stop-immediately), [INV-11](01-invariants.md#inv-11--an-endpoint-with-no-declared-permission-is-refused) |
| `apps/api/src/shared/audit/audit.interceptor.ts`  | [INV-04](01-invariants.md#inv-04--a-password-is-never-logged-returned-or-audited), [INV-05](01-invariants.md#inv-05--every-mutating-admin-request-writes-an-audit-row)                                                                                                     |
| `apps/api/src/shared/crypto/tokens.ts`            | [INV-03](01-invariants.md#inv-03--a-session-token-is-never-stored)                                                                                                                                                                                                         |
| `apps/api/src/shared/throttle/throttle.config.ts` | [ACC-11](02-access-logic.md#acc-11--login-is-rate-limited-to-five-attempts-a-minute)                                                                                                                                                                                       |
| `apps/api/src/config/env.ts`                      | [INV-09](01-invariants.md#inv-09--configuration-is-validated-before-the-process-serves-traffic)                                                                                                                                                                            |
| `apps/api/src/app.module.ts`                      | [INV-04](01-invariants.md#inv-04--a-password-is-never-logged-returned-or-audited) (redaction), global guards                                                                                                                                                               |

### API — controllers

| Path                                                             | Enforces                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/access/http/access.controller.ts`          | [ACC-01](02-access-logic.md#acc-01--the-permission-catalog-is-closed), [ACC-02](02-access-logic.md#acc-02--roles-are-rows), Owner-role protection                                                                                                                                                                                                             |
| `apps/api/src/modules/identity/http/auth.controller.ts`          | [ACC-10](02-access-logic.md#acc-10--login-does-not-reveal-whether-an-account-exists), [ACC-11](02-access-logic.md#acc-11--login-is-rate-limited-to-five-attempts-a-minute)                                                                                                                                                                                    |
| `apps/api/src/modules/identity/http/users.controller.ts`         | [INV-02](01-invariants.md#inv-02--the-last-owner-cannot-be-removed-suspended-or-demoted), [ACC-09](02-access-logic.md#acc-09--a-suspended-or-deleted-users-live-sessions-stop-immediately)                                                                                                                                                                    |
| `apps/api/src/modules/leads/http/admin-leads.controller.ts`      | [ACC-04](02-access-logic.md#acc-04--scope-narrows-the-query-not-the-response), [ACC-05](02-access-logic.md#acc-05--out-of-scope-reads-as-not-found)                                                                                                                                                                                                           |
| `apps/api/src/modules/leads/http/leads.controller.ts`            | [FLW-10](05-data-flow.md#flw-10--a-rejected-bot-is-told-nothing)                                                                                                                                                                                                                                                                                              |
| `apps/api/src/modules/content/http/content.controller.ts`        | [ACC-06](02-access-logic.md#acc-06--publishing-is-a-separate-permission-from-editing), [LIF-02](04-content-lifecycle.md#lif-02--publishing-requires-its-own-permission), [LIF-05](04-content-lifecycle.md#lif-05--deletion-is-soft-for-anything-a-human-wrote), [LIF-07](04-content-lifecycle.md#lif-07--a-case-study-cannot-claim-a-client-it-does-not-have) |
| `apps/api/src/modules/content/http/public-content.controller.ts` | [LIF-04](04-content-lifecycle.md#lif-04--the-public-site-reads-published-rows-only)                                                                                                                                                                                                                                                                           |
| `apps/api/src/modules/assessments/http/score.controller.ts`      | [SCO-06](03-scoring-logic.md#sco-06--at-least-six-of-nine-answers), [SCO-11](03-scoring-logic.md#sco-11--share-codes-are-short-unambiguous-and-not-the-row-id), [FLW-05](05-data-flow.md#flw-05--delivery-is-at-least-once-so-handlers-are-idempotent)                                                                                                        |

### API — infrastructure

| Path                                                                  | Enforces                                                                                                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/leads/infrastructure/prisma-lead.repository.ts` | [FLW-04](05-data-flow.md#flw-04--state-and-its-consequences-commit-together)                                                                                        |
| `apps/api/src/modules/messaging/application/outbox-relay.service.ts`  | [FLW-05](05-data-flow.md#flw-05--delivery-is-at-least-once-so-handlers-are-idempotent), [FLW-06](05-data-flow.md#flw-06--an-unknown-event-type-is-discarded-loudly) |
| `apps/api/src/modules/messaging/messaging.module.ts`                  | [DEC-02](06-decision-log.md#dec-02--no-vendor-lock-in-as-a-hard-constraint) (the mail port binding)                                                                 |
| `apps/api/src/modules/access/infrastructure/permissions.service.ts`   | [ACC-08](02-access-logic.md#acc-08--a-revoked-permission-takes-effect-on-the-next-request)                                                                          |

### Web

| Path                                                        | Enforces                                                                                                                                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/admin/session.ts`                         | [ACC-12](02-access-logic.md#acc-12--if-we-cannot-establish-who-you-are-you-are-signed-out), [DEC-16](06-decision-log.md#dec-16--unverifiable-identity-means-signed-out)                                     |
| `apps/web/src/lib/admin/api.ts`, `src/app/api/**`           | [FLW-01](05-data-flow.md#flw-01--the-browser-never-holds-an-api-token), [FLW-03](05-data-flow.md#flw-03--validating-twice-is-deliberate)                                                                    |
| `apps/web/src/lib/schema.ts`                                | [LIF-09](04-content-lifecycle.md#lif-09--an-illustrative-case-study-is-not-indexed), [LIF-10](04-content-lifecycle.md#lif-10--structured-data-is-generated-never-hand-written)                              |
| `apps/web/src/features/lead-form/lead-form.tsx`             | [INV-07](01-invariants.md#inv-07--silence-is-never-consent), [FLW-02](05-data-flow.md#flw-02--one-schema-validates-both-ends), [FLW-07](05-data-flow.md#flw-07--attribution-is-captured-once-at-submission) |
| `apps/web/src/features/score/score-tool.tsx`                | [SCO-09](03-scoring-logic.md#sco-09--the-result-is-free-and-ungated), [SCO-10](03-scoring-logic.md#sco-10--the-email-ask-comes-after-the-result)                                                            |
| `apps/web/src/features/case-studies/illustrative-badge.tsx` | [LIF-08](04-content-lifecycle.md#lif-08--the-illustrative-badge-renders-from-the-flag)                                                                                                                      |
| `apps/web/src/components/analytics.tsx`                     | [FLW-12](05-data-flow.md#flw-12--analytics-collects-nothing-that-identifies-anyone)                                                                                                                         |
| `apps/web/src/app/sitemap.ts`                               | [LIF-09](04-content-lifecycle.md#lif-09--an-illustrative-case-study-is-not-indexed)                                                                                                                         |

### Tooling

| Path                                  | Enforces                                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/config/eslint/api.js`       | [INV-12](01-invariants.md#inv-12--module-boundaries-hold)                                                                                                    |
| `packages/config/eslint/next.js`      | Design-token discipline (no hex literals)                                                                                                                    |
| `packages/contracts/`                 | [FLW-02](05-data-flow.md#flw-02--one-schema-validates-both-ends)                                                                                             |
| `infra/scripts/check-docker-paths.sh` | [FAI-10](07-failure-modes.md#fai-10--an-image-builds-locally-and-fails-in-ci), [DEC-15](06-decision-log.md#dec-15--empty-directories-are-tracked-explicitly) |
| `infra/scripts/restore-test.sh`       | [FAI-07](07-failure-modes.md#fai-07--a-backup-that-does-not-restore)                                                                                         |
| `infra/caddy/Caddyfile`               | Security headers, TLS                                                                                                                                        |

---

## Rules checked by tests

| Test file                                                            | Rules                                          | Count |
| -------------------------------------------------------------------- | ---------------------------------------------- | ----- |
| `apps/api/src/modules/access/domain/effective-permissions.spec.ts`   | ACC-03, INV-02, ACC-06                         | 23    |
| `apps/api/src/modules/leads/domain/lead.spec.ts`                     | SCO-01 – SCO-05, FLW-09                        | 21    |
| `apps/api/src/modules/leads/application/submit-lead.usecase.spec.ts` | INV-07, FLW-09, FLW-10                         | 9     |
| `apps/api/src/modules/assessments/domain/scoring.spec.ts`            | SCO-06 – SCO-08, SCO-11                        | 12    |
| `apps/api/src/modules/messaging/domain/templates.spec.ts`            | INV-07 (notification wording), DEC-06          | 11    |
| `apps/api/src/config/env.spec.ts`                                    | INV-09                                         | 8     |
| `packages/contracts/src/leads/leads.spec.ts`                         | INV-07, FLW-02                                 | 6     |
| `apps/web/src/components/ui/ui.spec.tsx`                             | INV-07, accessibility contracts                | 15    |
| `apps/web/e2e/accessibility.spec.ts`                                 | WCAG 2.2 AA, every page, both themes           | 33    |
| `apps/web/e2e/critical-paths.spec.ts`                                | ACC-12, INV-07, LIF-08, LIF-09, SCO-06, SCO-09 | 15    |

**Totals:** 105 unit (84 API + 15 web + 6 contracts), 33 accessibility,
15 end-to-end.

The two e2e figures are generated rather than written out: `accessibility.spec.ts`
declares 2 `test()` calls inside loops over 16 pages and 2 themes, and
`critical-paths.spec.ts` declares 11, one of which loops over 5 protected admin
routes.

---

## Rules with no automated check

Honest list. These are the ones a human has to hold.

| Rule                                                                                                        | Grade        | What would raise it                                      |
| ----------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------- |
| [INV-10](01-invariants.md#inv-10--business-settings-never-require-a-deploy) — settings not hard-coded       | Conventional | A lint rule banning price-like literals in components    |
| [LIF-06](04-content-lifecycle.md#lif-06--a-slug-change-never-breaks-a-link) — slug change writes a redirect | Conventional | Write the redirect in the same transaction as the update |
| Copy voice and banned vocabulary                                                                            | Conventional | A save-time lint over content fields                     |
| Word budgets per page                                                                                       | Conventional | A build-time count against the budget table              |

---

_Verified against commit `ab54b09`, 2026-09-23. Permission and role counts read
from source. Test counts from a full run._
