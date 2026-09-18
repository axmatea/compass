# COMPASS

A voice agent that adapts while acting. Say what you want, change your mind mid-task, and COMPASS updates only what changed instead of starting over.

- Website: https://mycompass.world
- Live demo: https://mycompass.world/demo
- Presentation: https://mycompass.world/present
- Repository: https://github.com/axmatea/compass (public)

## What is implemented (deployed)

- `/` website: opening screen plus a scroll story of one plan changing mid-sentence (illustrative footage).
- `/demo` live agent. Voice or typed input. Every turn is reasoned by GLM-5.3 on Nebius through `/api/turn` (SSE, contract v1) and kept as structured intent state (task, date, time, cuisine, location).
- Corrections mid-action: a follow-up like "Actually make it 8. Somewhere near Palo Alto." patches only the changed fields, marks the old value superseded, cancels the in-flight action and re-runs it with the new state.
- Voice: Boson Higgs Realtime (speech in, speech out, barge-in) through a server-side WebSocket bridge `/api/voice/realtime`. The API key never reaches the browser. If Boson is unavailable the demo falls back to browser speech and says which voice is active.
- `/present` stage presentation that embeds the live `/demo`.

## Not implemented

- Restaurant search is real but read-only: OpenStreetMap (Nominatim + Overpass), `server/tools/osm-restaurant-search.mjs`. Availability is not checked. Nothing is booked, reserved or sent. The offline replay (`?backend=mock`) uses sample data and is labelled as such.
- Web page or website generation is not part of the deployed service.
- No accounts, payments, calendar writes or cross-session memory.
- Multilingual voice is not claimed.

## Develop

```sh
npm ci
cp .env.example .env        # NEBIUS_API_KEY, BOSON_API_KEY: server-side only, never VITE_
npm run doctor              # presence check, never prints values
npm run typecheck
npm test                    # offline suite
npm run build && npm run start:local   # http://localhost:8770
```

Live checks (need keys): `npm run test:live` (GLM), `npm run probe:boson`, `npm run test:voice:live` (real Boson voice, incl. barge-in).

## Source layout

- `index.html`, `src/site/`, `src/cinematic/`: website and story.
- `live.html`, `src/components/`, `src/voice/`: the `/demo` agent UI.
- `present.html`, `src/presentation/stage/`: presentation.
- `server.mjs`, `server/`: static server, `/healthz`, `/api/health`, `/api/turn`, voice bridge, intent state, tools.
- `test/`: offline and live tests.
- `boson-claude-cli-bridge/`: separate local prototype (Python, runs on a laptop with the Claude CLI). Not deployed and not part of the public demo.

## Deploy

GitHub `main` is the source. Railway (existing service `compass-web`) builds the `Dockerfile` on push to `main` and serves https://mycompass.world. Secrets live only in Railway variables.
