'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import CallingCard from '../components/CallingCard'
import HeistTransition from '../components/HeistTransition'
import GateScreen from '../components/GateScreen'
import { useSound } from '../lib/useSound'
import { getCurrentBgmTrack } from '../lib/bgmTracks'

// Pre-create the Audio element at module load with preload='auto' so it's ready
// when the user gestures. iOS PWA standalone mode rejects audio.play() if the
// element was created in the same synchronous tick as play() — even inside a
// user-gesture handler. Pre-creating sidesteps that. loop=true replaces the
// manual 'ended' listener.
//
// Window-level singleton so a stale module reload (HMR, dev refresh, or navigation
// glitch) doesn't create a second Audio instance that plays on top of the first.
const bgMusicAudio = (() => {
  if (typeof window === 'undefined') return null
  if (window.__gtlBgMusic) return window.__gtlBgMusic
  const track = getCurrentBgmTrack()
  const a = new Audio(track.src)
  a.loop = true
  a.preload = 'auto'
  a.volume = 0
  window.__gtlBgMusic = a
  window.__gtlBgMusicTrackId = track.id
  return a
})()

// Pause + reset on page hide/unload so a backgrounded PWA tab doesn't leave a
// zombie audio playing while a refresh creates a second instance.
if (typeof window !== 'undefined' && bgMusicAudio && !window.__gtlBgMusicHideHook) {
  window.__gtlBgMusicHideHook = true
  window.addEventListener('pagehide', () => {
    try { bgMusicAudio.pause(); bgMusicAudio.currentTime = 0 } catch {}
  })
}

// iOS Chrome PWA (Add-to-Home-Screen, WKWebView) unlocks audio per-element.
// Even when the engine is unlocked by useSound's card-hover primer, this
// Audio element stays locked until it's played-once inside a user gesture.
// Prime it silently on first pointerdown so the actual play() in handleClick
// succeeds. once:true means it runs exactly once, on the first interaction.
//
// IMPORTANT: skip the prime entirely when the user has BGM disabled. iOS
// WKWebView has a known quirk where `muted = true` set immediately before
// `play()` doesn't always silence the first ~100-300ms of playback — if the
// singleton survived a prior session at volume 0.04, that brief window is
// audible. If BGM is off, settings/toggle-on will handle the unlock at the
// moment the user re-enables it (that toggle tap is itself a user gesture).
if (typeof window !== 'undefined' && bgMusicAudio) {
  const primeBgMusic = () => {
    try {
      if (window.localStorage.getItem('gtl-bg-music-on') === '0') return
    } catch {}
    bgMusicAudio.muted = true
    // Belt-and-suspenders: if iOS leaks the muted prime, volume 0 = silent.
    bgMusicAudio.volume = 0
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

function startBgMusic() {
  if (!bgMusicAudio) return
  // Settings toggle — if the user disabled bg music, don't start it. Also
  // backstop any audio that primeBgMusic or another race-y path may have
  // left playing (iOS PWA muted-prime leak). Force-pause + reset so we
  // don't leak audible BGM after a fresh launch with the flag off.
  try {
    if (window.localStorage.getItem('gtl-bg-music-on') === '0') {
      try { bgMusicAudio.pause(); bgMusicAudio.currentTime = 0; bgMusicAudio.volume = 0 } catch {}
      return
    }
  } catch {}
  // Trust the audio element's own state: if it's already playing (because a
  // previous mount started it and the module-level singleton is still alive),
  // don't kick another play() and don't re-run the fade interval.
  if (!bgMusicAudio.paused) return

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
        /* Phantom-Thieves throw — card flies in diagonally from off-screen
           top-right while spinning twice CCW, decelerates as it approaches
           the center, lands with a tiny jitter and settles flat. The card's
           own rotate-2 tilt is applied by CallingCard's wrapper inside this
           transform, so the keyframe finishes at rotate(0) to keep the
           final tilt clean. */
        @keyframes card-spin-throw {
          0%   { opacity: 0; transform: translate(140vw, -90vh) rotate(-720deg) scale(0.55); }
          15%  { opacity: 1; }
          70%  { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1.05); }
          80%  { transform: translate(-6px, 3px)  rotate(3deg)    scale(0.97); }
          90%  { transform: translate(2px, -1px)  rotate(-1.5deg) scale(1.02); }
          100% { transform: translate(0, 0)       rotate(0deg)    scale(1); }
        }
      `}</style>
      <div
        style={{
          width: '100%', maxWidth: '20rem',
          // Card is non-interactive in this overlay context — taps pass
          // through to the radial-gradient backdrop, where the window-level
          // pointerdown skip listener catches them. Otherwise the inner
          // CallingCard <button> swallows the tap and triggers its
          // setLaunching() animation while we're trying to route away.
          pointerEvents: 'none',
          animation: 'card-spin-throw 750ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
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

// SwipeHints now live INSIDE GateScreen as absolute children of its button so
// mix-blend-mode:multiply has the atmospheric bands as siblings to blend
// against. See components/GateScreen.jsx for the rendering.

export default function Home() {
  const router = useRouter()
  const { play } = useSound()

  // phase: 'gate' (default) → 'flash-fitness' | 'flash-nutrition' → route
  //   or:  'gate' → 'heist' (swipe during entrance: skip flash, play HeistTransition only)
  const [phase, setPhase] = useState('gate')
  const [transitionTarget, setTransitionTarget] = useState('/fitness')
  const [transitioning, setTransitioning] = useState(false)
  // Holds the FLASH_DURATION → setTransitioning timer so a skip tap can clear it.
  const flashTimerRef = useRef(null)
  // Latches once skipAll fires so we don't double-route from a stale timer or
  // HeistTransition's own onComplete.
  const skippedRef = useRef(false)
  // Stable ref to current transitionTarget for skipAll (avoids re-binding handlers).
  const targetRef = useRef('/fitness')

  const activate = (kind) => {
    if (phase !== 'gate') return
    // bg music is started synchronously by GateScreen.handleClick (tap path) or
    // by handleTouchEnd's swipe paths below — calling it here would be too late
    // for iOS PWA's autoplay rules (audio.play must run inside the user gesture).
    play('brand-confirm')
    const target = kind === 'fitness' ? '/fitness' : '/diet'
    setPhase(kind === 'fitness' ? 'flash-fitness' : 'flash-nutrition')
    setTransitionTarget(target)
    targetRef.current = target
    // After the calling-card reveal holds for FLASH_DURATION, kick off the
    // heist transition. Route push fires when the slash wipes complete.
    flashTimerRef.current = setTimeout(() => setTransitioning(true), FLASH_DURATION)
  }

  // One extra tap after the gate commit skips the rest of the cascade
  // (gate exit slashes → calling card → heist transition). Music is unaffected.
  const skipAll = () => {
    if (skippedRef.current) return
    skippedRef.current = true
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    router.push(targetRef.current)
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

  // Skip-everything: once the gate has been committed (phase !== 'gate'),
  // the next pointerdown anywhere on the screen routes immediately. Using
  // window-level capture sidesteps every per-element gotcha (iOS first-tap
  // hover absorption on the CallingCard button, HeistTransition's
  // pointer-events-none layer, z-index races, etc).
  useEffect(() => {
    if (phase === 'gate') return
    const handler = () => skipAll()
    window.addEventListener('pointerdown', handler, { capture: true })
    return () => window.removeEventListener('pointerdown', handler, { capture: true })
  }, [phase])

  const handleTransitionComplete = () => {
    if (skippedRef.current) return
    router.push(transitionTarget)
  }

  // GateScreen owns its own tap + swipe input. onCommit fires synchronously
  // (so we have the target ref before exit slashes start, in case the user
  // double-taps to skip mid-exit). onEnter fires after EXIT_MS once the
  // gate-exit slashes finish.
  const handleGateCommit = (kind) => {
    targetRef.current = kind === 'fitness' ? '/fitness' : '/diet'
  }
  const handleGateEnter = (kind) => activate(kind)

  // Swipe during the entrance animation — skip entrance + gate exit + calling
  // card; play HeistTransition only, then route. Phase set to 'heist' so
  // neither GateScreen nor CallingCardReveal renders behind the transition.
  const handleFastToHeist = (kind) => {
    const target = kind === 'fitness' ? '/fitness' : '/diet'
    targetRef.current = target
    setTransitionTarget(target)
    setPhase('heist')
    setTransitioning(true)
  }

  return (
    // Flow-based wrapper — min-h:100svh + bg-gtl-void matches the original c18b728
    // home and avoids the iOS PWA safe-area-inset clip that plagued any
    // position:fixed parent. html/body underneath paints #280609 (per globals.css)
    // so even if anything bleeds through, the user sees dark red, not black.
    // 100svh (small viewport height) instead of 100dvh: dvh is dynamic and reads
    // stale on the first iOS PWA mount, leaving a bottom-padding band until the
    // page re-renders. svh is locked at parse time — same race-free outcome.
    <main
      className="relative overflow-hidden"
      style={{ minHeight: '100%', background: '#280609', isolation: 'isolate' }}
    >
      {phase === 'gate' && (
        <GateScreen
          onEnter={handleGateEnter}
          onCommit={handleGateCommit}
          onMusicStart={startBgMusic}
          onSkip={skipAll}
          onFastToHeist={handleFastToHeist}
          swipeHintLabels={{ top: 'SWIPE UP FOR FITNESS', bottom: 'SWIPE DOWN FOR NUTRITION' }}
        />
      )}
      {phase === 'flash-fitness'   && <CallingCardReveal kind="fitness"   />}
      {phase === 'flash-nutrition' && <CallingCardReveal kind="nutrition" />}

      <HeistTransition
        active={transitioning}
        onComplete={handleTransitionComplete}
        title="GTL"
      />
    </main>
  )
}
