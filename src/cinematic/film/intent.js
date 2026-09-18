// Pure derivation: session (contract shape) + timeline -> what the film shows.
// No DOM. Also used by export-vtt.mjs in Node.
import { UTTER } from "./timeline.js";

// Row status after the interruption, derived only from turn 2 patch.
//   replaced -> old value superseded, new value active (gold)
//   added    -> new slot appears
//   kept     -> untouched by the patch
export function deriveRows(session) {
  const [t1, t2] = session.turns;
  const before = t1.response.state;
  const after = t2.response.state;
  const ops = new Map(t2.response.patch.map((p) => [p.path, p]));
  const fields = session.fieldOrder.filter((f) => f in before || f in after);
  let order = 0;
  return fields.map((field) => {
    const op = ops.get(field);
    const inFirst = field in before;
    return {
      field,
      label: session.fieldLabels[field] || field,
      firstIndex: inFirst ? order++ : -1,
      status: !op ? "kept" : op.op === "replace" ? "replaced" : "added",
      from: op && op.op === "replace" ? op.from ?? before[field] : before[field],
      to: after[field] ?? before[field],
    };
  });
}

export function deriveSteps(session) {
  const [t1, t2] = session.turns;
  const next = new Map(t2.response.plan.map((s) => [s.id, s]));
  return t1.response.plan.map((s) => {
    const n = next.get(s.id);
    return { id: s.id, from: s.label, to: n ? n.label : s.label, status: n && n.label !== s.label ? "replaced" : "kept" };
  });
}

// Word timings: use real ASR timestamps if provided, otherwise fit words
// into the utterance window proportionally to their length.
export function timeWords(text, window, words) {
  const [a, b] = window;
  if (words && words.length) {
    const last = words[words.length - 1].s || 1;
    const k = Math.min(1, (b - a) / last);
    return words.map((x) => ({ w: x.w, s: a + x.s * k }));
  }
  const list = text.split(/\s+/);
  const weights = list.map((w) => w.length + 2 + (/[.,]$/.test(w) ? 4 : 0));
  const total = weights.reduce((x, y) => x + y, 0);
  let acc = 0;
  return list.map((w, i) => {
    const s = a + ((b - a) * acc) / total;
    acc += weights[i];
    return { w, s };
  });
}

export function deriveCues(session) {
  const [t1, t2] = session.turns;
  const cues = [
    { id: "user1", speaker: "You", text: t1.text, window: UTTER.user1, words: timeWords(t1.text, UTTER.user1, t1.words) },
    { id: "user2", speaker: "You", text: t2.text, window: UTTER.user2, words: timeWords(t2.text, UTTER.user2, t2.words), interrupt: true },
  ];
  const reply = t2.response.reply;
  if (reply) cues.push({ id: "reply", speaker: "COMPASS", text: reply.text, window: UTTER.reply, words: timeWords(reply.text, UTTER.reply, reply.words) });
  return cues;
}

export function patchSummary(rows) {
  const n = (s) => rows.filter((r) => r.status === s).length;
  const parts = [];
  if (n("replaced")) parts.push(`${n("replaced")} changed`);
  if (n("added")) parts.push(`${n("added")} added`);
  if (n("kept")) parts.push(`${n("kept")} kept`);
  return parts.join(" · ");
}
