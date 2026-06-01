/**
 * CRAVR — Local Dev Reset
 *
 * Wipes ALL users and dependent data, then creates one clean test account.
 * ⚠️  DESTRUCTIVE — for local development only. Never run on production.
 *
 * Run:  pnpm --filter api db:reset-local
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Safety guard — refuse to run against a remote/production database
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    console.error("❌  Refusing to run reset against a non-localhost database.");
    console.error(`   DATABASE_URL: ${url.slice(0, 40)}...`);
    process.exit(1);
  }

  console.log("🗑️  Wiping all users and dependent data...\n");

  // TRUNCATE cascades to every table that has a FK on User
  await db.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE`);

  console.log("✓  All user data cleared.\n");

  // ── Create test user ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Test123!", 10);

  const user = await db.user.create({
    data: {
      username:     "testuser",
      email:        "test@cravr.local",
      passwordHash,
      role:         "MEMBER",
      credits:      1000,           // enough to test any purchase flow
      isActive:     true,
    },
  });

  await db.profile.create({
    data: {
      userId:      user.id,
      displayName: "Test User",
      bio:         "This is the local test account.",
      isVerified:  false,
    },
  });

  await db.ageVerification.create({
    data: {
      userId:     user.id,
      status:     "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  console.log("✅  Test account created:");
  console.log("    Username : testuser");
  console.log("    Password : Test123!");
  console.log("    Credits  : 1,000");
  console.log("    Role     : MEMBER");
  console.log("    Age gate : verified");
  console.log(`    User ID  : ${user.id}`);
  console.log("\n    Log in at http://localhost:5175/login");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
