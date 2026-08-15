<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Protected client APIs

Mobile and website clients call `/api/v1/*` only. **Never modify client API routes, mobile validation, or client-facing service behavior unless the user explicitly asks** — even when refactoring admin features or shared services.

Protected paths and endpoints: `docs/CLIENT_APIS.md`. Cursor rule: `.cursor/rules/client-api-protected.mdc`.

## Protected tests

Core flow integration tests in `tests/integration/core-flow.test.ts` are protected end-to-end coverage.
Run manually in GitHub Actions (**Core flow integration** → Run workflow) or with `pnpm test:integration:core`.
**Do not modify them unless explicitly requested.** See `tests/PROTECTED_TESTS.md`.
