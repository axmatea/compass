// Records ONE continuous real run of production /demo (real GLM-5.3 on Nebius, real OSM search).
// Input is typed (headless has no microphone), video only: label it "typed input, no sound".
//   PLAYWRIGHT_CORE=... CHROME_PATH=... node src/presentation/stage/tools/record-real-run.mjs --out public/media/present/real-run.mp4
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const url = arg("url", "https://mycompass.world/demo");
const out = arg("out", "public/media/present/real-run.mp4");
const pw = process.env.PLAYWRIGHT_CORE;
const { chromium } = await import(pw ? pathToFileURL(`${pw}/index.mjs`).href : "playwright-core");
const dir = mkdtempSync(join(tmpdir(), "compass-realrun-"));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir, size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
const turns = [];
page.on("response", async (r) => { if (r.url().includes("/api/turn")) turns.push(`${r.status()} ${new Date().toISOString()}`); });
const t0 = Date.now();
const mark = (m) => console.log(`${((Date.now() - t0) / 1000).toFixed(2)}s ${m}`);
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const box = page.getByPlaceholder("Or type…");
const say = async (text) => { await box.click(); await box.pressSequentially(text, { delay: 35 }); await box.press("Enter"); };
mark("T1 typed");
await say("Schedule dinner tomorrow at 7 and find an Italian restaurant.");
await page.waitForFunction(() => /where/i.test(document.body.innerText), null, { timeout: 60000 }).then(() => mark("T1 answered")).catch(() => mark("T1 no question seen"));
await page.waitForTimeout(1500);
mark("T2 typed");
await say("Actually, make it 8. Somewhere near Palo Alto.");
await page.waitForFunction(() => /Palo Alto/.test(document.body.innerText) && /8:00/.test(document.body.innerText) && /(tables|Sample|restaurant|places|found)/i.test(document.body.innerText.split("Palo Alto").slice(1).join(" ")), null, { timeout: 90000 }).then(() => mark("T2 result on screen")).catch(() => mark("T2 result marker not seen"));
await page.waitForTimeout(5000);
mark("end");
console.log("api/turn responses", turns);
await page.screenshot({ path: join(dir, "last.png") });
console.log("last frame", join(dir, "last.png"));
await ctx.close();
await browser.close();
const webm = join(dir, readdirSync(dir).find((f) => f.endsWith(".webm")));
const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-an", "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", out], { stdio: "inherit" });
if (r.status) process.exit(r.status);
console.log("wrote", out);
