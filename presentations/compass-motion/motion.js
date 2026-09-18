(() => {
  'use strict';
  const deck = document.getElementById('compass-cinema');
  if (!deck) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const titles = ['Think out loud. Move forward.','Stuck before saying yes.','The wrong concern. The wrong answer.','Change your mind. Keep the thread.','Actually, it is the payment.','Same facts. Better question.','One reply. A way forward.','Built. Proposed. To prove.','Test the turn.','Not just an answer. A next step.'];
  titles.forEach((t,i) => { const el = deck.querySelector('#cine-title-'+i); if(el) el.textContent=t; });
  const set = (s,t) => { const e=deck.querySelector(s); if(e)e.textContent=t; };
  set('.cine-intro .cine-sub','From tangled thoughts to one next action.');
  set('.cine-human .cine-quote','“Is it the deadline… or getting paid?”');
  set('.cine-human .cine-small','For independent professionals. Audience hypothesis.');
  set('.cine-thoughts .cine-sub','Say it. Correct it. Find the next step.');
  set('.cine-draft .cine-sub','50% upfront. Then confirm.');
  set('.cine-proof:not(.cine-problem):not(.cine-pilot) .cine-small','Scripted demo. No live AI connected.');
  const facts=deck.querySelectorAll('.cine-fact-grid article p');
  ['Accept the project?','Delivery date confirmed.','Not the deadline.','What terms would work?'].forEach((t,i)=>{if(facts[i])facts[i].textContent=t;});
  const problem=deck.querySelector('.cine-problem');
  problem?.querySelectorAll('.cine-proof-grid,.cine-small').forEach(e=>e.remove());
  const panel=document.createElement('div');panel.className='compass-shift';
  panel.innerHTML='<div class="shift-top"><span>One thought. A different direction.</span><button class="shift-control" type="button">Replay</button></div><div class="shift-track"><div class="shift-node">Deadline?</div><span class="shift-arrow" aria-hidden="true">→</span><div class="shift-node">Payment.</div></div><p class="shift-caption">“Friday works. I need an upfront payment.”</p><div class="shift-progress" aria-hidden="true"><i></i></div><p class="shift-badge">Scripted concept · Nothing sent</p>';
  problem?.append(panel);
  let animations=[];
  function cancel(){animations.forEach(a=>a.cancel());animations=[];}
  function animate(el, frames, opts){if(el) animations.push(el.animate(frames,{fill:'both',...opts}));}
  let active;
  function enter(){
    if(!deck.open){active=null;cancel();return;}
    const next=deck.querySelector('.cine-slide.is-current');
    if(next===active)return; active=next;cancel();
    if(!next||!deck.open||reduced.matches)return;
    const elements=[...next.querySelectorAll('.cine-eyebrow,h1,h2,.cine-sub,.cine-quote,.cine-glass,.cine-thought-card,.cine-draft-card,.cine-dialogue,.compass-shift')];
    elements.forEach((el,i)=>animate(el,[{opacity:0,transform:'translateY(26px) scale(.98)',filter:'blur(7px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],{duration:650,delay:Math.min(i*75,450),easing:'cubic-bezier(.16,1,.3,1)'}));
    if(next===problem) shift();
  }
  function shift(){
    if(reduced.matches)return;
    const nodes=panel.querySelectorAll('.shift-node');
    animate(nodes[0],[{opacity:1,filter:'blur(0)'},{opacity:.32,filter:'blur(1px)'}],{duration:600,delay:1200});
    animate(nodes[1],[{opacity:0,transform:'translateX(-24px)'},{opacity:1,transform:'translateX(0)'}],{duration:650,delay:1500,easing:'cubic-bezier(.16,1,.3,1)'});
    animate(panel.querySelector('.shift-caption'),[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,delay:2250});
    animate(panel.querySelector('.shift-progress i'),[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:3100});
  }
  panel.querySelector('button').addEventListener('click',()=>{cancel();shift();});
  new MutationObserver(enter).observe(deck,{attributes:true,attributeFilter:['class','open'],subtree:true});
  reduced.addEventListener('change',()=>{cancel();active=null;enter();});
  enter();
  const icon=document.createElement('link');icon.rel='icon';icon.type='image/svg+xml';icon.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0d141e"/><path d="M44 16 36 36 16 44 24 24Z" fill="#abf0de"/><circle cx="30" cy="30" r="4" fill="#0d141e"/></svg>');document.head.append(icon);
  // Future voice integration must supply a real backend; this build requests no microphone access.
  window.COMPASSIntegration=Object.freeze({mode:'scripted-concept',voiceConnected:false});
})();
