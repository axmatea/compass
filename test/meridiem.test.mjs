import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correctMeridiem, explicitMeridiems, keepHalfOfDay } from '../server/agent/meridiem.mjs';
import { makeRuntime, scriptedInterpreter } from './helpers.mjs';

test('explicit AM/PM overrides the model, bare hours are left alone', () => {
  const cases = [
    ['Actually make it 8 in the morning.', '20:00', '08:00'],
    ['Breakfast at 8 AM', '20:00', '08:00'],
    ['breakfast at 7:30 a.m.', '19:30', '07:30'],
    ['Dinner at 12:30 AM after the show', '12:30', '00:30'],
    ['Meeting at 3 PM', '03:00', '15:00'],
    ['make it seven in the evening', '07:00', '19:00'],
    ['Завтрак в 9 утра', '21:00', '09:00'],
    ['Ужин в семь вечера', '07:00', '19:00'],
    ['Make it 8.', '20:00', null],
    ['Make it 8 AM', '08:00', null],
    ['Good morning, dinner at 7', '19:00', null],
    ['Move it from 8 AM to 9 PM', '21:00', null],
    ['make it 8 in the morning', '09:00', null],
  ];
  for (const [text, time, want] of cases) assert.equal(correctMeridiem(text, time), want, text);
  assert.deepEqual(explicitMeridiems('for 8 people at 7 PM'), [{ hour: 7, pm: true }]);
});

test('runtime: GLM PM default on an explicit morning time is corrected and the reply matches state', async () => {
  const interpreter = scriptedInterpreter({
    'Schedule dinner tomorrow at 7.': { set: { task: 'schedule dinner', date: 'tomorrow', time: '19:00' }, reply: 'Dinner tomorrow at 7 PM.' },
    'Actually make it 8 in the morning.': { set: { time: '20:00' }, reply: 'Changed to 8 PM.' },
  });
  const { runtime } = makeRuntime({ interpreter });
  const s = runtime.createSession();
  const events = [];
  runtime.subscribe(s.id, (e) => events.push(e));
  await runtime.runTurn(s.id, 'Schedule dinner tomorrow at 7.');
  const r = await runtime.runTurn(s.id, 'Actually make it 8 in the morning.');
  assert.equal(r.state.intent.time, '08:00');
  assert.ok(events.some((e) => e.type === 'reasoning_status' && e.stage === 'meridiem_corrected' && e.to === '08:00'));
  assert.doesNotMatch(r.reply, /PM|20:00/);
  assert.match(r.reply, /8/);
});

test('a bare-hour correction keeps the half of the day of the current plan', () => {
  const cases = [
    ['Push it to 10.', '22:00', '09:00', '10:00'],
    ['Actually make it 8.', '08:00', '19:00', '20:00'],
    ['make it nine', '09:00', '19:00', '21:00'],
    ['Сделай в девять', '09:00', '19:00', '21:00'],
    ['Make it 8.', '20:00', '19:00', null],
    ['Make it 8 AM', '08:00', '19:00', null],
    ['Move it to 22:00', '22:00', '09:00', null],
    ['Push it to 10.', '22:00', null, null],
  ];
  for (const [text, time, prev, want] of cases) assert.equal(keepHalfOfDay(text, time, prev), want, `${text} ${prev}`);
});
