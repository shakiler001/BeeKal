# Glossary

Words that mean something specific here. Several are ordinary English used
precisely, which is worse than jargon — jargon announces that you need to look
it up.

---

## Products and offers

**Assessment** — _Business System Assessment_. A **paid**, structured
engagement: two to three weeks, about six hours of the client's time, eleven
named documents at the end. Capitalised when it means the product. Never a
synonym for "discovery call" and never free.

**Score** — _Business System Maturity Score_. A **free**, instant, self-service
tool. Nine sliders, five levels, no email required. It is a self-assessment;
the Assessment is where Beekal checks rather than asks. Confusing the two
undercuts the paid product.

**Solution** — one of exactly five named categories: Build, Modernize,
Automate, AI, Care. Not a generic word for "what we do". If something does not
fit one of the five, it is not yet a solution.

**Beekal Care** — continuous technology improvement. Deliberately not
"maintenance": maintenance is a cost line a CFO cuts; improvement is a budget
line a COO defends.

**Problem** — one of five buyer-stated symptoms (manual work, disconnected
systems, legacy software, AI opportunity, new product). The buyer identifies by
Problem; Beekal responds with a Solution.

---

## Content

**Illustrative** — a case study describing a plausible scenario rather than a
delivered client outcome. Every case study on the site is currently
illustrative, is flagged `is_illustrative`, and renders an "Example scenario"
badge. See [INV-01](01-invariants.md#inv-01--a-case-study-cannot-claim-to-be-real-without-an-approved-named-client).

**Published** — `status = 'PUBLISHED'` and `deleted_at IS NULL`. The only state
the public site reads. "Live" in the admin UI means exactly this.

**Eyebrow** — the small tracked uppercase line above a section heading, with an
amber rule before it. A brand element, not decoration.

**Band** — an inverted navy section. Carries `.on-band`, which redefines the
colour tokens for its subtree because the light-theme action colour fails
contrast on navy.

---

## Access

**Permission** — an atomic `resource:action` string, e.g. `case_study:publish`.
Defined in code, because each must correspond to something the code can
enforce. 82 currently.

**Role** — a named bundle of permissions. A database row, created and edited in
the UI. Never a migration.

**Scope** — a modifier on a grant answering _which rows_: `ALL`, `OWN` or
`ASSIGNED`. Narrows the query, not the response.

**Effective permissions** — the union of a user's roles, with the widest scope
winning per permission.

**Owner** — the protected role. Cannot be deleted; cannot lose `role:update` or
`user:update`; the last Owner account cannot be removed, suspended or demoted.
The only hard-coded access rules in the system.

---

## Data

**Contact consent** — permission to reply. Required for a lead to exist at all.

**Marketing consent** — permission to send occasional articles. A separate
column, defaulting to false, never inferred from contact consent. The privacy
page promises this, and the schema enforces it.

**Lead score** — 0–100, internal, with reasons attached. How much attention an
enquiry deserves. Never shown to the enquirer.

**Hot** — a lead scoring 70 or above. Changes the founder's notification to say
it is worth answering today.

**Outbox event** — a row written in the same transaction as the state change
that caused it, delivered later by the relay. What makes "a lead is never
silently lost" true.

**Share code** — eight characters identifying a maturity score result, designed
to be forwarded, read aloud and retyped. Excludes `0`, `o`, `1`, `l`, `i`.

---

## Architecture

**Port** — an interface the application owns, describing what it needs
(`Mailer`, `LeadRepository`). Named in domain terms, never in provider terms.

**Adapter** — a concrete implementation of a port (`SmtpMailer`,
`ConsoleMailer`). Bound to its port in exactly one place: the module file.

**BFF** — backend for frontend. The Next.js route handlers that proxy to the
API, attaching the session cookie server-side so the browser never holds a
token.

**Contract** — a Zod schema in `@beekal/contracts`, the single definition a
payload's runtime validation and static types both derive from.

**Domain** — the innermost layer of a module. Pure functions and types, no
framework, no database. Testable with nothing running.

**Structural / Guarded / Checked / Conventional** — how strongly a rule is
enforced. Defined in [README.md](README.md#enforcement-strength).

---

## Operations

**Health gate** — a new container must pass `/health` before the old one stops.
A bad deploy fails to happen rather than failing in production.

**Restore test** — the monthly job that restores the newest backup into a
throwaway database and counts rows. An untested backup is a belief, not a
capability.

**Expand-then-contract** — migrations are written so a code rollback never
strands the schema: add the new thing, migrate, remove the old thing in a
later release.

---

## Words used deliberately, and words avoided

The copy system bans a list of vocabulary
(`docs/01-strategy-offers-and-copy.md` section 6.3). Three worth repeating
because they creep back:

- **"Solutions"** in the generic sense. Beekal has five named Solutions. "We
  provide end-to-end solutions" means nothing and is banned.
- **"Leading"** / "best" / "#1". Unsupported superiority claims are forbidden
  by the brief.
- **"Digital transformation journey."** The brief bans the buzzword; the site
  describes the specific change instead.

And one used deliberately: **"we"** means Beekal, a company that is currently
one person. The copy does not pretend to a team that does not exist, and the
About page names the person you actually talk to.
