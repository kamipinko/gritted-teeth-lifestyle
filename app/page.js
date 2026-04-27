'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import CallingCard from '../components/CallingCard'
import HeistTransition from '../components/HeistTransition'
import GateScreen from '../components/GateScreen'
import { useSound } from '../lib/useSound'

// Pre-create the Audio element at module load with preload='auto' so it's ready
// when the user gestures. iOS PWA standalone mode rejects audio.play() if the
// element was created in the same synchronous tick as play() — even inside a
// user-gesture handler. Pre-creating sidesteps that. loop=true replaces the
// manual 'ended' listener.
const bgMusicAudio = typeof window !== 'undefined'
  ? new Audio('/sounds/chrono-cut-1.wav')
  : null
if (bgMusicAudio) {
  bgMusicAudio.loop = true
  bgMusicAudio.preload = 'auto'
  bgMusicAudio.volume = 0
}

// iOS Chrome PWA (Add-to-Home-Screen, WKWebView) unlocks audio per-element.
// Even when the engine is unlocked by useSound's card-hover primer, this
// Audio element stays locked until it's played-once inside a user gesture.
// Prime it silently on first pointerdown so the actual play() in handleClick
// succeeds. once:true means it runs exactly once, on the first interaction.
if (typeof window !== 'undefined' && bgMusicAudio) {
  const primeBgMusic = () => {
    bgMusicAudio.muted = true
    const p = bgMusicAudio.play()
    if (p && typeof p.then === 'function') {
      p.then(() => {
        bgMusicAudio.pause()
        bgMusicAudio.currentTime = 0
        bgMusicAudio.muted = false
      }).catch(() => {
        // If even the muted prime fails, leave muted=true reset and let
        // startBgMusic's load()-and-retry path try later.
        bgMusicAudio.muted = false
      })
    }
  }
  window.addEventListener('pointerdown', primeBgMusic, { once: true })
}

let bgMusicStarted = false

function startBgMusic() {
  if (!bgMusicAudio || bgMusicStarted) return
  bgMusicStarted = true

  // Kick off play() inside the user-gesture call stack (caller is GateScreen.handleClick
  // or handleTouchEnd's swipe path — both synchronous to the user tap/swipe).
  const playPromise = bgMusicAudio.play()
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // If iOS rejects (e.g. element wasn't loaded enough), give it a second
      // chance: load() then retry play() on next tick. NOT inside user gesture
      // anymore, but iOS has marked the element as "user-activated" by the
      // first attempt, so the retry usually succeeds.
      bgMusicAudio.load()
      bgMusicAudio.play().catch(() => {})
    })
  }

  // Fade in volume to TARGET_VOL over FADE_MS.
  const TARGET_VOL = 0.04
  const FADE_MS = 1500
  const steps = FADE_MS / 50
  const increment = TARGET_VOL / steps
  const interval = setInterval(() => {
    const next = Math.min(TARGET_VOL, bgMusicAudio.volume + increment)
    bgMusicAudio.volume = next
    if (next >= TARGET_VOL) clearInterval(interval)
  }, 50)
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
        // Top hint clears the Dynamic Island + 24px buffer; bottom hint sits 8px above the
        // home indicator (just enough breathing room — the prior 24px extra margin made the
        // bottom band read as "padding").
        [isTop ? 'top' : 'bottom']: isTop
          ? 'calc(env(safe-area-inset-top, 0px) + 24px)'
          : 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
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
    // bg music is started synchronously by GateScreen.handleClick (tap path) or
    // by handleTouchEnd's swipe paths below — calling it here would be too late
    // for iOS PWA's autoplay rules (audio.play must run inside the user gesture).
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
    if (dy < -SWIPE_THRESHOLD) {
      startBgMusic()        // synchronous to the touchend gesture — iOS PWA audio autoplay
      activate('fitness')
    } else if (dy > SWIPE_THRESHOLD) {
      startBgMusic()
      activate('nutrition')
    }
    // Otherwise it's a tap (small dy) — GateScreen's onClick handles fallback +
    // calls startBgMusic via the onMusicStart prop, also inside the gesture.
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
    // Flow-based wrapper — min-h:100svh + bg-gtl-void matches the original c18b728
    // home and avoids the iOS PWA safe-area-inset clip that plagued any
    // position:fixed parent. html/body underneath paints #280609 (per globals.css)
    // so even if anything bleeds through, the user sees dark red, not black.
    // 100svh (small viewport height) instead of 100dvh: dvh is dynamic and reads
    // stale on the first iOS PWA mount, leaving a bottom-padding band until the
    // page re-renders. svh is locked at parse time — same race-free outcome.
    <main
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden"
      style={{ minHeight: '100svh', background: '#280609' }}
    >
      {phase === 'gate' && (
        <>
          <GateScreen onEnter={handleGateTapEnter} onMusicStart={startBgMusic} />
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
    </main>
  )
}
