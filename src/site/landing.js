// COMPASS landing (owner: FRONTEND). Menu, word reveals, hero parallax, and the pinned stage. No library; one read-only /api/health probe for the live line.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const bar = document.querySelector('.bar')
const burger = document.querySelector('.burger')
burger?.addEventListener('click', () => { const open = bar.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)) })
bar?.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => { bar.classList.remove('open'); burger?.setAttribute('aria-expanded', 'false') }))

// Word reveals: split text nodes into words, keep <br> and <em> intact.
let wi = 0
const split = node => {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) {
      const frag = document.createDocumentFragment()
      child.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return
        if (/^\s+$/.test(part)) return frag.append(part)
        const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', wi++); w.textContent = part; frag.append(w)
      })
      child.replaceWith(frag)
    } else if (child.nodeType === 1 && child.tagName !== 'BR') split(child)
  }
}
document.querySelectorAll('.reveal').forEach(el => { wi = 0; split(el) })

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -12% 0px' })
document.querySelectorAll('section:not(.hero):not(.stage) .wrap, .reveal').forEach(el => io.observe(el))

// Hero: the art drifts and swells as the journey begins, the copy lifts away.
const hero = document.querySelector('.hero')
const stage = document.querySelector('.stage')
const browser = stage?.querySelector('.browser')
const page = stage?.querySelector('.page')
const steps = [...(stage?.querySelectorAll('.step') || [])]
const line = stage?.querySelector('.voice-line')
let step = -1, typing = 0
const type = (text, k = 0) => {
  clearTimeout(typing)
  line.textContent = text.slice(0, k)
  if (k < text.length) typing = setTimeout(() => type(text, k + 1), 30)
}
function setStep(i) {
  if (i === step) return
  const prev = step; step = i
  stage.dataset.step = i
  steps.forEach((s, j) => { s.classList.toggle('on', j === i); s.classList.toggle('past', j < i) })
  browser.classList.toggle('blank', i === 0)
  browser.classList.toggle('building', i === 1)
  page.classList.toggle('warm', i === 3)
  if (i === 0 || i === 2) { if (reduce) line.textContent = line.dataset['l' + i]; else if (prev !== -1 || i === 2) type(line.dataset['l' + i]); else line.textContent = line.dataset.l0 }
}
let queued = false
function frame() {
  queued = false
  const y = window.scrollY, vh = innerHeight
  if (hero && !reduce) {
    const t = Math.min(1, Math.max(0, y / vh))
    hero.style.setProperty('--hy', (t * 80).toFixed(1)); hero.style.setProperty('--hs', (t * .08).toFixed(3)); hero.style.setProperty('--hf', (t * 1.4).toFixed(3))
  }
  if (stage) {
    if (reduce) { setStep(3); return }
    const top = stage.offsetTop, len = stage.offsetHeight - vh
    const p = Math.min(1, Math.max(0, (y - top) / len))
    setStep(y < top - vh * .5 ? 0 : Math.min(3, Math.floor(p * 4)))
  }
}
const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(frame) } }
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll, { passive: true })
frame()

// The film pauses when it leaves the viewport, so audio never plays over the rest of the page.
const filmEl = document.getElementById('film-video')
if (filmEl && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (!e.isIntersecting && !filmEl.paused) filmEl.pause() }, { threshold: 0.2 }).observe(filmEl)

// Under the hood: the live line states what production runs right now (presence only, never a secret).
const live = document.getElementById('live-stack')
if (live) fetch('/api/health', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null).then(h => {
  if (!h || !h.ok) return
  const names = { gradium: 'Gradium', boson: 'Boson Higgs', browser: 'browser speech', generalcompute: 'General Compute', nebius: 'Nebius GLM-5.3' }
  const voice = h.voice && h.voice.provider, llm = h.llm && h.llm.provider
  if (!voice || !llm) return
  const model = h.llm.model ? ` (${h.llm.model})` : '', failover = h.llm.fallback ? ` · failover ${names[h.llm.fallback] || h.llm.fallback}` : ''
  live.querySelector('span').textContent = `Live now · voice ${names[voice] || voice} · reasoning ${names[llm] || llm}${model}${failover}`
  live.hidden = false
})
