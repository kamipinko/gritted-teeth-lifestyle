'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import CallingCard from '../components/CallingCard'
import HeistTransition from '../components/HeistTransition'
import GateScreen from '../components/GateScreen'
import { useSound } from '../lib/useSound'

// Module-level singleton: bg music persists across React re-mounts (e.g. when the
// user navigates back to the home page from /fitness). Without this, the unmount
// drops the component-scoped ref but the Audio keeps looping in the browser, and
// the next mount starts a SECOND audio overlapping the first → cacophony.
let bgMusicAudio = null

function startBgMusic() {
  if (bgMusicAudio) return
  const TARGET_VOL = 0.04
  const FADE_MS = 1500

  const fadeIn = (audio) => {
    audio.volume = 0
    audio.play().catch(() => {})
    const steps = FADE_MS / 50
    const increment = TARGET_VOL / steps
    const interval = setInterval(() => {
      const next = Math.min(TARGET_VOL, audio.volume + increment)
      audio.volume = next
      if (next >= TARGET_VOL) clearInterval(interval)
    }, 50)
  }

  const audio = new Audio('/sounds/chrono-cut-1.wav')
  audio.addEventListener('ended', () => {
    audio.currentTime = 0
    fadeIn(audio)
  })
  fadeIn(audio)
  bgMusicAudio = audio
}

const SWIPE_THRESHOLD = 50      // px — minimum vertical drag to register a swipe
const FLASH_DURATION  = 1000    // ms — calling-card hold time before transition kicks in

// CallingCard reveal — wraps the real CallingCard component (the one the original
// post-gate home used) inside a centered full-screen backdrop. The card animates
// in via card-reveal-pop, sits visible for ~FLASH_DURATION, then HeistTransition
// slashes wipe + push the route.
const FITNESS_CARD = {
  title: 'FITNESS',
  subtitle: 'TARGET / PALACE 01',
  body: 'YOUR WEAKNESS HAS BEEN NOTED. THE CLIMB BEGINS THE MOMENT YOU PICK UP THIS CARD.',
  signOff: 'WITH GRITTED TEETH',
  rotate: '-rotate-2',
  compact: false,
}
const NUTRITION_CARD = {
  title: 'NUTRITION',
  subtitle: 'TARGET / PALACE 02',
  body: 'WHAT YOU EAT IS WHO YOU ARE. EVERY MEAL IS A CHOICE. MAKE IT COUNT.',
  signOff: 'STAY DISCIPLINED',
  rotate: 'rotate-2',
  compact: true,
}

function CallingCardReveal({ kind }) {
  const card = kind === 'fitness' ? FITNESS_CARD : NUTRITION_CARD
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'radial-gradient(ellipse at 50% 55%, rgba(74,10,14,0.55) 0%, rgba(7,7,8,0.94) 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        animation: 'card-reveal-fade 1000ms ease-out forwards',
      }}
    >
      <style>{`
        @keyframes card-reveal-fade {
          0%   { opacity: 0; }
          16%  { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes card-reveal-pop {
          0%   { opacity: 0; transform: scale(0.85) translateY(20px); }
          50%  { opacity: 1; transform: scale(1.04) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        style={{
          width: '100%', maxWidth: '20rem',
          animation: 'card-reveal-pop 600ms cubic-bezier(0.2, 1.2, 0.4, 1) forwards',
        }}
      >
        <CallingCard
          title={card.title}
          subtitle={card.subtitle}
          body={card.body}
          signOff={card.signOff}
          rotate={card.rotate}
          compact={card.compact}
          onActivate={() => { /* navigation owned by parent timer */ }}
        />
      </div>
    </div>
  )
}

// Swipe hint — small mono label that floats above the GateScreen at top + bottom
// telling the user which direction maps to which section. Z-index above the gate
// but below transitions; pointer-events disabled so it never blocks the gate's
// touch + click handlers.
function SwipeHint({ position, label }) {
  const isTop = position === 'top'
  return (
    <div
      style={{
        position: 'fixed', left: '50%', zIndex: 51,
        [isTop ? 'top' : 'bottom']: 'env(safe-area-inset-' + (isTop ? 'top' : 'bottom') + ', 24px)',
        marginTop: isTop ? '24px' : 0,
        marginBottom: isTop ? 0 : '24px',
        transform: 'translateX(-50%)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.55rem',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: '#7d7d83',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        animation: 'swipe-hint-pulse 2400ms ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes swipe-hint-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.95; }
        }
      `}</style>
      {isTop ? '▲ ' : '▼ '}{label}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const { play } = useSound()

  // phase: 'gate' (default) → 'flash-fitness' | 'flash-nutrition' → 'transitioning'
  const [phase, setPhase] = useState('gate')
  const [transitionTarget, setTransitionTarget] = useState('/fitness')
  const [transitioning, setTransitioning] = useState(false)
  const touchStartY = useRef(null)

  const activate = (kind) => {
    if (phase !== 'gate') return
    startBgMusic()
    play('brand-confirm')
    setPhase(kind === 'fitness' ? 'flash-fitness' : 'flash-nutrition')
    setTransitionTarget(kind === 'fitness' ? '/fitness' : '/diet')
    // After the calling-card reveal holds for FLASH_DURATION, kick off the
    // heist transition. Route push fires when the slash wipes complete.
    setTimeout(() => setTransitioning(true), FLASH_DURATION)
  }

  const handleTouchStart = (e) => {
    if (phase !== 'gate') return
    touchStartY.current = e.touches[0]?.clientY ?? null
  }
  const handleTouchEnd = (e) => {
    if (phase !== 'gate' || touchStartY.current == null) return
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current
    const dy = endY - touchStartY.current
    touchStartY.current = null
    if (dy < -SWIPE_THRESHOLD) activate('fitness')
    else if (dy > SWIPE_THRESHOLD) activate('nutrition')
    // Otherwise it's a tap (small dy) — GateScreen's onClick handles fallback.
  }

  // Keyboard shortcut: arrow up = fitness, arrow down = nutrition (desktop).
  useEffect(() => {
    if (phase !== 'gate') return
    const handler = (e) => {
      if (e.key === 'ArrowUp')      activate('fitness')
      else if (e.key === 'ArrowDown') activate('nutrition')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  const handleTransitionComplete = () => router.push(transitionTarget)

  // Tap fallback: GateScreen's onClick drives this via setPhase('out')+onEnter.
  // Plain tap (no swipe) defaults to fitness — most-used target.
  const handleGateTapEnter = () => activate('fitness')

  return (
    // Outer wrapper fills the viewport edge-to-edge and paints gtl-void so any
    // gap between phase transitions never shows the browser default. Touch
    // handlers live here and bubble up from GateScreen's button.
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        // Stretch past the iOS home-indicator safe-area so the dark-red base paints
        // edge-to-edge in PWA standalone mode. inset:0 alone gets clipped at
        // safe-area-inset-bottom even with viewport-fit=cover.
        bottom: 'calc(0px - env(safe-area-inset-bottom, 0px))',
        // Match GateScreen's atmospheric base. If anything (the safe-area clip,
        // a phase transition gap) lets the wrapper show through, the user sees
        // dark red — not the void's #070708.
        background: '#280609',
        overflow: 'hidden',
      }}
    >
      {phase === 'gate' && (
        <>
          <GateScreen onEnter={handleGateTapEnter} />
          <SwipeHint position="top"    label="SWIPE UP FOR FITNESS" />
          <SwipeHint position="bottom" label="SWIPE DOWN FOR NUTRITION" />
        </>
      )}
      {phase === 'flash-fitness'   && <CallingCardReveal kind="fitness" />}
      {phase === 'flash-nutrition' && <CallingCardReveal kind="nutrition" />}

      <HeistTransition
        active={transitioning}
        onComplete={handleTransitionComplete}
        title="GTL"
      />
    </div>
  )
}
