# COMPASS

A voice agent that adapts while acting. Say what you want, change your mind mid-task, and COMPASS updates only what changed instead of starting over.

- Website: https://mycompass.world
- Live demo: https://mycompass.world/demo
- Presentation: https://mycompass.world/present
- Repository: https://github.com/axmatea/compass (public)

## What is implemented (deployed)

- `/` website: sales-first landing for the voice agent that builds websites.
- `/presentation` (alias `/story`): the hackathon presentation, a 12-scene scroll narrative: speak a website, interrupt mid-build, the site evolves.
- `/demo` voice to website. Say what page you want; COMPASS keeps a structured brief (business, audience, tone, theme, accent, font, hero layout, sections), writes the copy with the `write_copy` tool and renders the page into a sandboxed preview. A follow-up like "Make it darker, change the hero and add a product section" patches only the changed fields, keeps the rest, cancels the in-flight copy step and re-writes only the sections that depend on what changed. Every turn goes through `/api/site/turn` (SSE, contract v1).
- Inference: General Compute (`minimax-m2.7`, OpenAI-compatible, `GENERALCOMPUTE_API_KEY`) is the primary model for interpretation and copy; Nebius GLM-5.3 is the automatic failover (`server/llm/nebius.mjs`, `createLlmChain`). `/api/health` reports which provider is active.
- Voice: Gradium (`GRADIUM_API_KEY`): streaming speech-to-text with semantic turn detection and streaming text-to-speech, relayed through the server-side WebSocket bridge `/api/voice/realtime` (`server/voice/gradium-bridge.mjs`). Barge-in closes the current speech and the new utterance becomes a COMPASS turn. Boson Higgs Realtime remains as the second provider; browser speech is the last fallback. The UI says which voice is active. No API key reaches the browser.
- `/api/turn` dinner-planning agent (real OpenStreetMap restaurant search) still runs behind the same runtime and is used by the tests.
- `/present` stage presentation that embeds the live `/demo`.

## Not implemented

- Restaurant search is real but read-only: OpenStreetMap (Nominatim + Overpass), `server/tools/osm-restaurant-search.mjs`. Availability is not checked. Nothing is booked, reserved or sent. The offline replay (`?backend=mock`) uses sample data and is labelled as such.
- The generated page exists only inside the session preview (`/api/site/session/:id/page`, strict CSP, no scripts). Nothing is published, hosted or deployed on anyone's behalf. COMPASS is not a website builder product; the page is the visual use case for changing intent.
- No accounts, payments, calendar writes or cross-session memory.
- Multilingual voice is not claimed.

## Develop

```sh
npm ci
cp .env.example .env        # GENERALCOMPUTE_API_KEY, GRADIUM_API_KEY, NEBIUS_API_KEY, BOSON_API_KEY: server-side only, never VITE_
npm run doctor              # presence check, never prints values
npm run typecheck
npm test                    # offline suite
npm run build && npm run start:local   # http://localhost:8770
```

Live checks (need keys): `npm run test:live` (GLM), `npm run probe:boson`, `npm run test:voice:live` (real Boson voice, incl. barge-in).

## Source layout

- `index.html`, `story.html`, `src/site/`, `src/cinematic/`: website and presentation.
- `live.html`, `src/components/`, `src/voice/`: the `/demo` agent UI.
- `present.html`, `src/presentation/stage/`: presentation.
- `server.mjs`, `server/`: static server, `/healthz`, `/api/health`, `/api/turn`, voice bridge, intent state, tools.
- `test/`: offline and live tests.
- `boson-claude-cli-bridge/`: separate local prototype (Python, runs on a laptop with the Claude CLI). Not deployed and not part of the public demo.

## Deploy

GitHub `main` is the source. Railway (existing service `compass-web`) builds the `Dockerfile` on push to `main` and serves https://mycompass.world. Secrets live only in Railway variables.
