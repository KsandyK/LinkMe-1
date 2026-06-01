/**
 * CRAVR — Owner Account Seed
 *
 * Creates the platform owner's private admin account.
 * This account has ADMIN role, no public creator profile,
 * and will NOT appear in any creator or user listings.
 *
 * Reads credentials from env vars — never hardcoded.
 * Add to apps/api/.env (already gitignored):
 *
 *   OWNER_USERNAME=<your chosen username>
 *   OWNER_PASSWORD=<your chosen password>
 *
 * Run once on the server:
 *   pnpm --filter api db:seed-owner
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const username = process.env.OWNER_USERNAME;
  const password = process.env.OWNER_PASSWORD;
  const email    = process.env.OWNER_EMAIL ?? "allcravr@yahoo.com";

  if (!username || !password) {
    console.error("❌  Set OWNER_USERNAME and OWNER_PASSWORD in .env before running this script.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert user — ADMIN role, never appears in creator listings
  const user = await db.user.upsert({
    where:  { username },
    update: { passwordHash, role: "ADMIN", email },
    create: {
      username,
      email,
      passwordHash,
      role:    "ADMIN",
      credits: 99999,      // unlimited credits for testing
      isActive: true,
    },
  });

  // Upsert a minimal profile — no displayName that reveals identity
  // Using the username itself as displayName so it's unremarkable
  await db.profile.upsert({
    where:  { userId: user.id },
    update: {},
    create: {
      userId:      user.id,
      displayName: username,
      isVerified:  false,          // no verified badge — blends in
    },
  });

  // Age verification — mark verified so no gates block access
  await db.ageVerification.upsert({
    where:  { userId: user.id },
    update: { status: "VERIFIED" },
    create: { userId: user.id, status: "VERIFIED", verifiedAt: new Date() },
  });

  console.log("\n✅  Owner account ready");
  console.log(`    Username : ${username}`);
  console.log(`    Email    : ${email}`);
  console.log(`    Role     : ADMIN`);
  console.log(`    Credits  : 99,999 (for testing)`);
  console.log(`    User ID  : ${user.id}`);
  console.log("\n    This account has NO public creator profile.");
  console.log("    It will not appear in the Creators directory or any public listing.");
  console.log("    Log in at /login with your username and password.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
