// FIVE-SCENE deck (final presentation replacement). Speaker notes are verbatim from the brief.
// The previous 10-scene deck is archived in ./archive/slides-v10.js (open with ?deck=v10)
// and in git tag present-v10-archive.
import { CONFIG } from "./config.js";

const WPS = 2.5;
const words = (s) => s.replace(/\[[^\]]*\]/g, "").split(/\s+/).filter((w) => w && !/^[A-ZŸ]+:$/.test(w)).length;
const pauses = (s) => [...s.matchAll(/\[PAUSE (\d+(?:\.\d+)?)s\]/g)].reduce((a, m) => a + Number(m[1]), 0);
export const speechSeconds = (s) => Math.round(words(s) / WPS + pauses(s));

// Scene 3 is gated: page generation is NOT in the product (server/tools has restaurant search only).
const APP = CONFIG.app;

export const SLIDES = [
  {
    id: "founders", title: "NAYL × VINCENT", orb: "hidden", media: "none",
    motion: "Names mask-reveal, × draws, Russia × France and COMPASS fade up.",
    trigger: "Auto on start. → after 'what we worked on today.'",
    steps: [
      { speech: "NAYL: “Hey everyone. I’m NAYL, from Russia.”\nVINCENT: “And I’m Vincent, from France.”\nNAYL: “We build SaaS. Here’s what we worked on today.”" },
    ],
  },
  {
    id: "useful", title: "Less talk. Something useful.", orb: "hidden", media: "none",
    motion: "‘Less talk.’ masks up. Step 2 (on NAYL's last line): ‘Something useful.’ lands in gold.",
    trigger: "→ only when NAYL says ‘So we wanted more than a good conversation’.",
    steps: [
      { speech: "NAYL: “Quick show of hands—who here actually enjoys talking to AI voice agents?”\n[PAUSE 2s] (do not assume the response)\nVINCENT: “I’m harder to impress. During testing, ours moved dinner to seven a.m. My grandma calls that breakfast.”\n[PAUSE 1s]" },
      { speech: "NAYL: “So we wanted more than a good conversation. We wanted something useful to come out of it.”" },
    ],
  },
  {
    id: "app", demo: true, title: "Actual application", orb: "center",
    media: `LIVE: ${CONFIG.demoUrl}. RECORDED: ${CONFIG.recording.src || "none yet (no recording of the actual workflow exists)"}`,
    motion: "Orb breathes under ‘Actual application.’ Step 2: orb expands into the running product.",
    trigger: "→ opens the product (LIVE or RECORDED per path, M switches). PageDown / Back returns.",
    steps: [
      { speech: "NAYL: “We’ve met some great people here. Let’s make a page to stay in touch.”" },
      {
        speech: APP.verified
          ? `NAYL (to COMPASS): “${APP.request}”\n[let it run, do not talk over it]\nVINCENT: “Here’s the page it just created.”`
          : "[HOLD] Page generation is not in the product yet. Do NOT say the request and do NOT say ‘Here’s the page it just created’ until Orchestrator confirms a verified build.",
        live: APP.measuredSeconds || 60,
      },
    ],
    flag: APP.verified ? null : "SCENE 3 BLOCKED: no page-generation capability in main / feat/agent-core. Waiting on Orchestrator build confirmation.",
  },
  {
    id: "chain", title: "Voice → Request → Generated page", orb: "corner", media: "none (HTML)",
    motion: "Three nodes build left to right with provider labels under each.",
    trigger: "→ enters after the result is shown.",
    steps: [
      { speech: "“Boson handled the voice. GLM on Nebius interpreted the request. Our application turned that request into the page you just opened. The important part isn’t the assistant saying ‘done.’ It’s having a result you can actually open and use.”" },
    ],
    flag: APP.verified ? null : "PROVISIONAL: Boson voice and GLM-5.3 on Nebius are verified in prod. ‘turned that request into the page’ is NOT true until Scene 3 is built.",
  },
  {
    id: "cta", title: "COMPASS", orb: "end", media: `QR → https://${CONFIG.domain}`,
    motion: "Orb settles large above a big COMPASS wordmark; a small QR fades in bottom right. Nothing else on screen.",
    trigger: "→ enters. → on ‘Thank you’.",
    steps: [
      { speech: "NAYL: “We’re COMPASS. Find us at mycompass.world.”" },
      { speech: "NAYL: “Thank you.” [PAUSE 3s]" },
    ],
  },
];

export const LINES = {
  liveFailure: "The live run has stalled. Here’s the recorded run.",
  recordingFirst: "Here’s a recorded run of the application, with its original audio.",
};

export function timing(slides = SLIDES) {
  let speech = 0;
  let live = 0;
  const per = slides.map((s) => {
    const sp = s.steps.reduce((a, st) => a + (st.live ? 0 : speechSeconds(st.speech)), 0) + (s.steps.length - 1) * 0.5;
    const lv = s.steps.reduce((a, st) => a + (st.live || 0), 0);
    speech += sp;
    live += lv;
    return { id: s.id, speech: Math.round(sp), live: lv };
  });
  return { per, speech: Math.round(speech), live, total: Math.round(speech + live) };
}
