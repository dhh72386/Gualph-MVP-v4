# Milestone 0 Independent Release Review

## Review decision

**MILESTONE 0 PASSED**

The repository passes the complete Milestone 0 gate. GitHub Actions run [35266800031](https://github.com/dhh72386/Gualph-MVP-v4/actions/runs/35266800031) applied both migrations to a clean PostgreSQL 16.6 service and passed linting, strict type checking, 23 unit tests, six database integration tests, the production build, two built-server HTTP tests, and the production dependency audit.

## Remediation update 2026-09-17

The code-side release blockers identified by this review are now implemented:

1. Reservation move and cancellation transactions live in `lib/services/reservation-lifecycle.ts`, and the production route calls that service directly.
2. PostgreSQL integration coverage now includes simultaneous moves and move-versus-cancellation races, asserting reservation and inventory consistency after concurrent execution.
3. A built-server HTTP suite proves structured unauthenticated rejection and contains an authenticated cross-course mutation test.
4. CI runs clean migrations, six PostgreSQL integration tests, the production build, and the HTTP suite against PostgreSQL 16.6.

A verified PostgreSQL 16.14 archive could not initialize locally because the sandbox denied required System V shared memory. The committed GitHub Actions PostgreSQL 16.6 service supplied the required independent execution environment. The first CI run exposed an incorrect `400 BAD_REQUEST` response for a tenant-scoped reservation miss; shared guards now return `404 NOT_FOUND`, with unit and HTTP regression coverage. The follow-up run passed every gate.

## Defects found and fixed

The independent review identified and remediated these clear Milestone 0 defects:

1. JWT verification accepted the library's default symmetric algorithm set and did not validate issuer or audience. Signing and verification now require HS256, issuer `NEXT_PUBLIC_APP_URL`, and audience `gualph-web` (`lib/session.ts`, `lib/auth.ts`).
2. Session resolution caught database failures and returned an anonymous session, hiding availability failures as authentication failures. Token failures still return null, while database errors now propagate to controlled server-error handling (`lib/auth.ts`).
3. Environment validation was lazy rather than a server-startup guarantee. Next.js instrumentation now validates configuration during server registration (`instrumentation.ts`).
4. Browser cookie mutations had no origin validation. Unsafe API requests now reject malformed or cross-origin browser origins with a structured 403 response (`lib/security.ts` and mutation route handlers).
5. Prisma serializable transaction conflicts were returned as generic 500 errors. `P2034` now maps to a stable retryable 409 response (`lib/api.ts`).
6. Reservation move and cancellation used read-then-write lifecycle checks. Both now use conditional `BOOKED` updates, target inventory claims, serializable transactions, and stable conflict responses (`app/api/reservations/[id]/route.ts`).
7. The test suite did not assert JWT algorithm, issuer, audience, or origin rejection. Regression tests now cover these controls (`tests/services/session.test.ts`, `tests/services/security.test.ts`).

## Requirement verification

| Requirement | Evidence | Verification command or test | Result | Required remediation |
| --- | --- | --- | --- | --- |
| Reproducible pinned dependencies | Exact versions in `package.json`, pnpm 11.19.0 declaration, checked-in lockfile and overrides | `pnpm install --frozen-lockfile` | PASS | None for Milestone 0. |
| Production dependency security | Next.js 15.5.24 and patched PostCSS/Nanoid overrides | `pnpm audit --prod --audit-level high` | PASS: no known vulnerabilities | Continue CI audit enforcement. |
| Environment schema and no fallback secrets | `lib/env.ts`, `instrumentation.ts`; minimum 32-character JWT secret | Environment unit tests; production build | PASS | None. |
| Secure session configuration | Eight-hour HTTP-only SameSite cookie; HS256 issuer/audience validation; active user and session-version revalidation | Session unit tests and database-backed revocation integration test | PASS | None. |
| Protected application routes | Middleware covers all operator routes; every page also resolves the server session | Middleware inspection, production build, built-server HTTP smoke test | PASS: unauthenticated `/api/players` returned structured 401 | Keep the HTTP suite enforced in CI. |
| Reusable authentication and authorization | `requireUser`, `requireCourseUser`, `requireRole`, `requireCoursePermission`, permission matrix | Permission and session tests | PASS | None. |
| Role-based authorization | Staff cannot administer course settings, pricing approval, or report export | `tests/services/permissions.test.ts`; protected API inspection | PASS at unit/static level | Add route-level authenticated HTTP tests when the test server is available. |
| Course tenant isolation | Protected resource queries derive course ID from database-revalidated session claims | Database tenancy test and authenticated cross-course HTTP mutation test | PASS | None. |
| Zod validation for API inputs | Bodies, query parameters, and dynamic reservation/course identifiers use Zod; routes without input have no schema | Route audit and type check | PASS | Keep schema review mandatory for new endpoints. |
| Structured errors and secret safety | Stable envelopes, typed 403/404/409 errors, redacted unexpected-error log event | API helper inspection; origin regression test | PASS | Add request correlation IDs in a later observability hardening batch. |
| Transaction-safe reservation creation | Staff and public creation use serializable transactions and conditional inventory claims | PostgreSQL integration suite | PASS | None. |
| Cross-course resource rejection | Course-scoped selectors, integration fixture, and authenticated cross-course HTTP mutation test | Integration and built-server HTTP suites | PASS | None. |
| Tee-time availability and capacity enforcement | Zod limits, service assertions, conditional claims, migration check constraints | Unit and PostgreSQL constraint tests | PASS | None. |
| Concurrent double-booking prevention | Unique tee-time reservation constraint, conditional status claim, serializable transaction | Concurrent PostgreSQL booking test | PASS | None. |
| Concurrent move/cancel protection | Shared production lifecycle service plus simultaneous-move and move-versus-cancel tests | PostgreSQL lifecycle race tests | PASS | None. |
| Audit-log foundation | Login, reservation lifecycle, pricing approval, and exports create audit records | Route and schema inspection | PASS | Expand audit coverage as Milestone 1 operations are added. |
| Initial and forward migrations | Initial migration plus `20260917120000_milestone_zero_security` migration are committed | Clean `prisma migrate deploy` in PostgreSQL CI | PASS | None. |
| Authentication tests | Environment, token claim, cookie, permission, and database-backed revocation coverage | 23 unit tests and six integration tests | PASS | None. |
| CI | GitHub Actions provisions PostgreSQL and runs migration, unit, integration, build, HTTP, and audit gates | Successful run `35266800031` | PASS | Keep required on protected branches. |
| Repeatable local PostgreSQL | Pinned PostgreSQL 16.6 Compose service with health check | `docker-compose.yml` inspection | PASS as configuration | Install Docker or provide managed PostgreSQL and execute setup. |
| Setup and operational documentation | README and operations runbook cover setup, migrations, health, backups, and recovery | Documentation inspection | PASS | Perform and record a restore drill before pilot onboarding. |
| Linting | No lint warnings or errors | `next lint` | PASS | Migrate to ESLint CLI before Next.js 16. |
| Strict type checking | Application and tests compile under strict TypeScript | `tsc --noEmit --incremental false`; integration test compilation | PASS | None. |
| Unit tests | Environment, auth/session, authorization, origin, reservation, pricing, optimization, CSV | Node test runner | PASS: 23 tests | None. |
| Production build | Next.js compiles routes, middleware, instrumentation, and static output | `next build` | PASS: 21 routes/pages | None. |

## Commands and observed results

- `pnpm install --frozen-lockfile`: passed; lockfile and supply-chain policy verification succeeded.
- `prisma generate`: previously passed for the current schema; generated client is present.
- `prisma validate`: previously passed for the current schema.
- `next lint`: passed with no warnings or errors; the Next.js lint wrapper reports future deprecation.
- `tsc --noEmit --incremental false`: passed.
- Unit test compilation and Node test runner: 23 passed, 0 failed.
- Integration suite: six passed against PostgreSQL 16.6.
- `next build`: passed on Next.js 15.5.24; 21 application routes/pages and middleware generated.
- HTTP smoke suite: two passed, including unauthenticated rejection and authenticated cross-course rejection.
- `pnpm audit --prod --audit-level high`: passed; no known vulnerabilities.
- `prisma migrate deploy`: passed against an empty PostgreSQL 16.6 CI database.
- Local PostgreSQL bootstrap: verified PostgreSQL 16.14 binaries ran, but `initdb` failed because the sandbox denied required System V shared memory.

## Release blockers

No Milestone 0 release blockers remain. Milestone 1 may begin under the sequencing rules in `AGENTS.md` and the roadmap.
