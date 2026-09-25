# COMPASS Acquisition

Keep the next acquisition decision connected to what actually happened.

An invite-only workspace for service businesses linking experiment hypotheses,
inbound lead qualification, delayed answers and the next test. First scenario:
AI Media Global's AI implementation service. Not an ad-spending autopilot.

## This release

- `/`: interactive synthetic DEMO. Mission, Experiments, Pipeline and Memory.
- `/app`: private workspace, Better Auth sessions, PostgreSQL tenant isolation.
- `/?tour=1`: guided tour of the same product. Old presentation routes redirect.
- Versioned rules, manual experiments/leads, per-field evidence clocks, event
  deduplication, decision history, durable jobs and persisted checkpoints.
- Nimble research, Liquid extraction and Tinybird analytics adapters. Offline
  contract tests are NOT proof of live integrations. Missing configuration or
  spending authorization produces BLOCKED, never a fake result.
- Early Access $299/month, one business. Advertising/custom implementation
  separate. Request access saves an inquiry only if the database is available.
  No checkout, payment collection, automatic subscription or emails.
- Local Manrope, original SVG creative cards, reduced motion and PWA manifest.
  No offline AI, background microphone or service-worker API/data caching.

## Truth boundaries

The public tour uses local fixtures and accelerated time. It makes no sponsor
calls and does not prove a server restart. Backend restart tests use actual
PostgreSQL and a separate process killed after persisting a checkpoint.

Liquid results are proposals: human review is required before applying fields.
Deterministic rules, not confidence scores, qualify leads. Unknown budget is not
zero. Unknown attribution stays unknown. Small samples do not establish winners.

An uncertain external-call outcome is blocked, not retried automatically.
Persisted provider results can resume without repeated calls. This is NOT
upstream exactly-once delivery. Tinybird metrics enter decisions only after
matching the current versioned PostgreSQL snapshot.

The existing Gradium/Boson transport remains. The acquisition voice adapter is
authenticated, lead-scoped and disabled by default. This first-cut UI uses text,
not a claimed live microphone integration. No live sponsor or voice success is
claimed until verified receipts exist.

## Develop

Node 22.12+.

```sh
npm ci
npm run db:test
cp .env.example .env
npm run build
npm run start:local
```

The local test database binds 127.0.0.1:55438 and persists in ignored
`.cache/acquisition-test-pg`. Test-only DSN:
`postgresql://compass_test:local-test-only@127.0.0.1:55438/compass_test`.
Never use these credentials or this database for customer data.

Set DATABASE_URL, a random 32+ character BETTER_AUTH_SECRET, and the explicit
BETTER_AUTH_URL. Production requires HTTPS and separate secrets. Missing
configuration fails closed. Sponsor execution is disabled by default.

```sh
npm test
ACQUISITION_TEST_DATABASE_URL=postgresql://compass_test:local-test-only@127.0.0.1:55438/compass_test npm run test:acquisition
npm run typecheck
npm run test:acquisition-ui
npm run build
```

PostgreSQL tests explicitly skip without a test DSN. Never target production.
Invitation issuance is operator-only, email-bound, expiring and single-use.
There is no public signup or automatic invitation/password-reset email.

## Delivery and release

- [API contract](docs/ACQUISITION_CONTRACT.md)
- [Authentication](docs/ACQUISITION_AUTH.md)
- [Sponsor configuration and official sources](docs/ACQUISITION_PROVIDERS.md)
- [Release gates and rollback](docs/ACQUISITION_RELEASE.md)
- [Executed checks and remaining blockers](docs/ACQUISITION_VERIFICATION.md)
- [Three-minute stage script](docs/ACQUISITION_PITCH.md)

`main` auto-deploys to the existing Railway `compass-web` service and
https://mycompass.world. Implementation branch: `codex/acquisition-engine`.
Do not merge before database/auth/release gates pass. A working public fixture
demo is not a deployed production SaaS.

No Isaac data, Meta events, ad account, paid generation or billing code was
imported. Disclose existing voice infrastructure, AI-assisted development and
synthetic data in the hackathon submission.
