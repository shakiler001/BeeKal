# Content Lifecycle

How content moves from draft to public, and what must be true at each step.
Applies uniformly to solutions, problems, case studies, FAQs, articles and
resources.

---

## The state machine

```
          ┌─────────────────────────────────────┐
          │                                     ▼
      ┌───────┐        ┌───────────┐       ┌──────────┐
      │ DRAFT │ ─────► │ IN_REVIEW │ ────► │ PUBLISHED│
      └───────┘ ◄───── └───────────┘       └──────────┘
          ▲   │              │                   │
          │   └──────────────┼───────────────────┤
          │                  ▼                   ▼
          │            ┌──────────┐              │
          └─────────── │ ARCHIVED │ ◄────────────┘
                       └──────────┘
```

| From        | May go to                            |
| ----------- | ------------------------------------ |
| `DRAFT`     | `IN_REVIEW`, `PUBLISHED`, `ARCHIVED` |
| `IN_REVIEW` | `DRAFT`, `PUBLISHED`, `ARCHIVED`     |
| `PUBLISHED` | `DRAFT`, `ARCHIVED`                  |
| `ARCHIVED`  | `DRAFT` only                         |

---

## LIF-01 — Archived content returns as a draft

**Rule.** `ARCHIVED → PUBLISHED` is not a legal transition. Archived content
must pass back through `DRAFT`.

**Why.** Something was archived for a reason. Republishing straight from the
archive skips whatever review caused it to be archived in the first place —
usually that it had become untrue.

**Enforced at.** `canTransition()` in
`apps/api/src/modules/content/domain/publishing.ts`.

**Violation.** Content that was pulled for being wrong quietly returns, still
wrong.

---

## LIF-02 — Publishing requires its own permission

**Rule.** The transition to `PUBLISHED` requires `<resource>:publish`,
checked independently of the `:update` permission that allowed the edit.

See [ACC-06](02-access-logic.md#acc-06--publishing-is-a-separate-permission-from-editing).

---

## LIF-03 — Publication is validated, not assumed

**Rule.** Before any record reaches `PUBLISHED`, `validateForPublish()` must
pass: a non-empty SEO title, a non-empty SEO description, and alt text on every
referenced image.

**Why.** These are the three things that are invisible when missing. A page
with no meta description does not look broken; it just quietly underperforms
forever.

**Enforced at.** `validateForPublish()`, called on every status transition to
`PUBLISHED`. Returns all problems at once rather than the first, so an editor
fixes them in one pass.

---

## LIF-04 — The public site reads published rows only

**Rule.** Every public query filters `status = 'PUBLISHED' AND deleted_at IS
NULL` in the `WHERE` clause.

**Why.** Filtering in the query means an unpublished row never leaves the
database. Filtering afterwards means a draft was in memory, one serialisation
bug from being visible.

**Enforced at.** `PublicContentController` — every method filters in the query.

---

## LIF-05 — Deletion is soft for anything a human wrote

**Rule.** Content delete sets `deleted_at` and `status = 'ARCHIVED'`. The row
survives.

**Why.** The audit trail must keep pointing at something real, and "deleted the
wrong one" is a recoverable mistake only if the row is still there.

**Enforced at.** `ContentController.deleteCaseStudy` and `.deleteFaq` issue an
`UPDATE`, never a `DELETE`.

**Exception.** A lead deleted on request under the privacy policy is hard
deleted, with the deletion itself recorded in the audit log. That is the one
case where the point is that the data is gone.

---

## LIF-06 — A slug change never breaks a link

**Rule.** Changing a published slug writes a 301 into `redirects`.

**Why.** A URL that has been shared, linked or indexed outlives the reason it
was renamed.

**Enforced at.** `redirects` table and middleware exist. Automatic capture on
slug change is **not yet implemented** — currently an editor must add the
redirect manually.

**Status:** Conventional. This is a gap, listed here so it is a known one rather
than a surprise. Raising it to Guarded means writing the redirect inside the
same transaction as the slug update.

---

## LIF-07 — A case study cannot claim a client it does not have

The core content-integrity rule. Stated in full at
[INV-01](01-invariants.md#inv-01--a-case-study-cannot-claim-to-be-real-without-an-approved-named-client).

Three layers, deliberately:

| Layer    | Mechanism                    | Purpose                                            |
| -------- | ---------------------------- | -------------------------------------------------- |
| Database | `CHECK` constraint           | Cannot be bypassed by any code path                |
| API      | `validateCaseStudyClaim()`   | Explains the rule in words before Postgres refuses |
| Contract | `CaseStudyPublishableSchema` | The UI can prevent the mistake before submission   |

On a partial update the API validates the **merged** state, not the patch —
flipping `isIllustrative` to false without supplying a client name is caught
even though the patch itself contains only one field.

---

## LIF-08 — The illustrative badge renders from the flag

**Rule.** The "Example scenario" badge is derived from `is_illustrative`. It is
never written into copy.

**Why.** If the badge were text, the flag and the page could disagree. Deriving
it means the page cannot claim something the database denies.

**Enforced at.** `IllustrativeBadge` rendered conditionally in `CaseCard` and
on the detail page.

**Checked by.** An E2E test asserts the badge appears on `/work` — so a break
in either the flag or the rendering fails the build.

---

## LIF-09 — An illustrative case study is not indexed

**Rule.** A case study with `isIllustrative: true` emits `noindex`, gets no
`Article` structured data, and is excluded from `sitemap.xml`.

**Why.** Three signals that must agree. Listing a `noindex` URL in a sitemap
tells Google two contradictory things; emitting `Article` schema for a
hypothetical presents an invented result as a real one.

**Enforced at.** `generateMetadata` sets robots; `caseStudySchema()` returns
`null` for illustrative cases; `sitemap.ts` filters them out.

**Checked by.** An E2E test asserts `noindex` is present in the served HTML.

---

## LIF-10 — Structured data is generated, never hand-written

**Rule.** JSON-LD is built from the same records the page renders.

**Why.** The original demo noted that its FAQ schema mirrored the visible FAQ
_word for word_. Generating both from one source makes that a guarantee rather
than a discipline — they cannot drift, and a drifted FAQ schema silently loses
the rich result.

**Enforced at.** `apps/web/src/lib/schema.ts`. `faqSchema()` takes the same
`FAQS` array the accordion renders.

**Deliberately absent.** `Review` and `AggregateRating`: there are no genuine
reviews, and fabricating them is both dishonest and a manual-action risk.
`Offer` with a price: no published price exists yet.

---

## LIF-11 — Content is data, not code

**Rule.** Solutions, problems, case studies, FAQs, settings and score
configuration are database rows. An Editor changes them without a developer.

**Why.** It is what makes the admin panel worth building, and what makes the
"no deploy to fix a fact" property real.

**Current status, stated honestly.** The rows exist and the seed populates them
from the site's own content modules — 22 rows on first run. The public site
still renders from the TypeScript modules in `apps/web/src/content/`, which are
the seed source. Switching the public pages to read the database is the
remaining step; the tables, the API and the admin read paths are all in place.

Until then, a content edit in the admin changes the database but not the
rendered site. This is the single largest gap between the documented design and
the running system, and it is listed here rather than buried.

---

## Publishing checklist

What an editor should confirm before publishing. Items marked ✓ are enforced;
the rest are judgement.

| Check                                  | Enforced  |
| -------------------------------------- | --------- |
| SEO title present                      | ✓         |
| SEO description present                | ✓         |
| Alt text on every image                | ✓         |
| Case study client claim is supportable | ✓         |
| Slug is lowercase and hyphenated       | ✓ (regex) |
| No banned vocabulary                   | —         |
| Reads in the Beekal voice              | —         |
| Claims are checkable or labelled       | —         |
