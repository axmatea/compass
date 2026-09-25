# COMPASS / REMaster

**Can your team make Demo Day?** Start an AI-managed quarter, introduce a change,
and see why an old fact can change the next decision.

One interactive board. Six simulated teammates. Twelve weeks / sixty working
days. A visible difference between forgetting a fact and checking that decision.

## Run it

Node 22.12+. The public game requires no database or provider keys.

```sh
npm ci
npm run build
npm start
```

Open http://localhost:8770. The scripted memory stress test is marked explicitly;
disable it before starting to see the fact-retention path. Pause, inspect a
teammate or open Memory X-ray without leaving the board. Changing the deadline or
a dependency can cause the mission to miss its target. There is no guaranteed win.

## What is real

- React/Vite game UI, deterministic local simulation and interactive controls.
- Typed fixture/live transports with validation, ordered events and reconnect
  recovery. Live never falls back to fixtures.
- Authenticated same-origin bridge for Vincent's separate runtime. Defaults to
  BLOCKED; installing it does not create an agent backend or approve spending.
- Existing PostgreSQL/Better Auth and acquisition infrastructure preserved.

The public simulation makes no sponsor/model calls. Fictional team data is
labelled in both modes. Live AI may appear only for a verified live-mode snapshot.
No actual multi-week performance, customer adoption, on-device Liquid, Rawtree
use, cache savings or real sponsor success is implied.

## Routes

- `/`: public game, no registration, no paid APIs.
- `/app`: private runtime experience, BLOCKED until configured and signed in.
- `/login?returnTo=/app`: existing invited account sign-in.
- `/presentation`, `/present`, `/story`, old HTML aliases: the same game with
  `?stage=1`, not a separate deck.
- `/acquisition`: preserved public acquisition demo.
- `/acquisition/app`: preserved private acquisition workspace.

## Vincent runtime

Vincent owns Strategist, Doer, Cleaner, Shadow, recovery, persistence and sponsor
integrations. Read [the contract](docs/REMASTER_CONTRACT.md). The server runtime URL
and service token never enter browser configuration. Runtime ownership and
idempotency must be enforced using the verified server-to-server tenant identity.

Existing invited sessions, PostgreSQL and BETTER_AUTH_URL must be configured for
private use. Keep REMASTER_LIVE_ENABLED false until runtime, ownership checks and
an explicit spending cap pass. No automatic retry of ambiguous paid commands.

## Checks and delivery

```sh
npm run build
npm test
npm run test:remaster
npm run qa:remaster
npm run record:remaster
```

Browser QA uses Playwright Chromium (`npx playwright install chromium` if absent).
Recording additionally requires FFmpeg and ffprobe. Rendered MP4s, raw captures
and reports stay in ignored `delivery/`; render scripts are committed.
No new generated promo, Higgsfield, DaVinci or paid media is required.

For preserved PostgreSQL tests, use `npm run db:test` and the test-only DSN in
[verification](docs/ACQUISITION_VERIFICATION.md). Stop preview workers against
that database during integration tests.

## Release

Branch codex/remaster-experience starts at 5264a9e. One integrator owns main and
Railway. Main auto-deploys; do not merge before production gates pass. Missing
Vincent runtime, sponsor keys and resource approval remain explicit blockers.
No database tables or acquisition records are removed. An online fixture game
is not proof of a deployed autonomous SaaS.

- [Product brief](docs/PRODUCT_BRIEF.md)
- [Runtime contract](docs/REMASTER_CONTRACT.md)
- [Stage script](docs/REMASTER_PITCH.md)
- [Verification and limits](docs/REMASTER_VERIFICATION.md)
- [Preserved acquisition brief](docs/ACQUISITION_PRODUCT_BRIEF.md)

Disclose reused infrastructure, AI-assisted development, synthetic time/data and
deliberate memory-fault injection. Do not submit fictional metrics as experiments.
