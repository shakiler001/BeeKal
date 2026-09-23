# Failure Modes

What breaks, how it is detected, what the system does, and what a human does.

Operational procedure lives in `docs/06-runbook.md`. This file is about the
_logic_ of failure: what degrades, what fails closed, and what is recoverable.

---

## Design stance

Three rules govern every failure path here:

1. **Fail closed on access.** Anything that cannot establish identity or
   permission denies. The failure mode of forgetting is a locked door.
2. **Fail loud on configuration.** A misconfigured process exits at boot with
   the field named, rather than starting and failing later on one code path.
3. **Fail soft on the non-essential.** Analytics, a share code, an audit write
   — none of these may take down the thing they decorate.

---

## FAI-01 — The API is unreachable

**Detected by.** `/health` returns 503; the uptime check fires; the web
container's own health check fails.

**System behaviour.**

- Public pages: unaffected. They are statically rendered and read no API at
  request time.
- The lead form: returns a 502 through the BFF and shows _"Please email us
  directly"_ with the real address. The visitor is not left guessing.
- The score tool: unaffected. It computes in the browser. Only the share link
  is lost, and that failure is deliberately silent.
- The admin: redirects to login ([DEC-16](06-decision-log.md#dec-16--unverifiable-identity-means-signed-out)).

**Data loss.** None for the score. A lead submitted during the outage is lost —
it never reached Postgres. This is the one true gap.

**Not mitigated.** There is no client-side queue or retry for a failed lead
submission. Worth building if it ever happens; not built speculatively.

---

## FAI-02 — Postgres is unreachable

**Detected by.** `/health` names `database` as `down` and returns 503. The API
refuses to start at all if the database is down at boot.

**System behaviour.** The API is unhealthy, so Compose does not route to it. On
a deploy the old container keeps serving because the new one never passes its
health gate — a bad deploy fails to happen rather than failing loudly in
production.

**Recovery.** Restore from backup, tested monthly. See
[FAI-07](#fai-07--a-backup-that-does-not-restore).

---

## FAI-03 — Mail delivery fails

**Detected by.** `outbox_events` accumulating rows with `processed_at IS NULL`
and rising `attempts`. The relay logs an error at 5 attempts.

**System behaviour.** The lead is **already saved** — it was committed in the
same transaction as the event ([FLW-04](05-data-flow.md#flw-04--state-and-its-consequences-commit-together)).
Only the notification failed. The relay retries every 10 seconds, up to five
attempts, then stops and says so.

**Recovery.** Fix the mail configuration; set `attempts = 0` on the stuck rows;
the relay picks them up on the next poll.

**Why this matters.** This is the single failure the outbox exists for. Without
it the sequence would be: save lead → crash → nobody told → no record that
anything was missed.

**What a human must not do.** Tell the enquirer their message was lost. Check
the `leads` table first — it is almost certainly there.

---

## FAI-04 — The disk fills

**Detected by.** Disk alert above 80%. In practice it announces itself as
unrelated failures: containerd cannot create temp directories, builds fail with
confusing errors, Postgres refuses writes.

**System behaviour.** Degrades in ways that do not name the cause. This one
genuinely happened during development: Docker's daemon hung repeatedly, and the
actual cause was the host at 0.1GB free of 232GB.

**Usual culprits, in order.** Docker build cache, old backups, Postgres WAL,
container logs.

**Lesson recorded.** When several unrelated things fail at once, check disk
before debugging any of them.

---

## FAI-05 — A permission is misconfigured

**Detected by.** Someone reports they cannot do their job, or — worse — nobody
reports that they can do too much.

**System behaviour.** Fails closed. A missing permission denies rather than
allows.

**Recovery.** `/admin/people/roles/:id`, change the grants, save. Effective on
the next request ([ACC-08](02-access-logic.md#acc-08--a-revoked-permission-takes-effect-on-the-next-request)).
`/admin/audit` shows who changed what.

**Guard against the silent direction.** Over-permission does not announce
itself. The role editor shows a plain-English summary and the number of people
affected before saving, and 23 tests in `effective-permissions.spec.ts` assert what each role _cannot_ do — a
permission system tested only by users who are allowed through is a permission
system with unknown behaviour.

---

## FAI-06 — Every Owner has lost their password

**Detected by.** Nobody can sign in.

**System behaviour.** [INV-02](01-invariants.md#inv-02--the-last-owner-cannot-be-removed-suspended-or-demoted)
guarantees an Owner account still _exists_. It does not help if the password is
forgotten.

**Recovery.** A CLI, which runs both locally and inside the container:

```bash
pnpm --filter @beekal/api user:reset-password -- --email <owner>
docker compose exec api node dist/cli/reset-password.js --email <owner>
```

It reads the password from stdin rather than an argument, applies the same
policy the API applies, revokes that account's sessions, and writes an audit
row. `--revoke` clears the password instead, returning the account to INVITED.

**What it refuses to do.** Revoke the last Owner's password, which would leave
an account nobody can sign into and nobody can repair from the UI. That mirrors
[INV-02](01-invariants.md#inv-02--the-last-owner-cannot-be-removed-suspended-or-demoted)
rather than restating it in a second place that could drift.

**Was a gap until it was needed.** This was listed as the highest priority
unbuilt item on the grounds that it is wanted exactly when nobody is calm. That
turned out to be an accurate prediction: the first real lockout happened during
local verification, before any of this reached production.

---

## FAI-07 — A backup that does not restore

**Detected by.** `restore-test.sh`, monthly, which restores the newest dump into
a throwaway database and counts rows in the tables whose loss would hurt.

**System behaviour.** The test fails loudly if the newest backup is over 48
hours old, because a backup job that silently stopped is worse than no backup
job — it produces false confidence.

**Verified, not assumed.** Both scripts were run during development. The restore
brought back 2 users, 8 roles, 82 permissions, 5 solutions and 5 case studies.

**Two warnings the script emits on purpose.** An unset `BACKUP_RECIPIENT` means
the dump is unencrypted. An unset `BACKUP_REMOTE` means the backup lives on the
machine it protects, which is not a backup.

---

## FAI-08 — A deploy ships something broken

**Detected by.** The API's own health gate, before traffic moves.

**System behaviour.** The new container must pass `/health` before the old one
stops. A container that cannot reach its database never becomes healthy, so it
never receives traffic.

**Recovery.** `git checkout <previous-tag>` and rebuild — minutes, not a
rebuild from scratch. Migrations are written expand-then-contract, so a code
rollback never strands the schema.

---

## FAI-09 — A fabricated client result

**Detected by.** It cannot happen.

**System behaviour.** The database rejects it
([INV-01](01-invariants.md#inv-01--a-case-study-cannot-claim-to-be-real-without-an-approved-named-client)),
regardless of which code path attempts the write. The badge renders from the
same flag, so the page cannot claim what the database denies. An E2E test
asserts the badge is present.

**Listed here** because it is the failure mode with the worst consequence —
reputational, on the exact axis the company sells — and because writing down
"this is structurally impossible" is more useful than trusting that nobody
would.

---

## FAI-10 — An image builds locally and fails in CI

**Detected by.** `infra/scripts/check-docker-paths.sh`, running before the
build.

**System behaviour.** The build fails in seconds with the offending path named,
rather than minutes later with a confusing COPY error.

**Cause class.** A path that exists on a developer machine but not in a fresh
checkout. Empty directories are the common case, because git does not track
them.

**Recorded because it happened.** Two CI runs were spent on a plausible but
incomplete theory, built from the symptom pattern because job logs need admin
rights. Reproducing against a fresh `git archive` found it immediately.

**Lesson.** Reproduce from a clean checkout before theorising.

---

## Known gaps

Not failures yet. Places where the system would behave worse than documented,
listed so they are decisions rather than surprises.

| Gap                                            | Consequence                                     | Priority                                     |
| ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| Public site reads TypeScript, not the database | An admin content edit does not change the site  | **High** — the largest design-to-reality gap |
| Slug change does not auto-write a redirect     | A renamed page 404s until someone adds one      | Medium                                       |
| No retry for a lead submitted during an outage | That lead is lost                               | Medium                                       |
| 24-month lead purge not scheduled              | Retention promise is manual                     | Medium                                       |
| Data export/delete not one-click               | Privacy promise is manual                       | Medium                                       |
| Redis cache handler not wired                  | Breaks at the second container                  | Low until scaled                             |
| No media upload UI                             | Founder photo cannot be added through the admin | Low                                          |

Items marked **High** should be done before the site handles real enquiries.
