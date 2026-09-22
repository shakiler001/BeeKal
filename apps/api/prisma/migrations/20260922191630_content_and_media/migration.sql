-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "solutions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "name" TEXT NOT NULL,
    "card_headline" TEXT NOT NULL,
    "card_body" TEXT NOT NULL,
    "page_headline" TEXT NOT NULL,
    "page_intro" TEXT NOT NULL,
    "signs" JSONB NOT NULL,
    "what_we_do" JSONB NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "seo_title" TEXT NOT NULL,
    "seo_description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "card_headline" TEXT NOT NULL,
    "card_answer" TEXT NOT NULL,
    "card_body" TEXT NOT NULL,
    "page_headline" TEXT NOT NULL,
    "page_intro" TEXT NOT NULL,
    "diagnostic" JSONB NOT NULL,
    "causes" TEXT NOT NULL,
    "fix_looks_like" JSONB NOT NULL,
    "solution_key" TEXT NOT NULL,
    "seo_title" TEXT NOT NULL,
    "seo_description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT NOT NULL,
    "client_name" TEXT,
    "context" TEXT NOT NULL,
    "solution_key" TEXT NOT NULL,
    "tab_label" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "before_lead" TEXT NOT NULL,
    "before" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "what_changed" TEXT NOT NULL,
    "how_built" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "lesson" TEXT NOT NULL,
    "is_illustrative" BOOLEAN NOT NULL DEFAULT true,
    "client_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT,
    "blurhash" TEXT,
    "variants" JSONB,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solutions_key_key" ON "solutions"("key");

-- CreateIndex
CREATE INDEX "solutions_status_order_idx" ON "solutions"("status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "solutions_slug_locale_key" ON "solutions"("slug", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "problems_key_key" ON "problems"("key");

-- CreateIndex
CREATE INDEX "problems_status_order_idx" ON "problems"("status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_locale_key" ON "problems"("slug", "locale");

-- CreateIndex
CREATE INDEX "case_studies_status_featured_order_idx" ON "case_studies"("status", "featured", "order");

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_slug_locale_key" ON "case_studies"("slug", "locale");

-- CreateIndex
CREATE INDEX "faqs_group_order_idx" ON "faqs"("group", "order");

-- CreateIndex
CREATE UNIQUE INDEX "media_storage_key_key" ON "media"("storage_key");

-- CreateIndex
CREATE INDEX "media_deleted_at_created_at_idx" ON "media"("deleted_at", "created_at");
