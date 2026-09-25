# The Content Pipeline

What is editable without a deploy, what is not, and the plan to close the
difference.

Audited 2026-09-24 against the running system, endpoint by endpoint, rather
than from memory. Section 1 is a point-in-time record and will age as section 3
is delivered; the dated rows are the honest baseline to measure against.

---

## 1. The audit

### The chain

Content has to survive five links to be editable without a deploy. A break at
any one of them makes the rest irrelevant.

1. A database table exists
2. An admin API endpoint can write it
3. A BFF route exposes that endpoint to the browser
4. An admin screen offers a form
5. The public site reads the database rather than the repository

| Content type  | 1. Table  | 2. API       | 3. BFF | 4. UI     | 5. Public reads it |
| ------------- | --------- | ------------ | ------ | --------- | ------------------ |
| Solutions     | ✅ 5 rows | ⚠️ edit only | ❌     | list only | ❌ TypeScript      |
| Case studies  | ✅ 5 rows | ✅ full CRUD | ❌     | list only | ❌ TypeScript      |
| FAQs          | ✅ 7 rows | ✅ full CRUD | ❌     | list only | ❌ TypeScript      |
| Problems      | ✅ 5 rows | ❌           | ❌     | ❌        | ❌ TypeScript      |
| Articles      | ✅ 0 rows | ❌           | ❌     | ❌        | ❌ TypeScript      |
| Resources     | ✅ 0 rows | ❌           | ❌     | ❌        | ❌ TypeScript      |
| Score config  | ✅ 9+5    | ❌           | ❌     | ❌        | ❌ TypeScript      |
| Site settings | ✅ 9 rows | ⚠️ edit only | ✅     | ✅ editor | ❌ TypeScript      |

**Of 41 public routes, one reads the database**: `/score/r/[code]`, the shared
result page — and even that takes its dimension labels from TypeScript.

### The link that is easiest to miss

Link 3. The admin UI runs in a browser and can only reach the API through a
Next route handler, and the only ones that exist are:

```
/api/admin/login   /api/admin/logout   /api/admin/leads/[id]
/api/admin/roles/[id]   /api/admin/settings/[key]
```

There is no content route among them. So case studies have complete CRUD in the
API, correct permissions and an audit trail, and remain unreachable from the
browser. An endpoint with no route to it is indistinguishable from an endpoint
that does not exist.

### What is genuinely dynamic today

Not nothing, and worth stating precisely:

| Capability            | State                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Leads                 | Form → database → admin list → detail → stage changes. Complete.                                                          |
| Score submissions     | Answers → database → a `/score/r/xxxx` link that really resolves.                                                         |
| Roles and permissions | Full CRUD in the UI. A new role takes effect immediately, with no migration and no deploy. The original requirement, met. |
| Audit log             | Written on every mutation, viewable. Read-only by design.                                                                 |
| Settings              | Editable and saved — but no public page reads them, so changing one changes nothing a visitor can see.                    |

### How it came to be this way

Phase 2 built the public site from TypeScript modules to get the pages right.
Phases 3 and 4 built the schema, the permission engine and the admin shell. The
step that connects them was planned and never done, so both halves are finished
and neither is wired to the other.

It was recorded as the largest design-to-reality gap in the Logic Library, which
was honest. The admin content screen nevertheless describes itself as
"Everything the public site reads", which is not.

---

## 2. Target architecture

**Static by default, database-backed, revalidated on publish.**

```
Admin edits → API writes → API calls the web app's revalidate hook
                                 ↓
                    revalidateTag('solutions')
                                 ↓
        next request regenerates that page from /public/content/*
                                 ↓
               every other page keeps serving from cache
```

Three properties this has to keep, all of which the current site has and none
of which are worth trading for a CMS:

**An API outage must not take the marketing site down.** Pages are statically
rendered and served from cache. A failed revalidation serves the last good
version rather than an error. The site degrades to "slightly stale", which is
the correct failure for a brochure.

**A build must not require a running API.** CI builds the web and API images
independently, and the web image builds first. So `generateStaticParams` returns
an empty list when the API is unreachable and the routes render on demand
instead — fewer pages prerendered, nothing broken.

**One shape, one place.** Pages already consume typed objects. The mapping from
database row to that shape lives in one module, so page code barely changes and
the JSON columns never leak into components.

---

## 3. Plan

| #   | Step                                                     | Unlocks                                         | State |
| --- | -------------------------------------------------------- | ----------------------------------------------- | ----- |
| 1   | Content layer + revalidation                             | The mechanism. Nothing user-visible on its own. | Done  |
| 2   | Case studies read from the database                      | `/work` reflects what is in the admin           | Done  |
| 3   | Case study BFF + editor UI                               | Writing a case study without a deploy           | Done  |
| 4   | Solutions read from the database, plus create and delete | New categories without a deploy                 | Done  |
| 5   | FAQs, problems                                           | The remaining seeded types                      | Done  |
| 6   | Articles, resources                                      | Insights and Resources become publishable       | Done  |
| 7   | People: user CRUD and role assignment                    | Adding a colleague without a deploy             | Next  |

Steps 2 and 4 are the ones that change what a visitor sees. Step 1 is the
foundation and is deliberately boring.

### What step 4 delivered

Categories are rows. `SolutionKey` stopped being a union of the five that
shipped and became a string, because a closed union would have made the
compiler disagree with the data the moment a sixth was added — and the compiler
would have been wrong. In exchange, `getSolutionByKey()` returns
`Solution | undefined`, which forced every page to decide what to render when a
case study outlives the category it was filed under. They omit the label rather
than guess.

The API gained create and delete. Both permissions had existed since Phase 3;
only the endpoints were missing, which made five categories a fixed set in
practice while looking configurable in the permission matrix.

Verified by creating a sixth category through the admin as an editor. It
appeared on /solutions, on its own page, on the homepage, in the footer and in
the sitemap, five seconds after publishing. Deleting a category that case
studies reference is refused, and the message says how many and what to do
instead. `key` is immutable after creation and the field is disabled rather
than merely ignored. The test category and account were removed.

### What step 3 delivered

Case studies are writable from the admin: three BFF routes, a form that follows
the eight-part format in the order the page renders it, and publish, unpublish
and delete.

Verified by driving the browser as a real editor would — signed in on a
throwaway Editor account, wrote a case study, published it, and it was on
`/work` with its own detail page five seconds later. The honesty rule was then
tested from the same screen: unticking "example scenario" without a named,
approved client shows the reason inline, disables publish, and has the save
rejected. The database row was unchanged afterwards. The test data and the
account were removed.

### What steps 1 and 2 delivered

Case studies are now read from the database on `/work`, `/work/[slug]`, the
homepage, the solution pages and the sitemap. Publishing revalidates by tag
through the outbox, so the change reaches the site in seconds without a deploy.

Verified end to end: a row edited in the database, with a `content.changed`
event written in the same transaction, appeared on `/work` within five seconds
of the relay polling — and the whole web app still builds all 42 pages with the
API stopped, falling back to the repository baseline and saying so in the log.

### What step 5 delivered

FAQs and problem pages read from the database, and both are editable.

FAQs are edited in place on one screen rather than through a new-page-then-edit
-page flow: an FAQ is a question and an answer, they are read as a set, and
sending someone to another screen to change six words is how content stops
getting updated.

Problem pages got the API they never had — table, public endpoint and a full
set of permissions had existed since Phase 3 with no way to write them.

Verified: a question edited in the admin appeared on /assessment five seconds
later, in the visible list and in the FAQPage structured data, which come from
the same rows and therefore cannot disagree.

### What step 6 delivered

Articles and resources read from the database and are editable. Both tables had
existed since Phase 3 with no endpoints at all — not even public ones — which is
why /insights and /resources had never been publishable.

Article bodies are stored as typed blocks rather than HTML: HTML from an editor
is a sanitising problem forever and renders however the pasted markup felt like
rendering, while four block types validate and let the renderer decide how each
looks. Nobody authors JSON, though, so the editor speaks a four-line convention
and converts both ways, round-tripping so a typo fix does not rewrite the piece.

`publishedAt` is set on the first publish and never moved. It orders the index
and appears on the page, so republishing after a correction must not push a
year-old article back to the top.

The production build succeeds and all 96 browser checks displayed as passing,
but the runner did not exit cleanly after the final test. The authenticated
article/resource editor walkthrough is still pending. See ROADMAP.md.

The seed now preserves the existing article URLs and publishes the ungated score
tool; downloadable guides without files remain drafts. A published gated
resource has a detail page, validated email exchange, and a redacted file URL
in the public listing. Ungated files link directly. Publishing with no file or
tool link is refused. The authenticated editor walkthrough remains open.

### Step 7 is the same gap, one layer over

The People screen lists users and offers no way to add, edit or remove one, or
to change what role someone has. The cause is identical to the case studies:

| Link            | Users                    |
| --------------- | ------------------------ |
| 1. Table        | ✅                       |
| 2. API          | ✅ full CRUD on `/users` |
| 3. BFF route    | ❌ none                  |
| 4. Admin screen | ❌ read-only list        |

`POST`, `PATCH` and `DELETE` on `/users` have existed since Phase 3 with the
right permissions and audit entries, and the browser has never been able to
reach any of them. The role editor was built — the thing the original
requirement was really about — but assigning a role to a person was not.

It is listed last because it is not content, not because it is unimportant: a
second Owner is also the answer to the lockout risk in
[FAI-06](../LogicLibrary/07-failure-modes.md), which is currently mitigated by
a CLI rather than by there being someone else who can help.

### Explicitly not in this plan

- **Live preview of drafts.** Draft rows stay invisible to the public site.
  Worth building later; not required to publish.
- **Media uploads.** The `Media` table and MinIO exist; no upload UI. A case
  study needs no image to be useful.
- **Per-locale content.** The schema carries `locale` and everything is `en`.
  The column stays; nothing reads it yet.
