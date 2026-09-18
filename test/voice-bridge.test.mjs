// Offline tests for the Boson realtime bridge against a scripted fake upstream that
// follows the verified Boson event contract (COMPASS_MASTER §18).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import WebSocket from 'ws';
import { createRealtimeBridge } from '../server/voice/realtime-bridge.mjs';
import { attachVoiceServer } from '../server/voice/ws-server.mjs';
import { makeRuntime, scriptedInterpreter, DINNER_SCRIPT, T1, T2, sleep } from './helpers.mjs';

function fakeUpstream() {
  const handlers = new Map();
  const sent = [];
  let n = 0;
  const up = {
    sent,
    send: (ev) => { sent.push(ev); up.onSend?.(ev); },
    close: () => {},
    on: (type, fn) => { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return up; },
    emit: (ev) => { handlers.get(ev.type)?.forEach((fn) => fn(ev)); handlers.get('*')?.forEach((fn) => fn(ev)); },
    id: (p) => `${p}_${++n}`,
  };
  return up;
}
function fakeClient() {
  const json = [];
  const bin = [];
  return { json, bin, sendJson: (o) => json.push({ ...o, _t: performance.now() }), sendBinary: (b) => bin.push({ len: b.length, _t: performance.now() }), close: () => {} };
}
// Boson-like behaviour: a response.create gets audio (ms of speech, delivered fast) then response.done.
function autoSpeak(up, { speechMs = 1500 } = {}) {
  up.onSend = (ev) => {
    if (ev.type !== 'response.create') return;
    const rid = up.id('resp'); const item = up.id('item');
    setTimeout(() => {
      up.emit({ type: 'response.created', response: { id: rid, status: 'in_progress', metadata: ev.response?.metadata ?? null } });
      const chunks = Math.ceil(speechMs / 100);
      for (let i = 0; i < chunks; i++) up.emit({ type: 'response.output_audio.delta', response_id: rid, item_id: item, delta: Buffer.alloc(4800).toString('base64') }); // 100 ms each
      up.emit({ type: 'response.output_audio_transcript.done', response_id: rid, item_id: item, transcript: 'spoken' });
      up.emit({ type: 'response.done', response: { id: rid, status: 'completed', output: [] } });
    }, 20);
  };
}
function userTurn(up, utterance) {
  const rid = up.id('resp');
  const call = up.id('call');
  up.emit({ type: 'input_audio_buffer.speech_stopped', item_id: 'u' });
  up.emit({ type: 'response.created', response: { id: rid, status: 'in_progress', metadata: null } });
  up.emit({ type: 'response.function_call_arguments.done', response_id: rid, name: 'compass_turn', call_id: call, arguments: JSON.stringify({ utterance }) });
  up.emit({ type: 'response.done', response: { id: rid, status: 'completed', output: [{ type: 'function_call', call_id: call }] } });
}
const statuses = (c) => c.json.filter((j) => j.type === 'status').map((j) => j.status);

test('dinner by voice: barge-in during playback flushes audio, supersedes 7pm, speaks the new plan', async () => {
  const { runtime } = makeRuntime({ toolDelayMs: 900 });
  const up = fakeUpstream();
  const client = fakeClient();
  autoSpeak(up, { speechMs: 1500 });
  const bridge = createRealtimeBridge({ client, runtime, connectUpstream: async () => up, voice: 'nora', logger: { error() {} } });
  await bridge.start();
  up.emit({ type: 'session.created', session: {} });
  const cfg = up.sent.find((e) => e.type === 'session.update').session;
  assert.equal(cfg.tool_choice, 'auto');
  assert.equal(cfg.audio.output.voice, 'nora');
  assert.equal(cfg.tools[0].name, 'compass_turn');

  // T1 spoken
  up.emit({ type: 'input_audio_buffer.speech_started', item_id: 'u1' });
  userTurn(up, T1);
  await sleep(150);
  const out1 = up.sent.find((e) => e.type === 'conversation.item.create' && e.item.type === 'function_call_output');
  assert.equal(JSON.parse(out1.item.output).say, DINNER_SCRIPT[T1].reply, 'GLM ack returned to Boson');
  assert.ok(up.sent.some((e) => e.type === 'response.create' && e.response?.metadata?.compass === 'ack'));
  assert.ok(statuses(client).includes('SPEAKING'));
  const firstItem = client.json.find((j) => j.type === 'audio.start').itemId;

  // Boson finished GENERATING (response.done) but the browser is still PLAYING -> barge-in must flush.
  await sleep(300);
  up.emit({ type: 'input_audio_buffer.speech_started', item_id: 'u2' });
  const flush = client.json.find((j) => j.type === 'audio.flush');
  assert.ok(flush, 'audio.flush sent while playback in progress');
  assert.equal(flush.itemId, firstItem);
  assert.equal(statuses(client).at(-1), 'INTERRUPTED');
  const trunc = up.sent.find((e) => e.type === 'conversation.item.truncate');
  assert.equal(trunc.item_id, firstItem);
  assert.ok(trunc.audio_end_ms > 0 && trunc.audio_end_ms < 1500, `truncated at heard position (${trunc.audio_end_ms})`);

  // T1's search (7 PM) finishes while the user is still talking: its reply must NOT be spoken.
  await sleep(800);
  userTurn(up, T2);
  await sleep(1600);
  const st = runtime.getSession(bridge.sessionId).state;
  assert.deepEqual(st.intent, { task: 'schedule dinner', date: 'tomorrow', time: '20:00', location: 'Palo Alto', cuisine: 'Italian', party_size: null });
  const spokenUpdates = up.sent.filter((e) => e.type === 'conversation.item.create' && e.item.type === 'function_call_output').map((e) => JSON.parse(e.item.output).say);
  assert.ok(!spokenUpdates.some((t) => /7 PM/.test(t)), `no stale 7 PM speech: ${JSON.stringify(spokenUpdates)}`);
  assert.ok(spokenUpdates.some((t) => /Moved to 8 PM\. Three Italian spots near Palo Alto/.test(t)), 'final 8 PM plan spoken');
  const s = statuses(client);
  for (const want of ['LISTENING', 'SPEECH_DETECTED', 'THINKING', 'ACTING', 'SPEAKING', 'INTERRUPTED', 'REPLANNING']) assert.ok(s.includes(want), `status ${want} emitted`);
  assert.ok(client.json.some((j) => j.type === 'compass' && j.event.type === 'state_patch'));
  assert.ok(client.json.some((j) => j.type === 'metrics' && j.speechEndToFirstAudioMs != null));
  bridge.close();
});

test('if Boson answers by itself, its audio is dropped and the transcript goes through COMPASS', async () => {
  const { runtime } = makeRuntime({ toolDelayMs: 10 });
  const up = fakeUpstream();
  const client = fakeClient();
  const bridge = createRealtimeBridge({ client, runtime, connectUpstream: async () => up, logger: { error() {} } });
  await bridge.start();
  up.emit({ type: 'input_audio_buffer.speech_started', item_id: 'u1' });
  up.emit({ type: 'input_audio_buffer.speech_stopped', item_id: 'u1' });
  up.emit({ type: 'response.created', response: { id: 'r1', metadata: null } });
  up.emit({ type: 'response.output_audio.delta', response_id: 'r1', item_id: 'i1', delta: Buffer.alloc(4800).toString('base64') });
  assert.equal(client.bin.length, 0, 'self-answer audio never reaches the browser');
  assert.ok(up.sent.some((e) => e.type === 'response.cancel' && e.response_id === 'r1'));
  up.emit({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'u1', transcript: T1 });
  await sleep(100);
  assert.equal(runtime.getSession(bridge.sessionId).state.intent.time, '19:00', 'COMPASS handled the turn');
  bridge.close();
});

test('WebSocket endpoint closes with 4503 when Boson is not configured (browser falls back)', async () => {
  const { runtime } = makeRuntime();
  const http = createServer();
  attachVoiceServer(http, { runtime, config: { boson: { apiKey: '' } }, logger: { error() {} } });
  await new Promise((r) => http.listen(0, '127.0.0.1', r));
  const ws = new WebSocket(`ws://127.0.0.1:${http.address().port}/api/voice/realtime`);
  const msgs = [];
  ws.on('message', (d) => msgs.push(JSON.parse(d.toString())));
  const code = await new Promise((r) => ws.on('close', (c) => r(c)));
  http.close();
  assert.equal(code, 4503);
  assert.equal(msgs[0].code, 'boson_not_configured');
});

test('WebSocket endpoint rejects cross-origin browsers', async () => {
  const { runtime } = makeRuntime();
  const http = createServer();
  attachVoiceServer(http, { runtime, config: { boson: { apiKey: 'x' } }, connectUpstream: async () => fakeUpstream(), logger: { error() {} } });
  await new Promise((r) => http.listen(0, '127.0.0.1', r));
  const ws = new WebSocket(`ws://127.0.0.1:${http.address().port}/api/voice/realtime`, { headers: { Origin: 'https://evil.example' } });
  const err = await new Promise((r) => { ws.on('error', () => r('rejected')); ws.on('open', () => r('opened')); });
  http.close();
  assert.equal(err, 'rejected');
});
