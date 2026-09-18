// Server-side configuration. Secrets are read from process.env only and are
// never logged, serialized, or sent to the browser.
export function loadConfig(env = process.env) {
  return {
    nebius: {
      apiKey: env.NEBIUS_API_KEY || '',
      baseUrl: (env.NEBIUS_BASE_URL || 'https://api.tokenfactory.us-north1.nebius.com/v1/').replace(/\/?$/, '/'),
      model: env.NEBIUS_MODEL || 'zai-org/GLM-5.3',
      timeoutMs: Number(env.NEBIUS_TIMEOUT_MS || 20000),
      thinking: env.NEBIUS_THINKING === 'on',
    },
    boson: {
      apiKey: env.BOSON_API_KEY || '',
      // Voice is a product decision: set from the audition (scripts/boson-voice-audition.mjs).
      // Chosen by audition 2026-09-18 (nora: 160 Hz, 4.1 st pitch SD, 154 wpm). See COMPASS_MASTER §18.
      voice: env.BOSON_VOICE || 'nora',
      turnDetection: env.BOSON_TURN_DETECTION === 'server_vad' ? 'server_vad' : 'semantic_vad',
      realtimeUrl: env.BOSON_REALTIME_URL || 'wss://api.boson.ai/v1/realtime?model=higgs-realtime',
    },
    // auto (default): Boson realtime when BOSON_API_KEY is set, else browser speech. 'browser' forces fallback.
    voiceProvider: env.VOICE_PROVIDER === 'browser' ? 'browser' : 'auto',
  };
}

/** Safe description of config for logs/health: presence flags only. */
export function describeConfig(cfg) {
  return {
    nebius: { configured: Boolean(cfg.nebius.apiKey), model: cfg.nebius.model },
    boson: { configured: Boolean(cfg.boson.apiKey), voice: cfg.boson.voice, turnDetection: cfg.boson.turnDetection },
    voiceProvider: cfg.voiceProvider,
  };
}
