'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
const FLASH_DURATION  = 1000    // ms — calling-card flash hold time before navigation

// Inline calling-card flash overlay. Centered, fades in on mount, holds, navigates.
// Each section gets its own colour accent and headline so the user sees confirmation
// of which target their swipe selected before the route changes.
function CallingCardFlash({ kind }) {
  const isFitness = kind === 'fitness'
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'radial-gradient(ellipse at 50% 55%, rgba(74,10,14,0.55) 0%, rgba(7,7,8,0.92) 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'flash-card-pop 1000ms cubic-bezier(0.2, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes flash-card-pop {
          0%   { opacity: 0; transform: scale(0.96); }
          14%  { opacity: 1; transform: scale(1); }
          82%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); }
        }
        @keyframes flash-card-pulse {
          0%, 100% { transform: rotate(${isFitness ? '-2deg' : '2deg'}) scale(1); }
          50%      { transform: rotate(${isFitness ? '-2deg' : '2deg'}) scale(1.03); }
        }
      `}</style>

      <div
        style={{
          background: '#f1eee5',
          padding: '2.5rem 2.75rem',
          minWidth: '18rem', maxWidth: '24rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 4px #d4181f',
          animation: 'flash-card-pulse 1000ms ease-in-out infinite',
          position: 'relative',
        }}
      >
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.6rem', letterSpacing: '0.4em',
          textTransform: 'uppercase', color: '#7a0e14', marginBottom: '0.5rem',
        }}>
          ▸ TARGET ACQUIRED
        </div>
        <div style={{
          fontFamily: 'Anton, Impact, sans-serif',
          fontSize: 'clamp(3rem, 12vw, 5rem)', lineHeight: 1,
          color: '#070708',
          textShadow: '3px 3px 0 #d4181f',
          letterSpacing: '-0.01em',
        }}>
          {isFitness ? 'FITNESS' : 'NUTRITION'}
        </div>
        <div style={{
          marginTop: '1rem',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#070708',
        }}>
          {isFitness ? 'PALACE 01 — INFILTRATING' : 'PALACE 02 — INFILTRATING'}
        </div>
      </div>
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
    // After the calling-card flash holds for FLASH_DURATION, kick off the
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
  // We treat a plain tap (no swipe) as fitness — most-used target.
  const handleGateTapEnter = () => activate('fitness')

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {phase === 'gate' && <GateScreen onEnter={handleGateTapEnter} />}
      {phase === 'flash-fitness' && <CallingCardFlash kind="fitness" />}
      {phase === 'flash-nutrition' && <CallingCardFlash kind="nutrition" />}

      <HeistTransition
        active={transitioning}
        onComplete={handleTransitionComplete}
        title="GTL"
      />
    </div>
  )
}
