// Stage configuration. Anything unverified stays null and is NOT rendered.
export const CONFIG = {
  founders: {
    names: ["NAŸL", "VINCENT"],
    origin: ["Russia", "France"],
    role: "SaaS founders",
    photo: null, // e.g. "/media/present/founders.jpg" once a real photo is provided
    arr: null, // e.g. "$120K ARR" ONLY when verified. Never invent.
  },
  demoUrl: "/demo", // override in dev: present.html?demo=http://localhost:8791/live.html
  fallbackVideo: "/media/present/demo-fallback.mp4",
  domain: "mycompass.world",
  qr: "/media/present/qr-mycompass.svg",
  demoLoadTimeoutMs: 6000,
  demoZoom: 1.3, // projector legibility: the /demo page is laid out at 1920/zoom and scaled up
  fallbackZoom: 1.18, // center crop of the 1920x1080 recording
};
