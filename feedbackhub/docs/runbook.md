# Operational runbook

Procedures for backup, restore, key rotation, installation revocation, superadmin recovery, and deployment rollback.

## Backup

### PostgreSQL backup

Schedule daily backups through SmarterASP.NET PostgreSQL tools or `pg_dump`:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="feedbackhub-$(date +%Y%m%d).dump"
```

For plain SQL:

```bash
pg_dump "$DATABASE_URL" --file="feedbackhub-$(date +%Y%m%d).sql"
```

### What to back up

| Item | Method |
|------|--------|
| Database | `pg_dump` or hosting panel scheduled backup |
| Environment secrets | Hosting control panel export (never in git) |
| Application build | CI artifact or tagged release |

### Backup verification

Monthly, restore a backup to a non-production database and verify:

1. Migrations state is consistent
2. Admin login works
3. Sample app, installation, and conversation data is intact
4. Mobile sync returns expected questions and replies

Document the restore date and result.

## Restore

### Full database restore

1. Stop the application or enable maintenance mode to prevent writes during restore.
2. Restore from backup:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" feedbackhub-YYYYMMDD.dump
```

For plain SQL:

```bash
psql "$DATABASE_URL" < feedbackhub-YYYYMMDD.sql
```

3. Verify schema:

```bash
pnpm db:migrate
```

Drizzle migrate is safe on an already-restored database; it applies only pending migrations.

4. Start the application.
5. Verify health endpoints and admin login.
6. Test mobile registration and sync on staging.

### Partial restore

For accidental deletion of specific rows, restore to a temporary database from backup, extract needed rows, and insert into production with care. Prefer restoring full backup to staging and re-exporting specific data.

## Key rotation

### App client key rotation

When a client key may be compromised or as part of a regular rotation policy:

1. Sign in as **admin** or **superadmin**.
2. Open **Apps** → select the app → **Rotate client key**.
3. Copy the new raw client key immediately — it is shown only once.
4. Update the mobile app release or remote config with the new key.
5. Existing installation tokens remain valid until re-registration or revocation.
6. After all clients use the new key, old registrations with the previous key will fail with `401 Unauthorized`.

**API:** `POST /api/admin/apps/{appId}/rotate-key`

An audit log entry `app.key_rotated` is recorded.

### AUTH_SECRET rotation

Rotating `AUTH_SECRET` invalidates all admin sessions. Mobile installation tokens are unaffected.

1. Generate a new 32+ character random string.
2. Update `AUTH_SECRET` in the hosting control panel.
3. Restart the application.
4. All admins must sign in again.

Plan this during a maintenance window.

### Installation token rotation (client-side)

Mobile clients rotate tokens by calling register again with the same `appId`, `clientKey`, and `userGuid`. The server issues a new token and invalidates the previous hash.

No admin action required unless the installation should be blocked entirely (see revocation).

## Installation revocation

Revoke a compromised or abusive installation:

1. Sign in as **admin** or **superadmin**.
2. Open **Apps** → select the app → **Installations**.
3. Select the installation → **Revoke**.

**API:** `POST /api/admin/installations/{installationId}/revoke`

Effects:

- `revoked_at` is set on the installation row
- Bearer token authentication fails with `401 Unauthorized`
- The mobile client must re-register; re-registration clears `revoked_at` and issues a new token

An audit log entry `installation.revoked` is recorded.

### Bulk revocation

For a compromised client key, rotate the app key first, then revoke suspicious installations individually. Re-registration requires the new client key.

## Superadmin recovery

### Scenario: locked out with no admin access

If all superadmin accounts are disabled or passwords are lost:

1. Ensure database access (hosting panel or direct PostgreSQL connection).
2. Verify no active admin exists:

```sql
SELECT id, email, role, disabled_at
FROM "user"
WHERE role IN ('superadmin', 'admin') AND disabled_at IS NULL;
```

3. If no usable admin exists, run bootstrap (idempotent — only creates when no admins exist):

```bash
# Set SUPERADMIN_EMAIL and SUPERADMIN_INITIAL_PASSWORD in environment
pnpm bootstrap:superadmin
```

4. Sign in with the bootstrap credentials and change the password immediately.

### Scenario: superadmin disabled by mistake

Re-enable via database (emergency only):

```sql
UPDATE "user"
SET disabled_at = NULL, updated_at = NOW()
WHERE email = 'admin@example.com';
```

Prefer using another superadmin account via the team UI when available.

### Scenario: final superadmin protection

The application prevents disabling or demoting the last active superadmin. If this check fails due to data corruption, restore from backup or manually correct `role` and `disabled_at` in the database.

### Password reset via team UI

A superadmin can reset any team member's password via **Team** → user → **Reset password**. The temporary password is shown once.

## Rollback

### Application rollback

1. Identify the last known good deployment artifact (CI build or git tag).
2. Deploy the previous standalone bundle to SmarterASP.NET.
3. Do **not** run migrations backward — Drizzle does not support down migrations.
4. If the failed deployment ran new migrations, assess whether the old code is compatible with the new schema. If not, restore database from pre-deploy backup.

### Rollback decision matrix

| Failure type | Action |
|--------------|--------|
| Application bug, schema unchanged | Redeploy previous build |
| Bad migration | Restore DB from backup, redeploy previous build |
| Config error | Fix env vars, restart |
| Partial deploy | Redeploy complete standalone + static + public |

### Post-rollback verification

1. `GET /api/health/live` and `GET /api/health/ready`
2. Admin login and dashboard
3. Mobile register → sync → answer flow
4. Check error logs for migration or schema mismatches

## Health monitoring

| Endpoint | Expected |
|----------|----------|
| `GET /api/health/live` | `200` `{ "status": "ok" }` |
| `GET /api/health/ready` | `200` `{ "status": "ok", "checks": { "database": true } }` |

`503` on ready indicates database connectivity failure — check `DATABASE_URL`, network, and PostgreSQL service status.

## Incident checklist

1. Capture `x-request-id` from failing API responses
2. Check application logs (request ID, route, status, duration — no secrets)
3. Check `audit_logs` for recent administrative actions
4. Verify database connectivity via ready endpoint
5. If data corruption suspected, stop writes and restore from latest verified backup to staging
6. Document timeline and resolution

## Contacts and references

- Deployment steps: [README.md](../README.md)
- Database schema: [database-schema.md](database-schema.md)
- Mobile API: [openapi.yaml](openapi.yaml)
- Implementation decisions: [DECISIONS.md](../DECISIONS.md)
