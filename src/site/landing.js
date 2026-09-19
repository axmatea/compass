// COMPASS landing (owner: FRONTEND). Menu toggle, scroll reveal, rotating voice line. No network, no state.
const bar = document.querySelector('.bar')
const burger = document.querySelector('.burger')
burger?.addEventListener('click', () => {
  const open = bar.classList.toggle('open')
  burger.setAttribute('aria-expanded', String(open))
})
bar?.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => { bar.classList.remove('open'); burger?.setAttribute('aria-expanded', 'false') }))

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -12% 0px' })
document.querySelectorAll('section:not(.hero) .wrap').forEach(el => io.observe(el))

const line = document.querySelector('.voice-line')
if (line && !reduce) {
  const lines = JSON.parse(line.dataset.lines || '[]')
  let i = 0
  const type = (text, k = 0) => {
    line.textContent = text.slice(0, k)
    if (k < text.length) setTimeout(() => type(text, k + 1), 34)
    else setTimeout(next, 2600)
  }
  const next = () => { i = (i + 1) % lines.length; line.parentElement.classList.remove('listening'); void line.offsetWidth; line.parentElement.classList.add('listening'); type(lines[i]) }
  setTimeout(next, 2400)
}
