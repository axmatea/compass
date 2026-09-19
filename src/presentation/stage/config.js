// Stage configuration. Anything unverified stays null / false and is NOT claimed on stage.
export const CONFIG = {
  founders: {
    names: ["NAŸL", "VINCENT"],
    origin: ["Russia", "France"],
    role: "COMPASS", // five-scene deck line 3
    photo: null,
    arr: null, // never invent
  },
  // Scene 3. Flip verified:true ONLY after Orchestrator confirms the page-generation build.
  app: {
    verified: false,
    request: "Create a page called ‘After the Hackathon’ for the people I met today. Add a short introduction and a signup form.",
    // if generation exists but signup does not, use:
    requestNoSignup: "Create a page called ‘After the Hackathon’ for the people I met today. Add a short introduction and a ‘Stay in touch’ button.",
    measuredSeconds: null, // fill with the measured duration of a real run
  },
  demoUrl: "/demo", // override: present.html?demo=<url>
  // "live" = LIVE main path, recording is the backup. "recorded" = recording first. ?path=recorded or key M.
  stagePath: "live",
  // A recording of the SAME actual workflow, one continuous session, original audio.
  // The old /media/present/demo-fallback.mp4 is a fixture replay and is NOT wired here.
  // real-run.mp4: ONE continuous real run of production /demo (build 1d8c69d, 2026-09-18), real GLM-5.3 + real OSM search,
  // input typed (no microphone in the recorder), no sound. Label says exactly that.
  recording: { src: "/media/present/real-run.mp4", label: "Recorded run · mycompass.world · typed input · no sound", hasAudio: false },
  domain: "mycompass.world",
  qr: "/media/present/qr-mycompass.svg",
  demoLoadTimeoutMs: 6000,
  demoZoom: 1.3,
  fallbackZoom: 1.3, // center crop so the plan card is readable on a projector
};
