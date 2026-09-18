# COMPASS

The active COMPASS design is the dark sci-fi presentation with the adult heroine and luminous animated orb. The root page and #present use this version; /demo.html?deck=0#demo opens the matching guided demo.

- Website: https://compass-web-production-da39.up.railway.app/
- Presentation: https://compass-web-production-da39.up.railway.app/#present
- Repository: https://github.com/axmatea/compass (private)

## Develop and deploy

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build on http://127.0.0.1:8770/ (or PORT). Use a feature branch and review changes before merging to `main`. Railway is connected to `axmatea/compass`, branch `main`; it builds the Dockerfile and updates the existing public URL. No repository or service duplication is needed. The local `dist` folder is generated output, not editable source.

## Source layout

- `src/presentation/`: active sci-fi presentation CSS, JavaScript and optional browser voice adapter.
- `public/demo.html`: matching self-contained sci-fi guided demo.
- Other React files in `src/`: preserved imported Higgsfield version, not the active root page.
- `public/`: local images, fonts, captions, pitch notes, icons and original 60-second film.
- `server.mjs`: Node static server, health endpoint and video range requests.
- `Dockerfile`: build and production runtime.
- `MIGRATION.md`: source provenance, changes and verification.

## One source of truth

GitHub is now the working source and Railway is the live host. There is no bidirectional sync with the Higgsfield editor. Later edits there will not automatically appear here. Import intentional future changes into this repository and deploy through main. Keep Higgsfield for creative assets or as an unchanged archive; this migration does not delete or redirect the old site.

## Collaborator setup

`victorfaren` has been invited to GitHub with Write permission. Accept the invitation, clone the repository and work through branches. In Railway, join the existing project as Editor using your own account and link your own GitHub identity. The owner adds project members through Settings → Members. No credentials should be shared in chat or committed; future provider secrets belong in Railway variables.

## What is implemented

Eight-scene sci-fi presentation, animated orb, optional browser greeting, speaker notes, four scripted conversation paths, editable/downloadable next-step drafts, and the NYC film at /film.html.

The greeting and guided replies are scripted. Open-ended voice AI, cross-session memory, interruption handling and external actions are not implemented. The optional browser speech features depend on browser support and permissions.

## NYC product film

The linked film player now uses `public/media/compass-film-nyc.mp4`: the 60-second,
1920×1080, 24 fps remake. Its poster and English captions are versioned with the
new story. The staged conversation moves from a deadline concern to upfront
payment, ending with an unsent draft. The original film remains in Git history
and at its original media path. Full production archives are kept outside this
web repository.

## Backend and realtime voice (local)

```sh
cp .env.example .env        # fill NEBIUS_API_KEY and BOSON_API_KEY (server-side only, never VITE_)
npm run doctor              # presence check, never prints values
npm run build && npm run start:local   # http://localhost:8770
```

- Talk to COMPASS: http://localhost:8770/api/voice/console (dev console; headphones give the cleanest barge-in).
- Voice path: browser mic -> `/api/voice/realtime` -> Boson Higgs Realtime (voice `BOSON_VOICE`, default nora). Every user turn is reasoned by Nebius GLM-5.3 through `/api/turn` v1 state. Without `BOSON_API_KEY` the client falls back to browser speech.
- Tests: `npm test` (offline), `npm run test:live` (GLM), `npm run probe:boson`, `npm run test:voice:live` (real Boson voice, incl. barge-in).
