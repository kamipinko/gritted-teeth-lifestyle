'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSound } from '../../lib/useSound'
import HeistTransition from '../../components/HeistTransition'
import RetreatButton from '../../components/RetreatButton'

function ProfileChip({ name, onSelect, onSwipeSelect }) {
  const { play } = useSound()
  // Pointer-tracking refs for swipe-vs-tap discrimination. The decision is
  // made at pointerUp based on the FINAL dx — not a sticky armed flag — so
  // pulling back below the threshold cancels the swipe and falls through to
  // a normal tap.
  const startRef = useRef(null)
  const dxRef = useRef(0)
  const swipeFiredRef = useRef(false)
  const [dragX, setDragX] = useState(0)
  const SWIPE_THRESHOLD = 60

  const handlePointerDown = (e) => {
    startRef.current = { x: e.clientX, y: e.clientY }
    dxRef.current = 0
    swipeFiredRef.current = false
    setDragX(0)
  }
  const handlePointerMove = (e) => {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    // Only follow horizontal-dominant motion. dx clamped to [0, threshold*1.5]
    // so visual progress reflects pullback (release below threshold = cancel).
    if (Math.abs(dx) > Math.abs(dy)) {
      const clamped = Math.max(0, Math.min(dx, SWIPE_THRESHOLD * 1.5))
      dxRef.current = clamped
      setDragX(clamped)
    }
  }
  const handlePointerUp = () => {
    const completed = dxRef.current > SWIPE_THRESHOLD
    if (completed && onSwipeSelect) {
      swipeFiredRef.current = true
      play('card-confirm')
      onSwipeSelect(name)
    }
    startRef.current = null
    dxRef.current = 0
    setDragX(0)
  }
  const handleClick = (e) => {
    // Suppress click only when the gesture actually resolved as a full swipe.
    if (swipeFiredRef.current) {
      e.preventDefault(); e.stopPropagation()
      swipeFiredRef.current = false
      return
    }
    play('option-select')
    onSelect(name)
  }
  const swipeProgress = Math.min(1, dragX / SWIPE_THRESHOLD)

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { startRef.current = null; dxRef.current = 0; swipeFiredRef.current = false; setDragX(0) }}
      onClick={handleClick}
      className="relative group outline-none text-left overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Hover effects gated on (hover: hover) so iOS doesn't sticky-hover on first tap. */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-200 bg-gtl-surface border border-gtl-edge [@media(hover:hover)]:group-hover:bg-gtl-red [@media(hover:hover)]:group-hover:border-transparent"
        style={{ clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      {/* Swipe-progress fill — slides in from left as the user drags right. Reaches
          full red at the threshold to telegraph that the swipe is armed. */}
      <div
        className="absolute inset-0 pointer-events-none bg-gtl-red"
        style={{
          clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)',
          opacity: swipeProgress * 0.85,
          transform: `scaleX(${swipeProgress})`,
          transformOrigin: 'left center',
          transition: dragX === 0 ? 'opacity 200ms, transform 200ms' : 'none',
        }}
        aria-hidden="true"
      />
      <div
        className="relative px-7 py-5 flex items-center gap-3"
        style={{ transform: `translateX(${dragX * 0.3}px)`, transition: dragX === 0 ? 'transform 200ms' : 'none' }}
      >
        <span className="font-display text-3xl leading-none transition-colors duration-200 text-gtl-chalk [@media(hover:hover)]:group-hover:text-gtl-paper">
          {name.toUpperCase()}
        </span>
        <span className="font-display text-xl leading-none transition-all duration-200 text-gtl-red [@media(hover:hover)]:group-hover:text-gtl-paper [@media(hover:hover)]:group-hover:translate-x-1">➤︎</span>
        {/* Swipe hint — appears on the right, fades in as user drags */}
        <span
          className="ml-auto font-mono text-[8px] tracking-[0.3em] uppercase text-gtl-paper leading-none whitespace-nowrap pointer-events-none"
          style={{ opacity: swipeProgress }}
          aria-hidden="true"
        >
          SKIP →
        </span>
      </div>
    </button>
  )
}

const HUB_TARGET = '/fitness/hub'

export default function ProfilePage() {
  const router = useRouter()
  const { play } = useSound()
  const [profiles, setProfiles] = useState([])
  const [input, setInput] = useState('')
  const [ready, setReady] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const inputRef = useRef(null)
  // Latches once skipAll fires so HeistTransition.onComplete won't double-route.
  const skippedRef = useRef(false)
  // Synchronous flag — set on first selectProfile so a fast follow-up tap on the
  // same chip / submit button skips even if React hasn't committed `transitioning`
  // to state yet (the window pointerdown listener installs in the post-commit
  // useEffect, so there's a brief window where it isn't yet listening).
  const transitioningRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gtl-profiles')
      if (raw) setProfiles(JSON.parse(raw))
    } catch (_) {}
    setReady(true)
  }, [])

  const skipNow = () => {
    if (skippedRef.current) return
    skippedRef.current = true
    router.push(HUB_TARGET)
  }

  // Skip-the-transition: once HeistTransition is active, the next pointer/touch
  // input anywhere on the screen routes to the hub immediately. Listen for
  // both pointerdown AND touchstart in case iOS PWA suppresses pointerdown
  // events during rapid-tap sequences. Taps on RetreatButton (data-retreat)
  // are excluded so retreat navigates back instead of fast-forwarding.
  useEffect(() => {
    if (!transitioning) return
    const handler = (e) => {
      if (e.target?.closest?.('[data-retreat]')) return
      skipNow()
    }
    window.addEventListener('pointerdown', handler, { capture: true })
    window.addEventListener('touchstart',  handler, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', handler, { capture: true })
      window.removeEventListener('touchstart',  handler, { capture: true })
    }
  }, [transitioning])

  const selectProfile = (name) => {
    // Already transitioning → this rapid second tap is a skip.
    if (transitioningRef.current) { skipNow(); return }
    transitioningRef.current = true
    try {
      localStorage.setItem('gtl-active-profile', name)
    } catch (_) {}
    setTransitioning(true)
  }

  // Swipe-select on a profile chip → deep-launch straight through hub/load/active
  // to the first set's weight popup. Skips HeistTransition entirely. Only works
  // if the profile already has an active cycle (training-days populated under pk).
  const swipeSelectProfile = (name) => {
    if (transitioningRef.current) return
    transitioningRef.current = true
    try {
      localStorage.setItem('gtl-active-profile', name)
      localStorage.setItem('gtl-deep-launch', '1')
    } catch (_) {}
    router.push('/fitness/active')
  }

  const handleTransitionComplete = () => {
    if (skippedRef.current) return
    router.push(HUB_TARGET)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = input.trim()
    if (!name) return
    try {
      const existing = JSON.parse(localStorage.getItem('gtl-profiles') || '[]')
      if (!existing.includes(name)) {
        const updated = [name, ...existing]
        localStorage.setItem('gtl-profiles', JSON.stringify(updated))
        setProfiles(updated)
      }
    } catch (_) {}
    play('option-select')
    selectProfile(name)
  }

  const trimmed = input.trim()
  const isNew = trimmed.length > 0 && !profiles.includes(trimmed)
  const isExisting = trimmed.length > 0 && profiles.includes(trimmed)

  return (
    <>
    <main className="relative min-h-screen bg-gtl-void flex flex-col overflow-hidden">
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(122,14,20,0.2) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.3) 100%)',
        }}
      />

      {/* Kanji watermark — top offset rooted at the safe-area floor so it never clips
          into the iOS Dynamic Island camera area. */}
      {/* Content wrapper — atmospheric layers above paint full-bleed (incl. safe area);
          this wrapper holds the actual UI and pads down by the iOS top inset. */}
      <div className="relative z-10 flex-1 flex flex-col">
      {/* Nav */}
      <nav
        className="relative shrink-0 flex items-center justify-between pl-0 pr-8 pb-3"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <RetreatButton href="/" />
        <div className="font-matisse text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / IDENTITY
        </div>
      </nav>

      {/* Main */}
      <section className="relative z-10 flex-1 flex flex-col px-8 pt-0 pb-8 max-w-3xl mx-auto w-full">
        {/* Headline */}
        <div className="mb-2">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-16 bg-gtl-red" />
            <span className="font-matisse text-[10px] tracking-[0.3em] uppercase text-gtl-red">
              IDENTITY / 01
            </span>
          </div>
          <h1 className="font-matisse text-[5rem] md:text-[7rem] leading-[0.9] text-gtl-chalk -rotate-1">
            WHO<br />
            <span className="text-gtl-red inline-block rotate-1">ARE YOU</span>
          </h1>
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-gtl-ash mt-1 max-w-sm">
            Your cycles, lifts, and EXP belong to you alone.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} action="/" method="post" className="mb-3">
          <div className="flex items-stretch gap-0">
            <div className="relative flex-1">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: 'polygon(0% 0%, 97% 0%, 100% 100%, 0% 100%)',
                  background: '#111115',
                  border: '1px solid #3a3a42',
                }}
                aria-hidden="true"
              />
              {/* Visible-prompt overlay — shows when input is empty. Sits inside the
                  input's slot but is a sibling div, NOT the input's placeholder. iOS
                  heuristics scan placeholder text for "name"/"email" keywords; moving
                  the prompt out of the placeholder attribute kills that signal. */}
              {input.length === 0 && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none flex items-center px-4 md:px-6 font-display text-lg md:text-2xl text-gtl-smoke tracking-wide uppercase"
                >
                  ENTER YOUR N{'​'}AME
                </div>
              )}
              <input
                ref={inputRef}
                type="search"
                name="gtl-warrior-token"
                value={input}
                onChange={e => setInput(e.target.value)}
                inputMode="text"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={24}
                className="relative w-full bg-transparent font-display text-lg md:text-2xl text-gtl-chalk tracking-wide uppercase px-4 md:px-6 py-4 outline-none [&::-webkit-search-cancel-button]:hidden"
                style={{ caretColor: '#d4181f' }}
              />
            </div>
            <button
              type="submit"
              disabled={!trimmed}
              className="relative shrink-0 outline-none group"
            >
              <div
                className={`absolute inset-0 pointer-events-none transition-colors duration-200
                  ${trimmed ? 'bg-gtl-red group-hover:bg-gtl-red-bright' : 'bg-gtl-surface'}`}
                style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }}
                aria-hidden="true"
              />
              <div className="relative px-4 md:px-8 py-4 flex items-center gap-2">
                <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-200
                  ${trimmed ? 'text-gtl-paper' : 'text-gtl-ash'}`}>
                  {isNew ? 'CREATE' : isExisting ? 'ENTER' : 'ENTER'}
                </span>
                <span className={`font-display text-lg leading-none transition-colors duration-200
                  ${trimmed ? 'text-gtl-paper' : 'text-gtl-ash'}`}>➤︎</span>
              </div>
            </button>
          </div>
          {isNew && (
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ash mt-2 pl-1">
              NEW WARRIOR — A FRESH RECORD WILL BE CREATED
            </p>
          )}
        </form>

        {/* Existing profiles */}
        {ready && profiles.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-1">
              <div className="h-px w-8 bg-gtl-edge" />
              <span className="font-matisse text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
                KNOWN WARRIORS
              </span>
              <div className="h-px flex-1 bg-gtl-edge" />
            </div>
            {/* Gesture hint — teaches both interactions for the chip below. */}
            <div className="flex items-center gap-3 mb-1 font-mono text-[8px] tracking-[0.25em] uppercase text-gtl-ash/80">
              <span>TAP TO LOAD PROFILE</span>
              <span className="text-gtl-red">·</span>
              <span>SWIPE TO LIFT NOW →</span>
            </div>
            <div className="flex flex-col gap-3">
              {profiles.map(name => (
                <ProfileChip key={name} name={name} onSelect={selectProfile} onSwipeSelect={swipeSelectProfile} />
              ))}
            </div>
          </div>
        )}

        {/* Settings link — bottom of the IDENTITY page. */}
        <div className="mt-auto pt-10 flex justify-center">
          <Link
            href="/settings"
            onClick={() => play('menu-open')}
            className="group relative outline-none"
          >
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-200 bg-gtl-surface border border-gtl-edge [@media(hover:hover)]:group-hover:border-gtl-red"
              style={{ clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
              aria-hidden="true"
            />
            <div className="relative px-6 py-3 flex items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-4 h-4 shrink-0"
                fill="none"
              >
                {/* Outer gear teeth — red */}
                <path
                  d="M12 1.5l1.6 2.4 2.8-.8 1 2.8 2.8.4-.2 2.9 2.5 1.5-1.4 2.5 1.4 2.5-2.5 1.5.2 2.9-2.8.4-1 2.8-2.8-.8L12 22.5l-1.6-2.4-2.8.8-1-2.8-2.8-.4.2-2.9-2.5-1.5 1.4-2.5L1.5 8.3 4 6.8l-.2-2.9 2.8-.4 1-2.8 2.8.8L12 1.5z"
                  fill="#d4181f"
                />
                {/* Inner cutout — black void */}
                <circle cx="12" cy="12" r="4" fill="#070708" />
              </svg>
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase font-bold text-gtl-chalk [@media(hover:hover)]:group-hover:text-gtl-paper transition-colors duration-200">
                SETTINGS
              </span>
            </div>
          </Link>
        </div>
      </section>
      </div>
    </main>

    <HeistTransition
      active={transitioning}
      onComplete={handleTransitionComplete}
    />
    </>
  )
}
