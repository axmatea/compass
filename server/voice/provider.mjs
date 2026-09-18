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
 * Boson / Higgs placeholder. Intentionally NOT implemented: the official realtime
 * API contract has not been verified yet (COMPASS_MASTER risk #1). Do not add
 * endpoints, message formats or model names here until they are confirmed from
 * current official Boson documentation.
 */
export function createBosonVoiceProvider({ apiKey }) {
  const notReady = () => { throw Object.assign(new Error('Boson provider not implemented: contract unverified'), { code: 'not_implemented' }); };
  return {
    name: 'boson',
    where: 'server',
    capabilities: { stt: null, tts: null, realtime: null, bargeIn: null, streamingTts: null, languages: [] },
    status: () => ({ configured: Boolean(apiKey), verifiedContract: false, note: 'Awaiting verified Higgs realtime API contract.' }),
    synthesize: notReady,
    transcribe: notReady,
    openRealtime: notReady,
  };
}

export function createVoiceRegistry(config) {
  const providers = [createBrowserVoiceProvider(), createBosonVoiceProvider(config.boson)];
  const byName = new Map(providers.map((p) => [p.name, p]));
  const requested = byName.get(config.voiceProvider);
  // Fall back to browser unless the requested provider is configured AND verified.
  const active = requested && requested.status().configured && requested.status().verifiedContract ? requested : byName.get('browser');
  return {
    activeName: active.name,
    active,
    get: (n) => byName.get(n) || null,
    list: () => providers.map((p) => ({ name: p.name, where: p.where, capabilities: p.capabilities, ...p.status() })),
  };
}
