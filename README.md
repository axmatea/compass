# COMPASS

The editable COMPASS website and cinematic presentation, migrated from Higgsfield to Railway.

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

- `src/`: editable React/TypeScript product, presentation and guided conversation components.
- `public/`: local images, fonts, captions, pitch notes, icons and original 60-second film.
- `server.mjs`: Node static server, health endpoint and video range requests.
- `Dockerfile`: build and production runtime.
- `MIGRATION.md`: source provenance, changes and verification.

## One source of truth

GitHub is now the working source and Railway is the live host. There is no bidirectional sync with the Higgsfield editor. Later edits there will not automatically appear here. Import intentional future changes into this repository and deploy through main. Keep Higgsfield for creative assets or as an unchanged archive; this migration does not delete or redirect the old site.

## Collaborator setup

`victorfaren` has been invited to GitHub with Write permission. Accept the invitation, clone the repository and work through branches. In Railway, join the existing project as Editor using your own account and link your own GitHub identity. The owner adds project members through Settings → Members. No credentials should be shared in chat or committed; future provider secrets belong in Railway variables.

## What is implemented

Eight-slide cinematic presentation, timed playback, browser narration, fullscreen, responsive navigation, three scripted conversation paths, editable/downloadable next-step drafts, and local film playback.

The greeting and guided replies are scripted. Open-ended voice AI, cross-session memory, interruption handling and external actions are not implemented. The optional browser speech features depend on browser support and permissions.
