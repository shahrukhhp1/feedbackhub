# Client APIs (protected)

These endpoints are used by **mobile apps** and **websites**. They are **not** used by the admin dashboard.

**AI and contributors: do not modify these APIs or their contracts unless explicitly requested.** See `.cursor/rules/client-api-protected.mdc` and `AGENTS.md`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/installations/register` | Register installation (public; client key) |
| `GET` | `/api/v1/sync` | Questions + admin replies (installation token) |
| `POST` | `/api/v1/answers` | Submit answer (installation token) |
| `GET` | `/api/v1/conversations` | List conversations |
| `POST` | `/api/v1/conversations` | Create conversation |
| `GET` | `/api/v1/conversations/[conversationId]/messages` | List messages |
| `POST` | `/api/v1/conversations/[conversationId]/messages` | User message |
| `POST` | `/api/v1/messages/acknowledge` | Acknowledge messages |

## Source map

| Area | Path |
|------|------|
| Routes | `src/app/api/v1/**` |
| Validation | `src/server/validation/mobile.ts` |
| Sync | `src/server/services/sync.service.ts` |
| Answers (submit) | `src/server/services/answers.service.ts` (`submitAnswer`) |
| Installations | `src/server/services/installations.service.ts` (`registerInstallation`) |
| Conversations | `src/server/services/conversations.service.ts` |

## Admin APIs (safe to extend)

Admin dashboard uses `/api/admin/**` only. New features (e.g. app members, team, audit) should use admin routes and `src/server/validation/admin.ts`, not `/api/v1/*`.

## Related docs

- Integration examples: admin UI → **Integration** page (`src/app/(dashboard)/integration/page.tsx`)
- Core flow tests: `tests/integration/core-flow.test.ts` (protected; see `tests/PROTECTED_TESTS.md`)
