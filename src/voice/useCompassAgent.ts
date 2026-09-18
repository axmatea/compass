/**
 * COMPASS agent UI state = pure function of the v1 event stream (+ local voice I/O).
 * No schema translation: patch ops, action statuses and intent are rendered as the backend sends them.
 * Events can arrive twice (an open turn stream also carries later turns' events), so they are deduplicated.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createListener, createSpeaker, isEcho, recognitionSupported } from './speech'
import type { Listener } from './speech'
import { createTransport } from './transport'
import type { TransportMode } from './transport'
import type { AgentEvent, FieldName, Intent, OrbState, PatchOp, SearchResult, Turn } from './types'
import { t } from './i18n'

export interface ActionView {
  id: string
  tool: string
  args: Record<string, unknown>
  status: 'running' | 'done' | 'invalidated' | 'failed'
  changedFields?: FieldName[]
  result?: SearchResult
  mock?: boolean
  run: number
}
export interface PlanView { intent: Intent; patch: PatchOp[]; version: number; revision: boolean }

const BUSY: OrbState[] = ['thinking', 'acting', 'speaking', 'replanning']
export const isBusy = (s: OrbState) => BUSY.includes(s)
const T = { interruptFlare: 460, replanHold: 1300, msPerWord: 330, holdMax: 4000 }
const eventKey = (e: AgentEvent) => [e.type, e.turnId, 'actionId' in e ? e.actionId : '', e.at, 'stage' in e ? e.stage : '', 'text' in e ? e.text : ''].join('|')

export function useCompassAgent() {
  const transport = useMemo(() => createTransport(), [])
  const speaker = useMemo(() => createSpeaker(), [])

  const [plan, setPlan] = useState<PlanView | null>(null)
  const [actions, setActions] = useState<ActionView[]>([])
  const [thinking, setThinking] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [interrupted, setInterrupted] = useState(false)
  const [replanning, setReplanning] = useState(false)
  const [holding, setHolding] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [interim, setInterim] = useState('')
  const [caption, setCaption] = useState<{ text: string; key: number; msPerWord: number } | null>(null)
  const [servedBy, setServedBy] = useState<TransportMode | null>(null)
  const modeRef = useRef<TransportMode | null>(null)
  const [micOn, setMicOn] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [notice, setNotice] = useState('')
  const [micSupported, setMicSupported] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [revisions, setRevisions] = useState(0)

  const seen = useRef(new Set<string>())
  const sessionRef = useRef<string | undefined>(undefined)
  const sessionWaiters = useRef<((id: string) => void)[]>([])
  const inflight = useRef(0)
  const epoch = useRef(0)
  const speakingText = useRef<string | null>(null)
  const echoRef = useRef<string | null>(null)
  const echoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const simTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const voiceOnRef = useRef(true)
  const micOnRef = useRef(false)
  const orbRef = useRef<OrbState>('idle')
  const listenerRef = useRef<Listener | null>(null)
  const counter = useRef(0)
  const nextKey = () => ++counter.current
  const later = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); timers.current.push(t) }

  const hasRunning = actions.some(a => a.status === 'running')
  const orb: OrbState = interrupted ? 'interrupted' : replanning ? 'replanning' : speaking ? 'speaking' : thinking ? 'thinking' : hasRunning ? 'acting' : micOn ? 'listening' : interim ? 'listening' : 'idle'
  orbRef.current = orb

  useEffect(() => {
    setMicSupported(recognitionSupported())
    setVoiceSupported(speaker.supported())
    void transport.ready().then(m => { modeRef.current = m; setServedBy(m) })
    return () => { speaker.stop(); listenerRef.current?.stop(); timers.current.forEach(clearTimeout) }
  }, [speaker, transport])
  useEffect(() => { voiceOnRef.current = voiceOn; if (!voiceOn) speaker.stop() }, [voiceOn, speaker])

  /* ---------- voice out ---------- */
  const stopSpeech = useCallback((markCut: boolean) => {
    const was = speakingText.current
    speakingText.current = null
    if (simTimer.current) clearTimeout(simTimer.current)
    speaker.stop()
    setSpeaking(false); setCaption(null)
    if (markCut && was) setTurns(t => { const i = t.map(x => x.who === 'compass' && x.text === was).lastIndexOf(true); return i < 0 ? t : t.map((x, j) => (j === i ? { ...x, interrupted: true } : x)) })
  }, [speaker])

  const say = useCallback((text: string) => {
    stopSpeech(false)
    const myEpoch = epoch.current
    speakingText.current = text
    if (echoTimer.current) clearTimeout(echoTimer.current)
    echoRef.current = text
    setCaption({ text, key: nextKey(), msPerWord: T.msPerWord })
    setSpeaking(true)
    const finish = () => {
      if (speakingText.current !== text || epoch.current !== myEpoch) return
      speakingText.current = null; setSpeaking(false)
      echoTimer.current = setTimeout(() => { echoRef.current = null }, 1800)
    }
    if (voiceOnRef.current && speaker.supported()) speaker.speak(text, { onState: s => { if (s === 'ended' || s === 'unavailable') finish() } })
    else simTimer.current = setTimeout(finish, Math.max(1400, text.split(/\s+/).length * T.msPerWord))
  }, [speaker, stopSpeech])

  /* ---------- event reducer ---------- */
  const onEvent = useCallback((e: AgentEvent, myEpoch: number) => {
    if (myEpoch !== epoch.current) return
    const k = eventKey(e)
    if (seen.current.has(k)) return
    seen.current.add(k)
    if (!sessionRef.current && e.sessionId) { sessionRef.current = e.sessionId; sessionWaiters.current.splice(0).forEach(w => w(e.sessionId)) }
    switch (e.type) {
      case 'reasoning_status':
        if (e.stage === 'interpreting') setThinking(true)
        break
      case 'state_patch': {
        setThinking(false); setHolding(false)
        const revision = e.patch.some(op => op.status === 'kept') && e.patch.some(op => op.status === 'active')
        setPlan({ intent: e.intent, patch: e.patch, version: e.version, revision })
        if (revision) { setRevisions(n => n + 1); setReplanning(true); later(() => setReplanning(false), T.replanHold) }
        break
      }
      case 'action_invalidated':
        setActions(list => list.map(a => (a.id === e.actionId ? { ...a, status: 'invalidated', changedFields: e.changedFields } : a)))
        break
      case 'tool_call':
        setActions(list => [...list.filter(a => a.id !== e.actionId), { id: e.actionId, tool: e.tool, args: e.args, status: 'running' as const, mock: e.mock, run: nextKey() }].slice(-3))
        break
      case 'tool_result':
        setActions(list => list.map(a => (a.id === e.actionId ? { ...a, status: 'done', result: e.result } : a)))
        break
      case 'say':
        setTurns(t => [...t, { id: 'c' + nextKey(), who: 'compass', text: e.text }])
        say(e.text)
        break
      case 'error':
        setThinking(false)
        if (e.actionId) setActions(list => list.map(a => (a.id === e.actionId && a.status === 'running' ? { ...a, status: 'failed' } : a)))
        setNotice(e.message)
        break
      case 'done':
        break
    }
  }, [say])

  const waitSession = () => (sessionRef.current || !inflight.current ? Promise.resolve(sessionRef.current) : new Promise<string>(r => sessionWaiters.current.push(r)))

  const send = useCallback(async (text: string) => {
    const myEpoch = epoch.current
    setTurns(t => [...t, { id: 'u' + nextKey(), who: 'user', text }])
    setInterim('')
    setThinking(true)
    const sessionId = await waitSession()
    inflight.current++
    try {
      const res = await transport.send({ sessionId, text }, { onEvent: e => onEvent(e, myEpoch) })
      if (myEpoch !== epoch.current) return
      if (!sessionRef.current) sessionRef.current = res.sessionId
      setServedBy(res.servedBy)
      if (res.servedBy === 'mock' && modeRef.current === 'live') setNotice(t.notice.unreachable)
    } catch (err) {
      if (myEpoch === epoch.current && (err as Error).name !== 'AbortError') { setNotice(t.notice.failed); setThinking(false) }
    } finally {
      inflight.current--
      if (!inflight.current && !sessionRef.current) sessionWaiters.current.splice(0).forEach(w => w(undefined as unknown as string))
    }
  }, [onEvent, transport])

  /** Barge-in: cut speech now, flare, send the new words immediately (the backend supersedes stale work). */
  const interrupt = useCallback((text?: string) => {
    stopSpeech(true)
    setInterrupted(true); setHolding(true)
    later(() => setInterrupted(false), T.interruptFlare)
    later(() => setHolding(false), T.holdMax)
    if (text) void send(text)
  }, [send, stopSpeech])

  const submit = useCallback((text: string) => {
    const clean = text.trim()
    if (!clean) return
    setNotice('')
    if (isBusy(orbRef.current)) interrupt(clean)
    else void send(clean)
  }, [interrupt, send])

  const toggleMic = useCallback(() => {
    if (micOnRef.current) { listenerRef.current?.stop(); return }
    const listener = createListener({
      onInterim: heard => {
        if (isEcho(heard, echoRef.current)) return
        if (isBusy(orbRef.current) && heard.split(/\s+/).length >= 2) { if (orbRef.current !== 'interrupted') interrupt() }
        setInterim(heard)
      },
      onFinal: heard => { if (isEcho(heard, echoRef.current)) { setInterim(''); return } submit(heard) },
      onError: msg => setNotice(msg),
      onEnd: () => { micOnRef.current = false; setMicOn(false); setInterim('') },
    })
    listenerRef.current = listener
    if (listener.start()) { micOnRef.current = true; setMicOn(true); setNotice(t.notice.listening) }
    else setNotice(t.notice.noVoice)
  }, [interrupt, submit])

  const reset = useCallback(() => {
    epoch.current++
    stopSpeech(false)
    timers.current.forEach(clearTimeout); timers.current = []
    transport.reset()
    seen.current.clear(); sessionRef.current = undefined; sessionWaiters.current = []
    setPlan(null); setActions([]); setTurns([]); setInterim(''); setNotice(''); setRevisions(0)
    setThinking(false); setInterrupted(false); setReplanning(false); setHolding(false)
  }, [stopSpeech, transport])

  return {
    orb, plan, actions, holding, turns, interim, caption, servedBy, revisions,
    micOn, micSupported, voiceOn, voiceSupported, notice,
    setVoiceOn, submit, interrupt, toggleMic, reset,
    hasPlan: Boolean(plan),
  }
}
