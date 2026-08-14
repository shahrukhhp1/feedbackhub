# Feedback Hub

Feedback Hub is a Next.js application for collecting mobile app feedback, managing remote survey questions, and operating an admin inbox for replies. Mobile clients use a bearer-token API under `/api/v1`; administrators use a web dashboard with session-based authentication.

## Prerequisites

- **Node.js** — current LTS (20.x or newer)
- **pnpm** — `pnpm@11` (see `packageManager` in `package.json`)
- **PostgreSQL** — 14+ recommended

## Local setup

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your local values (see [Environment variables](#environment-variables) below). Set `DATABASE_URL` to your PostgreSQL instance.

3. Ensure the database exists and run migrations:

```bash
pnpm db:migrate
```

4. Bootstrap the first superadmin (only when no admin users exist):

```bash
pnpm bootstrap:superadmin
```

5. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with `SUPERADMIN_EMAIL` and `SUPERADMIN_INITIAL_PASSWORD` from your `.env` file. You will be prompted to change the password on first login.

## Environment variables

### Required

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development`, `test`, or `production` |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/feedbackhub` |
| `APP_BASE_URL` | Public base URL of the app, e.g. `http://localhost:3000` |
| `AUTH_SECRET` | Secret for Better Auth sessions; at least 32 random characters |
| `LOG_LEVEL` | `fatal`, `error`, `warn`, `info`, `debug`, or `trace` |

### Bootstrap (required for `bootstrap:superadmin`)

| Variable | Description |
|----------|-------------|
| `SUPERADMIN_EMAIL` | Email for the initial superadmin account |
| `SUPERADMIN_INITIAL_PASSWORD` | Temporary password (user must change on first login) |

### Optional

| Variable | Description |
|----------|-------------|
| `TRUST_PROXY` | Set to `true` when behind a reverse proxy (required on SmarterASP.NET) |
| `SMTP_HOST` | SMTP server for optional email delivery |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | From address for outbound email |

All variables are validated at startup. Missing or invalid required values cause the application to fail with a clear error.

See `.env.example` for a template. Never commit real secrets.

## Database setup and migrations

Schema is managed with [Drizzle ORM](https://orm.drizzle.team/). Migration files live in `./drizzle` (generated via `pnpm db:generate`).

**Apply migrations:**

```bash
pnpm db:migrate
```

**Generate a new migration** (after schema changes):

```bash
pnpm db:generate
pnpm db:migrate
```

**Open Drizzle Studio** (optional):

```bash
pnpm db:studio
```

## Bootstrap superadmin

The bootstrap script creates a single superadmin when no `superadmin` or `admin` users exist. It is idempotent:

- Skips if any admin user already exists
- Skips if a user with `SUPERADMIN_EMAIL` already exists
- Never overwrites an existing password

```bash
pnpm bootstrap:superadmin
```

Run once after migrations on a fresh installation, or after a controlled recovery (see `docs/runbook.md`).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js development server |
| `pnpm build` | Production build (standalone output) |
| `pnpm start` | Start production server |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:watch` | Unit tests in watch mode |
| `pnpm test:integration` | Integration tests |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm ci` | Full CI pipeline: typecheck, lint, test, build |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm bootstrap:superadmin` | Create initial superadmin |

## Tests

**Unit tests** — answer validation, permissions, cursor parsing, token hashing, and related server logic:

```bash
pnpm test
```

**Integration tests** — database-backed API flows:

```bash
pnpm test:integration
```

**End-to-end tests** — browser tests via Playwright:

```bash
pnpm test:e2e
```

## Build

Production builds use Next.js **standalone** output for deployment to Node.js hosts:

```bash
pnpm build
```

After build, standalone artifacts are in `.next/standalone`. Static assets are copied as part of the deployment process (see [Deployment](#deployment-to-smarteraspnet)).

Verify locally:

```bash
pnpm build
pnpm start
```

## Deployment to SmarterASP.NET

Feedback Hub targets SmarterASP.NET Node.js hosting with their PostgreSQL service.

### 1. Prepare the database

1. Create a PostgreSQL database and user with only the permissions required for the application.
2. Note the connection string for `DATABASE_URL`.

### 2. Configure the Node.js site

1. Create a Node.js site and select a supported current Node.js LTS runtime.
2. Set environment variables in the hosting control panel (never commit production secrets):

```text
NODE_ENV=production
DATABASE_URL=<from hosting panel>
APP_BASE_URL=https://your-domain.example
AUTH_SECRET=<long random string, 32+ characters>
SUPERADMIN_EMAIL=<your email>
SUPERADMIN_INITIAL_PASSWORD=<temporary password>
LOG_LEVEL=info
TRUST_PROXY=true
```

Configure optional SMTP variables if email is needed.

### 3. Build and deploy

1. Build locally or in CI:

```bash
pnpm install
pnpm build
```

2. Deploy the standalone bundle:
   - Copy `.next/standalone` contents to the site root
   - Copy `.next/static` to `.next/static` relative to the standalone server
   - Copy `public` to `public` relative to the standalone server

3. Set the start command to run the standalone server, e.g.:

```bash
node server.js
```

Use the port provided by the host environment variable; do not hardcode a production port.

### 4. Post-deploy steps

1. Run migrations as a controlled deployment step:

```bash
pnpm db:migrate
```

2. Run superadmin bootstrap once:

```bash
pnpm bootstrap:superadmin
```

3. Configure HTTPS, public base URL, secure cookies, and proxy trust (`TRUST_PROXY=true`).

### 5. Verify

- `GET /api/health/live` — process is running
- `GET /api/health/ready` — database connectivity
- Admin login and dashboard
- Mobile registration → sync → answer → reply flow on staging before production

Configure scheduled PostgreSQL backups and verify one restore (see `docs/runbook.md`).

## Documentation

| Document | Description |
|----------|-------------|
| [docs/openapi.yaml](docs/openapi.yaml) | OpenAPI 3.1 for mobile `/api/v1` endpoints |
| [docs/mobile-integration-guide.md](docs/mobile-integration-guide.md) | Mobile client integration guide |
| [docs/database-schema.md](docs/database-schema.md) | Database tables and relationships |
| [docs/roles-permissions.md](docs/roles-permissions.md) | Admin roles and permissions |
| [docs/runbook.md](docs/runbook.md) | Backup, restore, key rotation, recovery |
| [DECISIONS.md](DECISIONS.md) | Implementation decisions |

## Health endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health/live` | Liveness — returns `{ "status": "ok" }` |
| `GET /api/health/ready` | Readiness — checks database; returns 503 if unavailable |

Both endpoints include an `x-request-id` response header.
