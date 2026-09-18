# COMPASS product brief

Updated: September 17, 2026, Pacific time. Working branch: `codex/compass-homepage`.
This brief describes the local website revision. It has not been deployed.

## Product and audience

COMPASS is a voice-first thinking-partner concept by NAYL and Vincent.
The initial audience hypothesis is independent professionals and founders working
through an uncertain commitment, such as a client request. This is a hypothesis,
not a validated market or a claim of customer adoption.

## Problem and intended outcome

People often discover the real concern while explaining it. An initial
interpretation can be wrong. The proposed experience lets a person correct the
interpretation without restating the facts, then review one concrete next step.

The shared example: a client requests Friday. The person clarifies that Friday
works, but payment is the concern. They choose 50% upfront and 50% on delivery.
The result is a reply draft for the person to review. Nothing is sent.

Brand line: “Think out loud. Find what’s next.”
Closing promise: “Not just an answer. A next step.”
Use these as design intent, not as evidence of a working reasoning engine.

## Current design direction

- Name: COMPASS. SIDEKICK is a superseded working name.
- Dark sci-fi environment, restrained ice-blue illumination, generous space.
- Avenir Next with local system fallbacks; no remote font requirement.
- Fictional adult heroine: existing `public/assets/heroine.png`.
- Glowing orb is a visual concept, not a live microphone/AI status indicator.
- Installed Zoey OS inspected as a visual reference: central orb, small status
  labels, thin bordered panels and compact controls. No Zoey code or branding copied.
- Main website is a scrollable explanation. Presentation is an independent stage
  experience with eight scenes and its existing animations.
- Motion should explain a changing thought, respect reduced motion, and offer
  a pause control on the landing page.

## Routes in this revision

| Route | Purpose |
| --- | --- |
| `/` | Website: problem, interaction, concrete result, honest implementation status |
| `/present.html` | Existing eight-scene sci-fi presentation, with a return-to-site link |
| `/#present` | Compatibility entry for presentation links; redirects to `/present.html` |
| `/demo.html?deck=0#demo` | Existing guided conversation examples and editable drafts |
| `/film.html` | Existing NYC product film, captions and concept disclosure |

## Implemented browser behavior

- Scrollable responsive website and local, prepared interaction states.
- Presentation with animated orb, keyboard navigation and speaker notes.
- Four prepared demo scenarios, editable/downloadable drafts.
- Optional browser speech greeting and browser-dependent speech tools in the
  existing demo. These do not establish a voice AI backend.
- NYC film player, English captions and separate presentation route.

## Concepts and unknowns

No open-ended voice AI backend, persistent memory, dependable interruption
handling, or external action execution is connected in this website.
Prepared replies and state changes must be labelled scripted concepts.
Latency, correction accuracy, reliability, usefulness and customer demand have
not been measured. No autonomous booking, sending or paid action is implied.
The NYC film contains generated people/scenes and a scripted conversation.

## Coordination and ownership

- Website task: landing, navigation, presentation integration, approved media,
  browser verification and deployment when the user requests it.
- Video task: footage, sound and film production. This website task does not
  purchase generation or overwrite the video production archive.
- Text/editor task: narrative, concise copy and timed English stage script.
  Consult this brief and verified implementation before making capability claims.
- Update this file when decisions or implementation status change. Separate
  chats do not automatically share all context; this repository is the handoff.

## Source and release rules

Repository: https://github.com/axmatea/compass
Production: https://compass-web-production-da39.up.railway.app/
Railway project/service: `compass-nayl-vincent` / `compass-web`.
Production branch: `main`. Merging or pushing to main triggers deployment.
Use `codex/<task>` branches, preserve concurrent work, stage only owned files.
No force push. Deploy only following a current user request.
Higgsfield edits are not synchronized automatically with this repository.
