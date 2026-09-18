// Frame-exact draft render: seeks window.FILM to every frame and pipes PNGs to ffmpeg.
// No new package dependency: point PLAYWRIGHT_CORE at any playwright-core install and
// CHROME_PATH at a Chromium / headless shell binary.
//
//   npx vite --config src/cinematic/film/vite.config.mjs   (serve on :5188)
//   PLAYWRIGHT_CORE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
//     node src/cinematic/film/render.mjs [--url http://localhost:5188/] [--out file.mp4] [--from 0] [--to 28]
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const url = arg("url", "http://localhost:5188/");
const out = arg("out", fileURLToPath(new URL("./dist/compass-film-draft.mp4", import.meta.url)));
const vtt = fileURLToPath(new URL("./subtitles.en.vtt", import.meta.url));

const pwPath = process.env.PLAYWRIGHT_CORE;
const { chromium } = await import(pwPath ? pathToFileURL(`${pwPath}/index.mjs`).href : "playwright-core");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(`${url}?capture=1&autoplay=0`, { waitUntil: "networkidle" });
const { fps, duration } = await page.evaluate(async () => {
  await window.FILM.ready;
  return { fps: window.FILM.fps, duration: window.FILM.duration };
});
const from = Number(arg("from", 0));
const to = Math.min(duration, Number(arg("to", duration)));
const frames = Math.round((to - from) * fps);

const ff = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
  "-i", vtt,
  "-map", "0:v", "-map", "1:s",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow",
  "-g", String(fps), "-movflags", "+faststart",
  "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
  out,
], { stdio: ["pipe", "inherit", "inherit"] });

const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const t = from + i / fps;
  await page.evaluate((x) => window.FILM.seek(x), t);
  const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % fps === 0) process.stdout.write(`\r${t.toFixed(1)}s / ${to}s`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on("close", (c) => (c === 0 ? r() : j(new Error(`ffmpeg exit ${c}`)))));
await browser.close();
console.log(`\nwrote ${out} (${frames} frames @${fps}fps, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
