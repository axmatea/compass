import { DURATION, FPS, SHOTS, BEATS, CUE_HOLD, shotAt, statusAt } from "./timeline.js";
import fixture from "./dinner-turns.json";
import { deriveRows, deriveActions, deriveResults, deriveCues, patchSummary } from "./intent.js";

// ---------- math ----------
const clamp = (x) => Math.min(1, Math.max(0, x));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const k = (t, [a, b], e = outCubic) => e(clamp((t - a) / (b - a)));
const lerp = (a, b, x) => a + (b - a) * x;
const bump = (t, at, len) => (t < at || t > at + len ? 0 : Math.sin((Math.PI * (t - at)) / len));

// ---------- derived content ----------
const rows = deriveRows(fixture);
const actions = deriveActions(fixture);
const results = deriveResults(fixture);
const cues = deriveCues(fixture);
const SOURCE = results.mock ? "v1 fixture · mock tool" : "v1 fixture";

// ---------- DOM ----------
const $ = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.textContent = html;
  return el;
};
const stage = document.querySelector(".fl-stage");
stage.dataset.source = SOURCE;

const header = $("header", "fl-header");
header.append($("span", "fl-wordmark", "COMPASS"));
const status = $("span", "fl-status");
const statusDot = $("i");
const statusText = $("b");
statusText.style.fontWeight = "400";
status.append(statusDot, statusText);
header.append(status);

const orbPos = $("div", "fl-orb-pos");
const orb = $("div", "fl-orb");
const ring1 = $("div", "fl-orb-ring");
const ring2 = $("div", "fl-orb-ring two");
const shock = $("div", "fl-orb-shock");
orb.append($("div", "fl-orb-core"), ring1, ring2, shock, $("div", "fl-orb-glint"));
const wave = $("div", "fl-wave");
const bars = Array.from({ length: 48 }, () => wave.appendChild($("i")));
orbPos.append(orb, wave);

// Intent card
const card = $("section", "fl-panel fl-card");
const cardHead = $("div", "fl-head");
const patchNote = $("em", null, `Intent updated · ${patchSummary(rows)}`);
cardHead.append($("span", null, "Intent"), patchNote);
card.append(cardHead);
const rowEls = rows.map((r) => {
  const el = $("div", "fl-row");
  el.dataset.status = r.status;
  const edge = $("span", "fl-row-edge");
  const label = $("span", "fl-row-label", r.label);
  const tag = $("span", "fl-row-tag", { kept: "kept", added: "new", updated: "updated", removed: "removed" }[r.status]);
  const vals = $("span", "fl-vals");
  let oldEl = null;
  let newEl = null;
  let strike = null;
  if (r.status !== "added" && r.from) {
    oldEl = $("span", "fl-val old", r.from);
    strike = $("i", "fl-strike");
    oldEl.append(strike);
    vals.append(oldEl);
  }
  if (r.status === "added" || r.status === "updated") {
    newEl = $("span", "fl-val new", r.to);
    vals.append(newEl);
  }
  el.append(edge, label, tag, vals);
  card.append(el);
  return { r, el, edge, label, tag, oldEl, newEl, strike, newW: 0 };
});

// Action panel: one row per state.actions[] entry (invalidated / running / done)
const act = $("section", "fl-panel fl-act");
const actHead = $("div", "fl-head");
actHead.append($("span", null, "Action"), $("em", null, "Restaurant search"));
const actEls = actions.map((A) => {
  const row = $("div", "fl-action");
  row.dataset.status = A.status;
  const dot = $("span", "fl-dot");
  const text = $("span", "fl-action-text", A.label);
  const strike = $("i", "fl-strike");
  text.append(strike);
  const st = $("span", "fl-action-status");
  const run = $("span", "fl-run");
  const runFill = $("i");
  run.append(runFill);
  row.append(dot, text, st, run);
  return { A, row, dot, text, strike, st, run, runFill };
});
const resHead = $("div", "fl-res-head", results.mock ? "Sample results" : "Results");
const resList = $("ol", "fl-list");
const resEls = results.items.map((x) => {
  const li = $("li");
  li.append($("span", "fl-dot"), $("span", "fl-res-name", x.name), $("span", "fl-res-meta", x.meta), $("span", "fl-res-slot", x.slot));
  resList.append(li);
  return li;
});
act.append(actHead, ...actEls.map((x) => x.row), resHead, resList);

// Subtitles
const sub = $("div", "fl-sub");
const subSpeaker = $("span", "fl-sub-speaker");
const subLine = $("p", "fl-sub-line");
sub.append(subSpeaker, subLine);
const cueEls = cues.map((c) => {
  const words = c.words.map((w, i) => $("span", null, (i ? " " : "") + w.w));
  return { c, words };
});
let mountedCue = null;

// End card
const end = $("div", "fl-end");
const endMark = $("div", "fl-end-mark", "COMPASS");
const endRule = $("div", "fl-end-rule");
const l1 = $("p", "l1", "It doesn’t just answer you.");
const l2 = $("p", "l2", "It adapts while acting.");
end.append(endMark, endRule, l1, l2);

stage.append(header, orbPos, card, act, sub, end);

// ---------- helpers ----------
const show = (el, o, y = 0, blur = 0, extra = "") => {
  el.style.opacity = o.toFixed(3);
  el.style.transform = `translateY(${y.toFixed(2)}px)${extra}`;
  el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
};
function voiceAmp(t, id) {
  const c = cues.find((x) => x.id === id);
  if (!c) return 0;
  const [a, b] = c.window;
  const env = clamp((t - a) / 0.15) * clamp((b + 0.2 - t) / 0.25);
  return env * (0.5 + 0.5 * Math.abs(Math.sin(t * 13.1) * Math.cos(t * 7.7 + 1)));
}

// ---------- render: a pure function of t ----------
let T = 0;
function render(t) {
  T = t;
  const outUI = k(t, BEATS.uiOut, inOutCubic);

  // background drift
  stage.style.setProperty("--bx", `${50 + Math.sin(t * 0.21) * 4}%`);
  stage.style.setProperty("--by", `${lerp(40, 22, k(t, BEATS.orbDock, inOutCubic)) + lerp(0, 18, k(t, BEATS.orbHero, inOutCubic))}%`);

  // header
  show(header, k(t, BEATS.headerIn) * (1 - outUI));
  statusText.textContent = statusAt(t);
  const listening = /Listening/.test(statusText.textContent);
  statusDot.style.background = listening ? "#c3e3f9" : "#e8f1f7";
  statusDot.style.opacity = (0.55 + 0.45 * Math.abs(Math.sin(t * 3))).toFixed(2);

  // orb: hero (540,760 @340) -> docked (540,300 @170) -> end hero (540,800 @300)
  const dock = k(t, BEATS.orbDock, inOutCubic);
  const hero = k(t, BEATS.orbHero, inOutCubic);
  let cy = lerp(lerp(760, 300, dock), 800, hero);
  let size = lerp(lerp(340, 170, dock), 300, hero);
  const flare = bump(t, BEATS.bargeIn, 0.9);
  const speak = Math.max(voiceAmp(t, "say1"), voiceAmp(t, "say2"), voiceAmp(t, "reply"));
  const listen = Math.max(voiceAmp(t, "user1"), voiceAmp(t, "user2"));
  const breathe = 1 + Math.sin(t * 1.05) * 0.018;
  const sc = (size / 340) * breathe * (1 + flare * 0.1 + speak * 0.035);
  const inO = k(t, BEATS.orbIn);
  orbPos.style.transform = `translate(${540 - 170}px, ${cy - 170}px) scale(${sc.toFixed(4)})`;
  orbPos.style.opacity = inO.toFixed(3);
  orb.style.setProperty("--glow", (0.15 + flare * 0.85 + speak * 0.45 + listen * 0.2).toFixed(3));
  ring1.style.transform = `rotate(${-25 + t * 25.7}deg) scaleX(.98)`;
  ring2.style.transform = `rotate(${25 - t * 19}deg) scaleX(.97)`;
  const sh = clamp((t - BEATS.bargeIn) / 1.0);
  shock.style.opacity = t >= BEATS.bargeIn ? ((1 - sh) * 0.7).toFixed(3) : "0";
  shock.style.transform = `scale(${1 + outCubic(sh) * 0.9})`;
  // waveform: listens to the user, speaks the reply
  const amp = Math.max(listen, speak, 0.06);
  bars.forEach((bar, i) => {
    const n = Math.abs(Math.sin(i * 0.71 + t * 9.3) * Math.sin(i * 0.23 - t * 5.1));
    const shape = Math.sin((Math.PI * (i + 0.5)) / bars.length);
    bar.style.transform = `scaleY(${Math.max(0.06, amp * shape * (0.3 + 0.7 * n)).toFixed(3)})`;
  });
  wave.style.opacity = ((1 - dock * 0.55) * (1 - outUI)).toFixed(3);

  // intent card
  const cIn = k(t, BEATS.cardIn);
  show(card, cIn * (1 - outUI), lerp(40, 0, cIn) - outUI * 30, (1 - cIn) * 8 + outUI * 10);
  const kept = k(t, BEATS.keptIn);
  rowEls.forEach((R) => {
    const { r } = R;
    let rowIn;
    if (r.firstIndex >= 0) {
      const a = BEATS.rowStart + r.firstIndex * BEATS.rowStagger;
      rowIn = k(t, [a, a + 0.55]);
    } else rowIn = k(t, BEATS.addIn, outExpo);
    R.label.style.opacity = rowIn.toFixed(3);
    R.tag.style.opacity = (r.status === "kept" ? kept * 0.9 : r.status === "added" ? rowIn : k(t, BEATS.activeIn)).toFixed(3);
    const edgeO = r.status === "kept" ? 0 : r.status === "added" ? rowIn : k(t, BEATS.activeIn);
    R.edge.style.opacity = edgeO.toFixed(3);
    R.edge.style.transform = `scaleY(${edgeO.toFixed(3)})`;
    if (R.oldEl) {
      if (r.status === "updated" || r.status === "removed") {
        const st = k(t, BEATS.strike, outExpo);
        const rc = k(t, BEATS.recede, inOutCubic);
        R.strike.style.transform = `scaleX(${st.toFixed(3)})`;
        const o = rowIn * lerp(1, 0.38, rc);
        R.oldEl.style.opacity = o.toFixed(3);
        R.oldEl.style.color = st > 0 ? "#8599a8" : "";
        R.oldEl.style.transform = `translateX(${(-(R.newW + 30) * rc).toFixed(2)}px) translateY(${lerp(14, 0, rowIn).toFixed(2)}px) scale(${lerp(1, 0.66, rc).toFixed(3)})`;
      } else {
        R.oldEl.style.opacity = rowIn.toFixed(3);
        R.oldEl.style.transform = `translateY(${lerp(14, 0, rowIn).toFixed(2)}px)`;
      }
    }
    if (R.newEl) {
      const ni = r.status === "added" ? rowIn : k(t, BEATS.activeIn);
      const glow = bump(t, r.status === "added" ? BEATS.addIn[0] : BEATS.activeIn[0], 1.6);
      R.newEl.style.opacity = ni.toFixed(3);
      R.newEl.style.transform = `translateY(${lerp(26, 0, ni).toFixed(2)}px)`;
      R.newEl.style.filter = ni < 1 ? `blur(${((1 - ni) * 8).toFixed(2)}px)` : "";
      R.newEl.style.textShadow = `0 0 ${(28 * glow).toFixed(1)}px rgba(212,184,118,${(0.7 * glow).toFixed(2)})`;
    }
  });
  patchNote.style.opacity = k(t, BEATS.patchNote).toFixed(3);

  // action panel
  const aIn = k(t, BEATS.actIn);
  show(act, aIn * (1 - outUI), lerp(40, 0, aIn) - outUI * 30, (1 - aIn) * 8 + outUI * 10);
  const inv = k(t, BEATS.invalidate, outExpo);
  const newIn = k(t, BEATS.newAction);
  actEls.forEach(({ A, row, dot, text, strike, st, run, runFill }) => {
    const first = A.status === "invalidated";
    // first action: running from tool_call until action_invalidated
    // second action: running from new tool_call until tool_result
    const rowIn = first ? k(t, [BEATS.actIn[0] + 0.3, BEATS.actIn[1] + 0.3]) : newIn;
    const running = first ? t >= BEATS.actIn[0] && t < BEATS.invalidate[0] : t >= BEATS.newAction[0] && t < BEATS.toolDone;
    const done = !first && t >= BEATS.toolDone;
    const dead = first && t >= BEATS.invalidate[0];
    row.style.opacity = (rowIn * (dead ? lerp(1, 0.55, inv) : 1)).toFixed(3);
    row.style.transform = `translateY(${lerp(22, 0, rowIn).toFixed(2)}px)`;
    strike.style.transform = `scaleX(${(dead ? inv : 0).toFixed(3)})`;
    text.style.color = dead ? "#8599a8" : running || done ? "#f4f7fa" : "";
    st.textContent = dead ? `Invalidated · ${A.invalidatedFields.join(", ")} changed` : done ? "Done" : running ? "Running" : "";
    st.style.color = dead ? "#8599a8" : done ? "#c3e3f9" : "";
    dot.style.background = done ? "#c3e3f9" : running ? `rgba(195,227,249,${0.35 + 0.65 * Math.abs(Math.sin(t * 4))})` : "transparent";
    dot.style.borderColor = dead ? "#5d7382" : "#c3e3f9";
    run.style.opacity = running ? "1" : "0";
    runFill.style.transform = `translateX(${(((t * 0.9) % 1) * 360 - 120).toFixed(1)}%)`;
  });
  const rh = k(t, [BEATS.resultsIn, BEATS.resultsIn + 0.4]);
  resHead.style.opacity = rh.toFixed(3);
  resEls.forEach((li, i) => {
    const a = BEATS.resultsIn + 0.15 + i * BEATS.resultsStagger;
    const ri = k(t, [a, a + 0.5]);
    li.style.opacity = ri.toFixed(3);
    li.style.transform = `translateY(${lerp(22, 0, ri).toFixed(2)}px)`;
  });

  // subtitles
  const cue = cueEls.find(({ c }) => t >= c.window[0] - 0.1 && t < c.window[1] + CUE_HOLD) || null;
  if (cue !== mountedCue) {
    subLine.replaceChildren(...(cue ? cue.words : []));
    subSpeaker.textContent = cue ? (cue.c.interrupt ? "You, interrupting" : cue.c.speaker) : "";
    sub.dataset.speaker = cue ? cue.c.speaker : "";
    mountedCue = cue;
  }
  const sd = k(t, BEATS.subtitleDock, inOutCubic);
  sub.style.transform = `translateY(${lerp(1170, 1560, sd).toFixed(2)}px) scale(${lerp(1, 0.78, sd).toFixed(4)})`;
  if (cue) {
    const [, b] = cue.c.window;
    sub.style.opacity = clamp((b + CUE_HOLD - t) / 0.3).toFixed(3);
    cue.words.forEach((el, i) => {
      const wi = k(t, [cue.c.words[i].s, cue.c.words[i].s + 0.22]);
      el.style.opacity = wi.toFixed(3);
      el.style.transform = `translateY(${lerp(10, 0, wi).toFixed(2)}px)`;
      el.style.filter = wi < 1 ? `blur(${((1 - wi) * 6).toFixed(2)}px)` : "";
    });
  } else sub.style.opacity = "0";

  // end card
  show(endMark, k(t, BEATS.wordmarkIn), lerp(24, 0, k(t, BEATS.wordmarkIn)), (1 - k(t, BEATS.wordmarkIn)) * 10);
  endRule.style.transform = `scaleX(${k(t, [25.4, 26.2], inOutCubic).toFixed(3)})`;
  const a1 = k(t, BEATS.line1In);
  const a2 = k(t, BEATS.line2In);
  show(l1, a1, lerp(20, 0, a1), (1 - a1) * 8);
  show(l2, a2, lerp(20, 0, a2), (1 - a2) * 8);

  ui.sync(t);
}

// ---------- preview controls ----------
const params = new URLSearchParams(location.search);
const capture = params.has("capture");
if (capture) document.body.classList.add("capture");
const frame = document.querySelector(".fl-frame");
function fit() {
  const s = capture ? 1 : Math.min((innerHeight - 70) / 1920, (innerWidth - 24) / 1080);
  frame.style.setProperty("--s", s.toFixed(4));
  stage.style.setProperty("--s", s.toFixed(4));
}
addEventListener("resize", fit);
fit();

const ui = (() => {
  const bar = document.querySelector(".fl-ui");
  const play = $("button", null, "Play");
  const scrub = $("input");
  Object.assign(scrub, { type: "range", min: 0, max: DURATION, step: 1 / FPS, value: 0 });
  scrub.setAttribute("aria-label", "Timeline");
  const time = $("span", "fl-time");
  const shotBox = $("span", "fl-shots");
  const shotBtns = SHOTS.map((s) => {
    const b = $("button", null, String(s.id));
    b.title = `${s.name} (${s.start.toFixed(1)}s)`;
    b.onclick = () => { pause(); seek(s.start + 0.001); };
    shotBox.append(b);
    return b;
  });
  const flag = $("span", "fl-flag", SOURCE.toUpperCase());
  bar.append(play, scrub, time, shotBox, flag);
  play.onclick = () => (playing ? pause() : start());
  scrub.oninput = () => { pause(); seek(+scrub.value); };
  return {
    play,
    sync(t) {
      scrub.value = String(t);
      const s = shotAt(t);
      time.textContent = `${t.toFixed(2)} / ${DURATION.toFixed(2)}s · ${s.id} ${s.name}`;
      shotBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(SHOTS[i] === s)));
    },
  };
})();

let playing = false;
let last = 0;
let raf = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  let t = T + dt;
  if (t >= DURATION) {
    if (params.has("loop")) t = 0;
    else { t = DURATION; pause(); }
  }
  render(t);
  if (playing) raf = requestAnimationFrame(loop);
}
function start() {
  if (T >= DURATION) T = 0;
  playing = true;
  ui.play.textContent = "Pause";
  last = performance.now();
  raf = requestAnimationFrame(loop);
}
function pause() {
  playing = false;
  ui.play.textContent = "Play";
  cancelAnimationFrame(raf);
}
function seek(t) { render(Math.min(DURATION, Math.max(0, t))); }

addEventListener("keydown", (e) => {
  if (e.key === " ") { e.preventDefault(); playing ? pause() : start(); }
  else if (e.key === "ArrowRight" || e.key === "ArrowLeft") { pause(); seek(T + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 1 : 1 / FPS)); }
  else if (/^[1-8]$/.test(e.key)) { pause(); seek(SHOTS[+e.key - 1].start + 0.001); }
  else if (e.key === "Home") { pause(); seek(0); }
});

// fonts must be ready before measuring the new-value widths
const ready = document.fonts.ready.then(() => {
  rowEls.forEach((R) => { if (R.newEl) R.newW = R.newEl.getBoundingClientRect().width / (parseFloat(stage.style.getPropertyValue("--s")) || 1); });
  seek(params.has("t") ? +params.get("t") : 0);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!capture && !params.has("t") && !reduced && params.get("autoplay") !== "0") start();
});

// capture / automation hook: deterministic frame access
window.FILM = Object.freeze({ duration: DURATION, fps: FPS, shots: SHOTS, cues, source: SOURCE, ready, seek: (t) => { pause(); seek(t); }, play: start, pause, now: () => T });
