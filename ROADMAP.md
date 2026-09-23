# Roadmap

The single place that says what is done, what is next, and what is deliberately
not being done yet.

**Why this file exists.** Work on this project happens in long sessions that can
end abruptly — a context limit, a closed laptop, a week off. Anything held only
in a conversation is lost when that happens. This file is the handover: someone
picking the project up cold should be able to read it and know exactly where to
start, without reading a transcript.

**Keep it current in the same commit as the work.** A roadmap updated later is a
roadmap that is wrong in between, and a stale one is worse than none because it
is believed. If a step changes shape while being built, change the row.

Last updated: 2026-09-24

---

## Now

Order set by the founder on 2026-09-24: finish the content pipeline first, then
the admin's appearance.

1. **Step 7** — people: user CRUD and role assignment _(next)_
2. **[A1](#a1--the-admin-chrome-moves-between-screens)** — the admin chrome
   shifts between screens

**Step 6 shipped but is not fully verified.** The session ran short. Code,
types, lint and unit tests are green and it is deployed locally, but the
browser walkthrough — write an article in the admin, publish it, watch it
appear on /insights — was not run, and neither were the accessibility and
end-to-end suites. Do that first when picking this up:

```bash
pnpm turbo build --filter=@beekal/web
pnpm --filter @beekal/web test:a11y
pnpm --filter @beekal/web test:e2e
```

Then sign in at /admin/content and write one, the way an editor would. Every
other step in this pipeline was verified that way and each time it found
something a type check could not — a wrong payload shape, a form that saved but
did not publish.

---

## Content pipeline

Making the public site editable without a deploy. Full detail, including the
audit that prompted it, in [`docs/08-content-pipeline.md`](docs/08-content-pipeline.md).

| #   | Step                                    | State | Notes                                       |
| --- | --------------------------------------- | ----- | ------------------------------------------- |
| 1   | Content layer + revalidation            | Done  | Tag-based cache, revalidated via the outbox |
| 2   | Case studies read from the database     | Done  |                                             |
| 3   | Case study BFF + editor                 | Done  |                                             |
| 4   | Categories read from the database, CRUD | Done  | Answers "can I add a sixth category" — yes  |
| 5   | FAQs and problem pages                  | Done  | FAQs edited in place; problems get a form   |
| 6   | Articles and resources                  | Done¹ | Makes Insights and Resources publishable    |
| 7   | People: user CRUD and role assignment   | Next  | Same gap one layer over — API exists, no UI |

¹ Built and deployed, not yet walked through in a browser. See **Now** above.

### 6 — Articles and resources

Done. Both types read from the database, both have full CRUD, and both are
editable in the admin.

This is the one that matters for audience-building. The founder proposed a sixth
_Solution_ for education and consultancy; the counter-argument — accepted — was
that free, top-of-funnel material belongs under Insights and Resources, not in
the row that answers "what can I buy". That argument only held if publishing
there was actually easy, which it now is.

Article bodies are written as text, not JSON and not rich text:

```
## a heading
- a list item
> a quote — attribution
anything else is a paragraph; a blank line ends it
```

`toBlocks` / `toText` in `apps/web/src/features/admin/blocks.ts` convert both
ways and round-trip, so opening an article to fix a typo does not rewrite it.
Four tests cover that, including the case where a hyphen inside a quote must not
be mistaken for an attribution.

**Both tables are still empty.** The seed never populated them, so `/insights`
and `/resources` serve the repository baseline until something is written in the
admin. That is the fallback working as designed, not a fault.

### 7 — People

`POST`, `PATCH` and `DELETE` on `/users` have existed since Phase 3 with correct
permissions and audit entries. There is no BFF route and no form, so the People
screen lists users and can change nothing. Role assignment in particular is
missing, which is the half of "multi-user configurable for different roles" that
was never finished — the role _editor_ was built, assigning a role to a person
was not.

Also the practical fix for [FAI-06](LogicLibrary/07-failure-modes.md): a second
Owner is a better answer to lockout than a recovery CLI.

---

## Admin panel

### A1 — The admin chrome moves between screens

**Reported:** 2026-09-24, by the founder. "The topbar changes for every menu
click to different menu. Feels unstable and not smooth to work."

**To investigate:** whether the header is re-rendering per route rather than
persisting in the layout, whether its height changes with the page title, and
whether navigation is a full document load rather than a client transition.

**Done when:** the chrome does not move, shift height, or flash between admin
screens, and the current section stays obvious.

---

## Known gaps, carried

Tracked in detail in [`LogicLibrary/07-failure-modes.md`](LogicLibrary/07-failure-modes.md).
Listed here so they are visible next to the plan rather than only in a document
about failure.

| Gap                                       | Consequence                           | Priority |
| ----------------------------------------- | ------------------------------------- | -------- |
| No media upload UI                        | No images on case studies or articles | Medium   |
| Slug change writes no redirect            | A renamed page 404s                   | Medium   |
| No retry for a lead sent during an outage | That lead is lost                     | Medium   |
| 24-month lead purge not scheduled         | A retention promise done by hand      | Medium   |
| Data export/delete not one-click          | A privacy promise done by hand        | Medium   |
| Redis cache handler not wired             | Breaks at the second container        | Low      |

---

## Decisions that close questions

Recorded so they are not reopened by accident. Reasoning in
[`LogicLibrary/06-decision-log.md`](LogicLibrary/06-decision-log.md).

- **No sixth Solution for education or consultancy.** Free material belongs in
  Insights and Resources. Agreed 2026-09-24.
- **Case studies stay labelled as example scenarios** until there is a named
  client who has approved in writing. Enforced by a database constraint, not
  only by policy.
- **The maturity score sits in the main navigation** as the deliberate sixth
  item, against the five-item rule. The founder's call, 2026-09-24.

---

## Waiting on the founder

Nothing here is blocked on engineering.

- The domain: `www` or apex
- The Assessment price, or the range to publish
- A real founder photograph
- The WhatsApp number, if one should appear
- Legal entity name and registration number for the footer
