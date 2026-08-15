# Implementation decisions

This document records implementation choices made where the development plan left room for interpretation or where practical constraints shaped the design.

## Deployment and runtime

| Decision | Rationale |
|----------|-----------|
| **Next.js `output: 'standalone'`** | SmarterASP.NET Node.js hosting runs a self-contained Node process. Standalone output bundles dependencies and avoids requiring the full monorepo at runtime. |
| **No hardcoded production port** | The host provides the listen port via environment variables. The standalone server respects `PORT` when set. |
| **`CORS_ALLOWED_ORIGINS` for `/api/v1`** | Comma-separated website origins for browser embeds; preflight handled in middleware. |
| **`TRUST_PROXY=true` behind reverse proxy** | Your server config; required for correct client IP when proxied. |
| **`COOKIE_SECURE=true` when serving HTTPS** | Your server config; not tied to `NODE_ENV`. Dev and prod behave the same unless you set this. |

## Infrastructure omitted (by design)

| Decision | Rationale |
|----------|-----------|
| **No Redis** | Rate limiting, caching, and session storage use in-process memory. PostgreSQL remains the source of truth. Sufficient for initial scale on shared hosting. |
| **No message queues or background workers** | All work is synchronous in the request path. No Kafka, Bull, or similar. |
| **No WebSockets or push notifications** | Mobile clients poll via `/api/v1/sync`. APNs/FCM are explicit non-goals. |
| **No native mobile SDK** | HTTP API documented in OpenAPI and the mobile integration guide is the integration surface. |

## Security

| Decision | Rationale |
|----------|-----------|
| **In-memory rate limiter** | Per-IP (120 req/min) and per-installation (60 req/min) sliding windows. No shared store needed at current scale; resets on process restart. |
| **SHA-256 token hashing** | Client keys and installation tokens stored as SHA-256 hex hashes only. Raw values shown once at creation/registration. |
| **Plaintext client keys** | Stored in DB and shown in admin UI for easy mobile integration; compared with constant-time equality. Installation tokens remain hashed. |
| **Constant-time comparison** | `timingSafeEqual` when verifying client keys and token hashes. |
| **No browser-wide CORS for mobile API** | Mobile bearer-token endpoints are not designed for browser cross-origin access. |
| **Request ID on every response** | `x-request-id` header on success and error responses for correlation. |

## Observability

| Decision | Rationale |
|----------|-----------|
| **Lightweight JSON logger (Pino-equivalent)** | Custom structured JSON logger instead of Pino to avoid `thread-stream` bundling issues with Next.js standalone builds. Same log shape: level, time, msg, requestId. |

## Authentication

| Decision | Rationale |
|----------|-----------|
| **Better Auth for admin sessions** | Cookie-based sessions with Drizzle adapter; extends `user` table with `role`, `mustChangePassword`, `disabledAt`. |
| **Installation tokens do not expire by TTL** | Tokens remain valid until revoked, re-registration rotates them, or the app client key is rotated (old registrations must re-register with new key). No time-based expiration field. |
| **Re-registration rotates token** | Same `(appId, userGuid)` pair receives a new token and clears `revokedAt`. Previous token becomes invalid immediately. |
| **No public admin signup** | Users created only by superadmin via team management or bootstrap script. |

## API design

| Decision | Rationale |
|----------|-----------|
| **Cursor pagination, not offset** | Conversations, messages, answers, and audit logs use cursor-based pagination for stable performance at scale. |
| **Message `sequence` for sync** | PostgreSQL `GENERATED ALWAYS AS IDENTITY` on `messages.sequence` enables efficient `sequence > after` sync queries. |
| **Idempotency via `clientRequestId`** | Unique constraints on `(installationId, clientRequestId)` for answers and messages. Duplicate requests return the existing resource with 200. |
| **Sync metadata update is non-blocking** | `lastSeenAt` update failures do not fail sync; client always receives questions and replies. |
| **Bounded sync reply batch** | 100 messages per sync request (`SYNC_REPLY_LIMIT`); `hasMore` flag when additional messages exist. |

## Data model

| Decision | Rationale |
|----------|-----------|
| **UUID primary keys for domain tables** | Apps, installations, questions, answers, conversations, messages use UUIDs. |
| **Text primary key for Better Auth `user`** | Better Auth convention; application `created_by` and foreign keys reference `user.id` as text. |
| **Hardcoded question answers** | `externalQuestionKey` + `questionText` snapshot when no server question exists; analytics grouped by `(appId, externalQuestionKey)`. |
| **Append-only audit logs** | No delete/update paths in application code for `audit_logs`. |
| **No automatic data retention cleanup** | Retention is an explicit operator decision; not enabled by default. |

## Database access

| Decision | Rationale |
|----------|-----------|
| **postgres.js with Drizzle** | Lightweight driver suitable for SmarterASP.NET connection limits. Pool `max: 10`, `idle_timeout: 20`, `connect_timeout: 10`. |
| **Transactions for related writes** | Answer + conversation + system message, feedback conversation + message, and admin reply status transitions use short transactions. |
| **Migrations via drizzle-kit** | SQL migrations in `./drizzle`; applied with `pnpm db:migrate`. |

## UI and admin

| Decision | Rationale |
|----------|-----------|
| **Minimalist admin UI** | Neutral palette, system fonts, tables for lists, drawers for detail — per development plan visual direction. |
| **Server-side permission checks** | `canManage*` helpers in `permissions.ts`; UI hiding is not authorization. |
| **Viewer role** | Read-only access to apps, questions, inbox, and answers per plan. Mutation endpoints require `admin` or `superadmin` via `canManage*` checks. |

## Observability

| Decision | Rationale |
|----------|-----------|
| **Structured logging with Pino** | Request ID, route, method, status, duration; no passwords, tokens, or message bodies in logs. |
| **Separate audit log** | Business/security actions in `audit_logs`; operational logs via Pino. |

## Testing

| Decision | Rationale |
|----------|-----------|
| **Vitest for unit and integration tests** | Fast Node environment; integration config separate from unit config. |
| **Playwright for E2E** | Browser-level admin flow verification. |

## Explicit non-goals (unchanged)

Real-time chat, push notifications, file attachments, public customer accounts, social login, AI replies, billing, multi-tenant organizations, and microservices remain out of scope unless a future specification requests them.
