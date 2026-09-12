/**
 * Runs before any integration helper import side effects.
 * Snapshots production DATABASE_URL from the shell/.env, then clears it so
 * nothing can connect until setupTestDb() validates TEST_DATABASE_URL.
 */
declare global {
  var __FEEDBACKHUB_INITIAL_DATABASE_URL__: string | undefined;
}

const snapshot = process.env.DATABASE_URL?.trim();
globalThis.__FEEDBACKHUB_INITIAL_DATABASE_URL__ = snapshot;
delete process.env.DATABASE_URL;

export {};
