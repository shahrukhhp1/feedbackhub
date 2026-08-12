import { randomUUID } from "crypto";
import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "@/server/db";
import { account, user } from "@/server/db/schema";
import { getEnv } from "@/server/env";
import { normalizeEmail } from "@/server/security/crypto";

config();

async function main() {
  const env = getEnv();

  if (!env.SUPERADMIN_EMAIL || !env.SUPERADMIN_INITIAL_PASSWORD) {
    console.error("SUPERADMIN_EMAIL and SUPERADMIN_INITIAL_PASSWORD are required");
    process.exit(1);
  }

  const db = getDb();
  const email = normalizeEmail(env.SUPERADMIN_EMAIL);

  const existingAdmins = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.role, ["superadmin", "admin"]));

  if (existingAdmins.length > 0) {
    console.log("Admin user(s) already exist; skipping bootstrap.");
    await closeDb();
    return;
  }

  const [existingUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);

  if (existingUser) {
    console.log("User with SUPERADMIN_EMAIL already exists; skipping bootstrap.");
    await closeDb();
    return;
  }

  const userId = randomUUID();
  const now = new Date();
  const passwordHash = await hashPassword(env.SUPERADMIN_INITIAL_PASSWORD);

  await db.insert(user).values({
    id: userId,
    name: "Superadmin",
    email,
    emailVerified: true,
    role: "superadmin",
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(account).values({
    id: randomUUID(),
    accountId: email,
    providerId: "credential",
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created superadmin user: ${email}`);
  await closeDb();
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
