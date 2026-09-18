import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { diffFields, hasRevision, nextIntent } from './intent'
import { createListener, createSpeaker, isEcho, recognitionSupported } from './speech'
import type { Listener } from './speech'
import { createTransport } from './transport'
import type { TransportMode } from './transport'
import type { FieldView, Intent, OrbState, ToolResult, Turn } from './types'

export type ToolPhase = 'idle' | 'running' | 'paused' | 'done'
export interface ToolView { phase: ToolPhase; result: ToolResult | null; run: number }
export interface ChangeEntry { id: number; field: string; from: string | null; to: string | null; status: FieldView['status'] }

const BUSY: OrbState[] = ['thinking', 'acting', 'speaking', 'replanning']
export const isBusy = (s: OrbState) => BUSY.includes(s)

/** Timings are tuned so a spoken interruption can land while COMPASS is visibly acting. */
const T = { interruptFlare: 460, build: 900, settle: 320, replan: 1350, acting: 2300, msPerWord: 330 }

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
}
const newSessionId = () => 'web-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const isAbort = (e: unknown) => (e as Error)?.name === 'AbortError'

export function useCompassAgent() {
  const transport = useMemo(() => createTransport(), [])
  const speaker = useMemo(() => createSpeaker(), [])
  const [orb, setOrbState] = useState<OrbState>('idle')
  const [fields, setFields] = useState<FieldView[]>([])
  const [revision, setRevision] = useState(0)
  const [replans, setReplans] = useState(0)
  const [turns, setTurns] = useState<Turn[]>([])
  const [interim, setInterim] = useState('')
  const [caption, setCaption] = useState<{ text: string; key: number; msPerWord: number } | null>(null)
  const [tool, setTool] = useState<ToolView>({ phase: 'idle', result: null, run: 0 })
  const [changes, setChanges] = useState<ChangeEntry[]>([])
  const [servedBy, setServedBy] = useState<TransportMode>(transport.mode)
  const [micOn, setMicOn] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [notice, setNotice] = useState('')
  const [micSupported, setMicSupported] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)

  const orbRef = useRef<OrbState>('idle')
  const intentRef = useRef<Intent | null>(null)
  const runRef = useRef<AbortController | null>(null)
  const sessionRef = useRef(newSessionId())
  const echoRef = useRef<string | null>(null)
  const echoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceOnRef = useRef(true)
  const micOnRef = useRef(false)
  const listenerRef = useRef<Listener | null>(null)
  const idCounter = useRef(0)
  const nextId = () => ++idCounter.current

  const setOrb = useCallback((s: OrbState) => { orbRef.current = s; setOrbState(s) }, [])
  const restState = () => (micOnRef.current ? 'listening' : 'idle') as OrbState

  useEffect(() => {
    setMicSupported(recognitionSupported())
    setVoiceSupported(speaker.supported())
    return () => { runRef.current?.abort(); speaker.stop(); listenerRef.current?.stop() }
  }, [speaker])

  useEffect(() => { voiceOnRef.current = voiceOn; if (!voiceOn) speaker.stop() }, [voiceOn, speaker])

  const speakReply = useCallback((text: string, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
    const words = text.split(/\s+/).filter(Boolean).length
    setCaption({ text, key: nextId(), msPerWord: T.msPerWord })
    if (echoTimer.current) clearTimeout(echoTimer.current)
    echoRef.current = text
    const done = () => { echoTimer.current = setTimeout(() => { echoRef.current = null }, 1800); resolve() }
    const onAbort = () => { speaker.stop(); echoRef.current = null; reject(new DOMException('Aborted', 'AbortError')) }
    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort, { once: true })
    if (voiceOnRef.current && speaker.supported()) {
      speaker.speak(text, { onState: s => { if (s === 'ended' || s === 'unavailable') { signal.removeEventListener('abort', onAbort); done() } } })
    } else {
      wait(Math.max(1500, words * T.msPerWord), signal).then(() => { signal.removeEventListener('abort', onAbort); done() }, () => {})
    }
  }), [speaker])

  const startTurn = useCallback(async (text: string) => {
    const clean = text.trim()
    if (!clean) return
    runRef.current?.abort()
    const ctrl = new AbortController(); runRef.current = ctrl
    const { signal } = ctrl
    setInterim('')
    setTurns(t => [...t, { id: nextId(), who: 'user', text: clean }])
    setOrb('thinking')
    try {
      const res = await transport.send({ sessionId: sessionRef.current, text: clean }, signal)
      if (signal.aborted) return
      setServedBy(res.servedBy)
      if (res.servedBy === 'mock' && transport.mode === 'live') setNotice('Backend unreachable. This turn used the local mock.')
      const prev = intentRef.current
      const next = nextIntent(res, prev ?? {})
      const view = diffFields(prev, next)
      const meaningful = view.some(f => f.value)
      if (meaningful) intentRef.current = next
      if (meaningful && prev && hasRevision(view)) {
        setOrb('replanning')
        setFields(view); setRevision(r => r + 1); setReplans(n => n + 1)
        setChanges(c => [...view.filter(f => f.status === 'changed' || f.status === 'added' || f.status === 'removed')
          .map(f => ({ id: nextId(), field: f.label, from: f.previous, to: f.value, status: f.status })), ...c].slice(0, 6))
        await wait(T.replan, signal)
      } else if (meaningful) {
        setFields(view); setRevision(r => r + 1)
        await wait(prev ? T.settle : T.build, signal)
      }
      if (res.toolResult) {
        setOrb('acting')
        setTool(t => ({ phase: 'running', result: res.toolResult, run: t.run + 1 }))
        await wait(T.acting, signal)
        setTool(t => ({ ...t, phase: 'done' }))
      }
      setOrb('speaking')
      setTurns(t => [...t, { id: nextId(), who: 'compass', text: res.reply }])
      await speakReply(res.reply, signal)
      if (runRef.current === ctrl) setOrb(restState())
    } catch (err) {
      if (isAbort(err)) return
      setNotice('That turn failed. Try again, or type it.')
      setOrb(restState())
    }
  }, [setOrb, speakReply, transport])

  /** Barge-in: stop speech, freeze the action, flare, then take the new words. */
  const interrupt = useCallback(async (text?: string) => {
    const wasSpeaking = orbRef.current === 'speaking'
    runRef.current?.abort()
    speaker.stop()
    const ctrl = new AbortController(); runRef.current = ctrl
    setTool(t => (t.phase === 'running' ? { ...t, phase: 'paused' } : t))
    setTurns(t => {
      const last = t[t.length - 1]
      return last && last.who === 'compass' && wasSpeaking ? [...t.slice(0, -1), { ...last, interrupted: true }] : t
    })
    setCaption(null)
    setOrb('interrupted')
    try { await wait(T.interruptFlare, ctrl.signal) } catch { return }
    if (text) void startTurn(text)
    else setOrb('listening')
  }, [speaker, setOrb, startTurn])

  const submit = useCallback((text: string) => {
    const clean = text.trim()
    if (!clean) return
    setNotice('')
    if (isBusy(orbRef.current)) void interrupt(clean)
    else void startTurn(clean)
  }, [interrupt, startTurn])

  const toggleMic = useCallback(() => {
    if (micOnRef.current) { listenerRef.current?.stop(); return }
    const listener = createListener({
      onInterim: heard => {
        const s = orbRef.current
        if (s === 'speaking' && isEcho(heard, echoRef.current)) return
        if (isBusy(s)) {
          if (heard.split(/\s+/).length >= 2 && !isEcho(heard, echoRef.current)) { setInterim(heard); void interrupt() }
          return
        }
        if (s === 'idle') setOrb('listening')
        setInterim(heard)
      },
      onFinal: heard => {
        if (isEcho(heard, echoRef.current)) { setInterim(''); return }
        submit(heard)
      },
      onError: msg => { setNotice(msg) },
      onEnd: () => {
        micOnRef.current = false; setMicOn(false); setInterim('')
        if (orbRef.current === 'listening') setOrb('idle')
      },
    })
    listenerRef.current = listener
    if (listener.start()) {
      micOnRef.current = true; setMicOn(true)
      if (!isBusy(orbRef.current)) setOrb('listening')
      setNotice('Listening. Talk over COMPASS any time to interrupt. Headphones give the cleanest barge-in.')
    } else setNotice('Voice input is not available in this browser. Type instead, or use the prepared lines.')
  }, [interrupt, setOrb, submit])

  const reset = useCallback(() => {
    runRef.current?.abort(); runRef.current = null
    speaker.stop()
    transport.reset(sessionRef.current)
    sessionRef.current = newSessionId()
    intentRef.current = null
    setFields([]); setTurns([]); setChanges([]); setReplans(0); setInterim(''); setCaption(null)
    setTool(t => ({ phase: 'idle', result: null, run: t.run + 1 }))
    setNotice('')
    setOrb(restState())
  }, [speaker, transport, setOrb])

  return {
    orb, fields, revision, replans, turns, interim, caption, tool, changes, servedBy, mode: transport.mode,
    micOn, micSupported, voiceOn, voiceSupported, notice,
    setVoiceOn, submit, interrupt, toggleMic, reset,
    hasPlan: fields.some(f => f.value),
  }
}
