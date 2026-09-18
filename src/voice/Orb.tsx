import type { OrbState } from './types'

export const ORB_LABEL: Record<OrbState, string> = {
  idle: 'Ready', listening: 'Listening', thinking: 'Thinking', acting: 'Acting',
  speaking: 'Speaking', interrupted: 'Interrupted', replanning: 'Replanning',
}

/**
 * One persistent element; state only changes CSS custom properties and layer opacity,
 * so every transition morphs instead of swapping screens. Styles: compass-demo.css (.cv-orb).
 */
export default function Orb({ state, size = 176 }: { state: OrbState; size?: number }) {
  return (
    <div className="cv-orb" data-state={state} style={{ width: size, height: size }} aria-hidden="true">
      <div className="cv-orb-halo" />
      <div className="cv-orb-ripple" />
      <div className="cv-orb-ring" />
      <div className="cv-orb-ring cv-orb-ring-b" />
      <div className="cv-orb-arc" />
      <div className="cv-orb-core"><div className="cv-orb-glint" /></div>
      <div className="cv-orb-wave">{[0, 1, 2, 3, 4].map(i => <span key={i} style={{ animationDelay: `${i * -0.17}s` }} />)}</div>
    </div>
  )
}
