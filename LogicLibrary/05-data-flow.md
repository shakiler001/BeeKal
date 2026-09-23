# Data Flow

How data enters, moves and leaves. Consent, attribution, delivery guarantees
and caching.

---

## The lead path, end to end

```
Browser                BFF (Next)           API (Nest)            Postgres
   │                       │                     │                    │
   │ POST /api/leads       │                     │                    │
   ├──────────────────────►│                     │                    │
   │                       │ validate (Zod)      │                    │
   │                       ├────────────────────►│                    │
   │                       │                     │ spam check         │
   │                       │                     │ createLead()       │
   │                       │                     │ scoreLead()        │
   │                       │                     ├───── ONE TXN ─────►│
   │                       │                     │   lead             │
   │                       │                     │   outbox_event     │
   │                       │                     │   audit_log        │
   │                       │◄────────────────────┤                    │
   │◄──────────────────────┤ { ok, firstName }   │                    │
   │                       │                     │                    │
                                        ┌────────┴────────┐
                                        │ Outbox relay    │ every 10s
                                        │ → founder email │
                                        │ → acknowledgement│
                                        └─────────────────┘
```

---

## FLW-01 — The browser never holds an API token

**Rule.** The browser talks only to Next.js. Next.js talks to the API,
attaching the session cookie server-side.

**Why.** Three things follow. The cookie can stay `httpOnly`, so no script can
read it. It can be `SameSite=Strict`, because everything is same-origin. And
there is no token in client JavaScript to steal.

**Enforced at.** `apps/web/src/app/api/*` route handlers and
`apps/web/src/lib/admin/api.ts`, which reads cookies server-side via
`next/headers`.

---

## FLW-02 — One schema validates both ends

**Rule.** The browser and the API validate against the same Zod schema, imported
from `@beekal/contracts`.

**Why.** A field the form sends that the API would reject becomes a compile
error rather than a production bug. This is the main reason the monorepo
exists.

**Enforced at.** `packages/contracts`, built dual CJS/ESM because the API is
CommonJS and the web app is ESM.

**Cost, stated.** Zod ships to the browser on pages that validate — about 13KB.
Client components import the narrowest subpath (`@beekal/contracts/leads`, not
the root barrel), which cut `/contact` from 19.4KB of route JS to 3.1KB.

---

## FLW-03 — Validating twice is deliberate

**Rule.** The BFF validates, then the API validates again.

**Why.** Not redundancy. The BFF rejects obvious junk before it costs a network
hop, and the API validates because it is a network service that must not trust
its caller — the BFF is simply one caller among possible others.

---

## FLW-04 — State and its consequences commit together

**Rule.** A lead, its outbox event and its audit row are written in one
transaction. All three, or none.

**Why.** Without it, a crash between "lead saved" and "email queued" loses a
customer silently: the row exists, nobody is told, and nothing indicates
anything went wrong.

**Enforced at.** `PrismaLeadRepository.save()` wraps all three in
`$transaction`.

**Verified.** A submitted lead produced a `lead.submitted` outbox row and a
`lead.submitted` audit row alongside the lead itself.

---

## FLW-05 — Delivery is at-least-once, so handlers are idempotent

**Rule.** The outbox relay may deliver an event more than once. Every handler
must tolerate that.

**Why.** Exactly-once delivery does not exist across a process boundary. The
honest choice is at-least-once plus idempotent handlers.

**Enforced at.** `OutboxRelayService.drain()` polls every 10 seconds, marks
`processed_at` after success, and retries up to 5 attempts. Each send carries
an `idempotencyKey`. The score report endpoint returns early when the same
email has already been recorded, so asking twice queues one email.

**Verified.** Two identical report requests produced one `score.report_requested`
event.

---

## FLW-06 — An unknown event type is discarded, loudly

**Rule.** An outbox event with no handler is logged at warn level and marked
processed.

**Why.** An unknown type is a bug, not a transient failure. Retrying it five
times and then retrying forever would bury the real signal — that something is
emitting events nothing consumes.

**Enforced at.** The `default` branch of `OutboxRelayService.handle()`.

---

## FLW-07 — Attribution is captured once, at submission

**Rule.** UTM parameters, referrer and landing path are read from the page at
submit time and stored on the lead. They are never reconstructed later.

**Why.** Attribution decays. The referrer is gone after one navigation, and the
UTM parameters are gone the moment someone clicks an internal link.

**Enforced at.** `LeadForm` reads `useSearchParams()` and `document.referrer`
into the payload; `UtmSchema` carries them through.

See [SCO-05](03-scoring-logic.md#sco-05--source-is-derived-never-trusted) for
why `source` is derived rather than accepted.

---

## FLW-08 — Two consents, never conflated

The central privacy rule. Stated at
[INV-07](01-invariants.md#inv-07--silence-is-never-consent).

Flow consequences:

| Record            | `contact_consent`               | `marketing_consent` |
| ----------------- | ------------------------------- | ------------------- |
| Lead              | Required `true` to exist at all | Defaults `false`    |
| Score report      | n/a — they asked for it         | Defaults `false`    |
| Resource download | n/a — they asked for it         | Defaults `false`    |

The founder's lead notification states the consent in words — _"They agreed to
a reply only — do not add them to a sequence"_ — because a person acting
manually also needs to see it, not just the sequence runner.

---

## FLW-09 — Anti-spam without a CAPTCHA

**Rule.** Public forms use a honeypot field plus a timing check plus rate
limiting. No CAPTCHA.

**Why.** A CAPTCHA is a third-party dependency, an accessibility tax and a
conversion tax, on a B2B form that receives tens of submissions rather than
thousands.

**Enforced at.** `checkSpam()` in
`apps/api/src/modules/leads/domain/spam-check.ts`.

| Signal                       | Rejects                            |
| ---------------------------- | ---------------------------------- |
| Honeypot filled              | A bot; no person can see the field |
| Submitted in under 4 seconds | Nobody reads and answers that fast |
| Over 5 per minute per IP     | Volume                             |

**Deliberate asymmetries.** A _stale_ timestamp is accepted — a form left open
for a day is a distracted person, not an attack. _Missing_ timing data is
accepted — JavaScript may be partly blocked, and failing closed would reject
real people.

---

## FLW-10 — A rejected bot is told nothing

**Rule.** A submission caught by the honeypot returns the same success response
a real submission gets. Nothing is stored.

**Why.** Telling a bot that the honeypot caught it teaches it to leave the field
empty next time.

**Enforced at.** `LeadsController.create` returns the success shape for
`error: 'spam'`.

**Verified.** A honeypot submission returned success and the lead count did not
change.

---

## FLW-11 — Caching is by tag, and portable

**Rule.** Static pages are cached and revalidated by tag on publish. The cache
handler is Redis-backed, not filesystem.

**Why.** Filesystem ISR breaks the moment there are two containers, and the
usual fix for that is a hosting platform — which is the lock-in the whole plan
rules out.

**Status.** `output: 'standalone'` and the Redis service are in place. The
custom cache handler is **not yet wired**; at one container the filesystem
default is correct, and this becomes required at two. Listed so the gap is
known.

---

## FLW-12 — Analytics collects nothing that identifies anyone

**Rule.** Self-hosted Umami on its own database and its own subdomain. No
cookies, no cross-site identifiers, no third-party requests.

**Why.** The privacy page promises it. It is also why the site needs no cookie
banner, which is a conversion advantage as much as a privacy one.

**Enforced at.** The `Analytics` component renders nothing unless both
`NEXT_PUBLIC_UMAMI_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are set, so a fresh
clone and a local dev server send nothing anywhere. The script loads
`afterInteractive` — measurement that costs the LCP it measures is worthless.

Umami is served from `analytics.<domain>`, so a cookie set there can never
reach the app.

---

## FLW-13 — Data leaves on request

**Rule.** A person may ask for everything held about them, or for it to be
deleted, by email. Deletion is recorded in the audit log.

**Why.** The privacy page promises both.

**Status.** The promise is made and the paths are documented in the runbook.
The one-click admin actions are **not built** — today it is a manual query.
Listed as a gap, not claimed as a feature.

---

## Retention

| Data              | Kept                         | Then                                                                            |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| Unconverted leads | 24 months                    | Purged                                                                          |
| Client records    | Relationship + legal minimum | Reviewed                                                                        |
| Score submissions | Indefinite                   | Anonymous once detached from an email                                           |
| Audit log         | Indefinite                   | Never deleted — [INV-06](01-invariants.md#inv-06--the-audit-log-is-append-only) |
| Sessions          | 12h sliding                  | Revoked or expired                                                              |

The 24-month purge is documented and promised. The scheduled job that performs
it is **not yet written**.
