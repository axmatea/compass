// GLM-5.3 intent interpreter: state + utterance -> { set, unset, tool, reply }.
import { parseJsonLoose, LlmError } from '../llm/nebius.mjs';
import { FIELDS } from '../state/intent.mjs';

export function buildSystemPrompt(tools) {
  const toolLines = tools.length ? tools.map((t) => `- ${t.name}: ${t.description} (needs: ${t.requires.join(', ') || 'nothing'})`).join('\n') : '- none';
  return `You are the intent interpreter of COMPASS, a voice assistant that keeps a structured intent state and adapts while acting.
Given CURRENT_STATE and the user's latest UTTERANCE, return ONLY a JSON object:
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
- "reply": one short spoken sentence, max 14 words, acknowledging what changed. Never claim a booking or message was completed.`;
}

export function validateInterpretation(obj) {
  const out = { set: {}, unset: [], tool: null, reply: '' };
  if (obj && typeof obj.set === 'object' && !Array.isArray(obj.set)) {
    for (const [k, v] of Object.entries(obj.set)) if (FIELDS.includes(k)) out.set[k] = v;
  }
  if (Array.isArray(obj?.unset)) out.unset = obj.unset.filter((f) => FIELDS.includes(f));
  if (typeof obj?.tool === 'string' && obj.tool.trim()) out.tool = obj.tool.trim();
  if (typeof obj?.reply === 'string') out.reply = obj.reply.trim().slice(0, 240);
  return out;
}

export function createGlmInterpreter(llm, { maxTokens = 300 } = {}) {
  return {
    async interpret({ state, text, tools, signal }) {
      const r = await llm.chat({
        messages: [
          { role: 'system', content: buildSystemPrompt(tools) },
          { role: 'user', content: JSON.stringify({ CURRENT_STATE: state.intent, UTTERANCE: text }) },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0,
        maxTokens,
        signal,
      });
      if (!r.message?.content) throw new LlmError('Empty model output', { code: 'parse' });
      return { ...validateInterpretation(parseJsonLoose(r.message.content)), latencyMs: r.latencyMs };
    },
  };
}
