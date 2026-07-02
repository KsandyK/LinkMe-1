/**
 * CRAVR — Restore an account to ADMIN role + delete any creator profile.
 *
 * One-shot recovery for the case where an admin accidentally submitted a
 * creator application (which used to silently downgrade ADMIN → CREATOR
 * and create a public CreatorProfile). Fixed in code; this restores the row.
 *
 * Usage:
 *   cd /opt/cravr/apps/api && npx tsx prisma/restore-admin.ts <username>
 *   e.g. npx tsx prisma/restore-admin.ts ksand
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: npx tsx prisma/restore-admin.ts <username>");
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { username }, select: { id: true, role: true } });
  if (!user) { console.error(`User '${username}' not found.`); process.exit(1); }

  // Delete the creator profile (cascade clears liveFeeds / earnings refs)
  const deleted = await db.creatorProfile.deleteMany({ where: { userId: user.id } });

  // Restore ADMIN role
  await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });

  console.log("\n────────────────────────────────────────");
  console.log(`  User             : ${username}`);
  console.log(`  Previous role    : ${user.role}`);
  console.log(`  New role         : ADMIN`);
  console.log(`  Creator profile  : ${deleted.count > 0 ? "removed" : "none existed"}`);
  console.log("────────────────────────────────────────\n");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
