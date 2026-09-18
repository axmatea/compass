// Composition root for the COMPASS backend. Only this file wires config -> providers.
import { loadConfig, describeConfig } from './config.mjs';
import { createNebiusClient, LlmError } from './llm/nebius.mjs';
import { createGlmInterpreter } from './agent/interpreter.mjs';
import { createAgentRuntime } from './agent/runtime.mjs';
import { createToolRegistry } from './tools/registry.mjs';
import { createMockRestaurantSearch } from './tools/mock-restaurant-search.mjs';
import { createVoiceRegistry } from './voice/provider.mjs';
import { createApiHandler } from './api.mjs';
import { attachVoiceServer } from './voice/ws-server.mjs';

export function createCompassBackend({ env = process.env, interpreter, tools, connectUpstream, logger = console } = {}) {
  const config = loadConfig(env);
  const toolRegistry = tools || createToolRegistry([createMockRestaurantSearch({ delayMs: Number(env.MOCK_TOOL_DELAY_MS ?? 1500) })]);
  const interp = interpreter || (config.nebius.apiKey
    ? createGlmInterpreter(createNebiusClient(config.nebius))
    : { interpret: async () => { throw new LlmError('NEBIUS_API_KEY is not configured', { code: 'not_configured' }); } });
  const runtime = createAgentRuntime({ interpreter: interp, tools: toolRegistry });
  const voice = createVoiceRegistry(config);
  const health = () => ({ ...describeConfig(config), tools: toolRegistry.list().map((t) => ({ name: t.name, mock: t.mock })) });
  return {
    runtime,
    voice,
    handleApi: createApiHandler({ runtime, health, voice, logger }),
    /** Mount the realtime voice WebSocket on an http.Server (upgrade on /api/voice/realtime). */
    attachVoice: (httpServer) => attachVoiceServer(httpServer, { runtime, config, connectUpstream, logger }),
    config: describeConfig(config),
  };
}
