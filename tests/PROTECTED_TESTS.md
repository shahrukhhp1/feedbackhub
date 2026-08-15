# Protected tests

These tests define the **core product flow**. They are **not** run by GitHub on commits. Run them manually in GitHub Actions or locally.

## Protected files

- `tests/integration/core-flow.test.ts` — end-to-end HTTP API flow:
  1. Admin creates an app
  2. Admin creates an active question
  3. Admin lists and fetches the question
  4. Mobile client registers an installation
  5. Mobile client syncs and receives the question
  6. Mobile client submits an answer
  7. Sync no longer returns the answered question

## Rules for AI and contributors

**Do not modify, delete, rename, or weaken these tests unless the user explicitly requests it.**

That includes:

- Removing or skipping test cases
- Loosening assertions (e.g. allowing sync to fail silently)
- Replacing HTTP route tests with service-only calls
- Changing the flow order without user approval

Allowed without explicit user request:

- Fixing failures caused by intentional product changes (only when updating tests to match new behavior the user asked for)
- Infrastructure changes that keep the same assertions (e.g. CI Postgres version)

## Running locally

```bash
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/feedback_test"
pnpm test:integration:core
```

Without `TEST_DATABASE_URL`, integration tests are skipped.

## GitHub Actions (manual only)

Open **Actions → Core flow integration → Run workflow**. No workflows run automatically on push or PR.

Unit tests (`pnpm test`) run locally without Postgres or GitHub Actions.
