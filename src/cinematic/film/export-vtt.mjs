// node src/cinematic/film/export-vtt.mjs  -> writes subtitles.en.vtt next to this file
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deriveCues } from "./intent.js";
import { CUE_HOLD } from "./timeline.js";

const fixture = JSON.parse(readFileSync(new URL("./dinner-turns.json", import.meta.url), "utf8"));
const ts = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
};
const body = deriveCues(fixture)
  .map((c, i) => `${i + 1}\n${ts(c.window[0])} --> ${ts(c.window[1] + CUE_HOLD)}\n<v ${c.speaker}>${c.text}`)
  .join("\n\n");
const out = fileURLToPath(new URL("./subtitles.en.vtt", import.meta.url));
writeFileSync(out, `WEBVTT\n\n${body}\n`);
console.log("wrote", out);
