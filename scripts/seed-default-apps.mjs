import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

/** Matches Wallez `feedbackHubConfig` in the mobile app. */
const WALLEZ = {
  id: "969ee292-fcfe-41fa-bc04-02dcc2fc02ac",
  clientKey: "fh_hp9L8O9Un8TOMNwKy5j9mx0hHqf4E9fz",
  name: "Wallez",
  slug: "wallez",
};

/** Matches Shahkings site FeedbackHub app settings. */
const SHAHKINGS_WEB = {
  id: "6808e530-eaed-4ca5-8212-e4a5c8965dc6",
  clientKey: "fh_fO-y749oy_cbbH_SaEj0Vj72gxqFmFte",
  name: "Shahkings - Web",
  slug: "shahkings-web",
};

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUuid(name, value) {
  if (!UUID_RE.test(value)) {
    console.error(`${name} must be a UUID (got: ${value})`);
    process.exit(1);
  }
}

function appFromEnv(prefix, defaults) {
  return {
    id: process.env[`${prefix}_APP_ID`]?.trim() || defaults.id,
    clientKey: process.env[`${prefix}_CLIENT_KEY`]?.trim() || defaults.clientKey,
    name: process.env[`${prefix}_APP_NAME`]?.trim() || defaults.name,
    slug: process.env[`${prefix}_APP_SLUG`]?.trim() || defaults.slug,
  };
}

loadEnvFile();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const wallez = appFromEnv("SEED_WALLEZ", WALLEZ);
const shahkingsWeb = appFromEnv("SEED_SHAHKINGS_WEB", SHAHKINGS_WEB);

requireUuid("Wallez app id", wallez.id);
requireUuid("Shahkings web app id", shahkingsWeb.id);
if (wallez.id === shahkingsWeb.id) {
  console.error("Wallez and Shahkings web app ids must differ");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

const [admin] = await sql`
  SELECT id FROM "user"
  WHERE role = 'superadmin' AND disabled_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
`;

if (!admin?.id) {
  console.error("No active superadmin. Run pnpm bootstrap:superadmin first.");
  await sql.end();
  process.exit(1);
}

const adminId = admin.id;

async function upsertApp(app) {
  await sql`
    INSERT INTO apps (id, name, slug, client_key, status, created_by, created_at, updated_at)
    VALUES (${app.id}::uuid, ${app.name}, ${app.slug}, ${app.clientKey}, 'active', ${adminId}, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      client_key = EXCLUDED.client_key,
      status = 'active',
      updated_at = now()
  `;

  await sql`
    INSERT INTO app_members (app_id, user_id, app_role, created_by, created_at)
    VALUES (${app.id}::uuid, ${adminId}, 'admin', ${adminId}, now())
    ON CONFLICT (app_id, user_id) DO NOTHING
  `;
}

await upsertApp(wallez);
await upsertApp(shahkingsWeb);

console.log(`Seeded Wallez app id=${wallez.id} slug=${wallez.slug}`);
console.log(`Seeded Shahkings web app id=${shahkingsWeb.id} slug=${shahkingsWeb.slug}`);

await sql.end();
