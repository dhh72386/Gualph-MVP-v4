# Gualph Repository Instructions

## Product Mission

Gualph is a multi-tenant golf tee-time operating and booking platform. The initial release must support 5-10 pilot golf courses and must be secure, maintainable, testable, and capable of growing into a commercial SaaS platform.

The approved v1.0 scope is:

- A polished course-management portal
- A complete golfer search and booking experience
- A shared, accessible design system
- Operational and revenue analytics
- Rules-based dynamic pricing with explainable recommendations
- Human-approved AI tee-sheet optimization recommendations
- Reports and CSV exports
- A versioned, documented API for future integrations
- Production deployment, testing, monitoring, backups, and recovery procedures

## Approved Technology Direction

- Use the Next.js App Router, React, strict TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, and Zod.
- Deliver a responsive web application first. Do not begin a React Native client until the web booking experience is validated.
- Keep the current single-application architecture unless a demonstrated technical need justifies extracting packages or services.
- Do not perform a speculative monorepo conversion.
- Use `pnpm` as the package manager and keep the lockfile authoritative.

## Product Sequencing

Follow the milestones and exit criteria in `docs/Gualph-v1.0-Roadmap.md`. Do not begin a later milestone until the current milestone's exit criteria are satisfied or the product owner explicitly approves an exception.

Prioritize work in this order:

1. Security, authentication, authorization, and tenant isolation
2. Course-operator workflows
3. Design system and usability
4. Golfer booking
5. Analytics and reporting
6. Pricing and tee-sheet recommendations
7. Integration API and pilot operations

## Mandatory Engineering Standards

- Use strict TypeScript. Do not introduce `any`; use explicit types, generics, or `unknown` with narrowing.
- Validate every untrusted request body, query, path parameter, and external payload with Zod.
- Enforce authentication and authorization on the server. Client-side visibility is not an authorization boundary.
- Enforce course-level tenant isolation on every protected read and write.
- Never trust a client-supplied course ID. Derive course scope from the authenticated session or an explicitly authorized system-admin context.
- Store monetary values as integer cents. Never use floating-point values for persisted money.
- Handle dates in UTC at storage and API boundaries and apply the golf course's IANA time zone explicitly for course-local behavior and display.
- Use database transactions for multi-step booking and inventory operations.
- Prevent double bookings, over-capacity reservations, and race conditions with database constraints and transaction-safe conditional writes. Application pre-checks alone are insufficient.
- Return consistent structured API success and error envelopes.
- Do not expose secrets, password hashes, stack traces, raw database errors, or sensitive internal metadata.
- Add indexes, unique constraints, checks, and foreign keys based on actual query and integrity requirements.
- Maintain audit records for authentication events and security-sensitive or operational changes.
- Preserve functioning behavior and backward compatibility unless an approved requirement changes it.
- Do not add placeholder implementations that appear complete or silently omit requested requirements.
- Prefer focused service boundaries and straightforward code over premature abstractions or infrastructure.
- Avoid N+1 queries, select only needed fields where practical, and paginate potentially unbounded collections.
- Keep accessibility, responsive behavior, empty states, loading states, and error states part of feature completion.

## Authentication And Security

- Production and verification environments must fail closed when required secrets or configuration are missing.
- Use secure, HTTP-only, same-site session cookies and protect state-changing browser requests against CSRF where the request model requires it.
- Apply least-privilege role checks to protected operations. A valid session does not imply permission to mutate every course resource.
- Normalize user identifiers such as email addresses before lookup and uniqueness enforcement.
- Rate-limit authentication and public booking endpoints before pilot release.
- Treat authorization failures, cross-course lookups, and malformed input as expected controlled errors, not internal server errors.

## Dynamic Pricing And AI Guardrails

Dynamic pricing must begin as deterministic, rules-based logic. Every persisted price recommendation must record:

- Original price
- Recommended price
- Rule or reason
- Data inputs
- Recommendation timestamp
- Approving user
- Final applied price

AI recommendations in v1.0 must remain human-approved. AI may not autonomously change prices, tee-time inventory, reservations, or customer records. Recommendations must be explainable, auditable, reversible, and controlled by feature flags.

## Testing Requirements

Every meaningful feature or defect fix must include automated tests appropriate to its risk. At minimum, the suite must cover:

- Authentication and session behavior
- Role authorization
- Cross-course access rejection
- Input validation
- Tee-time availability and capacity
- Concurrent reservation conflicts
- Reservation creation, modification, cancellation, check-in, and no-show behavior
- Pricing calculations and approval records
- Time-zone behavior, including daylight-saving transitions
- Critical golfer and operator journeys

Use unit tests for isolated business rules, database-backed integration tests for persistence and tenancy guarantees, and end-to-end tests for critical user journeys.

Before declaring a task complete, run the checks relevant to the change, including the full required suite for milestone exit or release work:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec prisma validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Also run formatting checks, database migration validation against a fresh test database, integration tests, and end-to-end tests once their scripts exist. Report exact commands and results. Never claim a skipped or failed check succeeded.

## Database And Migration Discipline

- Change `prisma/schema.prisma` and add a checked-in Prisma migration together for every persisted schema change.
- Do not edit an already-applied migration. Add a new forward migration.
- Validate migrations from an empty database and test upgrades from the latest released schema before release.
- Make destructive or backfill-heavy migrations explicit, staged, and recoverable.
- Do not use production data, credentials, or personally identifiable information in tests or seed fixtures.

## API Standards

- Keep route handlers thin. Put reusable business rules in service modules and persistence concerns behind focused data access boundaries when complexity warrants them.
- Maintain a versioned API contract for external integrations. Preserve compatible behavior or document and version breaking changes.
- Document validation, authentication, authorization, pagination, idempotency, rate limits, response envelopes, and error codes.
- Require idempotency for integration-facing operations that create reservations or other financial or inventory effects.
- Audit exports and sensitive integration activity.

## Working Method

For every milestone or implementation batch:

1. Inspect the relevant existing code and current working tree before editing.
2. Compare the implementation with this file and `docs/Gualph-v1.0-Roadmap.md`.
3. Identify assumptions, risks, dependencies, and unresolved product decisions.
4. Present a concise implementation plan before major implementation.
5. Wait only when a missing decision would materially change the implementation or create unacceptable risk.
6. Implement in small, reviewable, end-to-end batches.
7. Add or update tests in the same batch.
8. Run all relevant verification commands.
9. Summarize changed files, migrations, test results, skipped checks, remaining risks, and the next recommended batch.
10. Update `docs/IMPLEMENTATION_STATUS.md` whenever implementation work changes milestone status.

Do not merely describe code that should be written when implementation is authorized. Make the changes, verify them, and report the verified result. Do not rewrite functioning code without a concrete requirement or demonstrated technical need.

## Current Repository Conventions

- Application routes and pages live under `app/`.
- Reusable UI lives under `components/`.
- Shared server utilities and domain services live under `lib/`.
- Prisma schema, migrations, and seed data live under `prisma/`.
- Automated tests live under `tests/` and should mirror the relevant domain or application boundary.
- Use the existing `{ ok: true, data }` and `{ ok: false, error }` API envelope until an approved versioned contract supersedes it.
- Keep course-scoped queries visibly constrained by the authenticated course ID.

## Product Decisions That Require Owner Approval

Do not silently decide the following when the answer materially affects architecture, money movement, policy, or launch scope:

- Payment at booking, card guarantee, or pay-at-course behavior
- Cancellation and refund policy defaults
- Whether one operator account manages multiple course locations in the first pilot
- The staff permission matrix
- Pilot tee-sheet import and export requirements
- Public launch versus private pilot booking links

Document temporary assumptions clearly and keep them reversible until the product owner decides.
