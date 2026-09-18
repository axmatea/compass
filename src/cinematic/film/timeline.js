// Exact 28.000s timeline. Pure data, no DOM. Beats are absolute seconds.
export const DURATION = 28;
export const FPS = 30;

export const SHOTS = [
  { id: 1, name: "Listening", start: 0.0, end: 2.5 },
  { id: 2, name: "Instruction", start: 2.5, end: 6.0 },
  { id: 3, name: "Intent materializes", start: 6.0, end: 9.0 },
  { id: 4, name: "Acting", start: 9.0, end: 12.0 },
  { id: 5, name: "Interruption", start: 12.0, end: 15.0 },
  { id: 6, name: "Intent patch", start: 15.0, end: 19.5 },
  { id: 7, name: "Replan, keep acting", start: 19.5, end: 24.0 },
  { id: 8, name: "Resolve", start: 24.0, end: 28.0 },
];

// Utterance windows. Word timings are fitted inside these windows.
export const UTTER = {
  user1: [2.7, 5.7],
  user2: [12.25, 14.7],
  reply: [21.3, 23.7],
};

export const BEATS = {
  orbIn: [0.2, 1.6],
  headerIn: [0.6, 1.6],
  subtitleDock: [6.0, 6.9], // subtitle block moves from centre to bottom
  orbDock: [6.0, 7.1], // orb moves from hero to header position
  cardIn: [6.4, 7.1],
  rowStart: 6.9, // first state row
  rowStagger: 0.38,
  actIn: [9.0, 9.7],
  progress1: [9.5, 11.9], // 0 -> turn1.progress
  bargeIn: 12.2, // orb flare + progress freezes
  strike: [15.3, 15.8], // 7:00 PM struck
  recede: [15.9, 16.5], // superseded value recedes
  activeIn: [16.1, 16.9], // 8:00 PM gold
  addIn: [16.9, 17.6], // Palo Alto
  keptIn: [17.5, 18.2], // Dinner / Tomorrow / Italian marked kept
  patchNote: [18.0, 18.6],
  stepStrike: [19.7, 20.1],
  stepNew: [20.0, 20.6],
  progress2: [20.3, 22.6], // resumes from turn1.progress -> 1
  resultsIn: 21.0,
  resultsStagger: 0.3,
  calendarIn: [22.4, 23.0],
  uiOut: [24.0, 24.8],
  orbHero: [24.1, 25.4],
  wordmarkIn: [24.9, 25.8],
  line1In: [25.7, 26.5],
  line2In: [26.3, 27.1],
};

export function shotAt(t) {
  return SHOTS.find((s) => t >= s.start && t < s.end) || SHOTS[SHOTS.length - 1];
}

export function statusAt(t) {
  if (t < 6.0) return "Listening";
  if (t < 9.0) return "Understanding";
  if (t < BEATS.bargeIn) return "Acting";
  if (t < 15.0) return "Listening";
  if (t < 19.5) return "Updating intent";
  if (t < 24.0) return "Acting";
  return "";
}
