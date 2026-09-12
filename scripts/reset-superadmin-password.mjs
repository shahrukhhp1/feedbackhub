import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { hashPassword } from "better-auth/crypto";
import postgres from "postgres";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const connectionString = process.env.DATABASE_URL;
const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const newPassword = process.env.SUPERADMIN_INITIAL_PASSWORD;

if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (!email || !newPassword) {
  console.error("SUPERADMIN_EMAIL and SUPERADMIN_INITIAL_PASSWORD are required");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

const [row] = await sql`
  SELECT u.id, u.role, u.disabled_at
  FROM "user" u
  WHERE u.email = ${email}
  LIMIT 1
`;

if (!row) {
  console.error(`No user with email ${email}. Run pnpm bootstrap:superadmin first.`);
  await sql.end();
  process.exit(1);
}

if (row.role !== "superadmin" && row.role !== "admin") {
  console.error(`User ${email} is role "${row.role}", not an admin.`);
  await sql.end();
  process.exit(1);
}

if (row.disabled_at) {
  console.error(`User ${email} is disabled. Enable in DB or via another admin first.`);
  await sql.end();
  process.exit(1);
}

const passwordHash = await hashPassword(newPassword);
const now = new Date();

await sql`
  UPDATE account
  SET password = ${passwordHash}, updated_at = ${now}
  WHERE user_id = ${row.id} AND provider_id = 'credential'
`;

await sql`
  UPDATE "user"
  SET must_change_password = true, updated_at = ${now}
  WHERE id = ${row.id}
`;

console.log(`Password reset for ${email}. Sign in with SUPERADMIN_INITIAL_PASSWORD from .env, then change password.`);
await sql.end();
