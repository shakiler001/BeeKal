# Scoring Logic

Two scoring systems, unrelated to each other:

- **Lead score** — how much attention a submitted enquiry deserves. Internal.
- **Maturity score** — where a visitor's business sits on a five-level scale.
  Shown to them, free.

Both are pure functions over plain data, so both are testable without a
database and produce the same answer wherever they run.

---

# Part 1 — Lead scoring

`apps/api/src/modules/leads/domain/lead-score.ts`

## SCO-01 — Every point is explained

**Rule.** `scoreLead()` returns the number **and** the reasons. The sum of the
reasons equals the score, exactly.

**Why.** An unexplainable number gets ignored by whoever it was meant to help.
The founder looking at a lead scored 88 needs to know it is 88 because they
asked for an assessment, wrote 36 words, and used a work domain — not because
an opaque model said so.

**Enforced at.** `scoreLead()` builds `reasons[]` and derives `score` from it,
rather than computing separately. `/admin/leads/:id` renders the breakdown.

**Checked by.** A test asserts `sum(reasons) === score`.

## SCO-02 — The factors and their weights

| Factor          | Points  | Reasoning                                           |
| --------------- | ------- | --------------------------------------------------- |
| Problem area    | 5–25    | A defined problem outranks "not sure yet"           |
| Intent          | 8 or 20 | Asking for the paid diagnostic beats a general chat |
| Message detail  | 3–25    | Word count as a proxy for seriousness               |
| Email domain    | 5 or 15 | Work domain carries more signal than a consumer one |
| Company named   | 0 or 10 | Optional field; naming it is a small commitment     |
| Referral source | 0 or 10 | `utm_source=referral` only                          |

Capped at 100.

**Problem area points:**

| Area                   | Points |
| ---------------------- | ------ |
| `disconnected-systems` | 25     |
| `legacy-software`      | 25     |
| `manual-work`          | 20     |
| `new-product`          | 15     |
| `ai-opportunity`       | 12     |
| `not-sure`             | 5      |

The top two score highest because they map to Modernize and Automate — the
offers with the clearest scope and the shortest path to a proposal.

**Message detail bands:** ≥60 words → 25, ≥30 → 18, ≥12 → 10, below → 3.

## SCO-03 — A consumer email domain is not disqualifying

**Rule.** A personal address scores 5 rather than 15. It never zeroes the
score or blocks the lead.

**Why.** Plenty of founders use a personal address, and the buyer we most want
— an owner of a growing business — is exactly the person who might.

**Checked by.** An explicit test that a consumer domain still scores above
zero.

## SCO-04 — Above 70 is "hot"

**Rule.** `isHot(score)` is `score >= 70`. A hot lead changes the subject line
of the founder's notification to say it is worth answering today.

**Why.** A threshold that changes behaviour is useful; a number that changes
nothing is decoration.

## SCO-05 — Source is derived, never trusted

**Rule.** `leads.source` is computed from attribution, not accepted from the
client:

```
utmSource present  → 'referral' if utmMedium === 'referral' else 'campaign'
referrer present   → 'organic'
neither            → 'direct'
```

**Why.** A client-supplied `source` field is a field an attacker or a
misconfigured form can set to anything, and attribution nobody can trust is
attribution nobody should act on.

**Enforced at.** `deriveSource()`, called in the use case before persisting.

**Verified.** A submission carrying `utm_source=linkedin`, `utm_medium=cpc`
stored `source = 'campaign'`.

---

# Part 2 — Maturity scoring

`apps/api/src/modules/assessments/domain/scoring.ts`

## SCO-06 — At least six of nine answers

**Rule.** Fewer than six answered dimensions produces no result. The API
rejects the submission; the UI withholds the panel.

**Why.** A "level" drawn from two sliders is noise presented as a diagnosis,
and the whole credibility of the tool rests on the answer feeling earned.

**Enforced at.** `ScoreSubmitSchema` refinement (API) and `MIN_ANSWERS` in the
tool (UI).

**Verified.** A two-answer submission returned 400 with _"Answer at least six
of the nine to get a result."_

## SCO-07 — Weighted mean over answered dimensions only

**Rule.**

```
total = Σ(answerᵢ × weightᵢ) / Σ(weightᵢ)      for answered i only
level = clamp(round(total), 1, 5)
```

Unanswered dimensions are excluded from both sums — **not** treated as zero.

**Why.** Treating a blank as zero would punish someone for skipping a question,
which is the opposite of what skipping means.

**Weights:**

| Dimension                                   | Weight |
| ------------------------------------------- | ------ |
| Data, Automation, Integration               | 1.2    |
| Security                                    | 1.1    |
| Process, Technology, Reporting, Scalability | 1.0    |
| AI                                          | 0.8    |

Data, Automation and Integration carry more because they gate the others: you
cannot report well on data you do not trust, and you cannot automate across
systems that do not connect. AI carries least because it is the one dimension
where a low score is frequently the correct answer.

**Checked by.** A test proves the same raw numbers score lower when the low
values sit on heavy dimensions than on light ones.

## SCO-08 — Ties break toward the heavier dimension

**Rule.** When ranking the weakest two, equal scores are broken by descending
weight.

**Why.** If AI and Integration both score 1, Integration is named first —
fixing it unblocks more.

**Verified.** A submission with AI and Integration both at 1 named
`integration` first.

## SCO-09 — The result is free and ungated

**Rule.** No account, no email, and no cookie is required to see a result. The
score is computed in the browser and rendered immediately; persisting it is a
background call whose failure is never surfaced.

**Why.** The page says _"Nothing is sent, no email required."_ Gating it would
break a promise printed on the same screen. Computing client-first also means
the answer does not depend on the network.

**Enforced at.** `ScoreTool` computes locally, then `POST /api/score` in a
`useEffect` whose `.catch()` is deliberately silent — a failure costs the share
link, not the result.

**Checked by.** A test asserts the "no email is required" copy is on the page.

## SCO-10 — The email ask comes after the result

**Rule.** The opt-in for the PDF report renders only once a result exists, and
only once a share code has come back.

**Why.** `$100M Leads`: give the value first, then ask. The trade is honest
because the report genuinely contains more than the screen — a page per weak
dimension and the questions to ask your own team.

## SCO-11 — Share codes are short, unambiguous, and not the row id

**Rule.** Eight characters from a 31-letter alphabet excluding `0`, `o`, `1`,
`l` and `i`. Collision is retried up to five times against the unique index.

**Why.** Two reasons. A UUID in a forwarded URL looks like a tracking link,
which discourages the forwarding that is the entire point. And the code gets
read aloud and retyped, where `0`/`O` and `1`/`l` are the characters that go
wrong.

**Checked by.** A test generates 200 codes and asserts none contains an
excluded character.

## SCO-12 — Scoring configuration lives in the database

**Rule.** Dimensions, weights, questions, anchor wording and level copy are
rows in `score_dimensions` and `score_levels`. The seed never overwrites an
edited weight.

**Why.** The model will change as real submissions accumulate. A scoring model
hard-coded in a React component is a scoring model nobody improves.

**Enforced at.** `GET /api/score/config`; seed uses `update: { order }` only,
so tuning survives a redeploy.

---

## Worked example

Answers: Process 2, Technology 3, Data 1, Automation 2, AI 1, Security 3,
Integration 1, Reporting 2, Scalability 2.

```
Σ(answer × weight) = 2(1.0) + 3(1.0) + 1(1.2) + 2(1.2) + 1(0.8)
                   + 3(1.1) + 1(1.2) + 2(1.0) + 2(1.0)
                   = 19.9
Σ(weight)          = 9.5
total              = 2.09 → rounded 2
```

Weakest two: Data (1, weight 1.2) and Integration (1, weight 1.2), tied on
score and weight, resolved by iteration order.

Result: **Level 2 — Digital.** Matches the live system, which returned level 2
with `weakest: ['data', 'integration']`.
