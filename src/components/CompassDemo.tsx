import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import Orb, { ORB_LABEL } from '../voice/Orb'
import { isBusy, useCompassAgent } from '../voice/useCompassAgent'
import type { ActionView, PlanView } from '../voice/useCompassAgent'
import { FIELD_ORDER, formatValue, labelFor, time12, toolLabel } from '../voice/format'
import type { FieldValue, PatchOp } from '../voice/types'
import './compass-demo.css'

const LINE_START = 'Schedule dinner tomorrow at 7 and find an Italian restaurant.'
const LINE_CHANGE = 'Actually make it 8. Somewhere near Palo Alto.'

function Mark() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m16.8 4.9-2.9 9-9 5.2 5.2-9 9-2.9-5.2 7.8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 1v2M12 21v2M1 12h2M21 12h2" stroke="currentColor" strokeWidth="1.15" /></svg>
}
function Mic() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.4" /><path d="M6 11a6 6 0 0 0 12 0m-6 6v4m-3 0h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
}
function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function Speaker({ on }: { on: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6l5 4V5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />{on ? <path d="M15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /> : <path d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}</svg>
}

const TAG: Record<string, string> = { kept: 'kept', changed: 'updated', added: 'added', removed: 'removed' }

/** Render state straight from the v1 patch op: kept | active+updated | active+added | active+removed. */
function slotStatus(op: PatchOp | undefined, value: FieldValue, revision: boolean): string {
  if (op?.status === 'kept') return 'kept'
  if (op?.status === 'active') return op.change === 'updated' ? 'changed' : op.change === 'removed' ? 'removed' : revision ? 'added' : 'new'
  return value == null ? 'empty' : 'plain'
}

function Plan({ plan }: { plan: PlanView }) {
  const fields = FIELD_ORDER.filter(f => plan.intent[f] != null || plan.patch.some(op => op.field === f) || f === 'location')
  return <ul className="cv-slots">{fields.map(f => {
    const op = plan.patch.find(o => o.field === f)
    const status = slotStatus(op, plan.intent[f], plan.revision)
    const previous = op && op.status === 'active' && (op.change === 'updated' || op.change === 'removed') ? formatValue(f, op.from) : null
    return (
      <li key={f} className={'cv-slot is-' + status}>
        <span className="cv-slot-label">{labelFor(f)}</span>
        <span className="cv-slot-values" key={f + '-' + plan.version}>
          {previous && <span className="cv-old"><s>{previous}</s><em>superseded</em></span>}
          <span className="cv-val">{formatValue(f, plan.intent[f]) ?? (f === 'location' ? 'Anywhere' : 'Not set')}</span>
        </span>
        {TAG[status] && <span className="cv-tag" key={'t' + plan.version}>{TAG[status]}</span>}
      </li>
    )
  })}</ul>
}

function argsLine(args: Record<string, unknown>) {
  return [args.cuisine, args.location ?? 'current area', args.date, time12((args.time as FieldValue) ?? null)].filter(Boolean).map(v => formatValue('x', v as FieldValue)).join(' · ')
}

function ActionRow({ a, current, holding }: { a: ActionView; current: boolean; holding: boolean }) {
  const phase = a.status === 'running' && holding ? 'paused' : a.status
  const status = phase === 'running' ? 'Searching' : phase === 'paused' ? 'Paused, listening' : phase === 'done' ? `${a.result?.results.length ?? 0} results` : phase === 'invalidated' ? `Invalidated by new ${(a.changedFields ?? []).map(labelFor).join(' + ').toLowerCase()}` : 'Stopped'
  return (
    <div className={'cv-act is-' + phase + (current ? ' is-current' : '')}>
      <div className="cv-act-head"><span className="cv-act-args">{argsLine(a.args)}</span><span className="cv-act-status">{status}</span></div>
      <div className="cv-progress"><span key={a.run} /></div>
      {current && a.status === 'done' && a.result && <ul className="cv-results">{a.result.results.map((r, i) => <li key={a.id + i} style={{ animationDelay: i * 90 + 'ms' }}><b>{r.name}</b><span>{r.area ?? 'Nearby'} · {r.distanceKm.toFixed(1)} km</span><small>{time12(r.availableAt) ?? ''}</small></li>)}</ul>}
    </div>
  )
}

function Caption({ text, msPerWord }: { text: string; msPerWord: number }) {
  return <p className="cv-caption">{text.split(/\s+/).map((w, i) => <span key={i} style={{ animationDelay: i * msPerWord + 'ms' }}>{w} </span>)}</p>
}

export default function CompassDemo() {
  const a = useCompassAgent()
  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLOListElement>(null)
  const planRef = useRef<HTMLDivElement>(null)
  const busy = isBusy(a.orb)

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [a.turns.length])

  // Phones: keep the plan in view at the moments that matter (first plan, replanning).
  const planVersion = a.plan?.version ?? 0
  useEffect(() => {
    const el = planRef.current
    if (!el || !planVersion || window.innerWidth > 860) return
    const r = el.getBoundingClientRect()
    if (r.top < 60 || r.top > window.innerHeight * 0.45) el.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [planVersion])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && isBusy(a.orb)) { e.preventDefault(); a.interrupt() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [a])

  function send(e?: FormEvent) {
    e?.preventDefault()
    if (!draft.trim()) return
    a.submit(draft); setDraft('')
  }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
  }

  const nextLine = a.hasPlan ? LINE_CHANGE : LINE_START
  const current = a.actions[a.actions.length - 1]
  const changes = a.plan?.revision ? a.plan.patch.filter(op => op.status === 'active') : []

  return (
    <div className="compass-demo cv">
      <div className="cd-disclosure"><span className="cd-disclosure-dot" />
        {a.servedBy === 'live' ? 'Live · /api/turn (Nebius GLM-5.3) · Restaurant results are mock data · Browser voice' : 'Replay of a recorded live session (same /api/turn v1 events) · Restaurant results are mock data'}
      </div>
      <div className="cv-shell" data-state={a.orb}>
        <div className="cv-toolbar">
          <div className="cv-identity"><Mark /><span>COMPASS</span><span className="cv-state-pill" aria-live="polite"><i />{ORB_LABEL[a.orb]}</span></div>
          <div className="cv-tools">
            <button type="button" className={'cv-icon-btn' + (a.voiceOn ? ' is-on' : '')} onClick={() => a.setVoiceOn(!a.voiceOn)} disabled={!a.voiceSupported} aria-pressed={a.voiceOn} title="COMPASS speaks replies with your browser voice"><Speaker on={a.voiceOn} /><span>{a.voiceOn ? 'Voice on' : 'Muted'}</span></button>
            <button type="button" className="cv-icon-btn" onClick={a.reset} aria-label="Reset session"><span aria-hidden="true">↺</span><span>Reset</span></button>
          </div>
        </div>

        <div className="cv-stage">
          <div className="cv-voice">
            <div className="cv-orb-wrap">
              <Orb state={a.orb} />
              <p className="cv-orb-label" aria-hidden="true">{ORB_LABEL[a.orb]}</p>
            </div>
            <div className="cv-live" aria-live="polite">
              {a.interim ? <p className="cv-interim">“{a.interim}”</p>
                : a.orb === 'speaking' && a.caption ? <Caption key={a.caption.key} text={a.caption.text} msPerWord={a.caption.msPerWord} />
                : a.orb === 'interrupted' ? <p className="cv-hint">Stopped. Listening to you.</p>
                : a.orb === 'thinking' ? <p className="cv-hint">Understanding what changed…</p>
                : a.orb === 'replanning' ? <p className="cv-hint">Updating the plan, keeping the rest.</p>
                : a.orb === 'acting' ? <p className="cv-hint">Working on it. Interrupt any time.</p>
                : <p className="cv-hint">{a.hasPlan ? 'Change anything. COMPASS adapts mid-action.' : 'Say what you need, then change your mind mid-action.'}</p>}
            </div>

            <div className="cv-dock">
              <div className="cv-controls">
                <button type="button" className={'cv-mic' + (a.micOn ? ' is-on' : '')} onClick={a.toggleMic} disabled={!a.micSupported} aria-pressed={a.micOn} title={a.micSupported ? 'Hands-free: talk, and talk over COMPASS to interrupt' : 'Voice input not supported in this browser'}>
                  <Mic /><span>{a.micOn ? 'Listening' : 'Talk'}</span>
                </button>
                {busy && <button type="button" className="cv-stop" onClick={() => a.interrupt()} title="Interrupt (Esc)">Interrupt</button>}
              </div>

              <div className="cv-script">
                <span className="cv-script-label">{busy && a.hasPlan ? 'Interrupt with' : a.hasPlan ? 'Change the plan' : 'Try saying'}</span>
                <button type="button" className={'cv-line' + (busy && a.hasPlan ? ' is-urgent' : '')} onClick={() => a.submit(nextLine)}>
                  <span>“{nextLine}”</span><Arrow />
                </button>
              </div>

              <form className="cv-composer" onSubmit={send}>
                <label htmlFor="cv-input" className="cv-sr">Type to COMPASS</label>
                <input id="cv-input" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder={busy ? 'Type to interrupt…' : 'Or type it…'} maxLength={500} autoComplete="off" />
                <button type="submit" disabled={!draft.trim()} aria-label="Send"><Arrow /></button>
              </form>

            </div>

            <ol className="cv-log" ref={logRef} aria-label="Conversation">
              {a.turns.slice(-6).map(t => <li key={t.id} className={'cv-turn is-' + t.who + (t.interrupted ? ' is-cut' : '')}><span>{t.who === 'user' ? 'You' : 'COMPASS'}</span><p>{t.text}{t.interrupted && <em> · cut off</em>}</p></li>)}
            </ol>
            <p className="cv-notice" role="status">{a.notice}</p>
          </div>

          <div className="cv-plan-col" ref={planRef}>
            <section className={'cv-plan' + (a.orb === 'replanning' ? ' is-replanning' : '')} aria-label="Current plan" aria-live="polite">
              <header><span className="cv-eyebrow">The plan</span>{a.plan && <span className={'cv-rev' + (a.revisions ? ' is-revised' : '')} key={a.plan.version}>v{a.plan.version}{a.revisions ? ' · revised' : ''}</span>}</header>
              {a.plan ? <Plan plan={a.plan} />
                : <div className="cv-plan-empty"><span className="cv-ghost" /><span className="cv-ghost" /><span className="cv-ghost" /><p>Your plan appears here as COMPASS understands it.</p></div>}
            </section>

            <section className={'cv-action' + (current ? '' : ' is-idle')} aria-label="Action in progress">
              <header><span className="cv-eyebrow">Action</span><span className="cv-tool-name">{current ? toolLabel(current.tool) + (current.mock ? ' · mock' : '') : 'Waiting for a plan'}</span></header>
              {a.actions.slice(-2).map(x => <ActionRow key={x.id} a={x} current={x === current} holding={a.holding} />)}
            </section>

            {changes.length > 0 && <section className="cv-changes" aria-label="What changed" key={a.plan!.version}>
              <span className="cv-eyebrow">What changed</span>
              <ul>{changes.map(op => <li key={op.field}><span>{labelFor(op.field)}</span>{op.from != null && <s>{formatValue(op.field, op.from)}</s>}{op.from != null && <i aria-hidden="true">→</i>}<b>{formatValue(op.field, op.to) ?? 'removed'}</b></li>)}</ul>
            </section>}
          </div>
        </div>
      </div>
    </div>
  )
}
