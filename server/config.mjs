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
    },
    voiceProvider: env.VOICE_PROVIDER || 'browser',
  };
}

/** Safe description of config for logs/health: presence flags only. */
export function describeConfig(cfg) {
  return {
    nebius: { configured: Boolean(cfg.nebius.apiKey), model: cfg.nebius.model },
    boson: { configured: Boolean(cfg.boson.apiKey) },
    voiceProvider: cfg.voiceProvider,
  };
}
