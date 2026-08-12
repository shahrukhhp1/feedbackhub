# Feedback Hub — Implementation Specification

## 1. Instruction to the implementation agent

Build the system described in this document. Treat this document as the source of truth. Do not add unrelated features, replace the chosen technologies, introduce microservices, or create a real-time chat system. If a minor detail is unspecified, choose the simplest secure implementation and document the choice in the repository README.

Work in small phases. At the end of every phase, run type checking, linting, unit tests, and relevant integration tests. Do not proceed while tests fail.

## 2. Product purpose

Create a central web system that multiple mobile applications can use to:

1. Retrieve questions configured remotely by an administrator.
2. Submit answers to remotely configured questions.
3. Submit answers to questions hardcoded inside a mobile app.
4. Submit general feedback or questions.
5. Allow an administrator to reply to an answer or feedback item.
6. Allow the mobile app to retrieve replies the next time it synchronizes.
7. Continue a simple asynchronous message exchange when necessary.

This is an asynchronous feedback mailbox, not chat. Do not implement WebSockets, typing indicators, presence, live messaging, or online status. Mobile clients poll only when the app opens, resumes, or performs an allowed background refresh.

## 3. Fixed technology choices

- Runtime: current supported Node.js LTS
- Language: TypeScript with strict mode enabled
- Package manager: pnpm
- Web framework and UI: current stable Next.js using App Router
- Backend: Next.js Route Handlers running on Node.js
- Database: PostgreSQL 15 or newer
- Database access and migrations: Drizzle ORM and Drizzle Kit
- Authentication: Better Auth, email/password, database sessions, and admin plugin
- Styling: Tailwind CSS
- Accessible UI primitives: shadcn/ui components where useful
- Icons: Lucide; do not mix icon libraries
- Request validation: Zod at every API boundary
- Unit/integration tests: Vitest
- Browser tests: Playwright
- Logging: structured JSON logging with Pino or an equivalent small logger
- Deployment target: SmarterASP.NET Node.js hosting and its PostgreSQL service

Use one deployable Next.js application. Do not create a separate Fastify service unless a future measured performance problem requires it.

## 4. Repository structure

Use a simple single-application repository:

```text
/
  src/
    app/
      (auth)/
      (dashboard)/
      api/
        auth/[...all]/
        admin/
        v1/
    components/
    features/
      apps/
      questions/
      inbox/
      team/
    server/
      auth/
      db/
      services/
      repositories/
      validation/
      security/
    shared/
      contracts/
      constants/
      types/
  drizzle/
  tests/
    integration/
    e2e/
  scripts/
  public/
```

Rules:

- Route handlers validate input and call service functions; they must not contain large business-logic blocks.
- Service functions contain business rules and transactions.
- Repositories contain database queries.
- React components never query PostgreSQL directly.
- Server-only modules must be explicitly marked and never imported into client components.
- Do not duplicate request or response types across files.

## 5. Authentication and authorization

### 5.1 Admin authentication

Use Better Auth with email/password authentication and database-backed cookie sessions.

- Disable public signup.
- Use secure, HTTP-only, same-site cookies in production.
- Require a minimum password length of 6 characters.
- Normalize email addresses to lowercase before comparison.
- Rate-limit login and password-reset attempts.
- Revoke other sessions after a password change or reset.
- Do not write custom password hashing or session cryptography.

### 5.2 First superadmin

Use these deployment environment variables:

```text
SUPERADMIN_EMAIL=
SUPERADMIN_INITIAL_PASSWORD=
```

Create a script named `bootstrap:superadmin` with these rules:

1. Run only after migrations.
2. If no admin users exist, create the user whose email exactly matches `SUPERADMIN_EMAIL`.
3. Give that account the `superadmin` role.
4. Set `mustChangePassword=true`.
5. If an account already exists, do not change its password or role automatically.
6. Never log the password.
7. On first login, redirect the user to a mandatory change-password page before allowing access elsewhere.
8. After the password is changed, the deployment operator should remove `SUPERADMIN_INITIAL_PASSWORD`.

### 5.3 Roles

Support exactly these roles initially:

- `superadmin`: complete access, including team management and system settings.
- `admin`: manage apps, questions, feedback, and replies; cannot manage superadmins.
- `viewer`: read-only access to apps, questions, and the inbox.

Never allow removal, disabling, or demotion of the final active superadmin. Enforce authorization on the server; hiding a button is not authorization.

### 5.4 Creating other users

The superadmin can create users with name, email, role, and a generated temporary password. Display the temporary password once and optionally email it when SMTP is configured. New accounts must change the password on first login. Public account registration must remain unavailable.

### 5.5 Mobile authentication

Mobile clients do not use administrator authentication.

Each configured app receives an app ID and a random client key. The client key may be embedded in the app but must be treated as an identifier and abuse deterrent, not as a true secret, because mobile binaries can be inspected.

Registration exchanges `appId + clientKey + userGuid` for a long random installation token. Store only a SHA-256 hash of the installation token. All later mobile requests use:

```http
Authorization: Bearer <installation-token>
```

Permit admins to rotate an app client key and revoke individual installations. Apply request-size limits and rate limits to all public mobile endpoints.

## 6. Core domain rules

### 6.1 Apps and installations

- An app represents one mobile application.
- `userGuid` is generated and stored by the mobile app. It identifies a local installation/user within that app.
- The unique identity is `(appId, userGuid)`; a GUID alone is never globally unique in this system.
- Registering an existing pair updates metadata and returns a newly rotated installation token.
- Store platform, app version, locale, timezone, and last-seen time when supplied.
- Never require name, email, phone number, advertising ID, or device fingerprint from mobile users.

### 6.2 Questions

Remote questions belong to one app. Supported answer types:

- short text
- long text
- single choice
- multiple choice
- rating from 1 to 5
- yes/no

A question has draft, active, paused, or archived status. It may have start and end dates. Only active questions within their date window are returned to clients. An installation should normally answer a question once. Admins may configure `allowMultipleAnswers` when needed.

Never edit the meaning of a question after answers exist. The UI should offer duplication instead. Minor metadata such as status and end date may still change.

### 6.3 Hardcoded questions

The mobile app may submit an answer for a question that does not exist in the server database. Such a request must contain:

- `externalQuestionKey`: a stable key defined by the app developer
- `questionText`: a snapshot of the text shown to the user
- `answerType`
- `answer`

Group hardcoded-question analytics by `(appId, externalQuestionKey)`. Preserve the question-text snapshot on every answer so historical records remain understandable after an app update.

### 6.4 Conversations and messages

- General feedback creates a conversation with an initial message from the mobile user.
- Every submitted question answer also creates a linked conversation, allowing an administrator to reply.
- A conversation belongs to exactly one app and one installation.
- Messages may be sent by `mobile_user`, `admin`, or `system`.
- Admin replies appear in the mobile sync response.
- The mobile user may send another message in the same conversation.
- Conversation statuses are `open`, `waiting_for_user`, and `closed`.
- An admin reply normally changes status to `waiting_for_user`.
- A new mobile message changes status to `open`.
- Closed conversations may be reopened by a new mobile message.

Do not implement deletion of conversations through the normal UI. Allow archiving or closing. Data-retention cleanup should be an explicit administrative process.

### 6.5 Idempotency

Every mobile mutation includes a UUID `clientRequestId`. Add unique constraints so retrying the same request cannot create duplicate answers or messages. On a duplicate request, return the previously created resource with a successful response.

## 7. Database design

Use UUID primary keys for public domain resources. Messages additionally use a monotonic PostgreSQL identity column called `sequence` for efficient synchronization. Store all timestamps as `timestamptz` in UTC.

Better Auth owns its required user, account, session, and verification tables. Extend the user record with `role`, `mustChangePassword`, and `disabledAt` using supported Better Auth configuration or a separate profile table.

Create these application tables:

### `apps`

- `id uuid primary key`
- `name varchar(120) not null`
- `slug varchar(80) unique not null`
- `client_key_hash varchar(64) not null`
- `client_key_prefix varchar(12) not null`
- `status varchar(20) not null`
- `created_by uuid not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `installations`

- `id uuid primary key`
- `app_id uuid not null references apps`
- `user_guid varchar(128) not null`
- `token_hash varchar(64) not null`
- `platform varchar(20) null`
- `app_version varchar(40) null`
- `locale varchar(20) null`
- `timezone varchar(80) null`
- `last_seen_at timestamptz not null`
- `revoked_at timestamptz null`
- `created_at timestamptz not null`
- unique `(app_id, user_guid)`
- unique `token_hash`

### `questions`

- `id uuid primary key`
- `app_id uuid not null references apps`
- `key varchar(100) not null`
- `title varchar(200) not null`
- `description text null`
- `answer_type varchar(30) not null`
- `options jsonb null`
- `required boolean not null default false`
- `allow_multiple_answers boolean not null default false`
- `status varchar(20) not null`
- `starts_at timestamptz null`
- `ends_at timestamptz null`
- `created_by uuid not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique `(app_id, key)`

### `answers`

- `id uuid primary key`
- `app_id uuid not null references apps`
- `installation_id uuid not null references installations`
- `question_id uuid null references questions`
- `external_question_key varchar(120) null`
- `question_text_snapshot text not null`
- `answer_type varchar(30) not null`
- `answer jsonb not null`
- `client_request_id uuid not null`
- `created_at timestamptz not null`
- unique `(installation_id, client_request_id)`
- check that either `question_id` or `external_question_key` is present

### `conversations`

- `id uuid primary key`
- `app_id uuid not null references apps`
- `installation_id uuid not null references installations`
- `answer_id uuid null references answers`
- `source_type varchar(30) not null`
- `subject varchar(200) not null`
- `status varchar(30) not null`
- `last_message_at timestamptz not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `messages`

- `id uuid primary key`
- `sequence bigint generated always as identity unique`
- `conversation_id uuid not null references conversations`
- `sender_type varchar(30) not null`
- `admin_user_id uuid null`
- `body text not null`
- `client_request_id uuid null`
- `delivered_at timestamptz null`
- `read_at timestamptz null`
- `created_at timestamptz not null`
- partial unique constraint on `(conversation_id, client_request_id)` when `client_request_id` is not null

### `question_dismissals`

- `question_id uuid not null references questions`
- `installation_id uuid not null references installations`
- `created_at timestamptz not null`
- primary key `(question_id, installation_id)`

### `audit_logs`

- `id bigint generated always as identity primary key`
- `actor_user_id uuid null`
- `action varchar(100) not null`
- `entity_type varchar(50) not null`
- `entity_id varchar(100) null`
- `metadata jsonb null`
- `ip_address varchar(64) null`
- `created_at timestamptz not null`

Add indexes for:

- installations by `(app_id, user_guid)`
- questions by `(app_id, status, starts_at, ends_at)`
- answers by `(app_id, created_at desc)` and `(question_id, created_at desc)`
- conversations by `(app_id, status, last_message_at desc)`
- conversations by `(installation_id, last_message_at desc)`
- messages by `(conversation_id, sequence)`
- messages by `sequence`
- audit logs by `created_at desc`

Generate version-controlled SQL migrations. Never use schema push directly against production.

## 8. Mobile API contract

All endpoints use JSON, live under `/api/v1`, and return a consistent error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A safe human-readable message",
    "requestId": "..."
  }
}
```

Never return stack traces, SQL details, secrets, hashes, or internal filenames.

### 8.1 Register installation

`POST /api/v1/installations/register`

Request:

```json
{
  "appId": "uuid",
  "clientKey": "key returned when the app was created",
  "userGuid": "local-mobile-guid",
  "platform": "ios",
  "appVersion": "1.2.0",
  "locale": "en-US",
  "timezone": "Asia/Bangkok"
}
```

Response returns `installationId` and the installation token. Return the raw token only in this response.

### 8.2 Synchronize

`GET /api/v1/sync?after=12345`

Authentication: installation bearer token.

Response:

```json
{
  "questions": [],
  "replies": [],
  "nextCursor": "12399",
  "serverTime": "2026-08-07T12:00:00Z"
}
```

Rules:

- Return active questions for this app that are in their schedule window and have not been answered or dismissed, unless multiple answers are allowed.
- Return admin/system messages for this installation with `sequence > after`.
- Limit replies to 100 per request and indicate `hasMore` if needed.
- Validate the cursor as a non-negative integer.
- Update installation metadata and last-seen time without making sync fail when the metadata update fails.

### 8.3 Submit an answer

`POST /api/v1/answers`

For a remote question, send `questionId`. For a hardcoded question, send `externalQuestionKey`, `questionText`, and `answerType`. Both forms include `answer` and `clientRequestId`.

Validate answer content against its type and options. Create the answer, conversation, and initial system context inside one PostgreSQL transaction.

### 8.4 Dismiss a remote question

`POST /api/v1/questions/:questionId/dismiss`

Include `clientRequestId`. Dismissal prevents the question from being returned again to that installation.

### 8.5 Submit general feedback

`POST /api/v1/conversations`

Request fields: `subject`, `message`, and `clientRequestId`. Create the conversation and first mobile-user message atomically.

### 8.6 Continue a conversation

`POST /api/v1/conversations/:conversationId/messages`

The authenticated installation may post only to its own conversation. Request fields: `body` and `clientRequestId`.

### 8.7 Acknowledge replies

`POST /api/v1/messages/acknowledge`

Accept arrays of delivered and read message IDs. The installation may acknowledge only messages belonging to its conversations.

### 8.8 List local conversation history

`GET /api/v1/conversations?cursor=&limit=20`

`GET /api/v1/conversations/:conversationId/messages?before=&limit=50`

Use cursor pagination, never offset pagination for message history.

## 9. Admin API

All `/api/admin/*` routes require a valid Better Auth session and server-side role checks.

Implement endpoints for:

- Current user and dashboard counts
- App create, list, update, deactivate, client-key rotation
- Installation list, detail, and revoke
- Question create, list, detail, update metadata, activate, pause, archive, and duplicate
- Inbox list with filters and cursor pagination
- Conversation detail, reply, close, and reopen
- Answer list/detail and CSV export with a bounded date range
- Team user list, create, disable, enable, role change, session revoke, and password reset
- Audit-log list

Every state-changing admin operation must create an audit record. CSV export must escape spreadsheet formula prefixes (`=`, `+`, `-`, `@`) to prevent formula injection.

## 10. Admin user interface

### 10.1 Visual direction

The UI must be minimalist, fast, and calm:

- White or near-white background, neutral gray borders, and one restrained accent color.
- Maximum content width around 1400px; comfortable spacing without oversized cards.
- System font stack or one locally optimized font.
- Use cards only when they clarify grouping; do not put every section in a card.
- Use tables for dense lists and side panels/drawers for quick details.
- Avoid gradients, glass effects, large illustrations, excessive shadows, and decorative animation.
- Provide visible keyboard focus, labels, sufficient contrast, and semantic HTML.
- Support desktop first and remain usable on tablet/mobile.
- Include dark mode only after the light theme is complete and tested.

### 10.2 Navigation

Use a compact left sidebar on desktop and a drawer on small screens:

- Overview
- Inbox
- Questions
- Apps
- Team — superadmin only
- Audit log — superadmin only
- Settings

The header contains the current page title, app filter where relevant, and user menu.

### 10.3 Required screens

1. Login, forgot password, reset password, and mandatory first password change.
2. Overview: open feedback, waiting-for-user count, answers in the last 7/30 days, and recent activity.
3. Inbox: searchable/filterable list showing app, subject/question, status, last message, and time.
4. Conversation detail: chronological messages, answer context, installation metadata, reply box, and status action.
5. Questions list and question editor with preview of answer type.
6. Answers list with question/app/date filters and CSV export.
7. Apps list, create/edit page, key reveal-once behavior, rotation confirmation, and installations.
8. Team management with role and disabled-state controls.
9. Audit log with actor, action, entity, and time filters.

Every list needs loading, empty, error, and permission-denied states. Destructive or disruptive actions such as key rotation, installation revocation, and account disabling require confirmation.

## 11. Security requirements

- Validate all environment variables at startup and fail with a clear error when required configuration is missing.
- Use parameterized queries through Drizzle.
- Validate every request body, parameter, query, and relevant response with Zod.
- Set strict request-body limits; feedback/message bodies should be at most 10,000 characters.
- Sanitize displayed text by rendering it as text, not HTML. Do not support arbitrary HTML or Markdown initially.
- Use CSRF protection for cookie-authenticated state changes. SameSite cookies alone are not the complete control.
- Configure a strict production CORS policy. Mobile bearer-token endpoints generally do not need browser-wide CORS access.
- Add security headers including CSP, frame restrictions, content-type protection, and referrer policy.
- Do not log passwords, tokens, cookies, client keys, full authorization headers, or answer/message contents.
- Compare token hashes using constant-time comparison where applicable.
- Store client keys and installation tokens only as hashes; display raw values once when generated.
- Apply per-IP and per-installation rate limits to registration, sync, answer, feedback, and message endpoints.
- Return generic login/reset responses that do not reveal whether an email exists.
- Keep audit logs append-only through application code.
- Back up PostgreSQL daily and document a restore test.
- Provide a configurable retention period, but do not automatically delete data until the operator explicitly enables retention cleanup.

## 12. Performance rules

- Keep the mobile API responses small and enable Brotli/gzip at the host or reverse proxy.
- Use cursor pagination for inboxes, conversations, messages, answers, and audit logs.
- Select only required columns; do not fetch full message histories for list screens.
- Avoid N+1 queries. Test list endpoints with realistic data volumes.
- Use transactions only around related writes and keep them short.
- Use a bounded PostgreSQL connection pool suitable for the hosting plan.
- Cache only stable reference data, such as an app lookup by key, in a small in-memory TTL cache. The database remains the source of truth.
- Do not add Redis, queues, background workers, or search infrastructure before measurements show a need.
- Add health endpoints: `/api/health/live` and `/api/health/ready`; readiness must perform a lightweight database check.

## 13. Observability and operations

- Generate a request ID for every request and return it in response headers.
- Log request ID, route, method, status, duration, and safe actor identifiers.
- Add structured error logging without sensitive payloads.
- Maintain an audit log for business/security actions; application logs and audit logs are separate concepts.
- Add a simple admin-visible system status page showing application version, database reachability, and migration state without exposing secrets.
- Provide scripts for migration, superadmin bootstrap, production build, start, test, and database backup instructions.

## 14. Testing requirements

### Unit tests

- Answer-type validation
- Question scheduling and eligibility
- Role permissions
- Cursor parsing
- Token hashing and verification
- Conversation status transitions
- CSV formula escaping

### Integration tests with a real temporary PostgreSQL database

- Installation registration and token rotation
- App isolation: one app cannot access another app's questions or data
- Installation isolation: one installation cannot access another conversation
- Remote and hardcoded answer submission
- Idempotent retries
- Sync cursor and pagination behavior
- Admin replies returned through sync
- Disabled users and revoked installations rejected
- Final superadmin cannot be removed or demoted

### Playwright tests

- Superadmin login and mandatory password change
- Create app and reveal client key once
- Create and activate a question
- View submitted feedback and send a reply
- Create another admin user
- Viewer cannot mutate data

Tests must not depend on production credentials or the production database.

## 15. Implementation phases and completion criteria

### Phase 1 — Foundation

- Initialize strict TypeScript Next.js project.
- Configure PostgreSQL, Drizzle, migrations, environment validation, logging, health endpoints, and test harness.
- Add CI commands for lint, type check, unit tests, integration tests, and build.

Complete when a fresh database can migrate, the app starts, health checks work, and CI passes.

### Phase 2 — Authentication and shell

- Integrate Better Auth with Drizzle and admin capabilities.
- Add superadmin bootstrap, login, logout, password change, roles, route guards, and basic dashboard shell.
- Add team management and audit events.

Complete when all role boundaries and first-login behavior have automated tests.

### Phase 3 — Apps and mobile identity

- Implement app management, key generation/rotation, installation registration, bearer-token middleware, revocation, and rate limiting.

Complete when two apps and two installations are proven isolated through integration tests.

### Phase 4 — Questions and answers

- Implement remote question management, scheduling, sync eligibility, dismissals, typed answer validation, hardcoded answers, and answer views.

Complete when each answer type and both question sources work end to end.

### Phase 5 — Feedback and reply exchange

- Implement conversations, messages, inbox filters, admin replies, mobile synchronization, delivery/read acknowledgement, status transitions, and history pagination.

Complete when a mobile client can submit feedback, receive an admin reply on its next sync, respond again, and close/reopen correctly.

### Phase 6 — Production hardening

- Add security headers, CSRF defense, final rate limits, request-size limits, safe logging, backup/restore documentation, CSV export protection, error pages, and load tests.
- Verify production build and SmarterASP.NET deployment steps in a staging site.

Complete when the production checklist below passes.

## 16. SmarterASP.NET deployment plan

1. Create a PostgreSQL database and user with only the required database permissions.
2. Configure the Node.js site and select a supported current Node.js LTS runtime.
3. Build the Next.js application using standalone production output if supported by the host.
4. Configure all secrets through the hosting control panel, never committed files.
5. Run production migrations as a controlled deployment step.
6. Run `bootstrap:superadmin` once.
7. Start the Node.js application using the host-provided port environment variable; never hardcode a production port.
8. Configure HTTPS, the public base URL, secure cookies, and proxy-header trust according to the host setup.
9. Test readiness, login, database writes, mobile registration, sync, and reply flow on staging before production.
10. Configure scheduled PostgreSQL backups and verify one restore.

Required environment variables:

```text
NODE_ENV=production
DATABASE_URL=
APP_BASE_URL=
AUTH_SECRET=
SUPERADMIN_EMAIL=
SUPERADMIN_INITIAL_PASSWORD=
LOG_LEVEL=info
TRUST_PROXY=true
```

Optional email variables:

```text
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Secrets must be long, randomly generated values. Provide `.env.example` containing names and descriptions but no real values.

## 17. Production acceptance checklist

- A fresh installation can be completed using only README instructions.
- No public admin signup endpoint is usable.
- Superadmin bootstrap is idempotent and never overwrites an existing password.
- All admin routes enforce server-side roles.
- All mobile data access is scoped by authenticated installation and app.
- Client keys, installation tokens, passwords, cookies, and authorization headers never appear in logs.
- Database migrations are committed and reproducible.
- Duplicate mobile requests do not create duplicate records.
- Sync works correctly after offline periods and with more than 100 pending messages.
- List endpoints are cursor paginated and use appropriate indexes.
- UI includes loading, empty, error, validation, and permission states.
- Keyboard navigation and visible focus work on all core screens.
- Unit, integration, and browser tests pass.
- Production build passes without TypeScript or lint errors.
- HTTPS and secure-cookie behavior are verified on staging.
- A database backup has been restored successfully in a test environment.

## 18. Explicit non-goals

Do not implement these unless a later specification requests them:

- Real-time chat or WebSockets
- Push notifications through APNs or FCM
- File or image attachments
- Public customer accounts
- Social login or enterprise SSO
- AI-generated replies or sentiment analysis
- Billing or subscriptions
- Multiple organizations/tenants
- Redis, Kafka, message queues, or microservices
- Native mobile SDK packages; the documented HTTP API is sufficient initially

## 19. Required documentation delivered with the code

- Root README with local setup, environment variables, database setup, migrations, tests, build, and deployment.
- OpenAPI 3.1 document for `/api/v1` mobile endpoints with examples and error codes.
- Short mobile integration guide showing register, securely store token, sync, answer, feedback, acknowledge, retry, and token-expiration behavior.
- Database diagram or schema document.
- Role/permission table.
- Operational runbook for backup, restore, key rotation, installation revocation, superadmin recovery, and rollback.
- A short `DECISIONS.md` recording any necessary implementation decisions not specified here.

