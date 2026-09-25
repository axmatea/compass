Original prompt: Implement COMPASS REMaster as one interactive game: launch an AI-managed quarter, introduce changes, inspect memory and recovery. Keep the existing warm Manrope/cobalt design; Vincent owns the runtime. Preserve Acquisition separately, no paid calls or production deployment before release gates.

## 2026-09-25

- Created branch codex/remaster-experience from 5264a9e.
- Contract and shared DTOs established before parallel implementation.
- UI, fixture simulation and authenticated runtime bridge have disjoint owners.
- Public fixture is a labelled simulation. Live is BLOCKED without Vincent's
  endpoint, server authorization and session; there is no silent fallback.
- TODO: implement, run typecheck/tests/game client, inspect screenshots, record
  a real three-minute walkthrough, commit/push a draft PR without merging main.

### Integration checkpoint

- New primary entry and legacy presentation aliases point to the game.
- Acquisition entry preserved at /acquisition and /acquisition/app, including
  invited auth. /login?returnTo=/app returns invited users to the game runtime.
- Server bridge uses existing server-verified identity; no competing runtime.
- Added browser QA and a real-time UI recording script for a silent 180s MP4.
- Baseline regression: 232 backend tests passed with local PostgreSQL, none
  skipped; seven Acquisition fixture tests passed. Typecheck passed before CSS
  and final agent changes. New REMaster tests and visual QA are still pending.
- Preview stopped while PostgreSQL integration tests ran, avoiding queue races.

### First-cut verification

- Game and transport workers handed off; implementation frozen for recording.
- Build passes. 66 REMaster tests pass (30 fixture, 36 client/bridge).
- Game QA passes 390/768/1440, source/person/task drawers, pause/reset, both
  memory paths and two failure outcomes. Public game makes zero API calls.
- Inspected final mobile, desktop, memory and game-client screenshots.
- Fixed old invite form URL rewrite found by regression QA. Public/private
  Acquisition browser flows now pass, including persistence after reload.
- Three-minute actual UI capture is running; runtime URL still not supplied.

### Delivery checkpoint

- Final backend suite: 254 pass, zero skipped. Source diff/secret scan passes.
- Actual UI video rendered, 179.967s / 1080p / 30fps / H.264, silent. Full decode
  and sampled frames checked. Raw WebM + timecodes retained in delivery/remaster.
- Trimmed initial browser-navigation flash. Last Week/12 header tweak is not
  reflected in the first-cut video; behavior and disclosures are unchanged.
- BLOCKED: Vincent runtime URL/token/compatibility, live tenant ownership and
  resource authorization. Do not enable live, provision resources or merge main.
