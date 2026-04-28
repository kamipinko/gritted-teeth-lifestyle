'use client'
import { useEffect, useRef, useState } from 'react'
import { useSound } from '../lib/useSound'

// Slashes take 500ms + 140ms stagger = 640ms total.
// Exit at 600ms — slashes are 95%+ across, seamless handoff to gate-reveal.
const EXIT_MS = 600
const SWIPE_THRESHOLD = 50
// Double-tap window. iOS uses ~300ms for double-tap-to-zoom; 350ms is slightly
// more lenient and still feels like a "fast second tap" rather than two
// separate intentional taps.
const DOUBLE_TAP_MS = 350

export default function GateScreen({ onEnter, onCommit, onMusicStart, onSkip, onFastToHeist, swipeHintLabels }) {
  const { play } = useSound()
  const [phase, setPhase] = useState('pre')
  // pre → in → idle → out
  // `instant` flag: when set by snapToIdle, all entrance keyframes + transitions
  // null out so elements jump to their settled state instead of continuing to
  // play out their delayed animation schedule.
  const [instant, setInstant] = useState(false)
  const exitTimerRef = useRef(null)
  const touchStartY = useRef(null)
  // Tracks the timestamp of a tap that landed during entrance (snapToIdle).
  // A subsequent tap within DOUBLE_TAP_MS triggers fastToHeist instead of the
  // full idle commit cascade — same effect as a swipe during entrance.
  const lastEntranceTapRef = useRef(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('in'), 60)
    // Entrance cascade ends at ~2150ms (sub-hint snap-in: 1500ms delay + 650ms
    // duration). Trigger idle just after that for a clean handoff.
    const t2 = setTimeout(() => setPhase('idle'), 2200)
    return () => {
      clearTimeout(t1); clearTimeout(t2)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [])

  // Full-cascade commit (idle → gate-exit slashes → onEnter triggers calling
  // card + heist). Used by tap and swipe once the user is at PRESS START.
  const commit = (kind) => {
    if (phase !== 'idle') return
    // Fire bg music start SYNCHRONOUSLY inside the user-gesture handler. iOS PWA
    // blocks audio.play() outside the synchronous click context — anything called
    // after the setTimeout below is outside that window and the play promise
    // rejects silently.
    if (onMusicStart) onMusicStart()
    play('brand-confirm')
    if (onCommit) onCommit(kind)  // sync, so parent can stash target
    setPhase('out')
    exitTimerRef.current = setTimeout(() => onEnter && onEnter(kind), EXIT_MS)
  }

  // Any input during 'out' (tap OR swipe) skips the rest of the cascade.
  const skipFromOut = () => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    if (onSkip) onSkip()
  }

  // Tap during entrance: snap to PRESS START (idle), start music, no commit.
  // User then needs another gesture to commit. `instant` kills the in-flight
  // entrance keyframes/transitions so elements jump to their final state
  // instead of continuing the delayed schedule.
  const snapToIdle = () => {
    if (onMusicStart) onMusicStart()
    setInstant(true)
    setPhase('idle')
  }

  // Swipe during entrance: skip entrance + gate slashes + calling card,
  // play HeistTransition, then route. Music starts here too.
  const fastToHeist = (kind) => {
    if (onMusicStart) onMusicStart()
    play('brand-confirm')
    if (onCommit) onCommit(kind)
    if (onFastToHeist) onFastToHeist(kind)
  }

  const handleClick = () => {
    if (phase === 'out') { skipFromOut(); return }
    const now = Date.now()
    const isDoubleTap = now - lastEntranceTapRef.current < DOUBLE_TAP_MS
    if (phase === 'pre' || phase === 'in') {
      // Two fast taps both during entrance → fastToHeist (same as swipe).
      if (isDoubleTap) { lastEntranceTapRef.current = 0; fastToHeist('fitness'); return }
      lastEntranceTapRef.current = now
      snapToIdle()
      return
    }
    // phase === 'idle' — second tap of a double-tap that started during
    // entrance also fast-tracks. Past the window it's a normal commit.
    if (isDoubleTap) { lastEntranceTapRef.current = 0; fastToHeist('fitness'); return }
    commit('fitness')
  }

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }
  const handleTouchEnd = (e) => {
    if (touchStartY.current == null) return
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current
    const dy = endY - touchStartY.current
    touchStartY.current = null
    const isSwipe = Math.abs(dy) > SWIPE_THRESHOLD
    if (phase === 'out' && isSwipe) { skipFromOut(); return }
    if (isSwipe && (phase === 'pre' || phase === 'in')) {
      fastToHeist(dy < 0 ? 'fitness' : 'nutrition')
      return
    }
    // Tap-then-swipe within DOUBLE_TAP_MS — same effect as double-tap.
    // (Caller's first tap snapped to idle; this swipe lands during 'idle'
    // but inside the followup window, so it short-circuits to fastToHeist
    // instead of running the full commit cascade.)
    if (isSwipe && Date.now() - lastEntranceTapRef.current < DOUBLE_TAP_MS) {
      lastEntranceTapRef.current = 0
      fastToHeist(dy < 0 ? 'fitness' : 'nutrition')
      return
    }
    if (dy < -SWIPE_THRESHOLD)      commit('fitness')
    else if (dy > SWIPE_THRESHOLD)  commit('nutrition')
    // Otherwise it's a tap — click event fires next, handleClick takes it.
  }

  const active = phase !== 'pre'
  const exiting = phase === 'out'
  // Helpers: when `instant` is set, drop all entrance animation/transition so
  // the styled `active`-true target values apply immediately (no in-flight tween).
  const animOf  = (s) => instant ? 'none' : (active ? s : 'none')
  const transOf = (s) => instant ? 'none' : s

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
        // Near-black base — atmospheric bg is red bands + bloom on top of black.
        // iOS PWA safe-area gaps fall back to html/body #280609 (globals.css) +
        // <main>'s #280609, so any clipping reads dark red, not pure black.
        background: '#070708', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Noise grain */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />

      {/* Red atmosphere bloom — bright red center fading to transparent so
          black bg shows through. Brighter than original to give the
          negative-photo difference blend a wider color range to chew on. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 55%, rgba(212,24,31,0.45) 0%, transparent 65%)',
          opacity: active ? 1 : 0,
          transition: transOf('opacity 1400ms ease 300ms'),
        }}
      />

      {/* ── Diagonal background bands (slide from left) ──
          Each band uses top/bottom anchors instead of explicit height so it
          naturally over-spans the parent in both directions, regardless of
          iOS safe-area or dvh oddities. */}
      {/* Band 1 — bright red, widest */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-25%', bottom: '-25%', left: '-5%', width: '52%',
          background: 'rgba(212,24,31,0.75)',
          transform: active ? 'skewX(-12deg) translateX(0)' : 'skewX(-12deg) translateX(-120%)',
          transition: transOf('transform 1100ms cubic-bezier(0.15, 0, 0.1, 1) 150ms'),
        }}
      />
      {/* Band 2 — bright red, medium */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-25%', bottom: '-25%', left: '10%', width: '38%',
          background: 'rgba(212,24,31,0.4)',
          transform: active ? 'skewX(-12deg) translateX(0)' : 'skewX(-12deg) translateX(-120%)',
          transition: transOf('transform 1100ms cubic-bezier(0.15, 0, 0.1, 1) 300ms'),
        }}
      />
      {/* Band 3 — bright red, right-side accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-25%', bottom: '-25%', right: '-8%', width: '20%',
          background: 'rgba(212,24,31,0.55)',
          transform: active ? 'skewX(-12deg) translateX(0)' : 'skewX(-12deg) translateX(120%)',
          transition: transOf('transform 1100ms cubic-bezier(0.15, 0, 0.1, 1) 225ms'),
        }}
      />

      {/* ── Corner accent lines ── */}
      <div className="absolute top-0 left-0 bg-gtl-red pointer-events-none"
        style={{ height: 5, width: active ? 168 : 0, transition: transOf('width 1000ms cubic-bezier(0.2,1,0.3,1) 700ms') }} />
      <div className="absolute top-0 left-0 bg-gtl-red pointer-events-none"
        style={{ width: 5, height: active ? 168 : 0, transition: transOf('height 1000ms cubic-bezier(0.2,1,0.3,1) 800ms') }} />
      <div className="absolute bottom-0 right-0 bg-gtl-red pointer-events-none"
        style={{ height: 5, width: active ? 168 : 0, transition: transOf('width 1000ms cubic-bezier(0.2,1,0.3,1) 700ms') }} />
      <div className="absolute bottom-0 right-0 bg-gtl-red pointer-events-none"
        style={{ width: 5, height: active ? 168 : 0, transition: transOf('height 1000ms cubic-bezier(0.2,1,0.3,1) 800ms') }} />

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
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#d4181f',
              mixBlendMode: 'difference',
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
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#d4181f',
              mixBlendMode: 'difference',
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

        {/* Logo — drops in and bounces on landing. Custom inline keyframe
            (logo-bounce) used instead of the shared forge-slam so the homepage
            entrance can be more dramatic without affecting other call sites. */}
        <style>{`
          @keyframes logo-bounce {
            0%   { opacity: 0; transform: translateY(-140px) scale(0.6); }
            45%  { opacity: 1; transform: translateY(0)      scale(1.18); }
            58%  { transform: translateY(-32px) scale(0.92); }
            70%  { transform: translateY(0)     scale(1.08); }
            80%  { transform: translateY(-12px) scale(0.97); }
            89%  { transform: translateY(0)     scale(1.03); }
            96%  { transform: translateY(-3px)  scale(0.99); }
            100% { transform: translateY(0)     scale(1); }
          }
        `}</style>
        <img
          src="/logo.png"
          alt="GTL"
          style={{
            width: 'clamp(128px, 24vw, 200px)',
            height: 'clamp(128px, 24vw, 200px)',
            borderRadius: '50%',
            objectFit: 'cover',
            animation: animOf('logo-bounce 1300ms linear 400ms both'),
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>

          {/* Label — no entrance animation; visible from t=0 in red so the
              difference-blend live-flips as bands sweep behind it. */}
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.85rem', letterSpacing: '0.35em',
            fontWeight: 800,
            textTransform: 'uppercase', color: '#d4181f',
            mixBlendMode: 'difference',
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
            animation: animOf('snap-in 800ms cubic-bezier(0.2, 0.9, 0.3, 1.1) 650ms both'),
          }}>
            GTL
          </div>

          {/* Slash divider — obeys the same negative-photo rule as the labels */}
          <div style={{
            height: 5, background: '#d4181f', transform: 'skewX(-12deg)',
            mixBlendMode: 'difference',
            width: active ? 'clamp(8rem, 20vw, 14rem)' : 0,
            transition: transOf('width 1000ms cubic-bezier(0.2, 1, 0.3, 1) 1200ms'),
          }} />

          {/* PRESS START — snaps in, then blinks. When `instant` is set
              (entrance tap-skip), drop the snap-in but keep the blink running
              from t=0 so PRESS START is visible-and-pulsing immediately. */}
          <div style={{
            fontFamily: 'Anton, Impact, sans-serif',
            fontSize: 'clamp(1.1rem, 3.2vw, 1.9rem)',
            letterSpacing: '0.25em', color: '#d4181f',
            mixBlendMode: 'difference',
            animation: 'cursor-blink 1.2s steps(2, end) infinite',
          }}>
            PRESS START
          </div>

          {/* Sub-hint — no entrance animation; visible from t=0 in red so the
              difference-blend live-flips as bands sweep behind it. */}
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem', letterSpacing: '0.3em',
            fontWeight: 800,
            textTransform: 'uppercase', color: '#d4181f',
            mixBlendMode: 'difference',
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
