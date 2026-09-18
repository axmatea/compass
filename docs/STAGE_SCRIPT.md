# COMPASS · Stage script (present.html)

Source of truth for speech and timing: `src/presentation/stage/slides.js` (the presenter view renders it live).
Timing = speech at ~150 wpm + scripted pauses. Laughs, applause and improvisation are extra.

| # | ON SCREEN | EXACT SPEECH | MOTION | MEDIA | TRIGGER | DURATION |
|---|---|---|---|---|---|---|
| 1 | NAŸL × VINCENT · Russia × France · SaaS founders · [ARR only if verified] | Hey everyone. I'm Nail, originally from Russia, and this is Vincent, from France. We build SaaS products together, products that are already generating real revenue. And lately we've become obsessed with one question. | names mask up, gold × rotates in | founders photo slot (empty) | open on it | ~14 s |
| 2 | Does AI actually feel human? | Quick show of hands. Who here has ever talked to an AI voice agent that was so good... that even your grandma couldn't figure out it was AI? [look around, 3 s] Yeah. Exactly. Neither have we. [laugh, 3 s] | footage fades in, line rises word by word | human-balcony.mp4 | → after "one question" | ~21 s |
| 3 | Humans change their minds. → AI keeps executing. | And that's actually the deeper problem. AI has become incredibly good at following instructions. But humans are terrible at giving final instructions. We change our minds. We interrupt ourselves. We realize halfway through that what we asked for isn't actually what we wanted. [→ line 2, 1 s beat] | step 2: footage freezes + desaturates, line 1 dims | human-speak.mp4 | → after the laugh; → for line 2 | ~19 s |
| 4 | REQUEST — PLAN — ACTION · 7:00 PM · Italian · "Actually, make it 8." · still executing the old plan | And once most agents start acting, [→ action runs] they're optimized around the instruction you already gave them. [→ correction bounces off] | nodes draw in; action shimmer; gold correction drops and bounces; action turns stale | HTML | → ×3 | ~9 s |
| 5 | (orb) COMPASS → AI that adapts while acting. | So we built COMPASS. [→] COMPASS doesn't just answer the request you gave it. It understands when the request changes while it's already acting. | slide 4 collapses into a point, orb grows out of it | orb | → | ~11 s |
| 6 | (orb) Let me show you. → LIVE /demo | But explaining this is boring. Let me just show you. [→] LIVE: "Schedule dinner tomorrow at 7 and find an Italian restaurant." [let it act] "Actually, make it 8. Somewhere near Palo Alto." [2 s] That's the part. | orb expands and dissolves into the live product (frame zoom 1.3 for projector) | LIVE /demo · fallback demo-fallback.mp4 | → opens live · R = recorded · PageDown/presenter = back | ~5 s + ~45 s live |
| 7 | It didn't restart. → It understood what changed. → state strip + Preserve. Supersede. Continue. | Notice what just happened. It didn't restart the conversation. [→] It didn't throw away everything we'd already figured out. It understood what changed... [→] and what didn't. | lines push up; strip lays out: kept values stay, 7:00 PM struck, 8:00 PM and Palo Alto gold | contract v1 fixture | → ×2 | ~12 s |
| 8 | VOICE ↓ BOSON ↓ COMPASS ↓ NEBIUS ↓ ACTION | Underneath it, [→] Boson gives us realtime conversation and interruption. [→] Nebius gives COMPASS the reasoning layer that understands mutable intent and replans actions. But the important part isn't the architecture. It's how the interaction feels. | stack builds; Boson then Nebius light up with one caption each | HTML | → per layer | ~15 s |
| 9 | We're not opening this to everyone. → Design partners. | We're not trying to open COMPASS to everyone tomorrow. [→] We're starting with a small number of design partners where voice AI actually touches real workflows. Because this only gets interesting when COMPASS can actually act. | line 1 dims, "Design partners." lands at 210 px | none | → | ~15 s |
| 10 | (orb) COMPASS · Build with us. · mycompass.world · QR → Thank you. | So if you're building a company where people are still clicking through software they should simply be able to talk to... come find us. Maybe you're one of the first teams we build COMPASS with. [→] Thank you. | orb settles above wordmark; QR fades up | QR svg | → on "Thank you" | ~19 s |

Totals: speech ~2:18 · live demo ~0:45 · full pitch ~3:03 (plan 3:15-3:30 with laughs and applause).

## Keys (audience window)
→ / Space / PageDown / Enter next · ← / PageUp back · 1-9, 0 jump · F fullscreen · P presenter window · D live demo · R recorded demo · Esc close demo · B black screen.
Inside the live demo, typing and the mic belong to /demo; a clicker PageDown returns to the slides (same origin). Hover top-right shows "Back to slides".

## Failsafe
- The demo frame preloads on slide 5. If /demo does not mount the COMPASS UI within 3 s (same origin) or does not load within 6 s, the next → silently plays the recorded demo instead. Presenter view shows `demo: live` or `demo: fallback` before you get there.
- R at any time plays the recorded demo (real /demo replaying the recorded live GLM-5.3 session, same scenario).
- Presenter window (P) mirrors state over BroadcastChannel and can drive everything if the audience window loses focus.

## Open items before stage
- Founders photo: none found locally. Drop a real photo at public/media/present/founders.jpg and set CONFIG.founders.photo.
- ARR: no verified figure (project README records new MRR USD 0). Slot stays hidden. The spoken line "already generating real revenue" must be true for the products you name.
- mycompass.world is purchased but not connected (§17): the QR resolves only after DNS is live.
