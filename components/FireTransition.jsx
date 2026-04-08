'use client'
/*
 * FireTransition — the branded-name transition overlay.
 *
 * Plays after the letter-branding animation completes on the naming
 * screen. Three overlapping phases:
 *
 *   1. Heat ripple — a white-hot shockwave expanding from the center of
 *      the screen outward, mimicking the heat shockwave from a brand
 *      being struck.
 *   2. Flame rise — layered fire gradients rising from the bottom of the
 *      viewport, flickering horizontally to feel alive, covering the
 *      screen with orange/red/yellow.
 *   3. Consume — a final full-screen saturation before navigation fires.
 *
 * Total duration ~2200ms. Sound impacts fire at the ignition moment and
 * again when the flames peak.
 */
import { useEffect, useState } from 'react'
import { useSound } from '../lib/useSound'

export default function FireTransition({ active, onComplete }) {
  const { play } = useSound()
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      return
    }

    setPhase('ripple')
    play('brand-confirm')

    // Flame rise begins shortly after the ripple starts
    const t1 = setTimeout(() => {
      setPhase('flames')
      play('stamp')
    }, 400)

    // Consume phase — peak fire
    const t2 = setTimeout(() => {
      setPhase('consume')
      play('mega-transition')
    }, 1400)

    // Navigate at peak
    const t3 = setTimeout(() => {
      if (onComplete) onComplete()
    }, 2000)

    // Cleanup
    const t4 = setTimeout(() => setPhase('idle'), 2400)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4)
    }
  }, [active, onComplete, play])

  if (phase === 'idle' && !active) return null

  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Phase 1: Heat ripple — a radial white-hot shockwave expanding
          outward from the center of the screen. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,240,150,0.95) 18%, rgba(255,160,40,0.85) 40%, rgba(212,24,31,0.6) 65%, transparent 90%)',
          mixBlendMode: 'screen',
          animation: phase !== 'idle' ? 'heat-ripple 1400ms cubic-bezier(0.2, 0.6, 0.2, 1) forwards' : 'none',
          willChange: 'transform, opacity',
        }}
      />

      {/* Phase 2: Flame base — primary orange/red layer rising from bottom */}
      <div
        className="absolute inset-0"
        style={{
          animation: phase === 'flames' || phase === 'consume'
            ? 'flame-rise 1800ms cubic-bezier(0.3, 0.5, 0.3, 1) forwards'
            : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(255,255,200,1) 0%, rgba(255,200,60,1) 15%, rgba(255,130,30,0.98) 35%, rgba(212,24,31,0.9) 55%, rgba(122,14,20,0.7) 75%, transparent 100%)',
            mixBlendMode: 'screen',
            animation: phase === 'flames' || phase === 'consume'
              ? 'flame-flicker 180ms steps(4, end) infinite'
              : 'none',
          }}
        />
      </div>

      {/* Phase 2b: Flame secondary layer — hotter core, offset flicker */}
      <div
        className="absolute inset-0"
        style={{
          animation: phase === 'flames' || phase === 'consume'
            ? 'flame-rise 1900ms cubic-bezier(0.3, 0.5, 0.3, 1) 80ms forwards'
            : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 100%, rgba(255,255,220,0.9) 0%, rgba(255,200,80,0.8) 20%, rgba(255,120,30,0.6) 45%, transparent 70%), radial-gradient(ellipse at 70% 100%, rgba(255,240,180,0.85) 0%, rgba(255,180,50,0.7) 25%, rgba(255,80,20,0.55) 50%, transparent 75%)',
            mixBlendMode: 'screen',
            filter: 'blur(10px)',
            animation: phase === 'flames' || phase === 'consume'
              ? 'flame-flicker 220ms steps(5, end) infinite reverse'
              : 'none',
          }}
        />
      </div>

      {/* Phase 2c: Heat glow haze — blurred warm overlay for atmospheric depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center 80%, rgba(255,150,40,0.5) 0%, rgba(212,24,31,0.25) 40%, transparent 80%)',
          mixBlendMode: 'screen',
          filter: 'blur(40px)',
          opacity: phase === 'flames' || phase === 'consume' ? 1 : 0,
          transition: 'opacity 400ms ease-out',
        }}
      />

      {/* Phase 3: Consume — final full-screen saturation */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,230,120,1) 0%, rgba(255,140,30,1) 30%, rgba(212,24,31,1) 60%, rgba(74,10,14,1) 100%)',
          animation: phase === 'consume'
            ? 'fire-consume 1000ms cubic-bezier(0.4, 0, 0.6, 1) forwards'
            : 'none',
          opacity: 0,
          willChange: 'opacity',
        }}
      />

      {/* Embers / noise overlay during flame phase for grit */}
      <div
        className="absolute inset-0 gtl-noise"
        style={{
          opacity: phase === 'flames' || phase === 'consume' ? 0.6 : 0,
          transition: 'opacity 300ms ease-out',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
