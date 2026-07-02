/**
 * CRAVR — Set a user's password directly (admin recovery tool)
 *
 * Reads username + password from command-line ARGUMENTS (not env), so it is
 * immune to dotenv quirks like '#' truncation. Hashes, updates, then verifies
 * the new hash matches — printing MATCH/FAIL so you know it worked.
 *
 * Usage:
 *   cd /opt/cravr/apps/api && npx tsx prisma/set-password.ts <username> <password>
 *   e.g. npx tsx prisma/set-password.ts ksand CravrAdmin2026
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  if (!username || !password) {
    console.error("Usage: npx tsx prisma/set-password.ts <username> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.update({
    where: { username },
    data:  { passwordHash, isActive: true },
    select: { username: true, role: true, passwordHash: true, isActive: true },
  });

  const verify = await bcrypt.compare(password, user.passwordHash);
  console.log("\n────────────────────────────────────────");
  console.log(`  User     : ${user.username}`);
  console.log(`  Role     : ${user.role}`);
  console.log(`  isActive : ${user.isActive}`);
  console.log(`  Password : ${JSON.stringify(password)}`);
  console.log(`  Verify   : ${verify ? "✅ MATCH — log in with this password" : "❌ FAIL"}`);
  console.log("────────────────────────────────────────\n");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
