-- CreateTable
CREATE TABLE "score_dimensions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "help_text" TEXT,
    "anchors" JSONB NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_levels" (
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "guidance" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_levels_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "score_submissions" (
    "id" TEXT NOT NULL,
    "share_code" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "level" INTEGER NOT NULL,
    "weakest" TEXT[],
    "email" TEXT,
    "lead_id" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "referrer" TEXT,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "score_dimensions_key_key" ON "score_dimensions"("key");

-- CreateIndex
CREATE INDEX "score_dimensions_active_order_idx" ON "score_dimensions"("active", "order");

-- CreateIndex
CREATE UNIQUE INDEX "score_submissions_share_code_key" ON "score_submissions"("share_code");

-- CreateIndex
CREATE INDEX "score_submissions_level_completed_at_idx" ON "score_submissions"("level", "completed_at");

-- CreateIndex
CREATE INDEX "score_submissions_email_idx" ON "score_submissions"("email");
