# Gualph MVP — Phase 1 Course Operator Portal

This is a best-practice MVP scaffold for **Gualph**, a golf tee time SaaS platform. Phase 1 focuses on the course-operator portal before adding the consumer mobile app.

## Included

- Next.js App Router + TypeScript
- Tailwind CSS UI
- PostgreSQL + Prisma schema
- Course signup/login with JWT cookie session
- Course profile data model
- Staff/user roles: `SUPER_ADMIN`, `COURSE_ADMIN`, `STAFF`
- Tee time inventory CRUD API
- Tee sheet calendar/table view
- Reservation records
- Player/customer records
- Dashboard KPIs: available tee times, reserved tee times, rounds booked, revenue estimate
- Super admin page
- Seed data

## Quick Start

```bash
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d postgres
pnpm prisma:generate
pnpm prisma:deploy
pnpm prisma:seed
pnpm dev
```

Open `http://localhost:3000`.

Demo course login:

- Email: `course@gualph.local`
- Password: `Gualph123!`

## Recommended local database

Use the committed PostgreSQL service:

```bash
docker compose up -d postgres
docker compose down
```

`docker-compose.yml` pins PostgreSQL 16.6, persists local data in a named volume, and includes a readiness health check. Never reuse its local-only credentials outside development.

## MVP architecture decisions

1. **Phase 1 is course-first.** The golfer-facing marketplace should not be built until course workflows are validated.
2. **Prisma schema is intentionally normalized.** Courses own users, players, tee times, and reservations.
3. **Pricing is stored in cents.** This prevents floating-point money errors.
4. **Auth is simple but replaceable.** For production, consider Clerk, Auth0, or Supabase Auth.
5. **API routes are thin.** Complex business rules should move into service modules as the product grows.

## Next build priorities

1. Add database-backed integration tests for booking, cancellation, modification, and tenant isolation.
2. Add email/SMS confirmations for reservation creation, moves, and cancellations.
3. Add tee sheet drag/drop and calendar grouping.
4. Add CSV import/export for tee times and player lists.
5. Add Stripe payments or payment-intent placeholders.
6. Add role and permission management UI for staff.
7. Add waitlist workflows and automated gap-fill recommendations.
8. Add future Phase 2 golfer marketplace APIs.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:validate
pnpm prisma:deploy
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm build
pnpm test:e2e
pnpm audit --prod --audit-level high
```

Integration and end-to-end tests require a migrated PostgreSQL database; the end-to-end suite also requires a completed production build. CI provisions the database and runs the checks in the required order. See `docs/OPERATIONS.md` for environment, migration, health-check, backup, and recovery procedures.

Machine-readable API documentation is available at `/api/docs`.

## Suggested Codex instruction

Run `/init` in Codex and keep this project instruction:

```text
You are building Gualph, a golf tee time SaaS product. Prioritize clean TypeScript, Prisma-safe database access, accessible UI, small focused commits, and maintainable architecture. Phase 1 is the course-operator portal only. Do not build the consumer app until Phase 1 workflows are complete and tested.
```
