import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/server/env";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    const env = getEnv();
    client = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema });
  }
  return db;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const sql = client ?? postgres(getEnv().DATABASE_URL, { max: 1 });
    await sql`SELECT 1`;
    if (!client) await sql.end();
    return true;
  } catch {
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

export type Database = ReturnType<typeof getDb>;
