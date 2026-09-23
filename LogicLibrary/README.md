# Beekal — Logic Library

A reference for the **rules** that govern this system: what must always be
true, where each rule is enforced, and what breaks if it is violated.

This is not a tutorial and not the plan. `docs/` explains _what we decided to
build and why_. This library states _how the system actually behaves_, in a
form you can look things up in and cite.

---

## How to use it

Every rule has a stable identifier. Cite it in code comments, pull requests,
commit messages and incident notes:

```ts
// INV-07: silence is never consent.
marketingConsent: z.boolean().default(false),
```

Identifiers never change meaning. If a rule is withdrawn its entry stays, marked
**Withdrawn**, with the reason and the date. A rule that quietly disappears is
a rule someone will reintroduce by accident.

### Prefixes

| Prefix | Meaning                            | File                                               |
| ------ | ---------------------------------- | -------------------------------------------------- |
| `INV-` | Invariant. Must hold at all times. | [01-invariants.md](01-invariants.md)               |
| `ACC-` | Access control rule.               | [02-access-logic.md](02-access-logic.md)           |
| `SCO-` | Scoring rule.                      | [03-scoring-logic.md](03-scoring-logic.md)         |
| `LIF-` | Content lifecycle rule.            | [04-content-lifecycle.md](04-content-lifecycle.md) |
| `FLW-` | Data flow rule.                    | [05-data-flow.md](05-data-flow.md)                 |
| `DEC-` | Recorded decision.                 | [06-decision-log.md](06-decision-log.md)           |
| `FAI-` | Known failure mode.                | [07-failure-modes.md](07-failure-modes.md)         |

### What each entry states

Every rule answers four questions, in this order:

1. **Rule** — what must be true, stated so it can be falsified.
2. **Why** — the reason, including what goes wrong without it.
3. **Enforced at** — the exact place. A rule with no enforcement point is a
   wish, and is marked as one.
4. **Violation** — what a reader would observe if the rule were broken.

### Enforcement strength

Rules are graded, because where a rule lives determines whether it can be
bypassed:

| Grade            | Meaning                                     | Can a bug bypass it?        |
| ---------------- | ------------------------------------------- | --------------------------- |
| **Structural**   | Database constraint or type system          | No                          |
| **Guarded**      | Single enforcement point every path crosses | Only by removing the guard  |
| **Checked**      | Asserted by a test                          | Only if the test is deleted |
| **Conventional** | Documented, reviewed by humans              | Yes                         |

Prefer structural. A rule that matters and is only conventional is a rule that
will eventually be broken by someone who did not read this.

---

## Index

| File                                               | Covers                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| [01-invariants.md](01-invariants.md)               | The 12 things that must never be false                  |
| [02-access-logic.md](02-access-logic.md)           | Permission resolution, scope, lockout prevention        |
| [03-scoring-logic.md](03-scoring-logic.md)         | Lead scoring and maturity scoring, with worked examples |
| [04-content-lifecycle.md](04-content-lifecycle.md) | Publishing state machine and content integrity          |
| [05-data-flow.md](05-data-flow.md)                 | Consent, attribution, the outbox, caching               |
| [06-decision-log.md](06-decision-log.md)           | Architectural decisions, with their costs               |
| [07-failure-modes.md](07-failure-modes.md)         | What breaks, how it is detected, what happens next      |
| [08-glossary.md](08-glossary.md)                   | Domain vocabulary, precisely defined                    |

---

## Reading order

Coming to this cold, read in this order:

1. **[08-glossary.md](08-glossary.md)** — the words mean specific things here.
   "Assessment" is a product, not a phase; "Score" is a free tool, not the
   Assessment.
2. **[01-invariants.md](01-invariants.md)** — the promises the system makes.
   Several are promises to customers that the schema enforces.
3. **[02-access-logic.md](02-access-logic.md)** — if you are touching anything
   behind `/admin`.
4. Whichever of 03–05 covers what you are changing.
5. **[06-decision-log.md](06-decision-log.md)** — before proposing to change an
   architectural choice. Most have a recorded cost; arguing against one is
   easier when you know what it bought.

---

## Maintaining this

- A new rule gets the next free number in its file. Numbers are never reused.
- A withdrawn rule keeps its entry, marked **Withdrawn**, with a date and a
  reason.
- If you find a rule that is **Conventional** and matters, the right response
  is to raise its grade, not to write it in bold.
- If a rule here contradicts the code, the code wins and this file is a bug.
  Fix it in the same pull request.

Last reviewed against the codebase: 2026-09-23, commit `2351271`.
