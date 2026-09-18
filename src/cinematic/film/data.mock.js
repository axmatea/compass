// PROTOTYPE DATA. Mirrors the frozen BACKEND contract:
//   POST /api/turn {sessionId, text} -> {state, patch, reply, toolResult}
// Swap this module for a recorded real session (same shape) and the film
// re-derives every visual status from `state` + `patch`. Nothing is hard-coded
// in the renderer: superseded / active / added / kept all come from the patch.

export const session = {
  source: "mock", // "mock" | "recorded" | "live"
  fieldOrder: ["task", "date", "time", "cuisine", "location"],
  fieldLabels: { task: "Plan", date: "When", time: "Time", cuisine: "Cuisine", location: "Near" },
  turns: [
    {
      speaker: "user",
      text: "Schedule dinner tomorrow at 7 and find an Italian restaurant.",
      // words: [{ w, s }]  optional real ASR timestamps (seconds from utterance start)
      response: {
        state: { task: "Dinner", date: "Tomorrow", time: "7:00 PM", cuisine: "Italian" },
        patch: [
          { op: "add", path: "task", value: "Dinner" },
          { op: "add", path: "date", value: "Tomorrow" },
          { op: "add", path: "time", value: "7:00 PM" },
          { op: "add", path: "cuisine", value: "Italian" },
        ],
        plan: [
          { id: "search", label: "Find Italian restaurants" },
          { id: "table", label: "Check a table for 7:00 PM" },
          { id: "hold", label: "Draft calendar hold" },
        ],
        progress: 0.46, // how far the first action got before the interruption
        reply: null,
        toolResult: null,
      },
    },
    {
      speaker: "user",
      interrupt: true,
      text: "Actually make it 8. Somewhere near Palo Alto.",
      response: {
        state: { task: "Dinner", date: "Tomorrow", time: "8:00 PM", cuisine: "Italian", location: "Palo Alto" },
        patch: [
          { op: "replace", path: "time", from: "7:00 PM", value: "8:00 PM" },
          { op: "add", path: "location", value: "Palo Alto" },
        ],
        plan: [
          { id: "search", label: "Find Italian restaurants" },
          { id: "table", label: "Check a table for 8:00 PM" },
          { id: "hold", label: "Draft calendar hold" },
        ],
        reply: { text: "Moved to 8. Three Italian spots near Palo Alto." },
        toolResult: {
          restaurants: [
            { name: "Trattoria Alba", meta: "0.4 mi", slot: "8:00 PM" },
            { name: "Osteria Verde", meta: "0.9 mi", slot: "8:00 PM" },
            { name: "Cena Palo Alto", meta: "1.2 mi", slot: "8:15 PM" },
          ],
          calendarDraft: { title: "Dinner", when: "Tomorrow, 8:00 PM", status: "Draft, not sent" },
        },
      },
    },
  ],
};
