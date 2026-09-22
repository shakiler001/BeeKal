-- A case study cannot claim to be real without a named, approved client.
--
-- The master brief forbids inventing client results. Enforcing it here rather
-- than in the UI means no code path -- an API bug, a bad import, a direct
-- psql session -- can publish a fabricated result as a genuine one.
ALTER TABLE "case_studies"
  ADD CONSTRAINT "case_study_real_requires_approval"
  CHECK (
    "is_illustrative" = true
    OR (
      "client_approved" = true
      AND "client_name" IS NOT NULL
      AND "approved_at" IS NOT NULL
    )
  );

-- Alt text is required before an image can be referenced publicly. Nullable in
-- storage so an upload can complete, then filled before publish.
CREATE INDEX "media_alt_text_missing_idx" ON "media" ("created_at")
  WHERE "alt_text" IS NULL AND "deleted_at" IS NULL;
