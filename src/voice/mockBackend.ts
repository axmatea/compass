/**
 * Local mock of POST /api/turn. Same request/response contract as the real backend.
 * Deterministic parsing, no network, no keys. Results are labelled mock in the UI.
 */
import type { AgentState, Intent, PatchOp, ToolResult, TurnRequest, TurnResponse } from './types'

const sessions = new Map<string, AgentState>()

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }
const CUISINES = ['italian', 'japanese', 'sushi', 'mexican', 'thai', 'french', 'indian', 'chinese', 'korean', 'mediterranean', 'vietnamese', 'greek', 'spanish', 'vegan', 'steakhouse']
const TASKS: Record<string, string> = { dinner: 'Dinner', lunch: 'Lunch', breakfast: 'Breakfast', brunch: 'Brunch', drinks: 'Drinks', coffee: 'Coffee' }
const DAYS = ['today', 'tonight', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const title = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

function parseTime(text: string, task: string | null | undefined): string | null {
  const t = text.toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g, w => String(NUMBER_WORDS[w]))
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|o'?clock)?(?=\W|$)/g)
  if (!m) return null
  for (const raw of m) {
    const mm = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/)
    if (!mm) continue
    const hour = Number(mm[1]); const min = mm[2] ?? '00'; const ap = mm[3]
    if (hour < 1 || hour > 12) continue
    const context = new RegExp('(at|make it|to|for|by|around|move it to|change it to|push it to)\\s+' + raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(t)
    if (!ap && !context) continue
    const morning = ap ? ap.startsWith('a') : task === 'Breakfast' || task === 'Coffee' ? hour >= 6 : false
    return `${hour}:${min} ${morning ? 'AM' : 'PM'}`
  }
  return null
}

function parseLocation(text: string): string | null {
  const m = text.match(/\b(?:near|around|close to|in|by)\s+((?!the\b|a\b|an\b|me\b)[a-z][a-z'.-]*(?:\s+(?!and\b|at\b|for\b|with\b|tomorrow\b|tonight\b)[a-z][a-z'.-]*){0,2})/i)
  if (!m) return null
  const place = m[1].replace(/[.,!?]+$/, '').trim()
  if (/^(the|a|an|me|my|here|there|italian|dinner)$/i.test(place)) return null
  return title(place)
}

export function parseIntent(text: string, prev: Intent): Intent {
  const lower = text.toLowerCase()
  const next: Intent = { ...prev }
  const taskWord = Object.keys(TASKS).find(k => new RegExp(`\\b${k}\\b`).test(lower))
  if (taskWord) next.task = TASKS[taskWord]
  const day = DAYS.find(d => new RegExp(`\\b${d}\\b`).test(lower))
  if (day) next.date = day === 'tonight' ? 'Tonight' : title(day)
  const time = parseTime(text, next.task)
  if (time) next.time = time
  const cuisine = CUISINES.find(c => new RegExp(`\\b${c}\\b`).test(lower))
  if (cuisine) next.cuisine = cuisine === 'sushi' ? 'Japanese' : title(cuisine)
  const loc = parseLocation(text)
  if (loc) next.location = loc
  for (const k of ['task', 'date', 'time', 'cuisine', 'location']) if (!(k in next)) next[k] = null
  return next
}

const MOCK_PLACES = ['Osteria Lucia', 'Trattoria del Ponte', 'Vino & Farina', 'Casa Nonna', 'Forno Rosso']

function search(intent: Intent): ToolResult {
  const where = intent.location ?? 'near you'
  const cuisine = intent.cuisine ?? 'Any cuisine'
  const offset = intent.location ? 1 : 0
  const items = MOCK_PLACES.slice(offset, offset + 3).map((name, i) => ({
    title: name,
    subtitle: `${cuisine} · ${intent.location ?? 'Nearby'}`,
    meta: `Table for 2 · ${intent.time ?? 'any time'}${i === 0 ? ' · best match' : ''}`,
  }))
  return {
    tool: 'restaurant_search',
    status: 'ok',
    summary: `3 ${cuisine.toLowerCase()} places ${intent.location ? 'near ' + where : where}${intent.time ? ' with a table at ' + intent.time : ''}`,
    items,
    draft: { title: `${intent.task ?? 'Plan'} at ${items[0].title}`, when: [intent.date, intent.time].filter(Boolean).join(' · ') || 'Time not set', where: intent.location ?? undefined, note: 'Draft, not sent' },
    mock: true,
  }
}

function reply(ops: PatchOp[], intent: Intent, first: boolean): string {
  if (first) {
    const parts = [intent.task, intent.date?.toLowerCase(), intent.time && 'at ' + intent.time].filter(Boolean).join(' ')
    return `${parts.charAt(0).toUpperCase() + parts.slice(1)}${intent.cuisine ? ', ' + intent.cuisine : ''}. I found three places with a table${intent.time ? ' at ' + intent.time : ''}.`
  }
  const bits: string[] = []
  for (const op of ops) {
    if (op.status === 'changed' && op.field === 'time') bits.push(`Moved to ${op.to}`)
    else if (op.status === 'changed') bits.push(`Switched to ${op.to}`)
    else if (op.status === 'added' && op.field === 'location') bits.push(`narrowed to ${op.to}`)
    else if (op.status === 'added') bits.push(`added ${op.to}`)
  }
  if (!bits.length) return 'Still on it. Nothing in the plan changed.'
  const kept = ['task', 'date', 'cuisine'].filter(k => intent[k] && !ops.some(o => o.field === k)).map(k => (k === 'cuisine' ? String(intent[k]) : String(intent[k]).toLowerCase()))
  const s = bits.join(', ')
  const t = intent.time ? ' at ' + intent.time : ''
  return `${s.charAt(0).toUpperCase() + s.slice(1)}. Kept ${kept.join(', ') || 'the rest'}. Three new options with a table${t}.`
}

export async function mockTurn(req: TurnRequest, signal?: AbortSignal): Promise<TurnResponse> {
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 520 + Math.random() * 260)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
  const prev = sessions.get(req.sessionId) ?? { intent: {}, status: 'planning', version: 0, history: [] }
  const first = !prev.version
  const intent = parseIntent(req.text, prev.intent)
  const ops: PatchOp[] = Object.keys(intent)
    .map(field => {
      const from = prev.intent[field] ?? null; const to = intent[field] ?? null
      const status: PatchOp['status'] = from === to ? 'kept' : from === null ? 'added' : to === null ? 'removed' : 'changed'
      return { field, from, to, status }
    })
    .filter(op => op.to !== null || op.from !== null)
  const changed = ops.filter(op => op.status !== 'kept')
  const understood = Boolean(intent.task || intent.cuisine || intent.time)
  if (!understood) {
    return { state: prev, patch: { ops: [] }, reply: 'I can plan a meal out. Try: schedule dinner tomorrow at 7 and find an Italian restaurant.', toolResult: null }
  }
  const version = (prev.version ?? 0) + 1
  const state: AgentState = {
    intent, status: 'acting', version,
    history: [...(prev.history ?? []), ...changed.filter(op => op.from !== null).map(op => ({ turn: version, field: op.field, from: op.from, to: op.to }))],
  }
  sessions.set(req.sessionId, state)
  return { state, patch: { ops }, reply: reply(changed, intent, first), toolResult: changed.length || first ? search(intent) : null }
}

export function resetMockSession(sessionId: string) { sessions.delete(sessionId) }
