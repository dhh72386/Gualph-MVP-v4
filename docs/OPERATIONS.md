# Gualph Milestone 0 Operations

## Environments and secrets

Every server environment must define `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL`. Startup validation rejects malformed database and application URLs and JWT secrets shorter than 32 characters. Generate secrets with a cryptographically secure secret manager, keep them out of source control, and rotate a compromised JWT secret immediately. Rotation invalidates all existing sessions.

## Local PostgreSQL

Run `docker compose up -d postgres`, copy `.env.example` to `.env`, and run `pnpm prisma:deploy`. The committed service pins PostgreSQL 16.6 and reports readiness through `pg_isready`. Stop it with `docker compose down`. Removing the named volume destroys local data and is never part of routine setup.

## Migrations and releases

CI applies all committed migrations to an empty PostgreSQL database with `pnpm prisma:deploy` before integration tests. Production releases must back up the database, run `pnpm prisma:deploy` once, verify `/api/health`, then deploy application instances. Never edit an applied migration or use `prisma migrate dev` in production.

## Health and monitoring

`GET /api/health` verifies application-to-database connectivity. Production monitoring should check it at least once per minute and alert after three consecutive failures. Application platforms must capture structured platform request logs and unexpected server errors; secrets, cookies, authorization headers, password hashes, and customer notes must never be logged.

## Backups and recovery

Pilot environments require encrypted daily PostgreSQL backups retained for 30 days and point-in-time recovery when supported by the provider. Target an initial recovery point objective of 24 hours and recovery time objective of 4 hours. Perform and record a restore test before onboarding the first pilot and quarterly thereafter.

Recovery procedure:

1. Stop writes or place the application in maintenance mode.
2. Restore the selected backup into a new database instance.
3. Run `pnpm prisma:deploy` against the restored instance.
4. Verify schema, row counts, authentication, tenant isolation, and a reservation lifecycle smoke test.
5. Update the application secret reference to the restored database.
6. Verify `/api/health`, resume traffic, and document recovery timing and data loss.

## Security response

Run `pnpm audit --prod --audit-level high` in CI. Critical or high production advisories block release. Rotate exposed credentials, increment affected users' `sessionVersion` to revoke sessions, preserve audit records, and document incident scope and corrective action.
