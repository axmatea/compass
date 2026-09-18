# COMPASS

Public presentation and scripted interactive demonstration, deployed with Railway.

## Source layout

- dist/index.html: presentation shell
- dist/styles.css: visual system and scene choreography
- dist/app.js: slides, continuous motion and interactions
- dist/voice-adapter.js: browser greeting adapter; not an AI backend
- dist/assets/heroine.png: original generated adult heroine
- dist/demo.html: existing scripted interactive demonstration, opened with ?deck=0#demo

## Repository and collaboration

Private repository: https://github.com/axmatea/compass

Accept the GitHub collaborator invitation, clone the repository, then run `npm start`. The local presentation is at http://127.0.0.1:8770/. Work in a feature branch and merge reviewed changes into `main`. No API keys belong in this repository.

For Railway access, use your own account, link your own GitHub identity, and accept an Editor invitation to the existing COMPASS project. Project membership permits deployment; do not create a duplicate project.

## Update the same URL

GitHub autodeploy is pending authorization of this new repository in the Railway GitHub App. Once connected to `main`, pushes/merges to that branch will deploy the same service. Until that is confirmed, deploy via the existing authenticated CLI.

From this project directory, run `npx @railway/cli up --service compass-web` after checking changes locally with `npm start`. The linked Railway service retains its generated public domain across updates. Use the existing project, do not create another project. `DEPLOYMENT.md` records the project and service identifiers. The Node server serves only `dist`, listens on Railway’s assigned PORT, and provides `/healthz`. No npm dependencies or external CDNs are required.

An unused Vercel project was created before the hosting choice changed; it has not been deployed.

## Future voice assistant

The current greeting is browser speech synthesis, and the conversation demo is scripted. To connect a real assistant, implement a server-side session endpoint or a separate authorized voice service, then replace the browser adapter with a realtime client. Keep provider secrets in Railway service variables, never in frontend files. Request microphone permission only from an explicit user action. Connect start, stop, speaking and error states to the existing presentation visuals. Do not expose long-lived API keys in the browser or portray scripted playback as live reasoning.

This static deployment does not yet include a voice backend, persistent memory, accounts, automatic sending, or calendar integration. A future server endpoint can be deployed under the same Railway service and domain after its provider and operating budget are selected.

## Provenance

The portrait was generated earlier with the built-in image tool. This iteration uses existing media and code-based abstract orbital graphics. No paid media generation was performed for deployment.
