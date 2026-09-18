// Guards the frozen /api/turn v1 contract (COMPASS_MASTER section 15) using the
// recorded live fixture consumed by FRONTEND and VIDEO.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIELDS } from '../server/state/intent.mjs';

const fx = JSON.parse(readFileSync(new URL('./fixtures/dinner-turns.json', import.meta.url), 'utf8'));
const EVENT_TYPES = ['reasoning_status', 'state_patch', 'action_invalidated', 'tool_call', 'tool_result', 'say', 'error', 'done'];

test('fixture responses match v1 top-level shape', () => {
  assert.equal(fx.contract, 'COMPASS /api/turn v1');
  for (const { response: r } of fx.turns) {
    for (const k of ['sessionId', 'turnId', 'state', 'patch', 'reply', 'toolResult', 'superseded']) assert.ok(k in r, k);
    assert.deepEqual(Object.keys(r.state.intent).sort(), [...FIELDS].sort());
    assert.ok(['idle', 'thinking', 'acting', 'ready', 'error'].includes(r.state.status));
    for (const p of r.patch) {
      assert.ok(FIELDS.includes(p.field));
      assert.ok(['active', 'kept'].includes(p.status));
      if (p.status === 'active') assert.ok(['added', 'updated', 'removed'].includes(p.change));
    }
    if (r.state.intent.time) assert.match(r.state.intent.time, /^\d{2}:\d{2}$/);
  }
});

test('fixture encodes the canonical interruption', () => {
  const [t1, t2] = fx.turns.map((t) => t.response);
  assert.equal(t1.superseded, true);
  assert.equal(t1.reply, null);
  assert.deepEqual(t2.state.intent, { task: 'schedule dinner', date: 'tomorrow', time: '20:00', location: 'Palo Alto', cuisine: 'Italian', party_size: null });
  const time = t2.patch.find((p) => p.field === 'time');
  assert.deepEqual([time.from, time.to, time.status, time.change], ['19:00', '20:00', 'active', 'updated']);
  assert.equal(t2.patch.find((p) => p.field === 'location').change, 'added');
  assert.equal(t2.toolResult.mock, true);
  assert.equal(t2.toolResult.result.results.length, 3);
});

test('fixture session events use only known event types, in time order', () => {
  let last = -1;
  for (const e of fx.sessionEvents) {
    assert.ok(EVENT_TYPES.includes(e.type), e.type);
    assert.ok(e.tMs >= last);
    last = e.tMs;
  }
  const types = fx.sessionEvents.map((e) => e.type);
  assert.ok(types.indexOf('action_invalidated') < types.lastIndexOf('tool_call'));
});
