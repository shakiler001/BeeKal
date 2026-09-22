# Beekal — Data Model, RBAC Engine and Admin Panel

The requirement is *"admin panel should be multi user configurable for different
roles"*. Read strictly, that means roles are **data**, not code: the founder can
create a role, tick the permissions it has, and assign it — without a developer
and without a deploy. Everything below follows from taking that literally.

---

## 1. The access model

### Why not the obvious approach

A `users.role` enum column is what most projects ship. It fails the requirement on
the first real request: *"let the new marketing hire edit articles and see leads,
but not delete anything or touch users."* That is a new role, which under an enum
is a migration, a code change and a deploy.

### What we build instead: RBAC with a permission catalog, plus scope

Three layers, each earning its place:

1. **Permissions** — atomic `resource:action` strings. A fixed catalog defined in
   code, because permissions correspond to things the code can actually do. New
   permissions arrive with new features; they are seeded on boot.
2. **Roles** — named bundles of permissions, **created and edited in the UI**.
   This is the configurable layer.
3. **Scope** — a modifier on a grant that answers *which rows*: `all`, `own`, or
   `assigned`. This is what separates "can read leads" from "can read **my**
   leads", and it is the difference between a toy and a usable system.

Layer 3 is ABAC-flavoured, kept deliberately small. Full attribute-based policy
evaluation is more than this business needs and is hard to reason about in a UI.

### The permission catalog

```
Content    page:read|update
           section:read|create|update|delete|reorder
           solution:read|create|update|delete|publish
           problem:read|create|update|delete|publish
           case_study:read|create|update|delete|publish
           faq:read|create|update|delete
           article:read|create|update|delete|publish
           resource:read|create|update|delete|publish
           media:read|upload|delete

Funnel     lead:read|update|assign|delete|export
           lead_note:create|read
           pipeline:read|update
           score_submission:read|export
           score_config:read|update

Messaging  email_template:read|create|update|delete
           sequence:read|create|update|delete|activate

Insight    analytics:read
           report:read|export

Platform   user:read|create|update|deactivate|delete
           role:read|create|update|delete
           setting:read|update
           redirect:read|create|update|delete
           audit:read
           feature_flag:read|update
```

Roughly 55 permissions. Grouped in the UI so nobody is asked to reason about a
flat list.

### Seeded roles

Starting points, all editable, none special-cased in code except the first:

| Role | Shape of access |
|---|---|
| **Owner** | Everything. Cannot be deleted, cannot lose `role:update`. Exactly one is guaranteed to exist. |
| **Admin** | Everything except deleting the Owner or editing the Owner role |
| **Editor** | Full content and media, publish rights, read-only analytics |
| **Marketer** | Content plus resources plus articles plus sequences; leads read and export; analytics |
| **Sales** | Leads (scope `assigned`), pipeline, notes, score submissions; content read-only |
| **Delivery** | Case studies (create and update, not publish), leads read-only, media |
| **Analyst** | Read-only everywhere, plus exports. Nothing else. |
| **Support** | Leads read, notes create. Reserved for Beekal Care's ticket queue. |

The Owner protections are the only hard-coded access rules in the system. They
exist to make lockout impossible: the last Owner cannot be deleted, deactivated,
or stripped of `role:update`. Every other rule is data.

---

## 2. Schema

Prisma syntax, abbreviated. Conventions throughout: UUID v7 primary keys
(time-sortable, so they index well), `created_at` / `updated_at` / `deleted_at` on
every table, soft delete for anything a human authored, `snake_case` in Postgres
mapped to `camelCase` in the client.

### 2.1 Identity and access

```prisma
model User {
  id            String    @id @default(dbgenerated("uuidv7()"))
  email         String    @unique
  passwordHash  String?           // null while an invite is pending
  name          String
  avatarMediaId String?
  status        UserStatus @default(INVITED)  // INVITED ACTIVE SUSPENDED
  lastLoginAt   DateTime?
  mfaSecret     String?
  mfaEnabledAt  DateTime?
  locale        String    @default("en")
  roles         UserRole[]
  sessions      Session[]
  auditEntries  AuditLog[]
  @@index([status])
}

model Role {
  id          String   @id @default(dbgenerated("uuidv7()"))
  key         String   @unique          // 'editor' — stable, used in seeds
  name        String                    // 'Editor' — editable label
  description String?
  isSystem    Boolean  @default(false)  // seeded; deletable only if false
  isOwner     Boolean  @default(false)  // exactly one; the protected role
  permissions RolePermission[]
  users       UserRole[]
}

model Permission {
  id       String @id @default(dbgenerated("uuidv7()"))
  key      String @unique   // 'case_study:publish'
  resource String          // 'case_study'
  action   String          // 'publish'
  group    String          // 'Content' — drives UI grouping
  roles    RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  scope        Scope  @default(ALL)     // ALL | OWN | ASSIGNED
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Restrict)
  @@id([userId, roleId])
}

model Session {
  id           String   @id @default(dbgenerated("uuidv7()"))
  userId       String
  tokenHash    String   @unique      // the raw token is never stored
  ip           String?
  userAgent    String?
  expiresAt    DateTime
  revokedAt    DateTime?
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, expiresAt])
}
```

A user may hold **several roles**; the effective permission set is their union,
with the widest scope winning. That is what makes the model composable — the
founder does not need a "Marketing plus Sales" role, they assign both.

### 2.2 Audit

```prisma
model AuditLog {
  id         String   @id @default(dbgenerated("uuidv7()"))
  userId     String?                       // null for system actions
  action     String                        // 'case_study.publish'
  entityType String
  entityId   String?
  before     Json?
  after      Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  @@index([entityType, entityId])
  @@index([userId, createdAt])
  @@index([createdAt])
}
```

Written by an interceptor on every mutating request, so it cannot be forgotten.
Append-only: no update or delete permission exists for it in the catalog. This is
the thing that makes a multi-user admin accountable rather than merely shared.

### 2.3 Content

A discriminated pattern: each content type is its own table (queries stay typed
and indexable) but all share the same publishing shape.

```prisma
model Solution {
  id            String   @id @default(dbgenerated("uuidv7()"))
  key           String   @unique     // 'build' | 'modernize' | 'automate' | 'ai' | 'care'
  slug          String
  locale        String   @default("en")
  name          String                // 'Beekal Build'
  cardHeadline  String                // homepage card
  cardBody      String
  pageHeadline  String                // /solutions/[slug]
  pageIntro     String
  signs         Json                  // string[] — "three signs you need this"
  whatWeDo      Json
  beforeAfter   Json
  iconKey       String
  order         Int
  status        ContentStatus @default(DRAFT)
  publishedAt   DateTime?
  seo           Json?
  @@unique([slug, locale])
  @@index([status, order])
}

model Problem {
  id             String @id @default(dbgenerated("uuidv7()"))
  key            String @unique       // 'manual-work'
  slug           String
  locale         String @default("en")
  cardHeadline   String               // "Too much repetitive work?"
  cardAnswer     String               // "Automate it."
  cardBody       String
  pageHeadline   String
  diagnostic     Json                 // string[] — "if three of these are true"
  causes         Json
  whatFixingLooksLike Json
  solutionKey    String               // links to Solution
  order          Int
  status         ContentStatus @default(DRAFT)
  seo            Json?
  @@unique([slug, locale])
}

model CaseStudy {
  id             String  @id @default(dbgenerated("uuidv7()"))
  slug           String
  locale         String  @default("en")
  title          String
  clientName     String?               // null while illustrative
  clientLogoId   String?
  context        String                // "Garment exporter, Dhaka, 180 staff"
  solutionKey    String

  // the eight-part format
  problem        String
  before         String
  diagnosis      String
  whatChanged    String
  howBuilt       String
  results        Json                  // [{ value, label }]
  lesson         String

  isIllustrative Boolean @default(true)     // see the constraint below
  clientApproved Boolean @default(false)
  approvedAt     DateTime?
  approvedBy     String?

  featured       Boolean @default(false)    // shown on the homepage
  order          Int
  status         ContentStatus @default(DRAFT)
  publishedAt    DateTime?
  seo            Json?
  @@unique([slug, locale])
  @@index([status, featured, order])
}
```

**The integrity rule that matters most**, enforced as a database check constraint,
not as a UI convention:

```sql
ALTER TABLE case_studies ADD CONSTRAINT real_case_needs_approval
  CHECK (
    is_illustrative = true
    OR (client_approved = true AND client_name IS NOT NULL AND approved_at IS NOT NULL)
  );
```

A case study cannot claim to be real without a named, approved client. Master
prompt section 28 forbids inventing client results; this makes it structurally
impossible rather than merely discouraged. The illustrative badge renders from the
same flag, so the page and the truth cannot drift apart.

```prisma
model Page {
  id       String  @id @default(dbgenerated("uuidv7()"))
  key      String  @unique          // 'home' | 'assessment' | 'method' | 'about'
  slug     String
  locale   String  @default("en")
  title    String
  seo      Json?
  sections PageSection[]
  status   ContentStatus @default(DRAFT)
  @@unique([slug, locale])
}

model PageSection {
  id        String  @id @default(dbgenerated("uuidv7()"))
  pageId    String
  type      String                 // 'hero' | 'problem-grid' | 'cta' | 'faq' ...
  order     Int
  enabled   Boolean @default(true)
  content   Json                   // validated by a per-type Zod schema
  page      Page    @relation(fields: [pageId], references: [id], onDelete: Cascade)
  @@index([pageId, order])
}
```

`PageSection.content` is `Json` validated against a **per-type Zod schema** from
`packages/contracts`. This is the deliberate trade: full type safety per section
type, without a migration every time a section gains a field. The validator is the
schema; the column is just storage.

```prisma
model Faq {
  id        String @id @default(dbgenerated("uuidv7()"))
  locale    String @default("en")
  question  String
  answer    String
  group     String                  // 'assessment' — drives placement and JSON-LD
  order     Int
  status    ContentStatus @default(DRAFT)
}

model Article {
  id          String @id @default(dbgenerated("uuidv7()"))
  slug        String
  locale      String @default("en")
  title       String
  excerpt     String
  body        Json                  // structured rich text
  coverId     String?
  authorId    String
  tags        String[]
  readMinutes Int
  status      ContentStatus @default(DRAFT)
  publishedAt DateTime?
  seo         Json?
  searchVector Unsupported("tsvector")?
  @@unique([slug, locale])
  @@index([status, publishedAt])
}

model Resource {
  id           String @id @default(dbgenerated("uuidv7()"))
  slug         String
  locale       String @default("en")
  title        String
  description  String
  kind         String              // 'checklist' | 'guide' | 'tool'
  fileMediaId  String?
  isGated      Boolean @default(true)
  sequenceId   String?             // nurture sequence on download
  downloadCount Int   @default(0)
  status       ContentStatus @default(DRAFT)
  @@unique([slug, locale])
}

model Media {
  id           String @id @default(dbgenerated("uuidv7()"))
  storageKey   String @unique      // the S3 key
  filename     String
  mimeType     String
  bytes        Int
  width        Int?
  height       Int?
  altText      String?             // required before a public render
  blurhash     String?
  variants     Json?               // generated sizes
  uploadedById String
  createdAt    DateTime @default(now())
}
```

`Media.altText` is nullable in storage but **required by the publish validator**.
An image without alt text cannot go live — an accessibility rule enforced by the
workflow instead of by a reviewer's memory.

### 2.4 Funnel

```prisma
model Lead {
  id           String @id @default(dbgenerated("uuidv7()"))
  name         String
  email        String
  company      String?
  phone        String?
  intent       String              // 'assessment' | 'talk'
  problemArea  String              // the qualifying field from the form
  message      String

  // consent, separated on purpose
  contactConsent   Boolean @default(false)   // required; reply only
  marketingConsent Boolean @default(false)   // optional; gates all sequences

  // attribution
  source       String?             // 'organic' | 'referral' | 'ads' | 'direct'
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?
  utmContent   String?
  utmTerm      String?
  referrer     String?
  landingPath  String?

  score        Int     @default(0)
  scoreReasons Json?               // explainable: why it scored what it scored

  stage        LeadStage @default(NEW)
  assignedToId String?
  scoreSubmissionId String?        // links a maturity score to this lead

  notes        LeadNote[]
  events       LeadEvent[]
  createdAt    DateTime @default(now())
  @@index([stage, createdAt])
  @@index([assignedToId, stage])
  @@index([email])
}

enum LeadStage {
  NEW QUALIFYING QUALIFIED ASSESSMENT_PROPOSED ASSESSMENT_BOOKED
  ASSESSMENT_DELIVERED PROJECT_PROPOSED WON LOST NURTURE DISQUALIFIED
}
```

The two consent booleans are not redundant. The demo's privacy copy promises *"we
never add you to a mailing list"*, so a lead who ticks the reply consent must not
enter a sequence. Separate columns mean the sequence runner checks the right flag,
and the promise on the page becomes a property of the schema.

`scoreReasons` stores *why* a lead scored what it did. An unexplainable score gets
ignored by whoever it was meant to help.

```prisma
model ScoreDimension {              // the nine sliders, editable
  id          String @id @default(dbgenerated("uuidv7()"))
  key         String @unique        // 'process' | 'technology' | ...
  label       String
  question    String
  helpText    String?
  anchors     Json                  // level 1..5 wording
  weight      Float  @default(1)
  order       Int
  active      Boolean @default(true)
}

model ScoreLevel {                  // the five maturity levels, editable
  id          String @id @default(dbgenerated("uuidv7()"))
  level       Int    @unique        // 1..5
  name        String                // 'Manual' ... 'Intelligent'
  description String
  guidance    String
}

model ScoreSubmission {
  id          String @id @default(dbgenerated("uuidv7()"))
  shareCode   String @unique        // /score/r/a7f3k2 — shareable result
  answers     Json                  // { process: 3, technology: 2, ... }
  totalScore  Float
  level       Int
  weakest     String[]
  email       String?               // only if the PDF was requested
  leadId      String?
  utmSource   String?
  completedAt DateTime @default(now())
  @@index([level, completedAt])
}
```

Dimensions, weights and level copy live in the database because they *will*
change. A scoring model hard-coded in a React component is a scoring model nobody
improves.

### 2.5 Messaging and platform

```prisma
model EmailTemplate {
  id        String @id @default(dbgenerated("uuidv7()"))
  key       String @unique
  subject   String
  body      String           // MJML or structured blocks
  variables Json             // declared placeholders, validated on save
  locale    String @default("en")
}

model Sequence {
  id        String @id @default(dbgenerated("uuidv7()"))
  key       String @unique
  name      String
  trigger   String           // 'score_completed' | 'resource_downloaded' | ...
  active    Boolean @default(false)
  steps     SequenceStep[]
}

model SequenceStep {
  id          String @id @default(dbgenerated("uuidv7()"))
  sequenceId  String
  order       Int
  delayHours  Int
  templateKey String
  condition   Json?          // skip rules
  sequence    Sequence @relation(fields: [sequenceId], references: [id], onDelete: Cascade)
}

model Setting {
  key       String @id       // 'contact.email' | 'assessment.price_range'
  value     Json
  group     String           // drives the settings UI
  label     String
  helpText  String?
  updatedAt DateTime @updatedAt
}

model Redirect {
  id         String @id @default(dbgenerated("uuidv7()"))
  fromPath   String @unique
  toPath     String
  statusCode Int    @default(301)
  hits       Int    @default(0)
}

model OutboxEvent {
  id          String   @id @default(dbgenerated("uuidv7()"))
  type        String
  payload     Json
  processedAt DateTime?
  attempts    Int      @default(0)
  lastError   String?
  createdAt   DateTime @default(now())
  @@index([processedAt, createdAt])
}
```

`Setting` is what makes every founder TODO in `00-master-plan.md` section 7 a
UI field: the Assessment price range, the reply-time promise, the WhatsApp number,
the contact email, the legal entity line. None of them should require a deploy,
because a fact that requires a deploy to correct is a fact that stays wrong.

---

## 3. How a permission check runs

```ts
// Declared on the route
@RequirePermission('lead:read')
@Get('/leads')
async list(@CurrentUser() user: AuthUser, @Query() q: LeadQuery) {
  const scope = user.scopeFor('lead:read');   // ALL | OWN | ASSIGNED
  return this.listLeads.execute({ query: q, scope, userId: user.id });
}
```

The guard resolves the user's effective permissions — union of all their roles,
widest scope winning — and either denies, or hands the scope to the use case. The
use case turns the scope into a Specification that narrows the query. Two
consequences worth stating:

- **Authorization is never a hand-written `if` in a controller.** It is declared
  on the route and evaluated in one place.
- **Scope narrows data, it does not filter after the fact.** A `Sales` user's
  query never loads rows they cannot see, so there is nothing to accidentally leak
  in a response or a log.

Effective permissions are cached in Redis per user, keyed by a version stamp that
bumps whenever any role changes. A permission revoked in the UI takes effect on
the user's next request, not on their next login — which is the behaviour anyone
revoking access in a hurry expects.

---

## 4. Admin panel

Mounted at `/admin` inside `apps/web`, sharing the design system but with its own
layout, its own denser spacing scale, and `noindex` plus `no-store` throughout.

**Why inside the web app rather than a separate SPA:** one deployment, one design
system, one auth cookie, one build pipeline. The admin is the only consumer of
several API endpoints, so splitting it would add a deployment without removing a
dependency. If it ever grows to justify its own release cycle, it is already a
route group and lifts out cleanly.

### Navigation, rendered per-permission

A user never sees a section they cannot use. The nav is built from the effective
permission set, so the Sales user's admin is genuinely a sales tool rather than a
mostly-disabled version of someone else's.

```
Dashboard          leads today, score completions, publish queue, recent audit
Leads              inbox, pipeline board, detail, notes, assignment, export
Content            Pages, Solutions, Problems, Case studies, FAQs, Articles, Resources
Media              library, upload, alt-text editor
Score tool         dimensions, level copy, submissions, aggregate benchmarks
Messaging          templates, sequences
Insights           traffic, conversion by source, funnel, content performance
Settings           business settings, redirects, feature flags
People             users, invitations, roles and permissions
Audit              filterable activity log
```

### Screens worth specifying now

**Role editor.** The screen the requirement is really about. A permission matrix
grouped by resource, rows as actions, a scope selector on each granted permission,
and a live "this role can:" summary in plain English beside it. Changing a role
shows how many users are affected before saving. Deleting a role is blocked while
users hold it, with a reassignment step offered instead.

**Lead inbox.** The founder's daily screen. Sorted by score, coloured by stage,
one-click assignment, notes, and the maturity score result inline when one is
linked. Keyboard-navigable, because a daily screen that needs a mouse gets avoided.

**Content editor.** Consistent across every type: edit, live preview against the
real public component, validation on save (including the banned-word lint as a
dismissible warning), draft and publish as distinct actions, version history from
the audit log, and a diff view.

**Publish workflow.** `DRAFT -> IN_REVIEW -> PUBLISHED -> ARCHIVED`, with the
transition to `PUBLISHED` requiring the `:publish` permission. This is why Editor
and Delivery are different roles: Delivery writes a case study, Editor publishes
it. Publishing triggers the cache-tag revalidation for exactly the affected routes.

**Settings.** Grouped, labelled, with help text — because it is where the founder
edits the price and the reply-time promise, and a bare key-value table invites
mistakes.

### Admin rules

1. Every destructive action needs typed confirmation and is soft-delete first
2. Every list is filterable, sortable, paginated server-side, and exportable when
   the permission allows
3. Every form saves a draft locally against an accidental navigation
4. Every screen works at 768px — the founder will use this on a tablet
5. Session timeout 12 hours, sliding; MFA available and required for any role
   holding `user:*` or `role:*`
6. The audit log is one click from any record, showing that record's history

---

## 5. Seeding and migration

`prisma/seed.ts` is idempotent and safe to re-run:

1. Upsert the permission catalog from the code-defined list
2. Upsert the eight system roles and their grants
3. Create the Owner user from `SEED_OWNER_EMAIL`, issuing a one-time setup link —
   **never** a default password in the repo
4. Seed score dimensions, levels and anchors from the demo's existing wording
5. Seed the settings catalog with sensible defaults and the founder TODOs marked
6. Seed content from the demo HTML — the five problems, five solutions, five
   illustrative case studies, seven FAQs, page sections — so the site is populated
   on first boot and the demo's copy is preserved as data

Step 6 makes the migration from demo to product concrete rather than aspirational:
the words already written become the first rows, and the rewrite happens in the
admin UI where it belongs.
