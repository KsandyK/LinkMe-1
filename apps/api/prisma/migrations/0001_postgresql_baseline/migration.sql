-- ============================================================
-- LinkMe API — PostgreSQL Baseline Migration
-- Generated: 2026-05-24
-- Replaces: SQLite init migrations
-- ============================================================

-- Enums
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'CREATOR', 'MODERATOR', 'ADMIN');
CREATE TYPE "AgeVerifyStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "TransactionType" AS ENUM ('CREDIT_PURCHASE', 'GIFT_SENT', 'MESSAGE_SENT', 'BOOST_PURCHASE', 'CREATOR_PAYOUT', 'REFUND');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "ContentType" AS ENUM ('PHOTO', 'VIDEO', 'LIVE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');
CREATE TYPE "ModerationStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- ── User ────────────────────────────────────────────────────────────────────────
CREATE TABLE "User" (
    "id"              TEXT NOT NULL,
    "username"        TEXT NOT NULL,
    "email"           TEXT,
    "passwordHash"    TEXT NOT NULL,
    "role"            "UserRole" NOT NULL DEFAULT 'MEMBER',
    "credits"         INTEGER NOT NULL DEFAULT 0,
    "ageVerified"     "AgeVerifyStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "isBanned"        BOOLEAN NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ── Session (refresh tokens) ────────────────────────────────────────────────────
CREATE TABLE "Session" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "tokenHash"   TEXT NOT NULL,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Profile ─────────────────────────────────────────────────────────────────────
CREATE TABLE "Profile" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "displayName" TEXT,
    "bio"         TEXT,
    "avatarUrl"   TEXT,
    "coverUrl"    TEXT,
    "location"    TEXT,
    "interests"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── CreatorProfile ──────────────────────────────────────────────────────────────
CREATE TABLE "CreatorProfile" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "isApproved"       BOOLEAN NOT NULL DEFAULT false,
    "isLive"           BOOLEAN NOT NULL DEFAULT false,
    "subscriptionPrice" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings"    INTEGER NOT NULL DEFAULT 0,
    "subscriberCount"  INTEGER NOT NULL DEFAULT 0,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");

ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── AgeVerification ─────────────────────────────────────────────────────────────
CREATE TABLE "AgeVerification" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "status"          "AgeVerifyStatus" NOT NULL DEFAULT 'PENDING',
    "docRefEncrypted" TEXT,
    "reviewedBy"      TEXT,
    "reviewedAt"      TIMESTAMP(3),
    "rejectionReason" TEXT,
    "submittedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgeVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgeVerification_userId_idx" ON "AgeVerification"("userId");
CREATE INDEX "AgeVerification_status_idx" ON "AgeVerification"("status");

ALTER TABLE "AgeVerification" ADD CONSTRAINT "AgeVerification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── LiveFeed ─────────────────────────────────────────────────────────────────────
CREATE TABLE "LiveFeed" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "thumbnailUrl" TEXT,
    "isLive"       BOOLEAN NOT NULL DEFAULT false,
    "viewerCount"  INTEGER NOT NULL DEFAULT 0,
    "peakViewers"  INTEGER NOT NULL DEFAULT 0,
    "sdpOffer"     TEXT,
    "startedAt"    TIMESTAMP(3),
    "endedAt"      TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveFeed_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LiveFeed_userId_idx" ON "LiveFeed"("userId");
CREATE INDEX "LiveFeed_isLive_idx" ON "LiveFeed"("isLive");

ALTER TABLE "LiveFeed" ADD CONSTRAINT "LiveFeed_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── ChatMessage ──────────────────────────────────────────────────────────────────
CREATE TABLE "ChatMessage" (
    "id"        TEXT NOT NULL,
    "feedId"    TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "username"  TEXT NOT NULL,
    "text"      TEXT NOT NULL,
    "creditTip" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatMessage_feedId_idx" ON "ChatMessage"("feedId");

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_feedId_fkey"
    FOREIGN KEY ("feedId") REFERENCES "LiveFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Conversation ─────────────────────────────────────────────────────────────────
CREATE TABLE "Conversation" (
    "id"        TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- ── ConversationParticipant ──────────────────────────────────────────────────────
CREATE TABLE "ConversationParticipant" (
    "conversationId" TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "lastReadAt"     TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conversationId", "userId")
);

CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Message ──────────────────────────────────────────────────────────────────────
CREATE TABLE "Message" (
    "id"             TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId"       TEXT NOT NULL,
    "text"           TEXT NOT NULL,
    "creditCost"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Transaction ──────────────────────────────────────────────────────────────────
CREATE TABLE "Transaction" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "amount"        INTEGER NOT NULL,
    "type"          "TransactionType" NOT NULL,
    "status"        "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "externalId"    TEXT,
    "meta"          JSONB,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── ContentUnlock ─────────────────────────────────────────────────────────────────
CREATE TABLE "ContentUnlock" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "contentId"   TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "creditCost"  INTEGER NOT NULL,
    "unlockedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentUnlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentUnlock_userId_idx" ON "ContentUnlock"("userId");

ALTER TABLE "ContentUnlock" ADD CONSTRAINT "ContentUnlock_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Subscription ──────────────────────────────────────────────────────────────────
CREATE TABLE "Subscription" (
    "id"          TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "creatorId"   TEXT NOT NULL,
    "status"      "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "priceAtTime" INTEGER NOT NULL,
    "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"   TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_subscriberId_creatorId_key" ON "Subscription"("subscriberId", "creatorId");
CREATE INDEX "Subscription_creatorId_idx" ON "Subscription"("creatorId");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberId_fkey"
    FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Gift ─────────────────────────────────────────────────────────────────────────
CREATE TABLE "Gift" (
    "id"         TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId"   TEXT NOT NULL,
    "giftType"   TEXT NOT NULL,
    "creditCost" INTEGER NOT NULL,
    "message"    TEXT,
    "sentAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Gift_toUserId_idx" ON "Gift"("toUserId");

ALTER TABLE "Gift" ADD CONSTRAINT "Gift_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Gift" ADD CONSTRAINT "Gift_toUserId_fkey"
    FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── BoostPurchase ─────────────────────────────────────────────────────────────────
CREATE TABLE "BoostPurchase" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "packageId"    TEXT NOT NULL,
    "boostsTotal"  INTEGER NOT NULL,
    "boostsUsed"   INTEGER NOT NULL DEFAULT 0,
    "creditCost"   INTEGER NOT NULL,
    "purchasedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostPurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BoostPurchase_userId_idx" ON "BoostPurchase"("userId");

ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── ModerationReport ──────────────────────────────────────────────────────────────
CREATE TABLE "ModerationReport" (
    "id"          TEXT NOT NULL,
    "reporterId"  TEXT NOT NULL,
    "targetId"    TEXT NOT NULL,
    "targetType"  TEXT NOT NULL,
    "reason"      TEXT NOT NULL,
    "details"     TEXT,
    "priority"    INTEGER NOT NULL DEFAULT 0,
    "status"      "ModerationStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedBy"  TEXT,
    "resolvedAt"  TIMESTAMP(3),
    "resolution"  TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModerationReport_status_idx" ON "ModerationReport"("status");
CREATE INDEX "ModerationReport_priority_idx" ON "ModerationReport"("priority" DESC);
CREATE INDEX "ModerationReport_targetId_idx" ON "ModerationReport"("targetId");

ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── ContentFlag ───────────────────────────────────────────────────────────────────
CREATE TABLE "ContentFlag" (
    "id"          TEXT NOT NULL,
    "contentId"   TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "reason"      TEXT NOT NULL,
    "autoFlagged" BOOLEAN NOT NULL DEFAULT false,
    "resolved"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentFlag_resolved_idx" ON "ContentFlag"("resolved");

-- ── Notification ──────────────────────────────────────────────────────────────────
CREATE TABLE "Notification" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "data"      JSONB,
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
