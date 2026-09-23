# Beekal — Operations Runbook

What to do, in order, to get this live and keep it there. Written for whoever
is holding the pager, which for now is the founder.

---

## 1. First deploy

### Before touching the server

- [ ] Domain decided: `www` or apex. Everything below assumes the apex.
- [ ] DNS A record pointing at the VPS. TLS will not issue until this resolves.
- [ ] A mail account or SMTP relay. Without it, nobody finds out a lead arrived.
- [ ] Somewhere off-site for backups (B2, S3, another box). Not optional.

### On the server

```bash
# Docker, Compose and git. Nothing else is required on the host.
curl -fsSL https://get.docker.com | sh

git clone git@github.com:shakiler001/BeeKal.git /opt/beekal
cd /opt/beekal

cp .env.example .env
```

Fill in `.env`. The three that must not be left at their example values:

```bash
openssl rand -base64 48   # SESSION_SECRET
openssl rand -base64 32   # UMAMI_SECRET
# POSTGRES_PASSWORD — anything long and random
```

Then:

```bash
pnpm docker:up
```

Compose brings up Postgres, Redis, MinIO and Caddy, runs the migrations and the
seed, waits for the API to report healthy, and only then starts the web
container. If the API never goes healthy, the site never serves a broken page.

### The Owner account

The seed prints a one-time setup link and no password. Use it, set a
passphrase, then enable MFA immediately — the Owner role holds `user:*` and
`role:*`, and those are the permissions that make MFA mandatory rather than
advisable.

If the link scrolls away: `docker compose logs migrate | grep setup`.

---

## 2. Launch checklist

Every one of these is verifiable. None is a matter of opinion.

**Domain and transport**

- [ ] `https://beekal.com` serves; `http://` redirects to it
- [ ] The other of `www`/apex 301s to the chosen one
- [ ] `curl -I https://beekal.com` shows HSTS, CSP, `X-Frame-Options: DENY`
- [ ] Certificate auto-renewal confirmed (`docker compose logs caddy | grep -i certificate`)

**Content**

- [ ] No `TODO` in any published row: `SELECT * FROM settings WHERE value::text ILIKE '%TODO%'`
- [ ] Every case study is either approved-and-named or visibly illustrative —
      the check constraint guarantees this, but confirm the badges render
- [ ] The Assessment price says something true, whether a range or "agreed first"
- [ ] The founder photo has replaced the initials placeholder
- [ ] Legal entity and registration number in the footer, if registered

**The funnel, tested as a stranger would**

- [ ] Submit the lead form from a phone on mobile data, not from the office wifi
- [ ] Confirm the notification email arrives, and that the reply-to works
- [ ] Complete the maturity score, share the result link, open it in a private window
- [ ] Request the PDF report and confirm it arrives
- [ ] Check the lead appears in `/admin/leads` with a sensible score

**Access**

- [ ] Sign in to every seeded role and confirm each sees only its own sections
- [ ] Confirm a non-Owner cannot reach `/admin/people`
- [ ] Owner MFA enabled

**Operations**

- [ ] `backup.sh` in cron, and one run completed
- [ ] `restore-test.sh` in cron, and one run **passed**
- [ ] Uptime check hitting `/health` from outside the VPS
- [ ] An alert delivered to a real inbox — cause one deliberately and confirm it lands

**Search**

- [ ] Search Console and Bing Webmaster verified
- [ ] `sitemap.xml` submitted
- [ ] `robots.txt` disallows `/admin` and `/api`
- [ ] Rich Results Test passes on `/assessment` (FAQ) and one article

---

## 3. Routine operations

### Deploying a change

```bash
cd /opt/beekal
git pull
pnpm docker:up --build
```

Compose rebuilds, runs pending migrations, and health-gates the rollover: the
new API container must pass `/health` before traffic moves. Migrations are
written expand-then-contract, so a rollback never strands the schema.

### Rolling back

```bash
git checkout <previous-tag>
pnpm docker:up --build
```

Minutes, not a rebuild from scratch. If a migration is the problem, roll the
code back first and deal with the schema deliberately — never under pressure.

### Restoring from backup

```bash
# Confirm which backup, and how old.
ls -lt /var/backups/beekal | head

docker compose stop api web
gunzip -c /var/backups/beekal/beekal-<stamp>.sql.gz \
  | docker exec -i beekal-postgres-1 psql -U beekal -d beekal --set ON_ERROR_STOP=on
docker compose start api web
```

The dumps are `--clean --if-exists`, so this restores over the existing database
without a manual drop. Stop the app first: restoring under live traffic
produces a half-restored database and a confused API.

---

## 4. When something is wrong

### The site is down

1. `docker compose ps` — which container is unhealthy?
2. `docker compose logs --tail=100 <service>`
3. `curl localhost:4000/health` — the body names the failing dependency.

Most likely causes, in the order they actually happen: disk full (`df -h`),
Postgres not accepting connections, a bad migration.

### A lead did not arrive

The lead is almost certainly saved; the _email_ failed. The outbox exists
precisely so this is recoverable:

```sql
SELECT id, type, attempts, last_error, created_at
FROM outbox_events
WHERE processed_at IS NULL
ORDER BY created_at DESC;
```

Fix the mail configuration and the relay retries on its next poll, up to five
attempts. To retry one that has given up, set `attempts = 0`.

The lead itself is in `leads` regardless. Check there before telling anyone
their message was lost.

### Someone is locked out

The last Owner cannot be suspended, deleted, or stripped of role management —
by design, and enforced in the API. If every Owner has genuinely lost their
password, reset it directly:

```bash
docker exec -it beekal-api-1 node -e "require('./dist/...')"  # not implemented yet
```

There is no such command yet. Until there is, the recovery path is a direct
`UPDATE users SET password_hash = NULL WHERE email = '...'` followed by the
set-password flow. **Write that CLI before it is needed at 2am.**

### Disk filling up

Usual culprits, in order: Docker build cache (`docker system prune -af`), old
backups (the prune in `backup.sh` should handle this — check it is running),
Postgres WAL, container logs (cap them in the daemon config).

---

## 5. What is deliberately not built yet

Listed so nobody goes looking for it, and so the gaps are decisions rather than
oversights.

| Not built                       | Why                                                       | When                                |
| ------------------------------- | --------------------------------------------------------- | ----------------------------------- |
| Client portal                   | No client has asked. Master prompt section 28.            | When one does                       |
| Proposal and invoice generation | The founder writes few enough by hand                     | Stage 2                             |
| Beekal Care ticketing           | No Care client yet                                        | With the first                      |
| Nurture sequences               | Templates and consent flags exist; the scheduler does not | When there is a list                |
| Media uploads                   | MinIO is running and the schema is there; no UI yet       | When the first real photo needs one |
| Password-reset CLI              | See above. Needed before it is needed.                    | Next                                |
| Bangla content                  | Routing and schema are ready; the copy is not             | When a Bangla-first buyer appears   |

---

## 6. Numbers worth watching

Not vanity metrics. Master prompt section 26: optimise for qualified
conversations, assessments, projects, recurring revenue.

| Weekly                                               | Where                              |
| ---------------------------------------------------- | ---------------------------------- |
| Leads, and how many scored 70+                       | `/admin/leads`                     |
| Score completions, and how many asked for the report | `/admin`                           |
| Which problem area leads pick most                   | `leads.problem_area`               |
| Where they came from                                 | `leads.source`, `leads.utm_source` |

| Monthly                                       | Where                         |
| --------------------------------------------- | ----------------------------- |
| Qualified conversations to assessments booked | Pipeline stages               |
| Which pages precede a form submission         | Umami                         |
| Backup restore test result                    | `/var/log/beekal-restore.log` |
| Anything in the audit log that surprises you  | `/admin/audit`                |
