# COMPASS stage, five scenes (final replacement)

Route: `/present.html` (production `/present`). Presenter view: `?presenter` or key P.
Archive: 10-scene deck runs at `/present.html?deck=v10`, script in `STAGE_SCRIPT_v10_ARCHIVE.md`, git tag `present-v10-archive` (ca0be1d).
Source of truth for speech and timings: `src/presentation/stage/slides.js`. Config: `src/presentation/stage/config.js`.

| # | On screen | Speech (verbatim) | Motion | Media | Trigger | Est. |
|---|---|---|---|---|---|---|
| 1 | NAŸL × VINCENT / Russia × France · COMPASS | NAYL: "Hey everyone. I'm NAYL, from Russia." VINCENT: "And I'm Vincent, from France." NAYL: "We build SaaS. Here's what we worked on today." | names mask-reveal | none | auto | 0:08 |
| 2 | Less talk. → Something useful. (gold) | NAYL: show of hands [pause, assume nothing]. VINCENT: grandma line [pause]. → NAYL: "So we wanted more than a good conversation..." | line 2 lands on NAYL's last line | none | → on "So we wanted" | 0:25 |
| 3 | Actual application. → product full screen | NAYL: "We've met some great people here. Let's make a page to stay in touch." → request (HOLD) → VINCENT: "Here's the page it just created." (HOLD) | orb expands into the product | LIVE `/demo` or recording | → opens run | 0:07 + run |
| 4 | Voice → Request → Generated page (Boson / GLM on Nebius / COMPASS application) | "Boson handled the voice. GLM on Nebius interpreted the request. Our application turned that request into the page you just opened..." (PROVISIONAL) | nodes build left to right | none | → | 0:16 |
| 5 | COMPASS / mycompass.world / QR → Thank you. | NAYL: "We're COMPASS. Find us at mycompass.world." → "Thank you." | orb settles, QR fades up | QR → https://mycompass.world (decoded, 200) | → | 0:07 |

Speech total ~1:02. Product run target 45 to 60 s, NOT measured (no build). Rehearsal estimate 1:50 to 2:05 once the run is measured.

## Scene 3 gate
`CONFIG.app.verified = false`. Page generation does not exist in main or feat/agent-core (server/tools = restaurant search only).
Presenter shows HOLD and does not show the request. Flip to true only after Orchestrator confirms the build; if signup is missing use `CONFIG.app.requestNoSignup` (a "Stay in touch" button, never described as a signup service). Fill `measuredSeconds` from a real run.

## Live / recorded path
- `stagePath: "live"` (default) or `"recorded"`; override `?path=recorded`; key M or presenter button switches before rehearsal.
- LIVE main path: → opens `/demo` in the stage frame. If it stalls: R, then "The live run has stalled. Here's the recorded run."
- RECORDED first: "Here's a recorded run of the application, with its original audio."
- Recordings play with sound and a permanent on-screen label "Recorded run · original audio". One continuous session, no dubbing, no fixture replay, no splicing.
- `CONFIG.recording.src = null`: no recording of the actual workflow exists. With no recording, R and a failed live load keep the audience on the slide (nothing broken is shown).
- The old `/media/present/demo-fallback.mp4` is a fixture replay: NOT wired. The 28 s concept film is not product evidence: NOT in the deck.

## Keys
→ / Space / PageDown / Enter next · ← / PageUp back · 1-5 jump · F fullscreen · P presenter · D live · R recorded · M switch path · Esc close run · B black.
Hash `#scene.step` is deterministic. Cross-origin demo in dev: clicker keys go to the frame, use the presenter or the Back button. Same-origin in production: PageDown returns.
