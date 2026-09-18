/**
 * COMPASS /api/turn contract v1 (COMPASS_MASTER §15, frozen 2026-09-18; backend implementation wins).
 * Mirrors feat/agent-core server/state/intent.mjs + server/agent/runtime.mjs. No frontend-only schema.
 *
 *   POST /api/turn {sessionId?, text}
 *     Accept: application/json  -> TurnResponse
 *     Accept: text/event-stream -> one SSE event per AgentEvent, then `event: result` (TurnResponse without events)
 */

export type OrbState = 'idle' | 'listening' | 'thinking' | 'acting' | 'speaking' | 'interrupted' | 'replanning'

export type FieldName = 'task' | 'date' | 'time' | 'location' | 'cuisine' | 'party_size'
export type FieldValue = string | number | null
/** intent.time is 24h "HH:MM". Formatting happens only at render. */
export type Intent = Record<FieldName, FieldValue>

export interface PatchOp {
  field: FieldName
  from: FieldValue
  to: FieldValue
  status: 'active' | 'kept'
  change?: 'added' | 'updated' | 'removed'
}

export type StateStatus = 'idle' | 'thinking' | 'acting' | 'ready' | 'error'
export type ActionStatus = 'pending' | 'running' | 'done' | 'invalidated' | 'failed'

export interface RestaurantResult { name: string; area: string | null; availableAt: FieldValue; distanceKm: number }
export interface SearchResult { mock?: boolean; query: Record<string, FieldValue>; results: RestaurantResult[] }

export interface Action {
  id: string
  tool: string
  args: Record<string, FieldValue>
  dependsOn: string[]
  status: ActionStatus
  basedOnVersion: number
  turnId?: string
  result?: SearchResult
  error?: string
  invalidatedBy?: { version: number; fields: string[] }
}

export interface HistoryEntry { version: number; turnId: string; text: string; patch: PatchOp[] }

export interface AgentState {
  sessionId: string
  version: number
  status: StateStatus
  intent: Intent
  actions: Action[]
  history: HistoryEntry[]
  updatedAt: string
}

export interface ToolResult { actionId: string; tool: string; mock: boolean; result: SearchResult }

interface EventBase { sessionId: string; version: number; at: string; turnId?: string }
export type AgentEvent = EventBase & (
  | { type: 'reasoning_status'; stage: 'interpreting' | 'waiting_for_fields' | 'reusing_action' | 'superseded' | string; text?: string; tool?: string; missing?: string[]; actionId?: string }
  | { type: 'state_patch'; patch: PatchOp[]; changed: FieldName[]; rejected: unknown[]; intent: Intent; latencyMs?: number }
  | { type: 'action_invalidated'; actionId: string; tool: string; previousStatus: ActionStatus; changedFields: FieldName[]; reason: string }
  | { type: 'tool_call'; actionId: string; tool: string; args: Record<string, FieldValue>; mock?: boolean }
  | { type: 'tool_result'; actionId: string; tool: string; result: SearchResult; mock?: boolean }
  | { type: 'say'; text: string; final: boolean }
  | { type: 'done'; superseded?: boolean }
  | { type: 'error'; code: string; message: string; actionId?: string; tool?: string }
)

export interface TurnRequest { sessionId?: string; text: string }
export interface TurnResponse {
  sessionId: string
  turnId: string
  state: AgentState
  patch: PatchOp[]
  reply: string | null
  toolResult: ToolResult | null
  superseded?: boolean
  events?: AgentEvent[]
  error?: string
}

export interface Turn { id: string; who: 'user' | 'compass'; text: string; interrupted?: boolean }
