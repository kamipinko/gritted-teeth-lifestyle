'use client'
import { useEffect, useState } from 'react'
import { useSound } from '../lib/useSound'

// Slashes take 500ms + 140ms stagger = 640ms total.
// Exit at 600ms — slashes are 95%+ across, seamless handoff to gate-reveal.
const EXIT_MS = 600

export default function GateScreen({ onEnter, onMusicStart, swipeHintLabels }) {
  const { play } = useSound()
  const [phase, setPhase] = useState('pre')
  // pre → in → idle → out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('in'), 60)
    const t2 = setTimeout(() => setPhase('idle'), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleClick = () => {
    if (phase !== 'idle') return
    // Fire bg music start SYNCHRONOUSLY inside the user-gesture handler. iOS PWA
    // blocks audio.play() outside the synchronous click context — anything called
    // after the setTimeout below is outside that window and the play promise
    // rejects silently.
    if (onMusicStart) onMusicStart()
    play('brand-confirm')
    setPhase('out')
    setTimeout(onEnter, EXIT_MS)
  }

  const active = phase !== 'pre'
  const exiting = phase === 'out'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Enter Gritted Teeth Lifestyle"
      style={{
        // Anchored to the parent <main> (flow-based, min-h:100svh) instead of
        // the viewport. Avoids the iOS PWA safe-area-inset-bottom clip that hits
        // any position:fixed element — even with viewport-fit=cover and a
        // negative-bottom calc. 100svh (small viewport height, locked at parse
        // time) sidesteps the dvh-stale-on-first-mount band on iOS PWA cold
        // launch.
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        width: '100%',
        minHeight: '100%',
        overflow: 'hidden',
        // Dark-red base matches the html/body globals.css bg + the atmospheric
        // base layer below, so the corners read red not black if anything clips.
        background: '#280609', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Noise grain */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />

      {/* Edge-to-edge dark-red base — guarantees the corners (and the iOS PWA
          home-indicator strip past the safe area) read red, not pure black, even
          when the radial bloom + skewed bands don't quite reach. Painted before
          everything else so the bands + bloom layer over it. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(40,6,9,1)',
          opacity: active ? 1 : 0,
          transition: 'opacity 900ms ease 200ms',
        }}
      />

      {/* Red atmosphere bloom — fades in with entry */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(122,14,20,0.55) 0%, rgba(74,10,14,0.25) 100%)',
          opacity: active ? 1 : 0,
          transition: 'opacity 900ms ease 200ms',
        }}
      />

      {/* ── Diagonal background bands (slide from left) ──
          Each band uses top/bottom anchors instead of explicit height so it
          naturally over-spans the parent in both directions, regardless of
          iOS safe-area or dvh oddities. */}
      {/* Band 1 — deep red, widest */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-25%', bottom: '-25%', left: '-5%', width: '52%',
          background: 'rgba(74,10,14,0.65)',
          transform: active ? 'skewX(-12deg) translateX(0)' : 'skewX(-12deg) translateX(-120%)',
          transition: 'transform 700ms cubic-bezier(0.15, 0, 0.1, 1) 100ms',
        }}
      />
      {/* Band 2 — blood red, medium */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-25%', bottom: '-25%', left: '10%', width: '38%',
          background: 'rgba(122,14,20,0.28)',
          transform: active ? 'skewX(-12deg) translateX(0)' : 'skewX(-12deg) translateX(-120%)',
          transition: 'transform 700ms cubic-bezier(0.15, 0, 0.1, 1) 200ms',
        }}
      />
      {/* Band 3 — right side counter-accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-25%', bottom: '-25%', right: '-8%', width: '20%',
          background: 'rgba(74,10,14,0.4)',
          transform: active ? 'skewX(-12deg) translateX(0)' : 'skewX(-12deg) translateX(120%)',
          transition: 'transform 700ms cubic-bezier(0.15, 0, 0.1, 1) 150ms',
        }}
      />

      {/* ── Corner accent lines ── */}
      <div className="absolute top-0 left-0 bg-gtl-red pointer-events-none"
        style={{ height: 5, width: active ? 168 : 0, transition: 'width 600ms cubic-bezier(0.2,1,0.3,1) 450ms' }} />
      <div className="absolute top-0 left-0 bg-gtl-red pointer-events-none"
        style={{ width: 5, height: active ? 168 : 0, transition: 'height 600ms cubic-bezier(0.2,1,0.3,1) 500ms' }} />
      <div className="absolute bottom-0 right-0 bg-gtl-red pointer-events-none"
        style={{ height: 5, width: active ? 168 : 0, transition: 'width 600ms cubic-bezier(0.2,1,0.3,1) 450ms' }} />
      <div className="absolute bottom-0 right-0 bg-gtl-red pointer-events-none"
        style={{ width: 5, height: active ? 168 : 0, transition: 'height 600ms cubic-bezier(0.2,1,0.3,1) 500ms' }} />

      {/* ── Swipe hints — plain red, no blend mode, no underlay. */}
      {swipeHintLabels && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 24px)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#000000',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              animation: 'swipe-hint-pulse 2400ms ease-in-out infinite',
            }}
          >
            ▲ {swipeHintLabels.top}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#000000',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              animation: 'swipe-hint-pulse 2400ms ease-in-out infinite',
            }}
          >
            ▼ {swipeHintLabels.bottom}
          </div>
          <style>{`
            @keyframes swipe-hint-pulse {
              0%, 100% { opacity: 0.85; }
              50%      { opacity: 1.0; }
            }
          `}</style>
        </>
      )}

      {/* ── Center content ── */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

        {/* Logo — forge-slam from above */}
        <img
          src="/logo.png"
          alt="GTL"
          style={{
            width: 'clamp(96px, 16vw, 148px)',
            height: 'clamp(96px, 16vw, 148px)',
            borderRadius: '50%',
            objectFit: 'cover',
            animation: active ? 'forge-slam 700ms cubic-bezier(0.2, 1.2, 0.4, 1) 250ms both' : 'none',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>

          {/* Label */}
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.55rem', letterSpacing: '0.4em',
            textTransform: 'uppercase', color: '#000000',
            animation: active ? 'snap-in 400ms cubic-bezier(0.2, 0.9, 0.3, 1.1) 600ms both' : 'none',
          }}>
            GRITTED TEETH LIFESTYLE
          </div>

          {/* Big GTL headline */}
          <div style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontSize: 'clamp(5rem, 14vw, 10rem)',
            lineHeight: 1, letterSpacing: '-0.02em',
            color: '#f1eee5',
            textShadow: '3px 3px 0 #d4181f, 6px 6px 0 #070708',
            animation: active ? 'snap-in 500ms cubic-bezier(0.2, 0.9, 0.3, 1.1) 400ms both' : 'none',
          }}>
            GTL
          </div>

          {/* Slash divider */}
          <div style={{
            height: 5, background: '#d4181f', transform: 'skewX(-12deg)',
            width: active ? 'clamp(8rem, 20vw, 14rem)' : 0,
            transition: 'width 600ms cubic-bezier(0.2, 1, 0.3, 1) 750ms',
          }} />

          {/* PRESS START — snaps in, then blinks */}
          <div style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontSize: 'clamp(1.1rem, 3.2vw, 1.9rem)',
            letterSpacing: '0.25em', color: '#d4181f',
            animation: active
              ? 'snap-in 400ms cubic-bezier(0.2, 0.9, 0.3, 1.1) 800ms both, cursor-blink 1.2s steps(2, end) 1350ms infinite'
              : 'none',
          }}>
            PRESS START
          </div>

          {/* Sub-hint */}
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.5rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: '#000000',
            animation: active ? 'snap-in 400ms cubic-bezier(0.2, 0.9, 0.3, 1.1) 950ms both' : 'none',
          }}>
            // CLICK OR TOUCH TO ENTER //
          </div>

        </div>
      </div>

      {/* ── EXIT: three slash wipes at 500ms each, staggered ── */}
      {exiting && (
        <>
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
        </>
      )}
    </button>
  )
}
