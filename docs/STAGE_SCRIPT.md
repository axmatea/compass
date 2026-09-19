# COMPASS stage, five scenes (final replacement)

Route: `/present.html` (production `/present`). Presenter view: `?presenter` or key P.
Archive: 10-scene deck runs at `/present.html?deck=v10`, script in `STAGE_SCRIPT_v10_ARCHIVE.md`, git tag `present-v10-archive` (ca0be1d).
Source of truth for speech and timings: `src/presentation/stage/slides.js`. Config: `src/presentation/stage/config.js`.

| # | On screen | Speech (verbatim) | Motion | Media | Trigger | Est. |
|---|---|---|---|---|---|---|
| 1 | NAŸL × VINCENT / Russia × France · COMPASS | NAYL: "Hey everyone. I'm NAYL, from Russia." VINCENT: "And I'm Vincent, from France." NAYL: "We build SaaS. Here's what we worked on today." | names mask-reveal | none | auto | 0:08 |
| 2 | Less talk. → Something useful. (gold) | NAYL: show of hands [pause, assume nothing]. VINCENT: grandma line [pause]. → NAYL: "So we wanted more than a good conversation..." | line 2 lands on NAYL's last line | none | → on "So we wanted" | 0:25 |
| 3 | Actual application. → product full screen | NAYL: "Let's plan a dinner, then change our mind while it's working." → to COMPASS: "Schedule dinner tomorrow at 7 and find an Italian restaurant." [it asks where to search] → "Actually, make it 8. Somewhere near Palo Alto." [let it run] → VINCENT: "It kept dinner, tomorrow and Italian, changed only the time, added Palo Alto, and then searched. Restaurants come from OpenStreetMap. Nothing is booked." | orb expands into the product | LIVE `/demo` or recording | → opens run | 0:07 + ~0:20 run |
| 4 | Voice → Request → Updated plan (Boson / GLM on Nebius / COMPASS agent) | "Boson handled the voice. GLM on Nebius interpreted the correction. COMPASS patched only what changed and kept acting, no restart. The important part isn't the assistant saying 'done.' It's a plan that stays right while you change your mind." | nodes build left to right | none | → | 0:16 |
| 5 | Orb / COMPASS / small QR + mycompass.world | NAYL: "We're COMPASS. Find us at mycompass.world." → "Thank you." | orb settles, QR fades in | QR → https://mycompass.world (decoded) | → | 0:07 |

Speech ~1:02. Measured product run on prod: 13.7 s from first request to results with typed input (T1 answer 4 s, T2 result 5.8 s); spoken with Boson allow ~25 to 35 s. Rehearsal ~1:40 to 2:00.

## Scene 3
Final script = Release 3 (main 1d8c69d): the dinner correction. Page generation is NOT implemented and is never claimed. Verified on prod 2026-09-18: T1 asks where to search (no search yet), T2 -> time 19:00->20:00 updated, Palo Alto added, task/date/cuisine kept, restaurant_search (OSM, mock:false) done: Vina Enoteca, Trellis.

## Scene 3 gate (page generation, not used)
`CONFIG.app.verified = false`. Page generation does not exist in main or feat/agent-core (server/tools = restaurant search only).
Presenter shows HOLD and does not show the request. Flip to true only after Orchestrator confirms the build; if signup is missing use `CONFIG.app.requestNoSignup` (a "Stay in touch" button, never described as a signup service). Fill `measuredSeconds` from a real run.

## Live / recorded path
- `stagePath: "live"` (default) or `?path=recorded`; key M or presenter button switches before rehearsal.
- Recording: `/media/present/real-run.mp4`, 19.7 s, ONE continuous real run of production /demo (build 1d8c69d), real GLM-5.3 + real OSM. Input was typed (the recorder has no microphone), no sound. On-screen label: "Recorded run · mycompass.world · typed input · no sound". Recorder: `src/presentation/stage/tools/record-real-run.mjs`.
- LIVE fails: R, then "The live run has stalled. Here's the recorded run."
- RECORDED first: "Here's a recorded run of the application. We typed the requests, and it has no sound." (The brief's "with its original audio" line is only used for a recording that has sound.)
- If /demo does not load, the stage switches to the recording automatically.
- Old `demo-fallback.mp4` (fixture replay) is not wired. The 28 s concept film is not product evidence and not in the deck.

## EMERGENCY (say nothing about the problem, just do it)
1. Demo stalls on stage: press R. Say "The live run has stalled. Here's the recorded run." → when it ends, → continues.
2. Presenter window gone: keep using → / ←. Numbers 1-5 jump to a scene. Speaker notes are also printed in this file.
3. Wrong screen or a glitch: press B (black), fix, press B again.
4. Internet down: open the offline copy on this Mac: double-click `~/Desktop/COMPASS-STAGE-OFFLINE/START.command` (opens http://localhost:8123/present.html?path=recorded). Scene 3 plays the recording automatically.
5. Browser dead: open `~/Desktop/COMPASS-STAGE-OFFLINE/videos/real-run.mp4` in QuickTime full screen, then say the lines from memory.

## Keys
→ / Space / PageDown / Enter next · ← / PageUp back · 1-5 jump · F fullscreen · P presenter · D live · R recorded · M switch path · Esc close run · B black.
Hash `#scene.step` is deterministic. Cross-origin demo in dev: clicker keys go to the frame, use the presenter or the Back button. Same-origin in production: PageDown returns.
