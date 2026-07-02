-- Migration: 0003_creator_earnings_revenue_tiers
-- Adds revenue share tracking, earnings ledger, and payout batches

-- ── New enum ─────────────────────────────────────────────────────────────────
CREATE TYPE "EarningType" AS ENUM ('TIP', 'GIFT', 'UNLOCK', 'SUBSCRIPTION', 'MESSAGE');

-- ── CreatorProfile additions ─────────────────────────────────────────────────
ALTER TABLE "CreatorProfile"
  ADD COLUMN "creatorActivatedAt" TIMESTAMP(3),
  ADD COLUMN "revenueSharePct"    DOUBLE PRECISION NOT NULL DEFAULT 0.80;

-- Backfill: set activatedAt = createdAt for already-approved creators
UPDATE "CreatorProfile"
  SET "creatorActivatedAt" = "createdAt"
  WHERE "isApproved" = true AND "creatorActivatedAt" IS NULL;

-- ── CreatorEarning (earnings ledger) ────────────────────────────────────────
CREATE TABLE "CreatorEarning" (
  "id"              TEXT         NOT NULL,
  "creatorId"       TEXT         NOT NULL,
  "spenderId"       TEXT         NOT NULL,
  "type"            "EarningType" NOT NULL,
  "grossCredits"    INTEGER      NOT NULL,
  "processingFee"   INTEGER      NOT NULL,
  "platformFee"     INTEGER      NOT NULL,
  "creatorCredits"  INTEGER      NOT NULL,
  "revenueSharePct" DOUBLE PRECISION NOT NULL,
  "isPaidOut"       BOOLEAN      NOT NULL DEFAULT false,
  "payoutId"        TEXT,
  "referenceId"     TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreatorEarning_pkey" PRIMARY KEY ("id")
);

-- ── CreatorPayout (weekly payout batches) ───────────────────────────────────
CREATE TABLE "CreatorPayout" (
  "id"           TEXT           NOT NULL,
  "creatorId"    TEXT           NOT NULL,
  "periodStart"  TIMESTAMP(3)   NOT NULL,
  "periodEnd"    TIMESTAMP(3)   NOT NULL,
  "totalCredits" INTEGER        NOT NULL,
  "totalUsd"     DECIMAL(10,2)  NOT NULL,
  "status"       TEXT           NOT NULL DEFAULT 'PENDING',
  "approvedBy"   TEXT,
  "approvedAt"   TIMESTAMP(3),
  "paidAt"       TIMESTAMP(3),
  "notes"        TEXT,
  "createdAt"    TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- ── Foreign keys ─────────────────────────────────────────────────────────────
ALTER TABLE "CreatorEarning"
  ADD CONSTRAINT "CreatorEarning_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "CreatorEarning_payoutId_fkey"
    FOREIGN KEY ("payoutId")  REFERENCES "CreatorPayout"("id");

ALTER TABLE "CreatorPayout"
  ADD CONSTRAINT "CreatorPayout_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX "CreatorEarning_creatorId_isPaidOut_createdAt_idx"
  ON "CreatorEarning"("creatorId", "isPaidOut", "createdAt");

CREATE INDEX "CreatorEarning_creatorId_createdAt_idx"
  ON "CreatorEarning"("creatorId", "createdAt");

CREATE INDEX "CreatorEarning_payoutId_idx"
  ON "CreatorEarning"("payoutId");

CREATE INDEX "CreatorPayout_creatorId_status_idx"
  ON "CreatorPayout"("creatorId", "status");

CREATE INDEX "CreatorPayout_status_createdAt_idx"
  ON "CreatorPayout"("status", "createdAt");
