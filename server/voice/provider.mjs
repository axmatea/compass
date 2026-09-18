// Voice provider abstraction. The agent core never talks to a voice vendor directly.
//
// VoiceProvider {
//   name: string
//   capabilities: { stt, tts, realtime, bargeIn, streamingTts, languages[] }
//   where: 'browser' | 'server'           // browser = runs client-side, server only reports it
//   status(): { configured: boolean, verifiedContract: boolean, note?: string }
//   synthesize?(text, { signal, voice, lang }) -> AsyncIterable<Uint8Array>   // server-side TTS
//   transcribe?(audio, { signal, lang }) -> Promise<{ text, final }>            // server-side STT
//   openRealtime?({ signal, onEvent }) -> { sendAudio(chunk), interrupt(), close() }
// }
//
// Barge-in contract with the agent core: when the provider detects user speech while
// the assistant speaks, the client stops playback and sends the new utterance to
// POST /api/turn. The runtime then patches state and invalidates dependent actions.

export function createBrowserVoiceProvider() {
  return {
    name: 'browser',
    where: 'browser',
    capabilities: { stt: true, tts: true, realtime: false, bargeIn: true, streamingTts: false, languages: ['browser-dependent'] },
    status: () => ({ configured: true, verifiedContract: true, note: 'Web Speech API in the browser; no server audio.' }),
  };
}

/**
 * Boson Higgs Realtime (contract verified from official docs 2026-09-18, COMPASS_MASTER §18).
 * Runs server-side as a relay (server/voice/realtime-bridge.mjs); the browser never sees the key.
 * liveVerified stays false until scripts/boson-smoke.mjs passes with a real BOSON_API_KEY.
 */
export function createBosonVoiceProvider({ apiKey, voice = 'default', turnDetection = 'semantic_vad' }) {
  return {
    name: 'boson',
    where: 'server',
    endpoint: '/api/voice/realtime',
    capabilities: { stt: true, tts: true, realtime: true, bargeIn: true, streamingTts: true, languages: ['100+ (auto-detected)'] },
    status: () => ({ configured: Boolean(apiKey), verifiedContract: true, liveVerified: false, voice, turnDetection, note: 'WebSocket relay to wss://api.boson.ai/v1/realtime (higgs-realtime); reasoning stays on Nebius via compass_turn.' }),
  };
}

export function createVoiceRegistry(config) {
  const providers = [createBrowserVoiceProvider(), createBosonVoiceProvider(config.boson)];
  const byName = new Map(providers.map((p) => [p.name, p]));
  // Priority: Boson realtime -> browser speech fallback.
  const boson = byName.get('boson');
  const active = config.voiceProvider !== 'browser' && boson.status().configured ? boson : byName.get('browser');
  return {
    activeName: active.name,
    fallback: 'browser',
    active,
    get: (n) => byName.get(n) || null,
    list: () => providers.map((p) => ({ name: p.name, where: p.where, capabilities: p.capabilities, ...p.status() })),
  };
}
