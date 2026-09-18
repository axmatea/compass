// node src/cinematic/film/export-vtt.mjs  -> writes subtitles.en.vtt next to this file
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { session } from "./data.mock.js";
import { deriveCues } from "./intent.js";

const ts = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
};
const body = deriveCues(session)
  .map((c, i) => `${i + 1}\n${ts(c.window[0])} --> ${ts(c.window[1] + 0.6)}\n<v ${c.speaker}>${c.text}`)
  .join("\n\n");
const out = fileURLToPath(new URL("./subtitles.en.vtt", import.meta.url));
writeFileSync(out, `WEBVTT\n\n${body}\n`);
console.log("wrote", out);
