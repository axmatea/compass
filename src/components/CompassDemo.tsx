'use client'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import './compass-demo.css'
type ScenarioId = 'cofounder' | 'career' | 'creative'
type Stage = 0 | 1 | 2
interface Scenario {
  id: ScenarioId; label: string; shortLabel: string; opening: string; firstReply: string
  pivot: string; pivotReply: string; actionPrompt: string; actionReply: string
  initialAssumption: string; revisedAssumption: string; keep: string
  nextStep: string; when: string; action: string; done: string; keywords: string[]
}
const SCENARIOS: Scenario[] = [
  {
    id: 'cofounder', label: 'A difficult conversation', shortLabel: 'The cofounder',
    opening: 'I think I need to tell my cofounder I’m done.',
    firstReply: 'Done with the company — or with how things are working?',
    pivot: 'Actually, I don’t want to leave. I just can’t keep doing everything myself.',
    pivotReply: 'You want to stay. The part that needs to change is how you share the work. What would make tomorrow feel different?',
    actionPrompt: 'Help me start that conversation.',
    actionReply: 'Start with what you want to protect. Then ask for one concrete change.',
    initialAssumption: 'Considering leaving the company.',
    revisedAssumption: 'Stay. Reset the way work is shared.',
    keep: 'The partnership matters.',
    nextStep: 'Ask for a 20-minute reset.',
    when: 'Send this before the end of today.',
    action: 'Can we take 20 minutes tomorrow to reset how we’re sharing the work? I want us to make this work, and I need us to make the workload sustainable.',
    done: 'A conversation on the calendar. No final decision required.',
    keywords: ['cofounder', 'partner', 'partnership', 'company', 'leave', 'stay', 'alone', 'workload', 'everything'],
  },
  {
    id: 'career', label: 'A career crossroads', shortLabel: 'The next chapter',
    opening: 'I got the offer. Better title, better money. I should be excited.',
    firstReply: 'What’s making you hesitate?',
    pivot: 'It’s not really about the money. I miss actually making things.',
    pivotReply: 'So the question is less “Is this a bigger role?” and more “Will I get to do the work that gives me energy?”',
    actionPrompt: 'How do I find that out before I decide?',
    actionReply: 'Get one real example of the week you’d be stepping into. You can decide with evidence, not just a title.',
    initialAssumption: 'Choosing the better title and salary.',
    revisedAssumption: 'Choosing room to make things.',
    keep: 'Meaningful, hands-on work matters.',
    nextStep: 'Ask to see a real working week.',
    when: 'Before you respond to the offer.',
    action: 'I’m excited about the opportunity. Could you walk me through a typical week in this role — especially how much time I’d spend making things versus managing?',
    done: 'One concrete answer to compare with what gives you energy.',
    keywords: ['career', 'offer', 'job', 'salary', 'title', 'money', 'making', 'role', 'manage'],
  },
  {
    id: 'creative', label: 'Too many ideas', shortLabel: 'The creative mind',
    opening: 'I’ve got twelve ideas and somehow nothing to show for them.',
    firstReply: 'Are you missing a good idea, or a place to begin?',
    pivot: 'Actually, I know the one I care about. I’m afraid the first version won’t be good.',
    pivotReply: 'The idea isn’t the problem. The first version is carrying the weight of the finished thing. What could you make just to learn?',
    actionPrompt: 'Make the first step smaller.',
    actionReply: 'Give it twenty minutes. Make one rough page, for your eyes only. The goal is something you can respond to.',
    initialAssumption: 'Need to find the right idea.',
    revisedAssumption: 'Need permission to start imperfectly.',
    keep: 'There’s already one idea you care about.',
    nextStep: 'Make one imperfect page.',
    when: 'Twenty minutes. Today.',
    action: 'Open a blank page. Set a 20-minute timer. Write the roughest useful version of the idea you keep coming back to. Stop when the timer ends, then mark the one part worth exploring.',
    done: 'One real thing to build on. It doesn’t have to be ready to share.',
    keywords: ['creative', 'idea', 'ideas', 'start', 'afraid', 'version', 'perfect', 'page', 'project'],
  },
]
interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; length: number; [index: number]: RecognitionAlternative }
interface RecognitionEvent { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } }
interface RecognitionError { error: string }
interface BrowserRecognition {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionError) => void) | null
  onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type RecognitionConstructor = new () => BrowserRecognition
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
function Mark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m16.8 4.9-2.9 9-9 5.2 5.2-9 9-2.9-5.2 7.8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 1v2M12 21v2M1 12h2M21 12h2" stroke="currentColor" strokeWidth="1.15" /></svg>
}
function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function Mic() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.4" /><path d="M6 11a6 6 0 0 0 12 0m-6 6v4m-3 0h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
}
const STAGE_LABELS = ['Start anywhere', 'Change your mind', 'Find a next step']
export default function CompassDemo() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('cofounder')
  const [stage, setStage] = useState<Stage>(0)
  const [draft, setDraft] = useState('')
  const [actionDraft, setActionDraft] = useState(SCENARIOS[0].action)
  const [customPivot, setCustomPivot] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [listening, setListening] = useState(false)
  const [micAvailable, setMicAvailable] = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(false)
  const [readAloud, setReadAloud] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const latestReplyRef = useRef<HTMLParagraphElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<BrowserRecognition | null>(null)
  const scenario = SCENARIOS.find(item => item.id === scenarioId) ?? SCENARIOS[0]
  useEffect(() => {
    const speechWindow = window as SpeechWindow
    setMicAvailable(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition))
    setSpeechAvailable('speechSynthesis' in window)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      recognitionRef.current?.abort()
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])
  useEffect(() => {
    const transcript = transcriptRef.current
    if (transcript) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: reducedMotion ? 'instant' : 'smooth' })
    }
  }, [stage, busy, scenarioId])
  function stopDictation() {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    recognition?.abort()
    setListening(false)
  }
  function speak(text: string) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'; utterance.rate = 0.92
    window.speechSynthesis.speak(utterance)
  }
  function reset(id: ScenarioId = scenarioId) {
    if (timerRef.current) clearTimeout(timerRef.current)
    stopDictation()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setScenarioId(id); setStage(0); setDraft(''); setCustomPivot(null); setBusy(false)
    setActionDraft((SCENARIOS.find(item => item.id === id) ?? SCENARIOS[0]).action)
    setNotice('Conversation reset. Choose the prepared line, or try typing your own.')
  }
  function advance(nextStage: Stage, nextScenario = scenario, pivot: string | null = null) {
    if (busy) return
    stopDictation()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (nextScenario.id !== scenarioId) { setScenarioId(nextScenario.id); setCustomPivot(null); setActionDraft(nextScenario.action) }
    if (pivot !== null) setCustomPivot(pivot)
    setStage(nextStage); setBusy(true); setDraft('')
    timerRef.current = setTimeout(() => {
      setBusy(false)
      if (readAloud) speak(nextStage === 1 ? nextScenario.pivotReply : nextScenario.actionReply)
      requestAnimationFrame(() => latestReplyRef.current?.focus({ preventScroll: true }))
    }, 550)
  }
  function runPreparedLine() {
    setNotice('')
    if (stage === 2) { reset(); return }
    advance(stage === 0 ? 1 : 2)
  }
  function submit(event?: FormEvent) {
    event?.preventDefault()
    const text = draft.trim()
    if (!text || busy || listening) return
    const tokens = text.toLowerCase().split(/[^a-z]+/)
    const actionWords = ['next', 'help', 'step', 'smaller', 'say', 'send', 'draft', 'conversation', 'decide']
    if (stage === 1 && actionWords.some(word => tokens.includes(word))) {
      setNotice('Matched a next-step cue. Playing the prepared response for this scenario.')
      advance(2); return
    }
    const matched = [scenario, ...SCENARIOS.filter(item => item.id !== scenarioId)].find(item => item.keywords.some(word => tokens.includes(word)))
    if (matched) {
      setNotice('Matched the “' + matched.label.toLowerCase() + '” scenario by keyword. The response and context below are scripted.')
      advance(1, matched, text); return
    }
    setNotice('This demo follows three prepared stories, so it can’t reason about that thought. Try the suggested line below, or choose another scenario.')
    inputRef.current?.focus({ preventScroll: true })
  }
  function inputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit() }
  }

  function toggleDictation() {
    if (listening) { recognitionRef.current?.stop(); return }
    const speechWindow = window as SpeechWindow
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Constructor) { setNotice('Dictation isn’t supported in this browser. You can type below or use the prepared line.'); return }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    const recognition = new Constructor()
    const existingText = draft.trim()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = true
    recognition.onresult = event => {
      if (recognitionRef.current !== recognition) return
      let transcript = ''
      for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript
      setDraft([existingText, transcript.trim()].filter(Boolean).join(' '))
    }
    recognition.onerror = event => {
      if (recognitionRef.current !== recognition) return
      recognitionRef.current = null; setListening(false)
      setNotice(event.error === 'not-allowed' ? 'Microphone access wasn’t granted. Type your thought or use the prepared line.' : 'Dictation couldn’t finish. Your draft is still here; you can type or use the prepared line.')
    }
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return
      recognitionRef.current = null; setListening(false)
      setNotice('Dictation stopped. Review your words, then send. Responses are scripted.')
      inputRef.current?.focus({ preventScroll: true })
    }
    try {
      recognition.start(); setListening(true)
      setNotice('Listening through your browser. Stop when you’re ready; nothing is sent to this demo until you press Send.')
    } catch {
      recognitionRef.current = null; setListening(false)
      setNotice('Dictation is unavailable right now. You can type your thought instead.')
    }
  }
  function toggleReadAloud() {
    const enabled = !readAloud
    setReadAloud(enabled)
    if (enabled) speak(stage === 0 ? scenario.firstReply : stage === 1 ? scenario.pivotReply : scenario.actionReply)
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }
  function actionText() {
    return ['COMPASS — Your next step', 'Guided concept demo · Scripted example', '', scenario.nextStep, scenario.when, '', actionDraft.trim(), '', 'What matters: ' + scenario.keep, 'Enough for now: ' + scenario.done].join('\n')
  }
  async function copyAction() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard not available')
      await navigator.clipboard.writeText(actionText())
      setNotice('Your next step is copied.')
    } catch { setNotice('Copy isn’t available in this browser. Use Download to save your next step.') }
  }
  function downloadAction() {
    const url = URL.createObjectURL(new Blob([actionText()], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'COMPASS-' + scenario.id + '-next-step.txt'
    document.body.appendChild(link); link.click(); link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Your next-step text file is ready.')
  }
  const turns = [
    { user: scenario.opening, assistant: scenario.firstReply },
    { user: customPivot ?? scenario.pivot, assistant: scenario.pivotReply },
    { user: scenario.actionPrompt, assistant: scenario.actionReply },
  ]
  return (
    <div className="compass-demo">
      <div className="cd-disclosure"><span className="cd-disclosure-dot" />Guided concept demo · Scripted responses, not live AI</div>
      <div className="cd-shell">
        <div className="cd-toolbar">
          <div className="cd-identity"><Mark /><span>Your thinking space</span></div>
          <button type="button" className="cd-reset" onClick={() => reset()} aria-label="Reset conversation"><span aria-hidden="true">↺</span> Reset</button>
        </div>
        <div className="cd-scenario-bar" aria-label="Demo scenarios">
          {SCENARIOS.map(item => <button type="button" key={item.id} className={'cd-scenario' + (item.id === scenarioId ? ' is-active' : '')} aria-pressed={item.id === scenarioId} onClick={() => reset(item.id)}>{item.shortLabel}</button>)}
        </div>
        <div className="cd-workspace">
          <div className="cd-conversation">
            <div className="cd-conversation-heading">
              <span className="cd-eyebrow">A thought in progress</span>
              <button type="button" className={'cd-audio' + (readAloud ? ' is-on' : '')} onClick={toggleReadAloud} disabled={!speechAvailable || busy} aria-pressed={readAloud} title="Read the scripted COMPASS lines with your browser’s voice">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6l5 4V5Zm4 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {readAloud ? 'Voice on' : 'Read aloud'}
              </button>
            </div>
            <div className="cd-transcript" ref={transcriptRef} role="log" aria-label="Scripted conversation" aria-live="polite" aria-relevant="additions text" aria-busy={busy}>
              {turns.slice(0, stage + 1).map((turn, index) => <div className={'cd-turn' + (index < stage ? ' cd-turn-past' : '')} key={scenarioId + '-' + index}>
                <div className="cd-user-line"><span className="cd-speaker">You</span><p>{turn.user}</p></div>
                {(!busy || index < stage) && <div className="cd-assistant-line"><span className="cd-speaker"><Mark /> COMPASS</span><p tabIndex={-1} ref={index === stage ? latestReplyRef : undefined}>{turn.assistant}</p></div>}
              </div>)}
              {busy && <p className="cd-playing">Playing the next scripted line…</p>}
            </div>
            <div className="cd-guided-action">
              <span className="cd-guide-label">{stage === 0 ? 'TRY CHANGING DIRECTION' : stage === 1 ? 'MAKE IT CONCRETE' : 'A LITTLE CLEARER. A LITTLE CLOSER.'}</span>
              {stage < 2 && <p>“{stage === 0 ? scenario.pivot : scenario.actionPrompt}”</p>}
              <button type="button" className="cd-primary" onClick={runPreparedLine} disabled={busy}>{stage === 0 ? 'Change direction' : stage === 1 ? 'Find my next step' : 'Replay the conversation'}<Arrow /></button>
            </div>
            <form className="cd-composer" onSubmit={submit}>
              <label htmlFor="compass-thought" className="cd-input-label">Or put it in your own words</label>
              <div className={'cd-input-wrap' + (listening ? ' is-listening' : '')}>
                <textarea id="compass-thought" ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={inputKeyDown} placeholder={stage === 1 ? 'Try: “Help me take the next step.”' : scenarioId === 'career' ? 'Try: “It’s not about the money.”' : scenarioId === 'creative' ? 'Try: “I’m afraid to start my idea.”' : 'Try: “Actually, I don’t want to leave.”'} rows={2} maxLength={800} disabled={busy || listening} aria-describedby="compass-input-help" />
                <div className="cd-input-buttons">
                  <button type="button" className="cd-mic" onClick={toggleDictation} disabled={busy || !micAvailable} aria-pressed={listening} aria-label={listening ? 'Stop dictation' : 'Dictate a thought with your browser'} title={micAvailable ? 'Browser dictation' : 'Dictation unavailable in this browser; use text'}><Mic /><span>{listening ? 'Stop' : 'Speak'}</span></button>
                  <button type="submit" className="cd-send" disabled={!draft.trim() || busy || listening} aria-label="Send thought to guided demo"><Arrow /></button>
                </div>
              </div>
              <p className="cd-input-help" id="compass-input-help">Keyword matching selects prepared replies. Browser dictation may use your browser’s speech provider.</p>
            </form>
            <p className="cd-notice" role="status" aria-live="polite">{notice}</p>
          </div>
          <aside className="cd-context" aria-label="Context and next step">
            <div className="cd-context-top"><span className="cd-eyebrow">The thread</span><span className="cd-step-count">0{stage + 1} / 03</span></div>
            <div className="cd-progress" aria-label={'Step ' + (stage + 1) + ' of 3: ' + STAGE_LABELS[stage]}>{STAGE_LABELS.map((label, index) => <span key={label} className={index <= stage ? 'is-complete' : ''} />)}</div>
            <h3>{stage === 0 ? 'Start with what’s there.' : stage === 1 ? 'Your thinking changed. So did the thread.' : 'One next step. Yours to take.'}</h3>
            <div className="cd-context-facts" aria-live="polite" aria-atomic="true">
              <div className="cd-fact"><span className="cd-fact-label">{stage === 0 ? 'THE WORKING ASSUMPTION' : 'WHAT CHANGED'}</span>{stage === 0 ? <p>{scenario.initialAssumption}</p> : <><p className="cd-outdated"><s>{scenario.initialAssumption}</s></p><p className="cd-revised">{scenario.revisedAssumption}</p></>}</div>
              <div className="cd-fact"><span className="cd-fact-label">WHAT STILL MATTERS</span><p>{scenario.keep}</p></div>
            </div>
            {stage === 2 && !busy ? <div className="cd-action-card">
              <span className="cd-fact-label">YOUR NEXT STEP</span><h4>{scenario.nextStep}</h4><p className="cd-action-when">{scenario.when}</p><label className="cd-edit-label" htmlFor="compass-next-step">Make it sound like you</label><textarea id="compass-next-step" className="cd-action-edit" value={actionDraft} onChange={event => setActionDraft(event.target.value)} rows={6} maxLength={2000} aria-describedby="compass-edit-help" /><p className="cd-edit-help" id="compass-edit-help">Edit this draft. Copy and download include your changes.</p><p className="cd-done">{scenario.done}</p>
              <div className="cd-export"><button type="button" onClick={copyAction} disabled={!actionDraft.trim()}>Copy next step</button><button type="button" onClick={downloadAction} disabled={!actionDraft.trim()}>Download <span aria-hidden="true">↗</span></button></div>
            </div> : <div className="cd-context-footnote"><span className="cd-small-cross" aria-hidden="true">+</span><p>{stage === 0 ? 'You don’t need a polished prompt. Just somewhere to begin.' : 'The point isn’t to hold you to your first thought. It’s to help you find the one that matters.'}</p></div>}
            <p className="cd-concept-note">An illustration of the COMPASS experience.<br />Context and next steps are prepared examples.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}
