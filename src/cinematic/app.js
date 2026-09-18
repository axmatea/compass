import { createVoiceAdapter } from '../presentation/voice-adapter.js';

// One native-scroll narrative is shared by the website and presentation mode.
// New generated assets are activated only through the local verified manifest.
const scenes = [...document.querySelectorAll('.scene')];
const $ = (selector) => document.querySelector(selector);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a + (b - a) * t;
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 700px)');
const worlds = Object.fromEntries([...document.querySelectorAll('[data-media]')].map(el => [el.dataset.media, el]));
const videoNodes = Object.values(worlds).map(el => el.querySelector('video'));
const orb = $('.orb-position');
const voice = createVoiceAdapter();
const notes = [
 'We begin with a familiar uncertainty: a client request, a possible yes, and a concern that is not yet clear.',
 'The person starts with an unfinished thought. This dialogue is prepared; there is no microphone listening.',
 'COMPASS is a working concept for thinking through uncertainty. The optional hello uses browser speech synthesis.',
 'The experience should leave room for hesitation. Listening here is a visual simulation, not a working voice engine.',
 'Separate a confirmed detail from an assumption. Friday was requested; a difficult deadline is only a guess.',
 'This is the meaningful correction: Friday works, payment is the concern. The button selects a prepared state.',
 'A relevant next question follows the correction, while the Friday detail remains intact.',
 'The person chooses the terms: half upfront, half on delivery. No financial outcome is promised.',
 'This is a real editable field, containing a prepared reply. Edits remain in this tab. Nothing is sent.',
 'The proposed benefit is returning to real work with one next step. This footage illustrates the concept.',
 'The guided browser demo exists. Its conversation and context changes are scripted. Open-ended voice, memory and external actions are not built.',
 'The next step is to try the prepared demo, then test a narrow voice prototype. Reliability and latency are not yet measured.'
];
let starts = [], active = -1, position = 0, queued = false;
let motionPaused = reducedQuery.matches, playing = false, timer = 0, scrollAnimation = 0;
let corrected = false;
const originalDraft = $('#reply').value;
let media = {};
const sceneMedia = { 0: 'chaos', 1: 'speak', 9: 'progress' };
const orbPos = [
 [80, 52, .28, 0], [78, 44, .3, 0], [50, 30, .92, 1], [50, 29, .7, 1],
 [80, 48, .53, .9], [81, 45, .44, 1], [50, 28, .58, 1], [50, 77, .18, 1],
 [88, 18, .2, 0], [81, 50, .32, 0], [83, 25, .26, .75], [50, 27, .58, 1]
];
const mobileOrbPos = [
 [75, 35, .25, 0], [76, 40, .25, 0], [50, 31, 1, 1], [50, 29, .84, 1],
 [84, 24, .3, .6], [84, 23, .3, .6], [50, 29, .7, 1], [50, 75, .2, 1],
 [86, 17, .18, 0], [81, 35, .25, 0], [84, 19, .26, .7], [50, 26, .65, 1]
];

$('#contents').innerHTML = scenes.map((s, i) => `<a href="#${s.id}" data-scene="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${s.dataset.label}</a>`).join('');
const navLinks = [...$('#contents').querySelectorAll('a')];
function measure() { starts = scenes.map(el => el.offsetTop); requestFrame(); }
function requestFrame() { if (!queued) { queued = true; requestAnimationFrame(render); } }
function scrollPosition() {
 const y = window.scrollY;
 let lower = 0;
 for (let i = 0; i < starts.length; i++) if (y >= starts[i]) lower = i;
 return lower + (lower < starts.length - 1 ? clamp((y - starts[lower]) / (starts[lower + 1] - starts[lower])) : 0);
}
function correct(announce = true) {
 if (corrected) return;
 corrected = true;
 $('#scene-6').classList.add('is-corrected');
 $('.new-concern').hidden = false;
 $('#correct').textContent = 'Correction kept ✓';
 $('#correct').setAttribute('aria-pressed', 'true');
 $('#correction-note').textContent = 'FRIDAY STAYS · PAYMENT IS THE CONCERN';
 if (announce) $('#announcement').textContent = 'Prepared correction selected. Friday works. The concern is payment.';
}
function resetCorrection() {
 corrected = false;
 $('#scene-6').classList.remove('is-corrected');
 $('.new-concern').hidden = true;
 $('#correct').innerHTML = 'Correct the assumption <span aria-hidden="true">↗</span>';
 $('#correct').setAttribute('aria-pressed', 'false');
 $('#correction-note').textContent = 'SELECT A PREPARED CORRECTION';
}
function setActive(index) {
 if (index === active) return;
 active = index;
 $('#scene-count').textContent = `${String(index + 1).padStart(2, '0')} / 12`;
 $('#scene-name').textContent = scenes[index].dataset.label;
 $('#note-content').textContent = notes[index];
 navLinks.forEach((a, i) => a.setAttribute('aria-current', String(i === index)));
 document.body.classList.toggle('light-active', index === 8);
 if (index >= 6) correct(false);
 manageMedia();
}
function render() {
 queued = false;
 position = scrollPosition();
 const p = reducedQuery.matches ? Math.round(position) : position;
 const lower = Math.floor(p), upper = Math.min(11, lower + 1), t = p - lower;
 setActive(clamp(Math.round(position), 0, 11));
 const opacityAt = (index) => clamp(1 - Math.abs(p - index));
 for (const [key, el] of Object.entries(worlds)) {
  const i = key === 'chaos' ? 0 : key === 'speak' ? 1 : 9;
  el.style.opacity = key === 'chaos' ? clamp(1 - p) : opacityAt(i);
  // Later worlds rise into view as full-height vertical apertures.
  el.style.clipPath = i === 9 ? `inset(${clamp(9 - p) * 100}% 0 0)` : 'inset(0)';
 }
 const lightIn = clamp(p - 7), lightOut = clamp(p - 8);
 $('.light-world').style.clipPath = `inset(${(1 - lightIn) * 100}% 0 ${lightOut * 100}% 0)`;
 const productIn = clamp(p - 9), productOut = clamp(p - 10);
 $('.product-world').style.clipPath = `inset(${(1 - productIn) * 100}% 0 ${productOut * 100}% 0)`;
 const positions = mobileQuery.matches ? mobileOrbPos : orbPos;
 const a = positions[lower], b = positions[upper];
 orb.style.left = `${mix(a[0], b[0], t)}%`;
 orb.style.top = `${mix(a[1], b[1], t)}%`;
 orb.style.transform = `translate(-50%,-50%) scale(${mix(a[2], b[2], t)})`;
 orb.style.opacity = mix(a[3], b[3], t);
 $('.orb-wave').style.opacity = clamp(1 - Math.abs(p - 3));
 $('.world-horizon').style.opacity = clamp(p - 10);
 scenes.forEach((scene, i) => {
  const distance = i - position;
  const copy = scene.querySelector('.scene-copy');
  copy.style.opacity = reducedQuery.matches ? '1' : String(clamp(1.25 - Math.abs(distance) * .85));
  copy.style.transform = reducedQuery.matches || motionPaused ? 'none' : `translateY(${clamp(distance, -1, 1) * 22}px)`;
 });
}
function manageMedia() {
 for (const [key, el] of Object.entries(worlds)) {
  const index = Number(Object.entries(sceneMedia).find(([, value]) => value === key)?.[0]);
  const video = el.querySelector('video'), asset = media[key];
  const eligible = Math.abs(index - active) <= 1;
  if (asset?.poster && el.querySelector('img').getAttribute('src') !== asset.poster) el.querySelector('img').src = asset.poster;
  if (eligible && asset?.video && !reducedQuery.matches && !video.getAttribute('src')) {
   video.src = asset.video;
   video.load();
  }
  if (index === active && asset?.video && !motionPaused && !document.hidden && !reducedQuery.matches) {
   video.play().catch(() => {});
  } else video.pause();
 }
}
for (const video of videoNodes) {
 video.addEventListener('playing', () => video.classList.add('ready'));
 video.addEventListener('error', () => { video.classList.remove('ready'); });
}
fetch('/media/cinematic/manifest.json').then(r => r.ok ? r.json() : {}).then(data => {
 media = data.scenes || {};
 manageMedia();
}).catch(() => {});
function stopAuto() {
 playing = false;
 clearTimeout(timer);
 cancelAnimationFrame(scrollAnimation);
 scrollAnimation = 0;
 $('#play-toggle').innerHTML = 'Play story <span aria-hidden="true">▷</span>';
 $('#play-toggle').setAttribute('aria-label', 'Play story');
}
function goTo(index, animate = true) {
 index = clamp(index, 0, 11);
 cancelAnimationFrame(scrollAnimation);
 const target = starts[index], from = window.scrollY;
 if (!animate || reducedQuery.matches || motionPaused) { window.scrollTo(0, target); return; }
 const begin = performance.now(), duration = 220;
 function step(now) {
  const elapsed = clamp((now - begin) / duration);
  const eased = 1 - Math.pow(1 - elapsed, 3);
  window.scrollTo(0, mix(from, target, eased));
  if (elapsed < 1) scrollAnimation = requestAnimationFrame(step);
  else scrollAnimation = 0;
 }
 scrollAnimation = requestAnimationFrame(step);
}
function queueAdvance() {
 const current = Math.round(scrollPosition());
 const delay = current === 5 ? 7500 : current === 8 ? 9500 : 5000;
 timer = window.setTimeout(() => {
  if (!playing) return;
  if (current === 11) { stopAuto(); return; }
  if (current === 5) correct(false);
  goTo(current + 1);
  timer = window.setTimeout(queueAdvance, 250);
 }, delay);
}
function playStory(fromStart = false) {
 if (reducedQuery.matches) { $('#announcement').textContent = 'Reduced motion is enabled. Scroll or use the scene navigation to explore.'; return; }
 if (motionPaused) { $('#announcement').textContent = 'Motion is paused. Turn motion on to play the story, or scroll at your own pace.'; return; }
 stopAuto();
 if (fromStart || active === 11) goTo(0);
 playing = true;
 $('#play-toggle').innerHTML = 'Pause story <span aria-hidden="true">Ⅱ</span>';
 $('#play-toggle').setAttribute('aria-label', 'Pause story');
 timer = window.setTimeout(queueAdvance, 250);
}
function updateMotion() {
 document.body.classList.toggle('motion-paused', motionPaused);
 $('#motion').setAttribute('aria-pressed', String(motionPaused));
 $('#motion').setAttribute('aria-label', motionPaused ? 'Resume decorative motion' : 'Pause decorative motion');
 $('#motion-state').textContent = motionPaused ? 'off' : 'on';
 manageMedia();
 requestFrame();
}
$('#motion').addEventListener('click', () => { stopAuto(); motionPaused = !motionPaused; updateMotion(); if (motionPaused) voice.stop(); });
$('#play-toggle').addEventListener('click', () => playing ? stopAuto() : playStory());
$('#play-story').addEventListener('click', () => playStory());
$('#replay').addEventListener('click', () => { stopAuto(); resetCorrection(); goTo(0); });
$('#correct').addEventListener('click', () => { stopAuto(); correct(); });
$('#correct').setAttribute('aria-pressed', 'false');
$('#reset-draft').addEventListener('click', () => { $('#reply').value = originalDraft; $('#announcement').textContent = 'The prepared draft has been restored. Nothing was sent.'; });
$('#greeting').addEventListener('click', () => {
 stopAuto();
 voice.speak('Hi. I’m COMPASS. Start with what’s on your mind. This is a scripted preview of a conversation that helps you find a next step.', {
  onState(state, detail) {
   $('#voice-state').textContent = state === 'preparing' ? 'Preparing browser voice…' : state === 'speaking' ? 'Scripted browser greeting' : state === 'unavailable' ? detail : '';
  }
 });
});
function togglePanel(button, panel) {
 const open = panel.hidden;
 panel.hidden = !open;
 button.setAttribute('aria-expanded', String(open));
}
$('#contents-toggle').addEventListener('click', () => togglePanel($('#contents-toggle'), $('#contents')));
$('#notes-toggle').addEventListener('click', () => togglePanel($('#notes-toggle'), $('#notes')));
function closePanels() {
 $('#contents').hidden = true; $('#notes').hidden = true;
 $('#contents-toggle').setAttribute('aria-expanded', 'false'); $('#notes-toggle').setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', event => {
 const anchor = event.target.closest('a[href^="#scene-"]');
 if (anchor) { event.preventDefault(); stopAuto(); goTo(Number(anchor.hash.replace('#scene-', '')) - 1); closePanels(); }
});
$('#presentation-link').addEventListener('click', () => { closePanels(); });
function presentationMode() {
 const present = location.hash === '#present';
 document.body.classList.toggle('presentation-mode', present);
 $('#presentation-link').textContent = present ? 'Exit present ↗' : 'Present ↗';
 $('#presentation-link').setAttribute('href', present ? '#story' : '#present');
 $('#presentation-link').setAttribute('aria-label', present ? 'Exit presentation mode' : 'Enter presentation mode');
 if (present) playStory(); else stopAuto();
}
window.addEventListener('hashchange', presentationMode);
window.addEventListener('wheel', stopAuto, { passive: true });
window.addEventListener('touchstart', stopAuto, { passive: true });
document.addEventListener('pointerdown', event => {
 if (!event.target.closest('#play-toggle, #play-story, #presentation-link')) stopAuto();
 if (!event.target.closest('.contents, .notes, #contents-toggle, #notes-toggle')) closePanels();
});
document.addEventListener('input', stopAuto);
document.addEventListener('keydown', event => {
 const wasPlaying = playing;
 stopAuto();
 if (event.key === 'Escape') { closePanels(); voice.stop(); return; }
 const interactive = event.target.closest('input,textarea,select,button,a,[contenteditable="true"]');
 if (interactive) return;
 const next = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key);
 const prev = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key);
 if (next || prev || event.key === 'Home' || event.key === 'End') {
  event.preventDefault();
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? 11 : Math.round(scrollPosition()) + (next ? 1 : -1);
  goTo(index);
 } else if (wasPlaying) requestFrame();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopAuto(); voice.stop(); } manageMedia(); });
window.addEventListener('pagehide', () => { stopAuto(); voice.stop(); videoNodes.forEach(video => video.pause()); });
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', measure, { passive: true });
reducedQuery.addEventListener('change', () => { stopAuto(); motionPaused = reducedQuery.matches; updateMotion(); });
new ResizeObserver(measure).observe($('#story'));
measure(); updateMotion(); render();
if (location.hash === '#present') presentationMode();
window.COMPASS = Object.freeze({
 goTo(index) { stopAuto(); goTo(index); },
 getState() { return { scene: active + 1, playing, motionPaused, reducedMotion: reducedQuery.matches, corrected, mode: location.hash === '#present' ? 'presentation' : 'website', liveVoice: false }; }
});
