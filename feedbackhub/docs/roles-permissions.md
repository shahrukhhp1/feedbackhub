# Roles and permissions

Feedback Hub has three administrator roles. Mobile installations are not role-based; they authenticate with per-installation bearer tokens scoped to a single app.

Authorization is enforced on the server for every admin API route. UI visibility does not grant access.

## Role summary

| Role | Description |
|------|-------------|
| **superadmin** | Full access including team management, audit log, and all admin operations |
| **admin** | Manage apps, questions, inbox, and answers; cannot manage team or view audit log |
| **viewer** | Read-only access to apps, questions, inbox, and answers |

## Permission matrix

| Capability | superadmin | admin | viewer |
|------------|:----------:|:-----:|:------:|
| View dashboard | ✓ | ✓ | ✓ |
| View apps and installations | ✓ | ✓ | ✓ |
| Create / update apps | ✓ | ✓ | ✗ |
| Rotate app client key | ✓ | ✓ | ✗ |
| Revoke installation | ✓ | ✓ | ✗ |
| View questions | ✓ | ✓ | ✓ |
| Create / update / activate / pause / archive / duplicate questions | ✓ | ✓ | ✗ |
| View inbox and conversations | ✓ | ✓ | ✓ |
| Reply, close, reopen conversations | ✓ | ✓ | ✗ |
| View answers | ✓ | ✓ | ✓ |
| Export answers (CSV) | ✓ | ✓ | ✓ |
| View team | ✓ | ✗ | ✗ |
| Create / disable / enable team users | ✓ | ✗ | ✗ |
| Change user roles | ✓ | ✗ | ✗ |
| Reset passwords / revoke sessions | ✓ | ✗ | ✗ |
| View audit log | ✓ | ✗ | ✗ |
| View settings / system status | ✓ | ✓ | ✓ |

## Server-side enforcement

Permissions are implemented in `src/server/auth/permissions.ts`:

| Function | Allowed roles |
|----------|---------------|
| `canManageApps` | superadmin, admin |
| `canManageQuestions` | superadmin, admin |
| `canManageInbox` | superadmin, admin |
| `canManageTeam` | superadmin only |
| `canViewAuditLog` | superadmin only |

Read endpoints (GET) generally require only a valid session. State-changing endpoints (POST, PATCH, DELETE) call `assertPermission` with the appropriate `canManage*` function.

## Superadmin safeguards

- The bootstrap script creates a superadmin only when no `superadmin` or `admin` users exist.
- The application must never allow removal, disabling, or demotion of the final active superadmin.
- New team accounts receive a temporary password and `mustChangePassword=true` until first login.

## Mobile clients

Mobile clients do not use administrator roles. Each installation token:

- Is scoped to one app (`appId`) and one local user identity (`userGuid`)
- Can only access conversations and messages belonging to that installation
- Can only see active questions for its app
- Is invalidated when revoked by an admin or when a new token is issued via re-registration

## Creating users

Only a superadmin can create users via `POST /api/admin/team` with:

- `name`, `email`, `role` (`admin` or `viewer`; superadmin assignment is restricted)
- A generated temporary password displayed once (optionally emailed when SMTP is configured)

Public self-registration is not available.
