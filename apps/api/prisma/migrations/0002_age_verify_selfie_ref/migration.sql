-- ============================================================
-- Migration 0002: Age verification selfie document reference
-- Adds selfieRef column and ensures UNDER_REVIEW enum value exists
-- ============================================================

-- Ensure UNDER_REVIEW value exists in AgeVerifyStatus enum (idempotent)
DO $$ BEGIN
  ALTER TYPE "AgeVerifyStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add selfie document reference column
ALTER TABLE "AgeVerification" ADD COLUMN IF NOT EXISTS "selfieRef" TEXT;
