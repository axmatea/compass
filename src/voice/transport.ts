/**
 * Turn transport. One function, two implementations, identical contract.
 *   mock (default): in-browser mockBackend, no network.
 *   live: POST /api/turn on the same origin (server.mjs, owned by BACKEND). Keys stay server-side.
 * Switch: ?backend=live in the URL, or VITE_COMPASS_BACKEND=live at build time.
 * Optional VITE_COMPASS_API_URL overrides the endpoint (default /api/turn).
 * If live fails at network/HTTP level, the demo falls back to mock and says so visibly.
 */
import { mockTurn, resetMockSession } from './mockBackend'
import type { TurnRequest, TurnResponse } from './types'

export type TransportMode = 'mock' | 'live'
export interface TurnTransport {
  readonly mode: TransportMode
  send(req: TurnRequest, signal?: AbortSignal): Promise<TurnResponse & { servedBy: TransportMode }>
  reset(sessionId: string): void
}

type ViteEnv = { env?: Record<string, string | undefined> }
const env = (import.meta as ImportMeta & ViteEnv).env ?? {}

export function resolveMode(): TransportMode {
  const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('backend') : null
  const v = (q ?? env.VITE_COMPASS_BACKEND ?? 'mock').toLowerCase()
  return v === 'live' || v === 'http' || v === 'real' ? 'live' : 'mock'
}

function isTurnResponse(x: unknown): x is TurnResponse {
  return Boolean(x) && typeof x === 'object' && 'reply' in (x as object) && 'state' in (x as object)
}

export function createTransport(mode: TransportMode = resolveMode(), endpoint = env.VITE_COMPASS_API_URL ?? '/api/turn'): TurnTransport {
  return {
    mode,
    async send(req, signal) {
      if (mode === 'mock') return { ...(await mockTurn(req, signal)), servedBy: 'mock' }
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req), signal })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const body: unknown = await res.json()
        if (!isTurnResponse(body)) throw new Error('Bad /api/turn shape')
        return { state: body.state, patch: body.patch ?? {}, reply: body.reply, toolResult: body.toolResult ?? null, servedBy: 'live' }
      } catch (err) {
        if ((err as Error).name === 'AbortError') throw err
        console.warn('[compass] /api/turn unavailable, using local mock:', (err as Error).message)
        return { ...(await mockTurn(req, signal)), servedBy: 'mock' }
      }
    },
    reset(sessionId) { resetMockSession(sessionId) },
  }
}
