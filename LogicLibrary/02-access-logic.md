# Access Logic

How the system decides who may do what. This is the formal statement; the
narrative reasoning is in `docs/04-data-model-and-rbac.md`.

---

## The model in one line

```
User → (many) Roles → (many) Permissions, each carrying a Scope
```

Permissions are **code**. Roles are **data**. Scope is a modifier answering
_which rows_.

That split is the whole design: a permission with no enforcement point in the
code is a lie told to an administrator, so permissions cannot be invented in a
UI. A role is just a named bundle, so it can be.

---

## ACC-01 — The permission catalog is closed

**Rule.** A permission exists only if it is in `PERMISSIONS` in
`apps/api/src/modules/access/permissions.catalog.ts`. 82 currently, of the form
`resource:action`.

**Why.** Every permission must correspond to something the code can actually
do. Allowing an administrator to invent `lead:archive` in a UI, with nothing
checking it, produces a role that appears to grant something and does not.

**Enforced at.** The seed upserts from the code list.
`AccessController.resolvePermissionIds()` rejects any grant naming a key that
is not in the table (`UNKNOWN_PERMISSION`).

---

## ACC-02 — Roles are rows

**Rule.** A custom role can be created, renamed, re-scoped and deleted through
`/admin/people/roles` with no code change, no migration and no deploy. Seeded
system roles may be edited but not deleted, because the next seed would
recreate them. The Owner role has additional lockout protection.

**Why.** This is the literal reading of the requirement. A `users.role` enum
fails on the first real request — _"let the new marketing hire edit articles
and see leads, but not delete anything"_ — because under an enum that is a
migration.

**Enforced at.** `roles`, `role_permissions`, `user_roles` tables;
`AccessController`.

**Verified.** A "Content Reviewer" role with five permissions was created
against the running API with zero code changes, and the Support role was later
re-scoped entirely through the admin UI.

---

## ACC-03 — Effective permissions are the union, widest scope wins

**Rule.** For a user holding roles R₁…Rₙ:

```
effective(user) = ⋃ grants(Rᵢ)
scope(p)        = max(scope of p across all Rᵢ)   where ALL > OWN > ASSIGNED
```

**Why.** Composability. The founder never needs a combined "Marketing plus
Sales" role — they assign both, and the result is the sum.

**Enforced at.** `resolveEffectivePermissions()` in
`apps/api/src/modules/access/domain/effective-permissions.ts`. Pure function,
no I/O.

**Worked example.**

| Role    | `lead:read` scope |
| ------- | ----------------- |
| Sales   | `ASSIGNED`        |
| Analyst | `ALL`             |

A user holding both reads **all** leads. Adding a role never removes access.

**Checked by.** 6 tests in `effective-permissions.spec.ts`, including that a
narrower second role does not narrow an existing grant.

---

## ACC-04 — Scope narrows the query, not the response

**Rule.** A scoped read is expressed as a `WHERE` predicate. Rows outside scope
are never loaded.

**Why.** Filtering after the fact means the data was in memory, in a log line,
or in a serialised response one bug away from being returned. Narrowing the
query means there is nothing to leak.

**Enforced at.** `AdminLeadsController.scopeFilter()`, applied to `findMany`,
`count` and `findFirst`.

**Mapping.**

| Scope      | Predicate                              |
| ---------- | -------------------------------------- |
| `ALL`      | `{}`                                   |
| `OWN`      | `{ assignedToId: user.id }`            |
| `ASSIGNED` | `{ assignedToId: user.id }`            |
| absent     | `{ id: '__none__' }` — matches nothing |

The `absent` case is unreachable, because the guard rejects first. It defaults
to nothing rather than everything so that if it ever _is_ reached, the failure
is empty rather than total.

---

## ACC-05 — Out of scope reads as "not found"

**Rule.** Fetching a record outside your scope returns 404, not 403.

**Why.** A 403 confirms the record exists. For a lead — a named person at a
named company — that is itself information.

**Enforced at.** `AdminLeadsController.get` folds the scope filter into the
lookup, so the row genuinely is not found.

---

## ACC-06 — Publishing is a separate permission from editing

**Rule.** `case_study:update` permits editing. Only `case_study:publish`
permits the transition to `PUBLISHED`.

**Why.** This is the entire reason Editor and Delivery are different roles.
Delivery writes up a project; an Editor decides it is ready to be public.

**Enforced at.** `ContentController.assertTransition()` checks the publish
permission on the target status, independently of the update permission that
got the caller into the handler.

**Verified.** A Delivery user edited a case study (200) and was refused
publication (403, _"You can edit this, but publishing needs an editor"_).

---

## ACC-07 — Authorization is declared, never hand-written

**Rule.** No controller contains `if (user.role === ...)`. Requirements are
declared with `@RequirePermission('resource:action')` and evaluated in one
place. `/auth/me` and logout use `@Authenticated()` because every active
account needs those session operations even if a custom role has no Settings
grant. Public routes use `@Public()` explicitly.

**Why.** Scattered checks cannot be audited. One evaluation point means the
whole policy is greppable, and a missing check is visible as a missing
decorator rather than invisible as an absent `if`.

**Enforced at.** `AuthGuard`. See also [INV-11](01-invariants.md#inv-11--an-endpoint-with-no-declared-permission-is-refused).

---

## ACC-08 — A revoked permission takes effect on the next request

**Rule.** Effective permissions are cached per user, keyed by a global version
stamp. Any role change bumps the stamp and invalidates every entry.

**Why.** Someone revoking access in a hurry expects it to take effect now, not
at the victim's next login. Caching without invalidation would make "remove
their access" mean "remove it in twelve hours".

**Enforced at.** `PermissionsService.bumpVersion()`, called after every role
create, update and delete, and after any change to a user's roles.

**Limitation.** The cache is in-process. With more than one API container each
would need its own bump; moving the cache to Redis is one adapter swap and is
not needed at one container.

---

## ACC-09 — A suspended or deleted user's live sessions stop immediately

**Rule.** Suspension or deletion revokes all of that user's active sessions in
the same transaction, and the guard re-checks user status on every request.

**Why.** Otherwise "suspended" means "suspended in twelve hours", which is not
what anyone means when they suspend someone.

**Enforced at.** `UsersController.update` and `.remove` revoke sessions;
`AuthGuard.authenticate` rejects any session whose user is not `ACTIVE` or is
soft-deleted.

---

## ACC-10 — Login does not reveal whether an account exists

**Rule.** A wrong password and a nonexistent account return identical
responses, and take comparable time.

**Why.** Either difference is a user-enumeration oracle: an attacker learns
which addresses have accounts before attacking any of them.

**Enforced at.** `AuthController.login` throws one `LOGIN_FAILED` for every
failure. `AuthService.login` verifies against a dummy Argon2 hash when the user
does not exist, so the timing does not differ either.

**Verified.** Both cases returned `401` with the identical body _"That email
and password do not match an active account"_.

---

## ACC-11 — Login is rate limited to five attempts a minute

**Rule.** `POST /api/auth/login` and `/api/auth/set-password` allow 5 requests
per minute per IP; public write endpoints allow 5–10.

**Why.** Login is the one endpoint where an attacker gets unlimited free
attempts at a secret. Five a minute makes online guessing pointless without
inconveniencing someone who mistyped.

**Enforced at.** `@Throttle(AUTH_THROTTLE)`, with `ThrottlerGuard` registered
before `AuthGuard` so a flood is rejected without touching the database. The
constant is keyed on `default`, which replaces the single root bucket for that
handler — see [DEC-17](06-decision-log.md#dec-17--one-rate-limit-bucket-at-the-root-overrides-per-route)
for why exactly one bucket is registered globally.

**Per IP, and that depends on configuration.** Behind a reverse proxy the
client address is the proxy's unless `TRUST_PROXY_HOPS` says how many proxies
to look through. Left at 0 behind one, this rule silently becomes "five
attempts a minute for everybody at once".

**Verified.** Attempts 1–5 returned 401, attempts 6–7 returned 429. Re-verified
after the root registration changed: an endpoint with no override served 20
consecutive requests, one with a 10/minute override stopped at exactly 10, and
health served 14 without throttling.

---

## ACC-12 — If we cannot establish who you are, you are signed out

**Rule.** In the admin UI, a rejected session (401/403), a missing endpoint
(404) or an unreachable API all redirect to `/admin/login`. A 5xx does not — it
reaches the error boundary.

**Why.** Showing an error page to someone who is not signed in leaks that an
admin exists and helps them not at all. But an administrator mid-task deserves
to know the difference between _"sign in again"_ and _"something is broken"_,
so a server that is up and answering badly is surfaced rather than disguised.

**Enforced at.** `apps/web/src/lib/admin/session.ts`, in two shapes.
`loadSession()` returns a result and is what the admin layout uses;
`requireSession()` redirects or throws and is what pages use. `redirect()` is
called outside any `try`, because it signals by throwing and a surrounding
`catch` would swallow the navigation.

**Why two.** A layout cannot throw usefully — no `error.tsx` catches the layout
of its own segment, and one that throws during the initial render of a document
escapes the boundaries above it as well, so the framework's own error page is
what a visitor gets. The layout therefore renders the failure instead of
raising it. See
[DEC-18](06-decision-log.md#dec-18--a-layout-that-loads-data-renders-its-failure).

**Checked by.** 5 tests in `critical-paths.spec.ts`, run with no API available
— which is also how CI runs them. The "answering badly" half was verified
separately against a deliberately rate-limited API: `/admin` returned 200 with
the error card, where it previously returned 500 and the framework page.

---

## Hard-coded guardrails

Everything above is data-driven except the following guardrails:

| Rule                                                                                     | Effect                                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [INV-02](01-invariants.md#inv-02--the-last-owner-cannot-be-removed-suspended-or-demoted) | The last Owner cannot be removed, suspended or demoted                  |
| `canEditRole()`                                                                          | The Owner role cannot be deleted, or lose `role:update` / `user:update` |
| `canEditRole()` for seeded roles                                                         | Seeded system roles cannot be deleted; the next seed would recreate them |

Plus two conveniences that prevent self-inflicted lockout: you cannot delete or
suspend your own account.

---

## Seeded roles

Starting points. All editable; none deletable. Owner has additional protection.

| Role     | Shape                                          | Grants |
| -------- | ---------------------------------------------- | ------ |
| Owner    | Everything; protected                          | 82     |
| Admin    | Everything except editing the Owner role       | 82     |
| Editor   | All content and media, including publishing    | 41     |
| Marketer | Content + sequences; leads read/export only    | 55     |
| Sales    | Assigned leads and pipeline; content read-only | 16     |
| Delivery | Writes case studies, cannot publish them       | 15     |
| Analyst  | Read-only everywhere, plus exports             | 17     |
| Support  | Reads leads, adds notes                        | 3      |

The grant counts are what the seed produces. They are listed because a large
unexplained change in one is worth noticing.
