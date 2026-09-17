# Gualph v1.0 Implementation Status

## Milestone 0 remediation update 2026-09-17

The remaining code-side release-review actions are implemented. Reservation move and cancellation now use the shared serializable transaction service in `lib/services/reservation-lifecycle.ts`. The PostgreSQL suite contains six tests, including simultaneous reservation moves and move-versus-cancellation consistency. A built-server HTTP suite covers unauthenticated API rejection and authenticated cross-course reservation mutation. CI runs the HTTP suite after the production build against its PostgreSQL 16.6 service.

Local verification passes frozen installation, Prisma generation and validation, linting, strict type checking, 21 unit tests, integration compilation, production build, and production dependency audit. The unauthenticated HTTP assertion also passes against the production server. A verified PostgreSQL 16.14 runtime could not initialize because this sandbox denies required System V shared memory; therefore clean migration execution, all six database tests, and the database-backed cross-course HTTP assertion remain unverified. Milestone 0 remains failed and Milestone 1 remains blocked pending a successful CI or external PostgreSQL run.

## Step 4 independent release review

The independent release review is recorded in `docs/MILESTONE_0_RELEASE_REVIEW.md`. It fixed JWT validation, startup environment validation, origin enforcement, transaction-conflict mapping, and reservation lifecycle concurrency defects. Static verification, 21 unit tests, strict type checking, linting, production build, frozen installation, and production dependency audit pass.

Milestone 0 remains failed because PostgreSQL is unavailable on this host. Clean migration execution and database-backed authentication, tenant isolation, capacity, and concurrent booking tests could not be verified. Milestone 1 remains blocked until the release-review blockers are closed.

## Milestone 0 implementation update 2026-09-17

Step 3 implemented the Milestone 0 security and data-integrity foundation in reviewable batches:

- Upgraded Next.js from 14.2.35 to 15.5.24 and aligned React 19.1.1, React DOM, React types, and eslint-config-next. Direct versions remain pinned and pnpm 11.19.0 is declared.
- Added centralized fail-closed environment validation and removed the fallback JWT secret.
- Reduced sessions to eight hours, added active-user and session-version database revalidation, added logout, and added protected-route middleware.
- Added a reusable permission matrix. Staff retain tee-sheet, reservation, and player operations; course settings, pricing approval, and report export require administrator permission.
- Added conditional tee-time inventory claims inside serializable transactions and stable booking-conflict responses.
- Added user session-revocation fields and database check constraints in migration `20260917120000_milestone_zero_security`.
- Added environment and authorization unit tests plus PostgreSQL integration tests for tenant scoping, concurrent booking, and database constraints.
- Added a pinned PostgreSQL Compose service, database health endpoint, GitHub Actions CI, security headers, audit coverage for login, pricing, and exports, and an operations/backup/recovery runbook.

Local static verification results are recorded below after the final Step 3 run. Fresh migration and integration proof require PostgreSQL. Docker is not installed on the current host, so those checks are delegated to the committed CI PostgreSQL service and remain unverified locally. Milestone 0 must not be marked complete until that CI job passes against a clean database.

Final Step 3 verification:

- `pnpm install --frozen-lockfile`: passed with pnpm 11.19.0.
- `prisma generate` and `prisma validate`: passed.
- `next lint`: passed with no warnings or errors; Next.js reports that its wrapper is deprecated for a future major release.
- `tsc --noEmit --incremental false`: passed after the production build regenerated route types.
- Unit tests: 19 passed, covering environment validation, session claims/cookies, role permissions, reservation rules, pricing, optimization, and CSV behavior.
- Integration-test TypeScript compilation: passed.
- `next build`: passed on Next.js 15.5.24 with 21 generated routes/pages and middleware.
- `pnpm audit --prod --audit-level high`: passed with no known vulnerabilities after pinned PostCSS and Nanoid overrides.
- `prisma migrate deploy`: could not connect to `localhost:5432`; no PostgreSQL server is installed.
- Integration tests: compiled, then failed to connect to `localhost:5432` for all three database tests. This is an infrastructure limitation, not a passing test result.

## Audit scope and conclusion

This document records the read-only Milestone 0 audit completed on 2026-09-17 against `AGENTS.md`, `docs/Gualph-v1.0-Roadmap.md`, and the current repository. Application code was not changed during this audit.

The repository is a coherent, buildable Next.js application with useful operator and public-booking flows. It is suitable for continued development and controlled demonstrations, but it does not satisfy Milestone 0 exit criteria and is not ready for an internet-facing pilot. The most urgent blockers are known critical dependency advisories, insecure development-secret fallback behavior, coarse authorization, missing database-backed tests, incomplete concurrency controls, and absent CI and production operations documentation.

## Current repository baseline

- Architecture: one Next.js App Router application with React server and client components, route handlers under `app/api`, shared utilities and domain functions under `lib`, and Prisma persistence under `prisma`.
- Runtime stack: Next.js 14.2.35, React 18.3.1, TypeScript 5.7.2, Tailwind CSS 3.4.17, Prisma 5.22.0, PostgreSQL, and Zod 3.25.76 (`package.json:17-41`).
- Dependency policy: direct dependency versions are pinned and `pnpm-lock.yaml` is checked in. `package.json:5` declares pnpm 11.7.0, while the available verification runtime used pnpm 11.19.0; the repository does not currently enforce the declared package-manager version.
- Type safety: TypeScript strict mode is enabled (`tsconfig.json:1`). No explicit `any` was found in application TypeScript during the audit.
- Data model: courses own users, tee times, players, photos, operating hours, pricing rules, audit logs, and feature flags (`prisma/schema.prisma:38-61`). Money is stored as integer cents on tee times and reservations (`prisma/schema.prisma:84-85`, `prisma/schema.prisma:120`).
- Migration state: one initial PostgreSQL migration creates the enums, tables, indexes, unique constraints, and foreign keys represented by the current schema (`prisma/migrations/20260627153000_init/migration.sql`). The schema validates statically, but the migration was not applied to a fresh database during this audit because no PostgreSQL service was available.
- Test baseline: 13 isolated service tests cover CSV escaping, pricing calculations, basic optimization suggestions, and reservation state assertions (`tests/services`). No API, database integration, browser, authentication, authorization, tenant-isolation, or concurrency tests exist.

## Working features

The following behavior exists in code and passed compilation and production build verification:

- Course registration creates a course and its course administrator in one Prisma transaction, hashes passwords with bcrypt cost 12, and sets an HTTP-only session cookie (`app/api/auth/register/route.ts:22-54`).
- Operator login validates input, verifies bcrypt hashes, and returns a consistent success or credential-error response (`app/api/auth/login/route.ts:7-27`).
- JWT session parsing validates claims with Zod, and API helpers distinguish authentication, validation, known Prisma, request, and unexpected failures (`lib/auth.ts:25-83`, `lib/api.ts:32-57`).
- Protected operator APIs derive course scope from the session rather than accepting a course ID. Representative examples include tee times (`app/api/tee-times/route.ts:25-66`), players (`app/api/players/route.ts:17-48`), reservations (`app/api/reservations/route.ts:17-66`), and course settings (`app/api/courses/route.ts:20-49`).
- Reservation creation, movement, and cancellation use Prisma transactions and scope staff operations through the authenticated course (`app/api/reservations/route.ts:31-61`, `app/api/reservations/[id]/route.ts:21-129`).
- The database has a unique reservation-per-tee-time constraint and a unique course/start-time constraint, which prevent duplicate records for the current one-reservation-per-slot model (`prisma/schema.prisma:125`, `prisma/schema.prisma:91`).
- Reservation moves and cancellations create audit records (`app/api/reservations/[id]/route.ts:72-81`, `app/api/reservations/[id]/route.ts:109-121`).
- Course-scoped analytics, reservation CSV export, deterministic price recommendations, and deterministic tee-sheet suggestions are implemented (`lib/services/analytics.ts`, `app/api/reports/export/route.ts`, `lib/services/pricing.ts`, `lib/services/optimization.ts`).
- Public course inventory and guest reservation creation exist (`app/api/public/courses/[slug]/route.ts`, `app/api/public/reservations/route.ts`).
- A static OpenAPI-shaped endpoint lists the current API surface (`app/api/docs/route.ts`).

## Missing or incomplete features

### Milestone 0 foundation

- There is no centralized environment schema. `.env.example:1-3` lists three variables, but code reads environment variables directly and validates only the production absence of `JWT_SECRET` at call time (`lib/auth.ts:32-40`).
- There is no Next.js middleware or shared protected layout. Each protected page repeats session and redirect logic, while the global shell renders operator navigation independently of authentication (`app/dashboard/page.tsx:7-12`, `components/shell/AppShell.tsx:18-69`).
- Role authorization is incomplete. `requireRole` exists (`lib/auth.ts:79-83`) but protected course APIs call only `requireCourseUser`; therefore a `STAFF` session can update the course profile, create inventory, apply prices, export data, and mutate reservations.
- Audit coverage is partial. Login, registration, course changes, tee-time changes, player changes, exports, and price application are not audited even though `AuditAction` supports relevant categories (`prisma/schema.prisma:29-35`).
- There is no CI configuration, formatting script, integration-test script, end-to-end-test script, or automated migration validation in `package.json:6-15` or the repository tree.

### Course operations and later milestones

- Course settings update profile and amenities only. Operating-hours, photos, policies, and hole configuration have schema support or roadmap intent but no complete management API and UI.
- Tee times can be created and listed, but no update, blocking, deletion, bulk generation, recurring generation, or true day/week calendar workflow exists (`app/api/tee-times/route.ts`).
- Reservation check-in and no-show statuses exist in the enum but have no operator endpoints or UI. Waitlists and group-booking behavior are absent.
- Player creation accepts only basic identity/contact fields; history, notes, handicap editing, deduplication, and loyalty operations are incomplete (`app/api/players/route.ts:7-48`).
- The public experience exposes inventory for a known course slug and guest booking, but does not provide course discovery, search filters, golfer accounts, favorites, booking history, self-service modification/cancellation, notifications, or payment strategy.
- Analytics have no date, comparison, or course filters, and aggregation is not course-time-zone aware (`lib/services/analytics.ts`).
- API documentation contains summaries only, with no request/response schemas, security schemes, error contracts, versioned paths, idempotency, rate limits, or pagination (`app/api/docs/route.ts`).

## Security findings

### Critical

1. **Known vulnerable production dependencies.** `pnpm audit --prod` reports 29 advisories: 2 critical, 12 high, 13 moderate, and 2 low. The critical findings affect the pinned Next.js 14.2.35 dependency and report patched versions beginning at Next.js 15.5.24. Evidence: `package.json:24` and the 2026-09-17 audit output. Dependency remediation and regression testing are required before deployment.

### High

1. **Predictable fallback signing secret outside production.** When `JWT_SECRET` is absent and `NODE_ENV` is not exactly `production`, every environment signs and accepts sessions using the public string `dev-secret` (`lib/auth.ts:32-40`). Any exposed preview, test, or misconfigured deployment can have arbitrary sessions forged, including `SUPER_ADMIN` claims.
2. **Course roles do not enforce least privilege.** Nearly every protected API uses `requireCourseUser`, which checks only that a session has a course ID (`lib/auth.ts:73-77`). `STAFF` can therefore reach administrator-level mutations such as course profile update (`app/api/courses/route.ts:28-49`) and price application (`app/api/pricing/apply/route.ts:10-31`).
3. **JWT authorization claims remain trusted until expiry.** Sessions contain role and course ID and remain valid for seven days (`lib/auth.ts:8-13`, `lib/auth.ts:42-53`). `currentUser` verifies signature and shape but does not revalidate active-user status, current role, current course membership, password/session version, or revocation state in the database (`lib/auth.ts:56-64`). Removed or demoted staff can retain access until expiration.

### Medium

1. **Authentication and public booking lack abuse controls.** Login, registration, public inventory, and public booking have no rate limits, bot controls, lockout/backoff, or request-size policy (`app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `app/api/public/reservations/route.ts`).
2. **Password policy and account lifecycle are incomplete.** Registration requires only eight characters (`app/api/auth/register/route.ts:9`), and no email verification, password reset, logout, session revocation, failed-login audit, or account-status model exists.
3. **No explicit CSRF/origin protection exists for cookie-authenticated mutations.** SameSite=Lax reduces common cross-site form attacks (`lib/auth.ts:46-53`), but protected mutation endpoints do not validate Origin/Host or use CSRF tokens. The final control should match the supported deployment and integration model.
4. **Sensitive operations have incomplete audit trails.** Pricing applies immediately without recording the recommendation inputs, approver, original price, final price, feature flag, or rollback data (`app/api/pricing/apply/route.ts:10-31`). Exports also do not create an audit record (`app/api/reports/export/route.ts`).
5. **Security response headers are not configured.** `next.config.mjs:1-3` is empty; the repository has no Content-Security-Policy, frame protection, referrer policy, permissions policy, or HSTS deployment guidance.
6. **Error logging is unstructured.** Unexpected errors are sent directly to `console.error` (`lib/api.ts:55-56`) with no correlation ID, redaction policy, environment-aware transport, or monitoring integration.

### Low

1. **Demo credentials are embedded in UI and documentation.** The login page prepopulates the demo email and password (`app/login/page.tsx:4`), and README publishes them (`README.md:35-38`). This is acceptable only for isolated local demonstration data and must not reach a pilot deployment.
2. **Session cookie name and lifecycle are minimal.** The cookie lacks a `__Host-` prefix and there is no explicit deletion/logout route (`lib/auth.ts:6`, `lib/auth.ts:46-53`).

## Tenant-isolation assessment

Protected API queries generally constrain resources using `user.courseId`, including nested relation filters for reservations. This is a solid baseline and no direct client-supplied course ID was found in the protected APIs reviewed.

Remaining risks:

- Tenant isolation is not covered by automated tests, so regressions would not be detected.
- Tenant identity comes entirely from long-lived JWT claims rather than current database membership (`lib/auth.ts:56-64`).
- `SUPER_ADMIN` handling is ad hoc. The admin page checks the role directly (`app/admin/page.tsx:5-8`), while `requireCourseUser` rejects users without a course. There is no explicit, auditable administrator impersonation or course-selection model.
- Player email uniqueness is not constrained per course, so duplicate identities can be created and public booking selects an arbitrary first match (`prisma/schema.prisma:103-104`, `app/api/public/reservations/route.ts:31`).

## API validation and error handling

Strengths:

- Route handlers consistently use Zod for most JSON bodies and selected query parameters.
- `parseJson` converts malformed JSON to a controlled request error (`lib/api.ts:32-38`).
- Success and failure envelopes are structurally consistent (`lib/api.ts:7-30`).
- Known unique and not-found Prisma errors are translated without exposing database detail (`lib/api.ts:50-53`).

Gaps:

- Dynamic path parameters such as reservation ID and course slug are used without Zod validation (`app/api/reservations/[id]/route.ts:21`, `app/api/public/courses/[slug]/route.ts:6`).
- Business-rule failures all use `RequestError` and become generic `BAD_REQUEST` responses, including missing resources and booking conflicts (`lib/api.ts:44-46`). This prevents reliable 404/409 handling by clients.
- The Prisma unique-error response always says a record with the value exists (`lib/api.ts:51`), which is not a useful booking-conflict contract.
- Reservation and player list endpoints are unbounded (`app/api/reservations/route.ts:17-24`, `app/api/players/route.ts:17-25`); the export is also unbounded and may become memory-heavy (`app/api/reports/export/route.ts:11-28`).
- The external API is not versioned and the documentation is not a complete OpenAPI contract.

## Data-integrity and concurrency risks

### High

1. **Reservation lifecycle and tee-time status can diverge.** Availability is stored both as `TeeTime.status` and `Reservation.status` (`prisma/schema.prisma:82-83`, `prisma/schema.prisma:119`). The database has no constraint tying them together. Any failed future code path, administrative repair, or direct data change can produce a cancelled reservation with a reserved tee time or a booked reservation with an available tee time.
2. **Check-then-write booking is not an explicit concurrency protocol.** Staff and public booking read availability and then create a reservation under Prisma's default transaction behavior (`app/api/reservations/route.ts:36-60`, `app/api/public/reservations/route.ts:20-53`). The unique `Reservation.teeTimeId` constraint prevents two committed reservations for one slot, which is valuable, but the losing request receives a generic unique-conflict response and there is no tested conditional update, serializable retry, or idempotency strategy.
3. **Concurrent lifecycle changes can overwrite state.** Reservation move and cancellation first read a record and later update by ID without an expected-status predicate or optimistic version (`app/api/reservations/[id]/route.ts:30-69`, `app/api/reservations/[id]/route.ts:96-110`). Concurrent cancel/move requests can interleave and leave tee-time statuses inconsistent.

### Medium

1. **Database checks do not enforce numeric domain rules.** Party size, players allowed, fees, loyalty points, operating-hour day, and pricing adjustment have application validation in some paths but no database check constraints (`prisma/schema.prisma:64-147`).
2. **Current schema cannot represent partial-slot capacity.** `Reservation.teeTimeId` is unique (`prisma/schema.prisma:125`), so a tee time supports exactly one reservation regardless of party size. This is internally consistent with the current status model but does not support multiple smaller groups or true remaining-capacity management promised by the product scope.
3. **Player identity can duplicate under concurrency.** The public flow performs `findFirst` by course and email followed by create, while the schema has only a non-unique index (`app/api/public/reservations/route.ts:31-41`, `prisma/schema.prisma:103-104`). Concurrent bookings can create duplicate player profiles.
4. **Analytics include cancelled value and rounds.** Revenue, party size, and reservation count aggregate all reservations without excluding `CANCELLED` (`lib/services/analytics.ts:10-15`), while cancellation is counted separately. Dashboard and report totals can therefore overstate booked revenue and rounds.
5. **Time-zone logic uses server-local time.** Pricing and optimization call JavaScript local-time getters on stored dates (`lib/services/pricing.ts:12-13`, `lib/services/optimization.ts:24`). Results can differ by deployment region and do not honor `Course.timezone`.
6. **Feature flags do not cleanly model global uniqueness.** `FeatureFlag` allows nullable `courseId` with `@@unique([courseId, key])` (`prisma/schema.prisma:167-176`). PostgreSQL permits multiple rows with null in a unique composite key, so multiple global flags with the same key are possible.

## Prisma schema, indexes, and migrations

Existing strengths include foreign keys, cascade behavior for course-owned data, unique course slugs, unique course/start-time slots, confirmation-code uniqueness, and indexes for common tee-time, player, pricing, audit, and user queries (`prisma/schema.prisma`).

Improvements required for Milestone 0 or the first relevant operational batch:

- Add database check constraints through explicit SQL migrations for positive capacity, nonnegative money, valid party size, valid weekday, and bounded pricing adjustments.
- Decide whether v1.0 permits multiple reservations per tee time. If yes, replace the one-to-one relation with a one-to-many capacity model and transaction-safe aggregate/locking strategy.
- Add a normalized, case-insensitive per-course player identity policy before adding a unique constraint.
- Add a reservation concurrency/version field or conditional status transitions where appropriate.
- Resolve global versus course feature-flag uniqueness.
- Add indexes based on planned date-filtered reservation/report queries, likely through tee-time course/start-time joins and reservation status.
- Prove the checked-in migration by applying it to a fresh PostgreSQL test database in CI.

## Test and build results

Commands were run from the repository root on 2026-09-17.

| Check | Result | Evidence or limitation |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | Passed | Lockfile resolved with no changes using available pnpm 11.19.0. |
| `./node_modules/.bin/prisma generate` | Passed | Generated Prisma Client 5.22.0. |
| `DATABASE_URL=<validation URL> ./node_modules/.bin/prisma validate` | Passed | Static schema validation does not connect to PostgreSQL. |
| `./node_modules/.bin/next lint` | Passed | No ESLint warnings or errors. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | Passed | Strict application type check completed without errors. |
| Test compilation plus `node --test .test-dist/tests/**/*.test.js` | Passed | 13 tests passed; all are isolated service tests. |
| `./node_modules/.bin/next build` | Passed | Production build completed and generated 20 static pages; dynamic routes were compiled. |
| `pnpm audit --prod` | Failed security gate | 29 advisories: 2 critical, 12 high, 13 moderate, and 2 low. |
| Fresh-database migration apply | Not run | No PostgreSQL service or test `DATABASE_URL` is available. This is missing infrastructure, not evidence that the migration fails. |
| Database integration tests | Not run | No integration test suite exists and no PostgreSQL service is available. |
| End-to-end tests | Not run | No browser test framework or test suite exists. |
| Formatting check | Not run | No formatter configuration or script exists. |

The production build passing proves compilation and static generation only. It does not validate database connectivity, migrations, authorization, cross-tenant rejection, concurrent booking, or browser journeys.

## CI, deployment, and operational readiness

- CI: absent. No `.github/workflows` or equivalent pipeline configuration was found.
- Container or local database setup: README contains an ad hoc Docker command (`README.md:40-46`), but there is no versioned Compose file, health check, test database workflow, or deterministic reset script.
- Deployment: no deployment manifest, infrastructure configuration, environment matrix, or release workflow was found.
- Monitoring and logging: no structured logger, error tracker, health/readiness endpoint, metrics, tracing, alert definitions, or incident thresholds exist.
- Backups and recovery: no backup schedule, retention policy, encryption requirement, restore procedure, recovery point objective, recovery time objective, or restore test is documented.
- Security operations: no dependency update policy, secret rotation procedure, vulnerability-response process, or production access policy exists.

Milestone 0 exit criteria are therefore **not met**. The application builds, but migrations have not been proven from a fresh database, protected operations lack complete role enforcement and automated cross-course verification, dependency audit is failing, and CI is absent.

## Milestone 0 implementation backlog

### Batch 0A dependency and configuration security

- Upgrade Next.js and aligned React/eslint dependencies to a currently supported, advisory-free combination after reviewing framework migration requirements.
- Add a startup environment schema for database URL, JWT secret strength, application URL, and environment mode.
- Remove every fallback signing secret and fail closed in all server environments.
- Enforce the declared pnpm version and add a dependency-audit gate.
- Add focused tests for missing/weak configuration and session signing.

### Batch 0B authentication and authorization

- Define an initial permission matrix for `SUPER_ADMIN`, `COURSE_ADMIN`, and `STAFF` pending founder confirmation.
- Centralize protected page enforcement in route groups/layouts or middleware where appropriate.
- Revalidate active user membership and role from the database for protected requests, with a session-version or revocation mechanism.
- Add logout, security-event audit records, origin/CSRF controls, and rate limits for authentication and public booking.
- Add API tests for unauthenticated, forbidden-role, stale-session, and cross-course access.

### Batch 0C database-backed integrity

- Add a repeatable PostgreSQL development/test service and isolated test database lifecycle.
- Add integration tests for registration, tenant scoping, reservation create/move/cancel, duplicate booking, and concurrent booking.
- Implement explicit conditional writes, transaction isolation/retry behavior, and domain-specific conflict responses.
- Add database check constraints and resolve player identity and feature-flag uniqueness.
- Decide and document the tee-time capacity model before changing the one-reservation-per-slot schema.

### Batch 0D API and observability foundation

- Introduce typed domain errors with stable 400, 403, 404, and 409 contracts.
- Validate all path/query/body input and paginate unbounded collection endpoints.
- Add request IDs, structured redacted logging, health/readiness endpoints, and error-monitoring hooks.
- Replace the summary-only API document with a validated versioned OpenAPI contract.

### Batch 0E CI and operational proof

- Add formatting, lint, type, unit, integration, migration, build, and production dependency-audit checks to CI.
- Apply migrations to a fresh database and test upgrade behavior in CI.
- Add a minimal deployment runbook, environment inventory, backup/restore procedure, and recovery test checklist.
- Run pilot acceptance scenarios and record Milestone 0 exit evidence.

## Recommended implementation order

1. **Batch 0A:** remove known critical dependency and secret-configuration risks before expanding behavior.
2. **Founder permission decision:** obtain the initial staff permission matrix while 0A is underway.
3. **Batch 0B:** establish trustworthy identity, role, and tenant boundaries.
4. **Capacity decision:** confirm one reservation per tee time versus multi-party capacity before database integrity changes.
5. **Batch 0C:** prove persistence, concurrency, and tenant behavior with PostgreSQL integration tests.
6. **Batch 0D:** make failures observable and the API contract reliable.
7. **Batch 0E:** automate every Milestone 0 exit check and document operations.

Each batch should remain reviewable and should update this document with completed evidence, new risks, and exact verification results.

## Product decisions requiring founder input

1. Define the first-pilot permission matrix: specifically whether ordinary staff may edit course settings, manage tee-time inventory, modify reservations, view/export customer data, approve prices, and access reports.
2. Decide whether a tee time can hold multiple independent reservations up to capacity or exactly one reservation containing the entire party.
3. Confirm payment strategy: pay at course, card guarantee, authorization hold, or payment capture.
4. Set default cancellation and refund policy boundaries so lifecycle and payment data can be modeled correctly.
5. Confirm whether one operator account must manage multiple courses in the first pilot.
6. Confirm whether golfer booking is public discovery or limited to course-specific pilot links.
7. Define player identity and deduplication rules when an email is missing, shared, or changed.

## Explicit deferred items

The following are intentionally deferred until Milestone 0 exit criteria are satisfied or the founder approves an exception:

- New course-operation functionality beyond work required to secure or test existing paths
- Design-system expansion and broad UI polish
- Golfer accounts, marketplace search, favorites, notifications, and payments
- Advanced analytics, scheduled reports, and additional exports
- Autonomous or predictive pricing
- Autonomous tee-sheet changes
- External integration API keys, webhooks, and partner integrations
- React Native development
- Advertising or campaign management

Existing pricing and optimization pages may remain available for controlled development, but they must not be represented as pilot-ready. Price changes must become permissioned, feature-flagged, persisted with complete recommendation evidence, auditable, and reversible before pilot use.
