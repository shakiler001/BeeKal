# Beekal — Information Architecture and Content Plan

Where every page lives, what job it does, and where each piece of the demo's
3,100 words ends up.

---

## 1. The principle

The demo is one page doing nine jobs. The site is many pages, each doing one, with
the homepage acting as a **router**: it qualifies the visitor by problem and sends
them somewhere that finishes the argument.

This solves the stated problem (too much text in one place) and an unstated one:
a single URL cannot rank for four different search intents, and a founder cannot
paste a useful link into a WhatsApp reply when everything is one anchor on one
page.

Three-second test for every page: _whose question does this answer, and what is
the one next step?_ If a page cannot answer that, it merges into another.

---

## 2. Sitemap

```
/                                 Homepage — qualify and route
/assessment                       THE money page
/solutions                        The five categories, at a glance
  /solutions/build
  /solutions/modernize
  /solutions/automate
  /solutions/ai
  /solutions/care
/problems/manual-work             Cold-traffic landing pages, one per problem.
/problems/disconnected-systems    Each mirrors a homepage card and is the paid /
/problems/legacy-software         cold-outreach destination for that intent.
/problems/ai-opportunity
/problems/new-product
/work                             Case study index, filterable by solution
  /work/[slug]                    One case study, eight-part format
/method                           UNDERSTAND - SIMPLIFY - SYSTEMIZE - AUTOMATE - IMPROVE
/score                            Maturity score tool, its own URL so it is linkable
/resources                        Lead magnet library
  /resources/[slug]               One resource, with the gate
/insights                         Articles index
  /insights/[slug]                One article
/about                            Founder, how Beekal works, how risk is managed
/contact                          The form, plus direct contact
/privacy   /terms                 Legal
```

Reserved, not built yet: `/portal` (client portal), `/products` (when
productization begins), `/careers`.

### Navigation

Header, five items maximum — a long nav is a company that has not decided:

```
Solutions (dropdown)   Work   Assessment   Method   Insights   [Request an assessment]
```

"Solutions" is the only dropdown. `/problems/*` pages are intentionally **not** in
the nav — they are landing pages for cold traffic, reached from the homepage cards
and from ads, and they would dilute the nav if listed.

Footer carries the full map, including the `/problems/*` set for crawl depth.

---

## 3. Page specifications

Word budgets are ceilings, not targets. `[Tier 1/2/3]` refers to the disclosure
tiers in [01-strategy-offers-and-copy.md](01-strategy-offers-and-copy.md).

### 3.1 `/` Homepage

**Job:** in eight seconds, make the visitor think _"that is us"_, then route them.
**Budget:** 550 words visible. The demo has roughly 3,100.

| #   | Section                                          | Tier | Budget | Source             | Change                                                                         |
| --- | ------------------------------------------------ | ---- | ------ | ------------------ | ------------------------------------------------------------------------------ |
| 1   | Hero: H1, lede, two CTAs, before/after animation | 1    | 45     | demo hero          | **Keep as is.** The H1 and the animation are the strongest assets on the page. |
| 2   | Trust strip: location, email, reply time         | 1    | 25     | demo               | Keep                                                                           |
| 3   | Buyer's-own-words pull quote                     | 1    | 20     | demo               | Keep. Best line on the site.                                                   |
| 4   | Five problem cards, linking to `/problems/*`     | 2    | 120    | demo `#problems`   | Keep the five, cut each body to one sentence, **make each a link**             |
| 5   | Before / After transformation                    | 2    | 80     | demo `#outcome`    | Keep, tighten                                                                  |
| 6   | Five solution cards, linking to `/solutions/*`   | 2    | 100    | demo `#solutions`  | Keep names and one line each; details move to their own pages                  |
| 7   | Assessment teaser                                | 1    | 60     | demo `#assessment` | **Reduce to a teaser.** The full section becomes `/assessment`                 |
| 8   | Two case study cards plus "see all"              | 2    | 70     | demo `#cases`      | **Cut from five to two.** The other three live at `/work`                      |
| 9   | Score tool teaser                                | 1    | 30     | demo `#score`      | **Teaser only.** Tool moves to `/score`                                        |
| 10  | Founder strip                                    | 2    | 60     | demo `#founder`    | Condense; full version at `/about`                                             |
| 11  | Final CTA plus form                              | 1    | 50     | demo `#start`      | Keep                                                                           |

**Removed from the homepage entirely:** the method steps (to `/method`), the risk
section (to `/about#risk`), the seven-question FAQ (to `/assessment`), three case
studies (to `/work`), the nine-slider tool (to `/score`).

### 3.2 `/assessment`

**Job:** convert a warm visitor into a booked Assessment. This is the money page
and the only page allowed to be long — a buyer reading it is already considering
a purchase, and here length signals thoroughness.
**Budget:** 1,400 words, heavily tiered.

Sections, in `$100M Offers` order — problem, then outcome, then mechanism, then
proof, then risk reversal, then ask:

1. H1 plus promise — _"See what to fix first, before you spend on building."_ [T1]
2. Who it is for, and who it is not for [T2] — the disqualifier raises conversion
3. The four facts: duration, your time, price, what you receive [T1] — the demo's
   `takes` block, kept
4. What we examine — thirteen items [T3, accordion, open by default]
5. What you receive — eleven documents, each reframed as the fear it answers
   (table in doc 01, section 3.2) [T3, accordion]
6. The sample roadmap artefact [T2] — the demo's `doc` figure, kept; it is proof
   of format
7. How the two to three weeks actually run, week by week [T3]
8. Risk reversal, all three lines [T1]
9. FAQ, all seven questions [T3, accordions] — moved here from the homepage, which
   is where they belong: they are booking objections
10. Book CTA plus form [T1]

### 3.3 `/solutions/[category]` — five pages

**Job:** the page the founder pastes into a reply when someone asks "do you do X?"
**Budget:** 700 words each. Identical structure across all five:

1. The outcome, as a headline. Never the technology.
2. Three signs you need this — the reader's symptoms in their words
3. What we actually do — where technology is finally allowed to appear
4. What changes — before and after, specific to this category
5. One relevant case study, pulled live from `/work`
6. How it starts: "most of these begin with an Assessment" plus CTA

Per-category emphasis: **Build** — the discovery-first argument. **Modernize** —
_"keep the logic, remove the limits"_, the strongest differentiator in the market
and the one that separates Beekal from rebuild-everything shops. **Automate** —
concrete process examples, fastest payback, best small first engagement.
**AI** — practical framing, explicit about where AI is the wrong answer; that
honesty sells better than enthusiasm. **Care** — improvement, never maintenance;
this page sells the annuity.

### 3.4 `/problems/[problem]` — five pages

**Job:** cold-traffic and ad destination. Matches the ad's promise exactly.
**Budget:** 450 words. Deliberately narrower than a solution page.

Structure: the symptom as a headline, a short diagnostic ("if three of these five
are true..."), what usually causes it, what fixing it looks like, one proof point,
one CTA. Single intent, single ask, no nav distractions beyond the header.

These exist so a paid click about manual work does not land on a general homepage.
They are near-duplicates in structure and distinct in content — which is fine for
search as long as the body copy genuinely differs. It must.

### 3.5 `/work` and `/work/[slug]`

Index: filterable by solution category, card per case. Each card carries the
illustrative badge if the flag is set.

Detail pages keep the demo's eight-part format, which is the best thing in the
current copy:

```
Client / context -> Problem -> What was happening before -> Diagnosis
-> What Beekal changed -> How it was built -> Result -> Lesson
```

The **Lesson** section — what we would do differently — stays mandatory. It is the
most credible element on the site precisely because no one fakes a lesson learned.

Every case study renders the illustrative badge automatically until the
`is_illustrative` flag is cleared by an editor with a named, approved client.

### 3.6 `/score`

The demo's tool, moved to its own URL and given a backend.

Changes: results become linkable via a short code (`/score/r/a7f3k2`) so a COO can
send their result to the CEO — which is organic distribution the current version
cannot do. The optional PDF email step appears **after** the result. Submissions
persist to Postgres for aggregate benchmarking, which becomes publishable content
of its own once the sample is large enough ("the average Dhaka manufacturer scores
2.3 on Integration").

Unchanged: nine dimensions, five levels, the radar chart, instant results, no
email required to see them.

### 3.7 Remaining pages

| Page                                 | Job                                                                          | Budget         |
| ------------------------------------ | ---------------------------------------------------------------------------- | -------------- |
| `/solutions`                         | Overview and router to the five                                              | 350            |
| `/method`                            | Publish the methodology; proof by process                                    | 800            |
| `/about`                             | Founder, how Beekal works, how risk is managed (absorbs the demo's `#risk`)  | 900            |
| `/resources` and `/resources/[slug]` | Lead magnet library and gate                                                 | 200 + per item |
| `/insights` and `/insights/[slug]`   | Article index and articles                                                   | per article    |
| `/contact`                           | Form plus direct contact                                                     | 150            |
| `/privacy`, `/terms`                 | Legal. The demo's privacy copy is good and honest — expand it, keep its tone | —              |

---

## 4. Demo content disposition — complete mapping

Every section of `beekal-website-demo.html`, accounted for:

| Demo section                           | Disposition                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `<head>` meta, JSON-LD                 | **Port and extend.** Becomes per-page `generateMetadata` plus a schema helper                           |
| Design tokens, dark theme              | **Port verbatim** to Tailwind config. Contrast is already verified — do not re-derive                   |
| SVG sprite (bee, lockup, icons)        | **Port** to a sprite component                                                                          |
| Header, nav, theme toggle, mobile menu | **Port**, extend nav for multi-page                                                                     |
| Hero: H1, lede, CTAs                   | **Keep verbatim.** Already correct                                                                      |
| Hero before/after animation            | **Port.** Highest-value interaction on the site                                                         |
| Hero quote, trust strip                | **Keep verbatim**                                                                                       |
| `#problems` five cards                 | **Keep on homepage, shortened.** Full versions become `/problems/*`                                     |
| `#outcome` before/after                | **Keep, tighten**                                                                                       |
| `#solutions` five cards                | **Keep as teasers.** Full versions become `/solutions/*`                                                |
| `#cases` five case studies             | **Two on homepage, all five to `/work`.** Keep the eight-part format and the illustrative badges        |
| `#assessment` full section             | **Becomes `/assessment`.** Homepage gets a teaser                                                       |
| `#assessment` sample roadmap figure    | **Keep** on `/assessment`. Proof of format                                                              |
| `#assessment` FAQ (7 questions)        | **Move to `/assessment`.** They are booking objections, not homepage content                            |
| `#method` five steps                   | **Becomes `/method`.** Homepage gets a one-line mention                                                 |
| `#method` "how an engagement runs"     | **To `/method`**                                                                                        |
| `#risk` section                        | **To `/about#risk`.** Valuable, wrong place — it answers a question asked later                         |
| `#score` nine-slider tool plus radar   | **Becomes `/score`.** Homepage gets a teaser                                                            |
| `#founder`                             | **Condense on homepage, full at `/about`.** Needs the real photo                                        |
| `#start` form                          | **Keep on homepage; also `/contact`.** Wire to the real API                                             |
| Footer, privacy accordion              | **Port.** Privacy expands into `/privacy`                                                               |
| Sticky mobile dock                     | **Port.** Works, keep                                                                                   |
| All form validation and a11y JS        | **Port as React**, preserving behaviour: inline errors, focus management, live regions, no-JS fallbacks |
| `TODO Shakil` comments                 | **Become admin fields plus the checklist** in `00-master-plan.md` section 7                             |

Nothing is discarded. The heaviest sections become their own pages, which is what
the word "handle" in the brief needs to mean.

---

## 5. Content model implications

Because content lives in Postgres and an Editor must publish without a deploy,
these page sections become editable records rather than JSX:

| Entity                             | Drives                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `pages` plus `page_sections`       | Homepage section order, headings, copy, per-page SEO                        |
| `problems`                         | Homepage cards **and** `/problems/*` — one record, two renderings           |
| `solutions`                        | Homepage cards **and** `/solutions/*`                                       |
| `case_studies`                     | `/work`, homepage cards, the per-solution case pull                         |
| `faqs`                             | `/assessment` FAQ, plus the `FAQPage` JSON-LD, generated from the same rows |
| `resources`                        | `/resources` and the gate                                                   |
| `articles`                         | `/insights`                                                                 |
| `score_dimensions`, `score_levels` | The `/score` tool's questions and result copy                               |
| `offer_facts`                      | The four Assessment facts, including price                                  |
| `settings`                         | Contact details, social links, the toggles behind every founder TODO        |

Two rules that follow:

1. **The FAQ JSON-LD is generated from the FAQ rows**, never hand-written. The
   demo notes that its schema mirrors the visible FAQ word-for-word; making that
   structural means it cannot drift and quietly break the rich result.
2. **A problem or solution is one record rendered two ways** — card and page. The
   homepage card is not a separate copy of the words, or the two will diverge
   within a month.

Full schema in [04-data-model-and-rbac.md](04-data-model-and-rbac.md).

---

## 6. URL and linking rules

- Lowercase, hyphenated, no trailing slash, no dates in article URLs (they age
  content that is still true)
- Slugs are stable; changing one writes a 301 into a `redirects` table
  automatically, managed in the admin
- Every page has exactly one canonical, one H1, and one primary CTA
- Every leaf page links up to its parent and across to one sibling — the demo's
  `bridge` element already does this well and is ported
- `/problems/*` and `/solutions/*` cross-link: the problem page names the solution,
  the solution page names the problems it fixes
- Locale prefixing is configured from day one; with only `en` active it emits no
  prefix, so adding `/bn` later changes no existing URL
