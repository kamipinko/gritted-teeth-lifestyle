'use client'
/*
 * /fitness — the Choose Your Cycle screen.
 *
 * The user has just survived the heist transition from the home page.
 * They are now inside the Fitness Palace. Their first decision: do they
 * begin a new cycle, or pick up where they left off?
 *
 * Two giant polygonal options. P5 grammar throughout. Asymmetric layout
 * with a kanji watermark, headline in heavy display type, and decorative
 * texture.
 *
 * Both options are stub-routed for this slice — they navigate to
 * /fitness/new and /fitness/load respectively, neither of which exists
 * yet. We'll wire those up in the next slice.
 */
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSound } from '../../../lib/useSound'
import { useProfileGuard } from '../../../lib/useProfileGuard'
import { pk } from '../../../lib/storage'
import HeistTransition from '../../../components/HeistTransition'
import RetreatButton from '../../../components/RetreatButton'

function CycleOption({
  number,
  label,
  caption,
  href,
  variant = 'primary',
  onClick,
}) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)

  const handleEnter = () => { setHovered(true); play('button-hover') }
  const handleLeave = () => setHovered(false)
  const handleClick = (e) => {
    e.preventDefault()
    play('option-select')
    if (onClick) onClick(href)
  }

  const isPrimary = variant === 'primary'

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`
        group relative block w-full text-left
        transition-all duration-300 ease-out
        focus:outline-none focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-gtl-red focus-visible:outline-offset-4
        min-h-[11rem] md:min-h-[20rem]
        ${hovered ? '-translate-y-3 scale-[1.04]' : 'translate-y-0 scale-100'}
      `}
    >
      {/* Idle red glow ring — telegraphs interactivity even at rest */}
      <div
        className={`
          absolute -inset-3 pointer-events-none transition-opacity duration-500
          ${hovered ? 'opacity-100' : 'opacity-30'}
        `}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,42,54,0.35) 0%, transparent 70%)',
          filter: 'blur(24px)',
          animation: hovered ? 'none' : 'pulse-red 2.4s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Card background — clipped polygon */}
      <div
        className={`
          absolute inset-0 gtl-clip-card transition-all duration-300
          ${isPrimary
            ? (hovered ? 'bg-gtl-red-bright' : 'bg-gtl-red')
            : (hovered ? 'bg-gtl-ivory' : 'bg-gtl-paper')}
          ${hovered ? 'shadow-red-glow' : ''}
        `}
      />

      {/* Hover red border layer — a second clipped polygon slightly larger */}
      <div
        className={`
          absolute -inset-1 gtl-clip-card pointer-events-none
          transition-opacity duration-300
          ${hovered ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          background: 'linear-gradient(135deg, #ff2a36 0%, #d4181f 100%)',
          zIndex: -1,
        }}
        aria-hidden="true"
      />

      {/* Inset border layer for depth */}
      <div className={`absolute inset-0 gtl-clip-card ${isPrimary ? 'shadow-inset-edge' : ''}`} />

      {/* Decorative corner number */}
      <div
        className={`
          absolute top-4 right-6 font-mono text-xs tracking-[0.3em]
          transition-colors duration-300
          ${isPrimary
            ? (hovered ? 'text-gtl-paper' : 'text-gtl-paper/70')
            : (hovered ? 'text-gtl-red' : 'text-gtl-ink/60')}
        `}
      >
        OPTION / {number}
      </div>

      {/* Big number stamp — grows on hover */}
      <div
        className={`
          absolute top-3 left-6 font-display leading-none select-none
          transition-all duration-500 ease-out
          ${hovered ? 'text-[10rem]' : 'text-[8rem]'}
          ${isPrimary
            ? (hovered ? 'text-gtl-paper/30' : 'text-gtl-paper/15')
            : (hovered ? 'text-gtl-red/25' : 'text-gtl-ink/10')}
        `}
        aria-hidden="true"
      >
        {number}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8 pt-16">
        {/* Slash bar above the label — grows wider on hover */}
        <div
          className={`
            h-1.5 mb-4 transition-all duration-300 ease-out
            ${hovered ? 'w-32' : 'w-16'}
            ${isPrimary ? 'bg-gtl-paper' : 'bg-gtl-red'}
          `}
          style={{ transform: 'skewX(-12deg)' }}
        />

        <h2
          className={`
            font-display text-6xl leading-none mb-2
            transition-all duration-300 ease-out
            ${hovered ? '-rotate-2 translate-x-1' : '-rotate-1'}
            ${isPrimary ? 'text-gtl-paper' : 'text-gtl-ink'}
          `}
        >
          {label}
        </h2>

        <p
          className={`
            font-mono text-[10px] tracking-[0.25em] uppercase mt-3 max-w-[60%]
            ${isPrimary ? 'text-gtl-paper/80' : 'text-gtl-ink/70'}
          `}
        >
          {caption}
        </p>

        {/* Arrow indicator — much larger and more visible at idle */}
        <div
          className={`
            absolute bottom-6 right-8 flex items-center gap-2
            transition-all duration-300 ease-out
            ${hovered ? 'translate-x-3 scale-110' : 'translate-x-0 scale-100'}
          `}
        >
          <div
            className={`
              font-mono text-[9px] tracking-[0.3em] uppercase
              transition-opacity duration-300
              ${hovered ? 'opacity-100' : 'opacity-0'}
              ${isPrimary ? 'text-gtl-paper' : 'text-gtl-red'}
            `}
          >
            ENGAGE
          </div>
          <div
            className={`
              font-display text-5xl leading-none
              ${isPrimary ? 'text-gtl-paper' : 'text-gtl-red'}
            `}
          >
            ➤︎
          </div>
        </div>
      </div>
    </button>
  )
}

/**
 * GhostOption — the third, less-committal option on the Choose screen.
 * Visually distinct from the two main CycleOption cards: horizontal,
 * shorter, dark/transparent background with a red outline polygon.
 * Reads as a "system" command rather than a painterly choice.
 *
 * Used for "CONTINUE CYCLE WITHOUT SAVING" — a transient/throwaway path
 * for users who want to train without committing to a tracked program.
 */
function GhostOption({ number, label, caption, href, onClick }) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)

  const handleEnter = () => { setHovered(true); play('button-hover') }
  const handleLeave = () => setHovered(false)
  const handleClick = (e) => {
    e.preventDefault()
    play('option-select')
    if (onClick) onClick(href)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`
        group relative block w-full text-left
        transition-all duration-300 ease-out
        focus:outline-none focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-gtl-red focus-visible:outline-offset-4
        ${hovered ? '-translate-y-1 scale-[1.01]' : 'translate-y-0 scale-100'}
      `}
      style={{ minHeight: '7rem' }}
    >
      {/* Outer red glow — far more subtle than the main options */}
      <div
        className={`
          absolute -inset-2 pointer-events-none transition-opacity duration-500
          ${hovered ? 'opacity-60' : 'opacity-15'}
        `}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,42,54,0.4) 50%, transparent 100%)',
          filter: 'blur(16px)',
          animation: hovered ? 'none' : 'pulse-red 3s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Background — dark with red outline */}
      <div
        className={`
          absolute inset-0 gtl-clip-card transition-all duration-300
          ${hovered ? 'bg-gtl-surface' : 'bg-gtl-ink'}
        `}
      />
      {/* Red outline border — slightly larger polygon behind */}
      <div
        className={`
          absolute -inset-[2px] gtl-clip-card pointer-events-none
          transition-all duration-300
          ${hovered ? 'bg-gtl-red-bright opacity-100' : 'bg-gtl-red opacity-70'}
        `}
        style={{ zIndex: -1 }}
        aria-hidden="true"
      />

      {/* Content — laid out horizontally, system-command style */}
      <div className="relative h-full flex items-center gap-3 md:gap-6 px-4 md:px-8 py-5">
        {/* Number stamp on the left — hidden on mobile to give text room */}
        <div
          className={`
            hidden md:block font-display leading-none transition-all duration-300 shrink-0
            ${hovered ? 'text-gtl-red-bright md:text-7xl' : 'text-gtl-red md:text-6xl'}
          `}
          aria-hidden="true"
        >
          {number}
        </div>

        {/* Vertical separator — hidden on mobile */}
        <div
          className={`
            hidden md:block w-px transition-all duration-300
            ${hovered ? 'h-16 bg-gtl-red-bright' : 'h-12 bg-gtl-red/60'}
          `}
        />

        {/* Label and caption */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span
              className={`
                font-mono text-[9px] tracking-[0.3em] uppercase
                transition-colors duration-300
                ${hovered ? 'text-gtl-red-bright' : 'text-gtl-ash'}
              `}
            >
              OPTION / {number} / GHOST
            </span>
            <div className={`h-px flex-1 transition-colors duration-300 ${hovered ? 'bg-gtl-red-bright' : 'bg-gtl-edge'}`} />
          </div>
          <h3
            className={`
              font-display text-xl md:text-3xl lg:text-4xl leading-tight transition-colors duration-300
              ${hovered ? 'text-gtl-paper' : 'text-gtl-chalk'}
            `}
          >
            {label}
          </h3>
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-gtl-ash mt-2 max-w-md">
            {caption}
          </p>
        </div>

        {/* Arrow indicator — visible at idle, more visible on hover */}
        <div
          className={`
            shrink-0 flex items-center gap-2
            transition-all duration-300 ease-out
            ${hovered ? 'translate-x-2 scale-110' : 'translate-x-0 scale-100'}
          `}
        >
          <span
            className={`
              font-mono text-[9px] tracking-[0.3em] uppercase
              transition-opacity duration-300
              ${hovered ? 'opacity-100 text-gtl-red-bright' : 'opacity-0'}
            `}
          >
            PROCEED
          </span>
          <span
            className={`
              font-display text-2xl md:text-4xl leading-none transition-colors duration-300
              ${hovered ? 'text-gtl-red-bright' : 'text-gtl-red'}
            `}
          >
            ➤︎
          </span>
        </div>
      </div>
    </button>
  )
}

export default function FitnessPage() {
  useProfileGuard()
  const router = useRouter()
  const { play } = useSound()
  const [transitioning, setTransitioning] = useState(false)
  const [transitionConfig, setTransitionConfig] = useState({ href: '', title: 'GRIT THOSE TEETH', intensity: 'normal' })
  // Latches once a skip tap fires so HeistTransition.onComplete won't double-route.
  const skippedRef = useRef(false)
  // Synchronous flag — set on first select so a fast follow-up tap on the same
  // button skips even if React hasn't committed `transitioning` to state yet.
  // (The window pointerdown listener installs in the post-commit useEffect, so
  // there's a brief window where it isn't yet listening.)
  const transitioningRef = useRef(false)
  // Stable ref to current href so the pointerdown listener doesn't have to
  // re-bind on every transitionConfig update.
  const hrefRef = useRef('')
  useEffect(() => { hrefRef.current = transitionConfig.href }, [transitionConfig.href])

  const skipNow = () => {
    if (skippedRef.current) return
    skippedRef.current = true
    router.push(hrefRef.current)
  }

  const handleSelect = (href) => {
    // Already transitioning → this rapid second tap is a skip.
    if (transitioningRef.current) { skipNow(); return }
    transitioningRef.current = true
    // NEW CYCLE gets the mega transition; the others get the normal one.
    if (href === '/fitness/new') {
      // Clear any in-progress edit so ETCH CYCLE creates a fresh entry
      try { localStorage.removeItem(pk('editing-cycle-id')) } catch (_) {}
      try { localStorage.removeItem('gtl-back-to-edit') } catch (_) {}
      setTransitionConfig({ href, title: 'NEW CYCLE', intensity: 'mega' })
    } else if (href === '/fitness/load') {
      setTransitionConfig({ href, title: 'FURTHER WITH EVERY TURN', intensity: 'normal' })
    } else if (href === '/fitness/stats') {
      setTransitionConfig({ href, title: 'WAR RECORD', intensity: 'normal' })
    } else {
      setTransitionConfig({ href, title: 'GHOST CYCLE', intensity: 'normal' })
    }
    hrefRef.current = href  // sync immediately so a fast follow-up tap routes to the right place
    setTransitioning(true)
  }

  // Skip-the-transition: once HeistTransition is active, the next pointerdown
  // anywhere on the screen routes to the destination immediately.
  useEffect(() => {
    if (!transitioning) return
    const handler = () => skipNow()
    window.addEventListener('pointerdown', handler, { capture: true })
    return () => window.removeEventListener('pointerdown', handler, { capture: true })
  }, [transitioning])

  const handleTransitionComplete = () => {
    if (skippedRef.current) return
    router.push(transitionConfig.href)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gtl-void">
      {/* Background atmospherics */}
      <div className="absolute inset-0 gtl-noise" />

      {/* Faint diagonal gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(122,14,20,0.25) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.35) 100%)',
        }}
      />

      {/* Kanji watermark — top-left, oversized, very faint. Rooted at safe-area floor
          so it never clips into the iOS Dynamic Island camera area. */}
      <div
        className="absolute -left-8 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) - 48px)',
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '40rem',
          lineHeight: '0.8',
          color: '#ffffff',
          opacity: 0.04,
          fontWeight: 900,
        }}
      >
        闘
      </div>

      {/* Content wrapper — atmospheric layers paint full-bleed (incl. safe area). */}
      <div className="relative z-10 flex-1 flex flex-col">
      {/* Top nav row — back link and palace breadcrumb */}
      <nav
        className="relative flex items-center justify-between pl-0 pr-8 pb-6"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <RetreatButton href="/fitness" />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS
        </div>
      </nav>

      {/* Main content */}
      <section className="relative z-10 px-8 pt-4 pb-6 md:pt-12 md:pb-20 max-w-6xl mx-auto">
        {/* Headline block */}
        <div className="mb-6 md:mb-16">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-16 bg-gtl-red" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red">
              ENTRY POINT / 01
            </span>
          </div>

          <h1 className="font-display text-[3rem] md:text-[8rem] leading-[0.9] text-gtl-chalk -rotate-1">
            CHOOSE
            <br />
            <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-2">
              YOUR CYCLE
            </span>
          </h1>

          <p className="font-mono text-xs tracking-[0.25em] uppercase text-gtl-ash mt-6 max-w-md">
            Forge a new climb, or return to one already in progress.
          </p>
        </div>

        {/* Two options — LOAD first so its tap target overlays the profile-chip
            slot from /fitness (chip y≈444 lands inside LOAD card y=272–530). Quick-nav
            muscle memory. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="md:translate-y-0">
            <CycleOption
              number="01"
              label="LOAD CYCLE"
              caption="Resume an active program. Continue where you left off."
              href="/fitness/load"
              variant="secondary"
              onClick={handleSelect}
            />
          </div>
          <div className="md:translate-y-12">
            <CycleOption
              number="02"
              label="NEW CYCLE"
              caption="Begin from zero. Define the climb. Forge a fresh program."
              href="/fitness/new"
              variant="primary"
              onClick={handleSelect}
            />
          </div>
        </div>

        {/* Third option — ghost / transient path, visually distinct */}
        <div className="mt-20 md:mt-24">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-8 bg-gtl-edge" />
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
              ALTERNATE PATH
            </span>
            <div className="h-px flex-1 bg-gtl-edge" />
          </div>
          <GhostOption
            number="03"
            label="CONTINUE CYCLE WITHOUT SAVING"
            caption="Train without commitment. No record kept, no progress logged."
            href="/fitness/ghost"
            onClick={handleSelect}
          />
          <div className="mt-4">
            <GhostOption
              number="04"
              label="WAR RECORD"
              caption="Career stats. Level, XP, completed days, top muscles."
              href="/fitness/stats"
              onClick={handleSelect}
            />
          </div>
        </div>

        {/* Decorative footer slash */}
        <div className="mt-24 flex items-center gap-4">
          <div className="h-px flex-1 bg-gtl-edge" />
          <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
            GRITTED TEETH LIFESTYLE / FITNESS PALACE
          </div>
          <div className="h-px flex-1 bg-gtl-edge" />
        </div>
      </section>

      </div>
      {/* Heist transition overlay — fires when an option is selected */}
      <HeistTransition
        active={transitioning}
        intensity={transitionConfig.intensity}
        title={transitionConfig.title}
        onComplete={handleTransitionComplete}
      />
    </main>
  )
}
