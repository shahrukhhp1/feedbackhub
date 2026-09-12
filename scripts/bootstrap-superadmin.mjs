import { randomUUID } from "node:crypto";
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
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const superadminPassword = process.env.SUPERADMIN_INITIAL_PASSWORD;

if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (!superadminEmail || !superadminPassword) {
  console.error("SUPERADMIN_EMAIL and SUPERADMIN_INITIAL_PASSWORD are required");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

const existingUser = await sql`
  SELECT id, role FROM "user" WHERE email = ${superadminEmail} LIMIT 1
`;

if (existingUser.length > 0) {
  console.log(
    `User ${superadminEmail} already exists (role: ${existingUser[0].role}). ` +
      "Run pnpm reset-superadmin-password to set password from .env.",
  );
  await sql.end();
  process.exit(0);
}

const otherAdmins = await sql`
  SELECT email, role FROM "user" WHERE role IN ('superadmin', 'admin') ORDER BY created_at ASC
`;

if (otherAdmins.length > 0) {
  console.log("Other admin users already in DB (bootstrap will still create SUPERADMIN_EMAIL):");
  for (const admin of otherAdmins) {
    console.log(`  - ${admin.email} (${admin.role})`);
  }
}

const userId = randomUUID();
const accountId = randomUUID();
const now = new Date();
const passwordHash = await hashPassword(superadminPassword);

await sql`
  INSERT INTO "user" (
    id, name, email, email_verified, role, must_change_password, created_at, updated_at
  ) VALUES (
    ${userId}, 'Superadmin', ${superadminEmail}, true, 'superadmin', true, ${now}, ${now}
  )
`;

await sql`
  INSERT INTO account (
    id, account_id, provider_id, user_id, password, created_at, updated_at
  ) VALUES (
    ${accountId}, ${superadminEmail}, 'credential', ${userId}, ${passwordHash}, ${now}, ${now}
  )
`;

console.log(`Created superadmin user: ${superadminEmail}`);
await sql.end();
