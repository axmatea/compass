import type { AgentState, FieldView, Intent, PatchOp, TurnResponse } from './types'

export const FIELD_ORDER = ['task', 'date', 'time', 'cuisine', 'location']
const LABELS: Record<string, string> = { task: 'Plan', date: 'When', time: 'Time', cuisine: 'Cuisine', location: 'Near' }

export const labelFor = (key: string) => LABELS[key] ?? key.replace(/[_-]+/g, ' ').replace(/^\w/, c => c.toUpperCase())

const norm = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null)

/** Accepts { ops: [...] }, a bare op array, or a JSON-merge-style object ({ time: '8:00 PM' } or { intent: {...} }). */
export function normalizePatch(patch: TurnResponse['patch'], prev: Intent): PatchOp[] {
  if (!patch) return []
  if (Array.isArray(patch)) return patch as PatchOp[]
  const obj = patch as Record<string, unknown>
  if (Array.isArray(obj.ops)) return obj.ops as PatchOp[]
  const merge = (obj.intent && typeof obj.intent === 'object' ? obj.intent : obj) as Record<string, unknown>
  return Object.entries(merge).map(([field, to]) => {
    const from = norm(prev[field]); const next = norm(to)
    return { field, from, to: next, status: from === null ? 'added' : next === null ? 'removed' : from === next ? 'kept' : 'changed' }
  })
}

/** The next intent is taken from state when present, else derived by applying the patch. */
export function nextIntent(res: TurnResponse, prev: Intent): Intent {
  if (res.state?.intent && typeof res.state.intent === 'object') return res.state.intent
  const out: Intent = { ...prev }
  for (const op of normalizePatch(res.patch, prev)) out[op.field] = op.to
  return out
}

/** Diff previous vs next intent into renderable slots. State is authoritative; patch only fills gaps. */
export function diffFields(prev: Intent | null, next: Intent): FieldView[] {
  const keys = [...FIELD_ORDER, ...Object.keys(next).filter(k => !FIELD_ORDER.includes(k))]
  return keys.map(key => {
    const before = prev ? norm(prev[key]) : null
    const after = norm(next[key])
    let status: FieldView['status']
    if (!prev) status = after ? 'new' : 'empty'
    else if (before === after) status = after ? 'kept' : 'empty'
    else if (before === null) status = 'added'
    else if (after === null) status = 'removed'
    else status = 'changed'
    return { key, label: labelFor(key), value: after, previous: status === 'changed' || status === 'removed' ? before : null, status }
  })
}

export const hasRevision = (fields: FieldView[]) => fields.some(f => f.status === 'changed' || f.status === 'added' || f.status === 'removed')
export const emptyState = (): AgentState => ({ intent: {}, status: 'planning', version: 0, history: [] })
