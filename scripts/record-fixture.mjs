// Record the canonical 2-turn dinner session against live GLM-5.3 as a contract fixture
// for FRONTEND and VIDEO. Run: node --env-file=.env scripts/record-fixture.mjs
// Output contains no secrets (state, patch, events, reply, toolResult only).
import { writeFileSync } from 'node:fs';
import { loadConfig } from '../server/config.mjs';
import { createNebiusClient } from '../server/llm/nebius.mjs';
import { createGlmInterpreter } from '../server/agent/interpreter.mjs';
import { createAgentRuntime } from '../server/agent/runtime.mjs';
import { createToolRegistry } from '../server/tools/registry.mjs';
import { createMockRestaurantSearch } from '../server/tools/mock-restaurant-search.mjs';

const cfg = loadConfig();
const TOOL_DELAY = 2500;
const runtime = createAgentRuntime({
  interpreter: createGlmInterpreter(createNebiusClient(cfg.nebius)),
  tools: createToolRegistry([createMockRestaurantSearch({ delayMs: TOOL_DELAY })]),
});
const s = runtime.createSession();
const stream = [];
const t0 = performance.now();
runtime.subscribe(s.id, (e) => stream.push({ ...e, tMs: Math.round(performance.now() - t0) }));

const turns = [
  { text: 'Schedule dinner tomorrow at 7 and find an Italian restaurant.' },
  { text: 'Actually make it 8. Somewhere near Palo Alto.' },
];
const p1 = runtime.runTurn(s.id, turns[0].text);
while (!stream.some((e) => e.type === 'tool_call')) await new Promise((r) => setTimeout(r, 20));
await new Promise((r) => setTimeout(r, 900)); // interrupt mid-search
const tInterrupt = Math.round(performance.now() - t0);
const p2 = runtime.runTurn(s.id, turns[1].text);
const [r1, r2] = await Promise.all([p1, p2]);

const strip = ({ events, ...rest }) => rest; // per-turn events are in sessionEvents
const fixture = {
  contract: 'COMPASS /api/turn v1',
  recordedAt: new Date().toISOString(),
  source: { model: cfg.nebius.model, tool: 'mock_restaurant_search (MOCK data)', mockToolDelayMs: TOOL_DELAY },
  note: 'Real GLM-5.3 interpretation. Restaurant results are mock placeholders, not real venues.',
  turns: [
    { request: { sessionId: s.id, text: turns[0].text }, sentAtMs: 0, response: strip(r1) },
    { request: { sessionId: s.id, text: turns[1].text }, sentAtMs: tInterrupt, response: strip(r2) },
  ],
  sessionEvents: stream,
};
writeFileSync(new URL('../test/fixtures/dinner-turns.json', import.meta.url), JSON.stringify(fixture, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, interruptAtMs: tInterrupt, events: stream.map((e) => `${e.tMs}:${e.type}`).join(' '), final: r2.state.intent }));
