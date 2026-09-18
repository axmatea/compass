// GLM-5.3 intent interpreter: state + utterance -> { set, unset, tool, reply }.
import { parseJsonLoose, LlmError } from '../llm/nebius.mjs';
import { FIELDS } from '../state/intent.mjs';

/** Forced function call. Measured 2026-09-18: json_object mode echoed the old state
 * on corrections (4/4 wrong), function calling was correct 8/8 at ~360ms. */
export function buildIntentFunction(tools) {
  return {
    type: 'function',
    function: {
      name: 'update_intent',
      description: 'Record the intent update for this utterance.',
      parameters: {
        type: 'object',
        properties: {
          set: {
            type: 'object',
            description: 'Only fields newly provided or changed in this utterance.',
            properties: {
              task: { type: 'string' }, date: { type: 'string' },
              time: { type: 'string', description: '24h HH:MM' },
              location: { type: 'string' }, cuisine: { type: 'string' }, party_size: { type: 'integer' },
            },
            additionalProperties: false,
          },
          unset: { type: 'array', items: { type: 'string' } },
          tool: { type: ['string', 'null'], enum: [...tools.map((t) => t.name), null] },
          reply: { type: 'string' },
        },
        required: ['set', 'unset', 'tool', 'reply'],
      },
    },
  };
}

export function buildSystemPrompt(tools) {
  const toolLines = tools.length ? tools.map((t) => `- ${t.name}: ${t.description} (needs: ${t.requires.join(', ') || 'nothing'})`).join('\n') : '- none';
  return `You are the intent interpreter of COMPASS, a voice assistant that keeps a structured intent state and adapts while acting.
Given CURRENT_STATE and the user's latest UTTERANCE, call update_intent with:
{"set": {"<field>": <value>}, "unset": ["<field>"], "tool": "<tool name>" or null, "reply": "<string>"}
Fields:
- task: short lowercase verb phrase, e.g. "schedule dinner"
- date: as spoken, e.g. "tomorrow", or YYYY-MM-DD
- time: 24h HH:MM. A bare hour for dinner means PM ("7" -> "19:00")
- location: place name only, e.g. "Palo Alto"
- cuisine: one word, e.g. "Italian"
- party_size: integer
Rules:
- The utterance may start a new intent, correct it, or extend it.
- "set" contains ONLY fields the user newly provided or changed in THIS utterance. Never repeat unchanged fields. Never invent values.
- "actually", "make it", "instead", "change to" replace the old value.
- "unset" only if the user explicitly drops a detail.
- "tool": pick a tool only if the user's goal needs it now, else null.
Tools:
${toolLines}
- "reply": one short spoken sentence, max 14 words, acknowledging what changed. Never claim a booking or message was completed.
Always include all four keys. Example:
CURRENT_STATE {"task":"schedule dinner","time":"19:00","location":null,"cuisine":"Italian"}
UTTERANCE "no, 7:30, and somewhere in San Mateo"
OUTPUT {"set":{"time":"19:30","location":"San Mateo"},"unset":[],"tool":null,"reply":"Changed to 7:30 in San Mateo."}`;
}

export function validateInterpretation(obj) {
  const out = { set: {}, unset: [], tool: null, reply: '' };
  // Accept {set:{...}} (instructed) or a flat object of fields (observed GLM drift).
  const source = obj && typeof obj.set === 'object' && !Array.isArray(obj.set) ? obj.set : obj && typeof obj === 'object' ? obj : {};
  for (const [k, v] of Object.entries(source)) if (FIELDS.includes(k)) out.set[k] = v;
  if (Array.isArray(obj?.unset)) out.unset = obj.unset.filter((f) => FIELDS.includes(f));
  if (typeof obj?.tool === 'string' && obj.tool.trim() && !/^(none|null)$/i.test(obj.tool.trim())) out.tool = obj.tool.trim();
  if (typeof obj?.reply === 'string') out.reply = obj.reply.trim().slice(0, 240);
  return out;
}

export function createGlmInterpreter(llm, { maxTokens = 300, attemptTimeoutMs = 8000, retries = 1 } = {}) {
  async function once({ state, text, tools, signal }) {
      const attempt = AbortSignal.timeout(attemptTimeoutMs);
      const r = await llm.chat({
        messages: [
          { role: 'system', content: buildSystemPrompt(tools) },
          { role: 'user', content: JSON.stringify({ CURRENT_STATE: state.intent, UTTERANCE: text }) },
        ],
        tools: [buildIntentFunction(tools)],
        toolChoice: { type: 'function', function: { name: 'update_intent' } },
        temperature: 0,
        maxTokens,
        signal: signal ? AbortSignal.any([signal, attempt]) : attempt,
      }).catch((err) => {
        // Per-attempt timeout surfaces as 'aborted' from the client; relabel it.
        if (err.code === 'aborted' && attempt.aborted && !signal?.aborted) err.code = 'timeout';
        throw err;
      });
      const call = r.message?.tool_calls?.find((c) => c.function?.name === 'update_intent');
      const raw = call?.function?.arguments ?? r.message?.content;
      if (!raw) throw new LlmError('Model returned no update_intent call', { code: 'parse' });
      const parsed = typeof raw === 'string' ? parseJsonLoose(raw) : raw;
      return { ...validateInterpretation(parsed), latencyMs: r.latencyMs };
  }

  return {
    async interpret(input) {
      let lastErr;
      for (let i = 0; i <= retries; i++) {
        try {
          const out = await once(input);
          return i ? { ...out, retried: i } : out;
        } catch (err) {
          lastErr = err;
          // Retry transient failures only; never retry a user/turn cancellation.
          if (input.signal?.aborted || !['timeout', 'network', 'parse', 'http'].includes(err.code) || (err.code === 'http' && err.status < 500 && err.status !== 429)) break;
        }
      }
      throw lastErr;
    },
  };
}
