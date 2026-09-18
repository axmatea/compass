import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import Orb, { ORB_LABEL } from '../voice/Orb'
import { isBusy, useCompassAgent } from '../voice/useCompassAgent'
import type { FieldView } from '../voice/types'
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

const TAG: Partial<Record<FieldView['status'], string>> = { kept: 'kept', changed: 'updated', added: 'added', removed: 'cleared' }

function Slot({ f, revision }: { f: FieldView; revision: number }) {
  return (
    <li className={'cv-slot is-' + f.status}>
      <span className="cv-slot-label">{f.label}</span>
      <span className="cv-slot-values" key={f.key + '-' + revision}>
        {f.previous && <span className="cv-old"><s>{f.previous}</s><em>superseded</em></span>}
        <span className="cv-val">{f.value ?? (f.key === 'location' ? 'Anywhere' : 'Not set')}</span>
      </span>
      {TAG[f.status] && <span className="cv-tag" key={'t' + revision}>{TAG[f.status]}</span>}
    </li>
  )
}

function Caption({ text, msPerWord }: { text: string; msPerWord: number }) {
  return <p className="cv-caption">{text.split(/\s+/).map((w, i) => <span key={i} style={{ animationDelay: i * msPerWord + 'ms' }}>{w} </span>)}</p>
}

export default function CompassDemo() {
  const a = useCompassAgent()
  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLOListElement>(null)
  const busy = isBusy(a.orb)

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [a.turns.length])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isBusy(a.orb)) { e.preventDefault(); void a.interrupt() }
    }
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
  const toolName = a.tool.result?.tool === 'restaurant_search' ? 'Restaurant search' : a.tool.result?.tool?.replace(/_/g, ' ') ?? 'Action'
  const toolStatus = a.tool.phase === 'running' ? 'Searching' : a.tool.phase === 'paused' ? 'Paused. Replanning with your change' : a.tool.phase === 'done' ? a.tool.result?.summary ?? 'Done' : 'Waiting for a plan'

  return (
    <div className="compass-demo cv">
      <div className="cd-disclosure"><span className="cd-disclosure-dot" />
        {a.servedBy === 'live' ? 'Live prototype · Connected to /api/turn · Browser voice' : 'Live prototype · Local mock backend (same /api/turn contract) · Results are mock data'}
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

            <div className="cv-controls">
              <button type="button" className={'cv-mic' + (a.micOn ? ' is-on' : '')} onClick={a.toggleMic} disabled={!a.micSupported} aria-pressed={a.micOn} title={a.micSupported ? 'Hands-free: talk, and talk over COMPASS to interrupt' : 'Voice input not supported in this browser'}>
                <Mic /><span>{a.micOn ? 'Listening' : 'Talk'}</span>
              </button>
              {busy && <button type="button" className="cv-stop" onClick={() => void a.interrupt()} title="Interrupt (Esc)">Interrupt</button>}
            </div>

            <div className="cv-script">
              <span className="cv-script-label">{busy && a.hasPlan ? 'Interrupt with' : a.hasPlan ? 'Change the plan' : 'Try saying'}</span>
              <button type="button" className={'cv-line' + (busy && a.hasPlan ? ' is-urgent' : '')} onClick={() => a.submit(nextLine)}>
                <span>“{nextLine}”</span><Arrow />
              </button>
            </div>

            <form className="cv-composer" onSubmit={send}>
              <label htmlFor="cv-input" className="cv-sr">Type to COMPASS</label>
              <input id="cv-input" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder={busy ? 'Type to interrupt…' : 'Or type it…'} maxLength={400} autoComplete="off" />
              <button type="submit" disabled={!draft.trim()} aria-label="Send"><Arrow /></button>
            </form>

            <ol className="cv-log" ref={logRef} aria-label="Conversation">
              {a.turns.slice(-6).map(t => <li key={t.id} className={'cv-turn is-' + t.who + (t.interrupted ? ' is-cut' : '')}><span>{t.who === 'user' ? 'You' : 'COMPASS'}</span><p>{t.text}{t.interrupted && <em> · cut off</em>}</p></li>)}
            </ol>
            <p className="cv-notice" role="status">{a.notice}</p>
          </div>

          <div className="cv-plan-col">
            <section className={'cv-plan' + (a.orb === 'replanning' ? ' is-replanning' : '')} aria-label="Current plan" aria-live="polite">
              <header><span className="cv-eyebrow">The plan</span>{a.hasPlan && <span className={'cv-rev' + (a.replans ? ' is-revised' : '')} key={a.replans}>{a.replans ? 'Revised ×' + a.replans : 'Draft 1'}</span>}</header>
              {a.fields.length ? <ul className="cv-slots">{a.fields.filter(f => f.value || f.previous || f.key === 'location').map(f => <Slot key={f.key} f={f} revision={a.revision} />)}</ul>
                : <div className="cv-plan-empty"><span className="cv-ghost" /><span className="cv-ghost" /><span className="cv-ghost" /><p>Your plan appears here as COMPASS understands it.</p></div>}
            </section>

            <section className={'cv-action is-' + a.tool.phase} aria-label="Action in progress">
              <header><span className="cv-eyebrow">Action</span><span className="cv-tool-name">{toolName}{a.tool.result?.mock ? ' · mock' : ''}</span></header>
              <div className="cv-progress"><span key={a.tool.run} /></div>
              <p className="cv-tool-status">{toolStatus}</p>
              {a.tool.phase === 'done' && a.tool.result?.items && <ul className="cv-results">{a.tool.result.items.map((it, i) => <li key={a.tool.run + '-' + i} style={{ animationDelay: i * 90 + 'ms' }}><b>{it.title}</b><span>{it.subtitle}</span><small>{it.meta}</small></li>)}</ul>}
              {a.tool.phase === 'done' && a.tool.result?.draft && <div className="cv-draft" key={'d' + a.tool.run}><span className="cv-eyebrow">Calendar</span><b>{a.tool.result.draft.title}</b><span>{[a.tool.result.draft.when, a.tool.result.draft.where].filter(Boolean).join(' · ')}</span><small>{a.tool.result.draft.note}</small></div>}
            </section>

            {a.changes.length > 0 && <section className="cv-changes" aria-label="What changed">
              <span className="cv-eyebrow">What changed</span>
              <ul>{a.changes.map(c => <li key={c.id}><span>{c.field}</span>{c.from && <s>{c.from}</s>}{c.from && <i aria-hidden="true">→</i>}<b>{c.to ?? 'cleared'}</b></li>)}</ul>
            </section>}
          </div>
        </div>
      </div>
    </div>
  )
}
