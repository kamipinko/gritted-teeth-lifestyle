'use client'
/*
 * SlashWipe — three skewed red slash bars that wipe across the screen.
 *
 * Same visual as the GateScreen exit slashes (textless). Used by the
 * quick-forge chain for inter-page navigation: triggers ~600ms of red
 * slashes, then fires onComplete so the parent can router.push.
 *
 * No title text, no headline — just three diagonal bars (red, bright red,
 * deep red) that sweep across at 70ms staggered offsets.
 */
import { useEffect, useState } from 'react'

export default function SlashWipe({ active, onComplete }) {
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    if (!active) { setPhase('idle'); return }
    setPhase('wipe')
    // Slashes finish their 500ms wipe with a 140ms stagger by ~640ms;
    // hand off slightly before that so the destination paints under the
    // fading slashes (visual continuity, no flash).
    const tNav = setTimeout(() => onComplete?.(), 520)
    const tEnd = setTimeout(() => setPhase('done'), 720)
    return () => { clearTimeout(tNav); clearTimeout(tEnd) }
  }, [active, onComplete])

  if (phase === 'idle' || phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden" aria-hidden="true">
      <div style={{
        position: 'absolute', pointerEvents: 'none',
        top: '-25%', left: '-50%', width: '200%', height: '65vh',
        background: '#d4181f',
        transform: 'skewY(-12deg)', transformOrigin: 'top left',
        animation: 'slash-wipe 500ms cubic-bezier(0.7, 0, 0.2, 1) forwards',
      }} />
      <div style={{
        position: 'absolute', pointerEvents: 'none',
        bottom: '-25%', right: '-50%', width: '200%', height: '65vh',
        background: '#ff2a36',
        transform: 'skewY(-12deg)', transformOrigin: 'bottom right',
        animation: 'slash-wipe 500ms cubic-bezier(0.7, 0, 0.2, 1) 70ms forwards',
      }} />
      <div style={{
        position: 'absolute', pointerEvents: 'none',
        top: '-50%', right: '-33%', width: '200%', height: '90vh',
        background: '#7a0e14',
        transform: 'skewY(15deg)', transformOrigin: 'top right',
        animation: 'slash-wipe 500ms cubic-bezier(0.7, 0, 0.2, 1) 140ms forwards',
      }} />
    </div>
  )
}
