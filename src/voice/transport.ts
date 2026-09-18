/**
 * Turn transport. Identical contract (v1) for both modes; the UI never branches on mode.
 *   mock (default): replay of the recorded backend session (mockBackend.ts).
 *   live: POST /api/turn with Accept: text/event-stream on the same origin. Keys stay server-side.
 * Switch: ?backend=live in the URL, or VITE_COMPASS_BACKEND=live at build time.
 * VITE_COMPASS_API_URL overrides the endpoint (default /api/turn).
 * If live is unreachable (network error or non-2xx before any event), the turn falls back to mock and is flagged.
 */
import { mockTurn, resetMockSession } from './mockBackend'
import type { AgentEvent, TurnRequest, TurnResponse } from './types'

export type TransportMode = 'mock' | 'live'
export interface SendOptions { onEvent: (e: AgentEvent) => void; signal?: AbortSignal }
export interface TurnTransport {
  readonly mode: TransportMode
  send(req: TurnRequest, opts: SendOptions): Promise<TurnResponse & { servedBy: TransportMode }>
  reset(): void
}

type ViteEnv = { env?: Record<string, string | undefined> }
const env = (import.meta as ImportMeta & ViteEnv).env ?? {}

export function resolveMode(): TransportMode {
  const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('backend') : null
  const v = (q ?? env.VITE_COMPASS_BACKEND ?? 'mock').toLowerCase()
  return v === 'live' ? 'live' : 'mock'
}

class Unreachable extends Error {}

async function sse(endpoint: string, req: TurnRequest, { onEvent, signal }: SendOptions): Promise<TurnResponse> {
  let res: Response
  try {
    res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(req), signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Unreachable((err as Error).message)
  }
  if (!res.ok || !res.body || !/event-stream/.test(res.headers.get('content-type') ?? '')) throw new Unreachable('HTTP ' + res.status)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let result: TurnResponse | null = null
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, sep); buf = buf.slice(sep + 2)
      let type = 'message'; const data: string[] = []
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) type = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
      }
      if (!data.length) continue
      const payload = JSON.parse(data.join('\n'))
      if (type === 'result') result = payload as TurnResponse
      else onEvent(payload as AgentEvent)
    }
  }
  if (!result) throw new Error('Stream ended without result')
  return result
}

export function createTransport(mode: TransportMode = resolveMode(), endpoint = env.VITE_COMPASS_API_URL ?? '/api/turn'): TurnTransport {
  return {
    mode,
    async send(req, opts) {
      if (mode === 'mock') return { ...(await mockTurn(req, opts.onEvent, opts.signal)), servedBy: 'mock' }
      try {
        return { ...(await sse(endpoint, req, opts)), servedBy: 'live' }
      } catch (err) {
        if (!(err instanceof Unreachable)) throw err
        console.warn('[compass] /api/turn unreachable, using recorded mock:', err.message)
        return { ...(await mockTurn(req, opts.onEvent, opts.signal)), servedBy: 'mock' }
      }
    },
    reset() { resetMockSession() },
  }
}
