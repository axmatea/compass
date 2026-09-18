/**
 * COMPASS turn contract (frozen, shared with BACKEND):
 *   POST /api/turn  { sessionId, text }  ->  { state, patch, reply, toolResult }
 * The local mock (mockBackend.ts) returns exactly this shape, so switching
 * mock -> real backend is a transport flag, not a UI change.
 */

export type OrbState = 'idle' | 'listening' | 'thinking' | 'acting' | 'speaking' | 'interrupted' | 'replanning'

/** Known intent slots. Backend may add more keys; the UI renders unknown keys generically. */
export type IntentField = 'task' | 'date' | 'time' | 'cuisine' | 'location'
export type Intent = Partial<Record<IntentField, string | null>> & Record<string, string | null | undefined>

export type PatchStatus = 'added' | 'changed' | 'removed' | 'kept'
/** One slot change. Shape agreed with VIDEO/BACKEND: { field, from, to, status }. */
export interface PatchOp { field: string; from: string | null; to: string | null; status: PatchStatus }
export interface TurnPatch { ops: PatchOp[] }

export interface HistoryEntry { turn: number; field: string; from: string | null; to: string | null }

export interface AgentState {
  intent: Intent
  status?: 'planning' | 'acting' | 'done' | 'needs_input'
  version?: number
  history?: HistoryEntry[]
}

export interface ToolItem { title: string; subtitle?: string; meta?: string }
export interface ToolDraft { title: string; when: string; where?: string; note?: string }
export interface ToolResult {
  tool: string
  status: 'ok' | 'error'
  summary: string
  items?: ToolItem[]
  draft?: ToolDraft
  mock?: boolean
}

export interface TurnRequest { sessionId: string; text: string }
export interface TurnResponse {
  state: AgentState
  patch: TurnPatch | PatchOp[] | Record<string, unknown>
  reply: string
  toolResult: ToolResult | null
}

export type FieldStatus = 'empty' | 'new' | 'kept' | 'changed' | 'added' | 'removed'
export interface FieldView { key: string; label: string; value: string | null; previous: string | null; status: FieldStatus }

export interface Turn { id: number; who: 'user' | 'compass'; text: string; interrupted?: boolean }
