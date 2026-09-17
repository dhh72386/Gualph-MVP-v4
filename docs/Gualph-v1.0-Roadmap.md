# Gualph v1.0 Recommended Build Roadmap

## Product goal

Deliver a secure, polished, pilot-ready tee-time operating platform for 5-10 golf courses, with a golfer booking experience and a foundation for pricing optimization, analytics, exports, and future integrations.

## Current baseline

The existing Phase 1 application is a functional scaffold built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, and Prisma. It includes a normalized core schema, course registration and login, tee-time, reservation, player, dashboard, administrator, public booking, pricing recommendation, optimization, reporting, and export surfaces.

It is not yet production-ready. Principal remaining gaps include incomplete authorization, limited operator workflows, insufficient database-backed concurrency guarantees, no integration or end-to-end test suite, limited course configuration, and no production deployment pipeline or operational monitoring.

## v1.0 scope

- Polished course-management portal
- Complete golfer search and booking experience
- Shared, accessible design system
- Operational and revenue analytics dashboard
- Rules-based dynamic pricing with explainable recommendations
- AI-assisted tee-sheet optimization recommendations
- Reports and CSV exports
- Versioned, documented API ready for future integrations

## Delivery plan

### Milestone 0 Foundation and security Weeks 1-2

- Pin dependency versions and establish reproducible builds
- Introduce service and repository boundaries without unnecessary monorepo complexity
- Add environment validation and structured error responses
- Replace permissive JWT fallback behavior with secure session configuration
- Add route protection and role-based access control
- Enforce course-level tenant isolation throughout the application
- Add audit logging foundation
- Add CI checks for lint, type checking, tests, migrations, and builds
- Add PostgreSQL development and test setup and initial migration

**Exit criteria:** Clean build; migrations run from a fresh database; protected routes reject unauthorized and cross-course access; CI is green.

### Milestone 1 Complete course operations Weeks 3-5

- Course profile, operating hours, amenities, policies, and hole configuration
- Staff invitations, roles, and permissions
- Tee-time creation, bulk generation, editing, blocking, and deletion
- Day and week tee-sheet views with filters and status controls
- Reservation creation, modification, cancellation, check-in, and no-show workflows
- Player profiles, notes, history, handicap, and loyalty fields
- Transaction-safe capacity and double-booking prevention

**Exit criteria:** A course employee can operate a full day from setup through close without database intervention.

### Milestone 2 Design system and operator polish Weeks 6-7

- Responsive navigation and reusable interface components
- Accessible forms, tables, dialogs, notifications, loading states, and empty states
- Consistent branding and visual hierarchy
- Tablet-friendly tee-sheet workflow for pro-shop use
- Usability pass based on representative operator scenarios

**Exit criteria:** Core workflows are usable on desktop and tablet and meet basic accessibility checks.

### Milestone 3 Golfer booking experience Weeks 8-10

- Public course pages and searchable tee-time inventory
- Date, time, price, location, and player-count filters
- Golfer accounts, profiles, favorites, and booking history
- Guest and authenticated checkout flows
- Booking confirmation, modification, and cancellation
- Email notifications and payment-provider integration or a pilot-safe payment hold strategy

**Exit criteria:** A golfer can discover, reserve, receive confirmation, and manage a tee time end to end.

### Milestone 4 Analytics reports and exports Weeks 11-12

- Revenue, rounds, occupancy, utilization, cancellations, no-shows, and lead-time metrics
- Date and course filters with comparison periods
- Player and tee-sheet CSV exports
- Scheduled-report foundation
- Verified metric definitions and timezone-safe aggregation

**Exit criteria:** Course management can reconcile daily operations and export pilot data without engineering help.

### Milestone 5 Pricing and tee-sheet intelligence Weeks 13-15

- Configurable price rules for time, day, demand, and occupancy
- Recommendation mode before automatic price changes
- Explanation and audit trail for every recommendation
- Tee-sheet gap, underutilization, and consolidation suggestions
- Guardrails, approval workflow, feature flags, and rollback controls

**Exit criteria:** Recommendations are transparent, reversible, and safe to test with pilot courses. AI does not autonomously change inventory or pricing in v1.0.

### Milestone 6 Integration API and pilot release Weeks 16-18

- Versioned API contract and generated documentation
- API keys, rate limits, idempotency, pagination, and webhook foundation
- Production database, backups, monitoring, alerting, and error tracking
- Security and privacy review
- End-to-end regression suite and pilot acceptance testing
- Pilot onboarding documentation and support runbook

**Exit criteria:** Pilot-ready release deployed with monitoring, backups, documented recovery, and signed-off acceptance scenarios.

## Estimated duration

| Target | Estimated time | Meaning |
| --- | ---: | --- |
| Strong operator demo | 6-8 weeks | Polished course portal with realistic data and complete primary workflows |
| Pilot-ready v1.0 | 16-18 weeks | Course portal, golfer booking, analytics, guarded intelligence, API foundation, testing, and operations |
| Broader commercial release | 20-28 weeks | Pilot feedback incorporated, payment and compliance hardening, deeper integrations, reliability, and support maturity |

These estimates assume rapid founder feedback, weekly decisions, access to a working PostgreSQL environment, and no major third-party integration delays. A traditional small development team could work in parallel and shorten calendar time; a single AI-assisted development stream should use the ranges above to preserve testing and product quality.

## Recommended sequencing decisions

1. Keep the current single Next.js application while completing the pilot. Extract shared packages only when the golfer client or integration surface creates a proven need.
2. Build the golfer experience as responsive web first. Add React Native after booking behavior is validated.
3. Make dynamic pricing rules-based and explainable before using predictive models.
4. Keep AI recommendations human-approved in v1.0.
5. Defer advertising campaign tooling until course supply and golfer booking activity are proven.
6. Treat payment capture, refunds, taxes, chargebacks, privacy, and legal terms as explicit launch work.

## Immediate next sprint

The next sprint must complete Milestone 0. Remaining work should be selected from:

1. Add environment schema validation and remove the development-secret fallback.
2. Complete reusable role and tenant authorization helpers and protected route enforcement.
3. Guarantee reservation conflict handling under concurrent requests.
4. Add database-backed integration tests for authentication, tenancy, tee times, and booking conflicts.
5. Add CI and repeatable PostgreSQL development and test setup.
6. Validate the migration from a fresh database.

## Founder decisions needed during the build

- Whether v1.0 collects payment at booking, stores a card guarantee, or records pay-at-course reservations
- Cancellation and refund policy defaults
- Whether one operator account can manage multiple course locations in the first pilot
- Initial staff permission matrix
- Pilot courses' current tee-sheet import and export needs
- Whether golfer booking launches publicly or only through private pilot links
