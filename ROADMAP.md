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

Last updated: 2026-09-26

---

## Now

The founder paused the admin redesign to mature the public homepage. That
homepage pass is complete; the reusable admin panel remains next.

1. **[A2](#a2--a-reusable-admin-panel-and-navigation-system)** — reusable
   sidebar and nested admin navigation _(next)_

**Step 6 is verified.** The production build, accessibility checks, and browser
suite pass. Pointing Playwright at the running Docker web app avoids the
child-server shutdown hang:

```bash
$env:E2E_BASE_URL='http://localhost:3000'
pnpm --filter @beekal/web exec playwright test --workers=2
```

The suite exited cleanly: 100 passed, 4 intentionally skipped without disposable
Editor/administrator credentials. Separate authenticated runs passed draft, publish, edit,
gated download, unpublish, and cleanup. It found and fixed an API existence check
that incorrectly looked for an FAQ when editing or deleting an article/resource.

---

## Content pipeline

Making the public site editable without a deploy. Full detail, including the
audit that prompted it, in [`docs/08-content-pipeline.md`](docs/08-content-pipeline.md).

| #   | Step                                    | State | Notes                                                           |
| --- | --------------------------------------- | ----- | --------------------------------------------------------------- |
| 1   | Content layer + revalidation            | Done  | Tag-based cache, revalidated via the outbox                     |
| 2   | Case studies read from the database     | Done  |                                                                 |
| 3   | Case study BFF + editor                 | Done  |                                                                 |
| 4   | Categories read from the database, CRUD | Done  | Answers "can I add a sixth category" — yes                      |
| 5   | FAQs and problem pages                  | Done  | FAQs edited in place; problems get a form                       |
| 6   | Articles and resources                  | Done  | Makes Insights and Resources publishable                        |
| 7   | People: user CRUD and role assignment   | Done  | Secure invite/setup, user and role management, browser-verified |

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

The seed now inserts the three existing articles and the score tool when rows
are absent. The three unfinished checklists remain drafts because they have no
files. The repository baseline is used when the API is unavailable, not when a
database table is empty. Gated downloads now have a detail page and the public
API redacts their file URLs; ungated resources link directly. Publishing a
resource without a file or tool link is refused.

The authenticated editor walkthrough passed against Docker, and its disposable
records were removed. Side-by-side review of the legacy HTML and current page
confirmed the hero diagram and connector animation match; the newer multi-page
layout intentionally differs in typography and spacing. Today/Tomorrow and
reduced-motion states now have browser tests. Founder visual review is welcome
but does not block Step 7.

### 7 — People

Invite, update, suspend, and delete now have BFF routes and People controls.
An invitation is a random 256-bit link stored only as a hash, expiring after
48 hours and consumed once. SMTP delivers it in production; the local console
mailer shows a copy link. The existing email-as-token setup path is removed.
Custom roles can be created through the permission matrix; seeded system roles
are protected from deletion. A disposable browser walkthrough passed invite,
setup, replay refusal, login, role creation/assignment, immediate permission
refresh, suspension, deletion, and sign-out revocation. It also checked the
People page at tablet width in both themes. The API unit suite passed 109 tests;
the ordinary browser suite passed 100 with four credential-gated skips. Test
users/roles and invitation links were removed. This completed Step 7.

The browser walkthrough found two adjacent issues and fixed them: the admin
header overflowed at tablet width, and sign-out redirected to the container's
`0.0.0.0` bind address instead of the public app URL.

Also the practical fix for [FAI-06](LogicLibrary/07-failure-modes.md): a second
Owner is a better answer to lockout than a recovery CLI.

---

## Public website

### H1 — Homepage visual and business hierarchy

**Requested:** 2026-09-26, by the founder. The homepage was still too text-heavy;
“What we fix” and “Solutions” repeated the same idea. Add an infographic,
timeline or flow illustration, and improve the buying story as well as the UI.

**Implemented:** The legacy Today/Tomorrow hero remains. Five live problem
records now appear as a concise symptom selector next to an illustrative
handoff diagram. The repeated before/after table and separate Assessment
teaser became one three-step visual path: trace real work, rank fixes, then
choose who builds. It states that the Assessment is paid and fixed-scope,
shows duration, client time and document count, and makes ownership of the
roadmap explicit. Solution records remain linked as a compact capability index
**after** the decision, with Care visually separated as continuity. The free
Score entry moved beside the symptoms. Case-study integrity labels remain.

**Done when:** the revised home renders without horizontal overflow at 320px,
passes light/dark accessibility, retains the hero's Today/Tomorrow behavior,
and routes the problem, Score, Assessment, solution and proof links correctly.

**Completed 2026-09-26.** The production web build is live locally. The main
content measures 537 visible words against the 550-word ceiling; first-load JS
remains about 123KB. The full browser suite passed 104 tests with six
credential-gated skips. It covers the legacy hero interaction, home links,
320/412/768px overflow, and light/dark accessibility on mobile and desktop.
Founder visual review is welcome; keep A2 next.

**Founder follow-up, completed 2026-09-26:** In the connected Tomorrow state,
each of the six nodes now keeps sending a signal into the centre. The bee
remains stationary; experimental spin and forward-motion treatments were
removed after founder review. Signals stop on Today, pause while the diagram
or tab is out of view, and stay off for reduced motion. In the "After the plan"
capability links, the Beekal prefix is smaller
and Build, Modernize, Automate, AI and Care lead visually. Mobile and desktop
browser regressions cover the repeating flow and name hierarchy. A2 remains
the next planned work after founder visual review.

### H2 — Homepage visual refinement

**Requested:** 2026-09-27, by the founder. Make the homepage more professional,
especially buttons, typography, spacing, and the example-scenario section.

**Implemented:** Homepage calls to action share a measured corner radius and
type treatment. The hero headline and trust strip have calmer weight and
spacing. The everyday handoff illustration is now a readable four-step flow.
The work previews use a consistent friction/approach hierarchy, a single
section-level disclosure, and no illustrative result metrics on the homepage.
The repeated solution-section lede was removed. The full case pages retain
their detailed content and integrity labels.

**Verified:** 320/412/768px overflow checks, light/dark accessibility, and
the homepage journeys pass on mobile and desktop. Keep A2 next after visual
review.

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

**Completed 2026-09-26.** Authenticated browser measurements showed the admin
layout persisted across client navigation and the desktop header stayed 65px
high. On mobile, opening the menu enlarged the sticky header from 65px to
374px and pushed the content down; the menu now overlays it. The mobile Content
page also expanded to 913px because its grid track used an automatic minimum;
it now remains within 320–412px viewports. Mobile active navigation has the
same `aria-current` and selected styling as desktop. A production-browser
regression covers desktop, tablet, mobile, light/dark, keyboard menu use,
reduced motion, reload, active route, and shell geometry. The ordinary suite
passes 100 tests with six credential-gated skips; the separate authenticated
chrome test passes on mobile and desktop.

### A2 — A reusable admin panel and navigation system

**Requested:** 2026-09-26, by the founder. The admin should feel like one
coherent product: stable sidebar, menu, nested and multi-level child menus,
logo/title, and consistent UI and UX on every screen.

**Plan:** Replace the flat, topbar-only navigation with one permission-aware
navigation tree shared by a persistent desktop sidebar and an overlay mobile
drawer. Extract reusable shell parts (brand, sidebar, topbar, navigation tree,
breadcrumbs/page heading, and content frame) with shared spacing and colour
tokens. The current route must highlight its leaf and ancestors; expanding one
branch must not shift the content frame. Content types and People roles provide
the first real nested routes. Keep unavailable sections hidden according to the
existing permission map. Do not create empty menu levels merely to demonstrate
depth.

**Done when:** the shell is reused by every admin route; nested levels work by
mouse, touch, and keyboard; mobile navigation overlays rather than reflows;
focus, active, and expanded states are clear in light/dark and reduced-motion
modes; and browser tests cover routes, permissions, and geometry.

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
