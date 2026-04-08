'use client'
/*
 * /fitness/new — Name Your Cycle screen.
 *
 * The user has just survived a mega heist transition. They're now staring
 * at the most important screen in this slice: a single text input where
 * each typed character starts the size of the screen and crashes down to
 * inline size with a brand-iron sound and a full-screen vibration.
 *
 * - Random default name pre-loaded on mount, cascades in
 * - Each subsequent keystroke triggers char-stamp + screen-shake + sound
 * - Backspace is silent (no shake) — only adds get the moment
 * - Background flavor text reduced to one sentence per latest spec
 * - No forge button; RETREAT is the only way out
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../lib/useSound'
import FireTransition from '../../../components/FireTransition'

const MAX_LEN = 40

const RANDOM_NAMES = [
  'PIERCE THE HEAVENS',
  'FORGE THE ABYSS',
  'BURN THE DAY',
  'DRILL THROUGH STONE',
  'CLIMB THE SPIRAL',
  'BREAK THE CHAIN',
  'STEEL THE WILL',
  'IGNITE THE MARROW',
  'OUTRUN THE SHADOW',
  'EIGHT WEEKS OF FIRE',
  'BLOOD AND BONE',
  'THE CRUCIBLE',
  'INTO THE STORM',
  'FIRST LIGHT',
  'NEVER KNEEL',
  'BEYOND THE BREAK',
  'THE LONG ASCENT',
  'CARVE THE PATH',
]

function pickRandomName() {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
}

/**
 * Reusable retreat button.
 */
function RetreatButton({ href = '/fitness' }) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div
        className={`
          absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}
        `}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span
          className={`
            font-display text-base leading-none transition-all duration-300
            ${hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-red translate-x-0'}
          `}
        >
          ◀
        </span>
        <span
          className={`
            font-mono text-[10px] tracking-[0.3em] uppercase font-bold
            transition-colors duration-300
            ${hovered ? 'text-gtl-paper' : 'text-gtl-chalk'}
          `}
        >
          RETREAT
        </span>
      </div>
    </Link>
  )
}

/**
 * StampedNameInput — the main event.
 *
 * Renders an offscreen real <input> for accessibility/native handling,
 * and a custom display where each character is its own animated <span>.
 * New characters get fresh keys, which forces remount and triggers the
 * mega char-stamp animation.
 *
 * Calls `onCharAdded` whenever a NEW character is typed (not on delete),
 * so the parent can fire the screen shake and sound at the right moment.
 */
function StampedNameInput({ value, onChange, maxLength, isInitialMount, onCharAdded, onConfirm, isBranding }) {
  const inputRef = useRef(null)
  const charKeysRef = useRef([])
  const { play } = useSound()
  const prevLenRef = useRef(0)

  if (value.length !== prevLenRef.current) {
    if (value.length > prevLenRef.current) {
      while (charKeysRef.current.length < value.length) {
        charKeysRef.current.push(`k-${Date.now()}-${Math.random()}`)
      }
    } else {
      charKeysRef.current = charKeysRef.current.slice(0, value.length)
    }
    prevLenRef.current = value.length
  }

  const handleChange = (e) => {
    if (isBranding) return
    const raw = e.target.value
    const next = raw.toUpperCase().slice(0, maxLength)
    if (next.length > value.length) {
      const numAdded = next.length - value.length
      for (let i = 0; i < numAdded; i++) {
        setTimeout(() => onCharAdded && onCharAdded(), i * 60)
      }
    } else if (next.length < value.length) {
      play('char-erase')
    }
    onChange(next)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isBranding && value.trim().length > 0) {
      e.preventDefault()
      if (onConfirm) onConfirm()
    }
  }

  const handleWrapperClick = () => {
    if (isBranding) return
    if (inputRef.current) inputRef.current.focus()
  }

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  return (
    <div
      onClick={handleWrapperClick}
      className="relative cursor-text select-none"
      role="presentation"
      style={{ overflow: 'visible' }}
    >
      {/* Hidden real input — captures all keyboard input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        className="sr-only"
        aria-label="Cycle name"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        disabled={isBranding}
      />

      {/* Visible character display.
          IMPORTANT: overflow visible at every level so the giant scaled
          characters can extend beyond the container without being clipped. */}
      <div
        className="relative flex flex-wrap items-baseline justify-center gap-y-2 min-h-[6rem] px-4"
        style={{ overflow: 'visible' }}
      >
        {value.split('').map((char, i) => (
          <span
            key={isBranding ? `brand-${i}` : charKeysRef.current[i]}
            className={`
              inline-block font-display text-6xl md:text-7xl lg:text-8xl leading-none
              ${isBranding ? 'animate-brand-letter' : 'text-gtl-chalk animate-char-stamp'}
            `}
            style={{
              animationDelay: isBranding
                ? `${i * 20}ms`
                : (isInitialMount ? `${i * 35}ms` : '0ms'),
              transformOrigin: 'center center',
              willChange: 'transform, opacity, filter, color, text-shadow',
              position: 'relative',
              zIndex: 50,
            }}
          >
            {char === ' ' ? '\u00a0' : char}
          </span>
        ))}

        {/* Blinking cursor — hidden during branding */}
        {!isBranding && (
          <span
            className="inline-block w-1.5 md:w-2 h-16 md:h-20 bg-gtl-red-bright animate-cursor-blink ml-1 self-center"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}

export default function NewCycleNamePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [isBranding, setIsBranding] = useState(false)
  const [isFireActive, setIsFireActive] = useState(false)
  const mainRef = useRef(null)
  const { play } = useSound()

  // Pick the random default exactly once on mount
  useEffect(() => {
    const initial = pickRandomName()
    setName(initial)
    const t = setTimeout(() => setIsInitialMount(false), initial.length * 35 + 500)
    return () => clearTimeout(t)
  }, [])

  /**
   * triggerBrandConfirm — fired when the user presses Enter on a non-empty
   * name. Fires the heavy confirm sound, sets branding state (which swaps
   * the character animation class to brand-letter), and navigates to the
   * stub destination after the brand has cooled.
   */
  const triggerBrandConfirm = () => {
    if (isBranding) return
    if (name.trim().length === 0) return
    setIsBranding(true)
    play('brand-confirm')
    // Play a second impact ~400ms in to reinforce the peak of the brand
    setTimeout(() => play('stamp'), 380)
    // Shake the screen once at ignition
    if (mainRef.current) {
      mainRef.current.animate(
        [
          { transform: 'translate(0, 0)' },
          { transform: 'translate(-12px, 8px)' },
          { transform: 'translate(10px, -10px)' },
          { transform: 'translate(-8px, -5px)' },
          { transform: 'translate(6px, 6px)' },
          { transform: 'translate(-4px, 3px)' },
          { transform: 'translate(2px, -2px)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }
      )
    }
    // After the brand cools, fire the fire transition. It then navigates.
    const brandDuration = name.length * 20 + 1650
    setTimeout(() => {
      setIsFireActive(true)
    }, brandDuration)
  }

  /** Called from FireTransition when its sequence peaks — navigate now. */
  const handleFireComplete = () => {
    router.push('/fitness/new/muscles')
  }

  /**
   * triggerImpact — fired by the input whenever a new character is added.
   * Times the sound + screen shake to land at the moment the character
   * "lands" at scale 1, which is roughly 70% through the 480ms animation.
   */
  const triggerImpact = () => {
    if (isBranding) return
    // Land timing: 480ms × 0.70 = 336ms after the keystroke. We delay
    // the sound and shake to sync with the character's impact.
    setTimeout(() => {
      play('char-stamp')
      // Screen shake via Web Animations API — more reliable than CSS
      // class toggling for rapid re-triggering.
      if (mainRef.current) {
        mainRef.current.animate(
          [
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-10px, 6px)' },
            { transform: 'translate(9px, -8px)' },
            { transform: 'translate(-7px, -4px)' },
            { transform: 'translate(6px, 6px)' },
            { transform: 'translate(-5px, 3px)' },
            { transform: 'translate(4px, -5px)' },
            { transform: 'translate(-2px, 4px)' },
            { transform: 'translate(1px, -1px)' },
            { transform: 'translate(0, 0)' },
          ],
          {
            duration: 320,
            easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
          }
        )
      }
    }, 320)
  }

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen overflow-hidden bg-gtl-void"
      style={{ willChange: 'transform' }}
    >
      {/* Background atmospherics */}
      <div className="absolute inset-0 gtl-noise" />

      {/* Ignition flash overlay — only renders during branding */}
      {isBranding && (
        <div
          className="absolute inset-0 pointer-events-none z-40 animate-ignition-flash"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,200,80,0.5) 0%, rgba(255,100,30,0.35) 30%, rgba(212,24,31,0.2) 60%, transparent 100%)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />
      )}

      {/* Diagonal gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(122,14,20,0.30) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.40) 100%)',
        }}
      />

      {/* Kanji watermark — 名 ("name") top-right */}
      <div
        className="absolute -top-12 -right-16 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '46rem',
          lineHeight: '0.8',
          color: '#ffffff',
          opacity: 0.05,
          fontWeight: 900,
        }}
      >
        名
      </div>

      {/* Background flavor text — ONE sentence, oversized, faded inscription */}
      <div
        className="absolute pointer-events-none select-none"
        aria-hidden="true"
        style={{
          right: '4rem',
          bottom: '6rem',
          maxWidth: '54rem',
          opacity: 0.08,
          transform: 'rotate(-1.5deg)',
        }}
      >
        <p className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.0] text-gtl-chalk text-right uppercase">
          You will be stuck with this name for weeks — choose wisely.
        </p>
      </div>

      {/* Top nav row */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <RetreatButton />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / NEW CYCLE / NAME
        </div>
      </nav>

      {/* Main content area */}
      <section className="relative z-10 px-8 pt-12 pb-20 max-w-6xl mx-auto" style={{ overflow: 'visible' }}>
        {/* Step indicator + headline — significantly bolder than v1 */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-0.5 w-20 bg-gtl-red" />
            <span className="font-mono text-xs tracking-[0.4em] uppercase text-gtl-red font-bold">
              STEP / 01 / NAME
            </span>
            <div className="h-0.5 w-20 bg-gtl-red" />
          </div>
          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl text-gtl-chalk leading-none -rotate-1">
            NAME
            <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-2 ml-4">
              YOUR CYCLE
            </span>
          </h1>
        </div>

        {/* The input — center stage */}
        <div className="relative mb-8" style={{ overflow: 'visible' }}>
          {/* Giant ghosted "01" stamp number — much bigger now */}
          <div
            className="absolute -top-32 -left-12 font-display text-[22rem] leading-none text-gtl-red/[0.06] select-none pointer-events-none"
            aria-hidden="true"
          >
            01
          </div>

          <StampedNameInput
            value={name}
            onChange={setName}
            maxLength={MAX_LEN}
            isInitialMount={isInitialMount}
            onCharAdded={triggerImpact}
            onConfirm={triggerBrandConfirm}
            isBranding={isBranding}
          />

          {/* The slot/engraving rail beneath the text — thicker and wider.
              During branding, the slot itself heats and cools along with
              the letters. */}
          <div className="relative mt-6 mx-auto max-w-4xl">
            <div
              className={`h-2.5 gtl-slash ${isBranding ? 'animate-brand-slot' : 'bg-gtl-red-bright'}`}
              aria-hidden="true"
            />
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gtl-red-bright rotate-45" aria-hidden="true" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gtl-red-bright rotate-45" aria-hidden="true" />
          </div>
        </div>

        {/* State indicator + character counter */}
        <div className="mt-8 flex items-center justify-center gap-8">
          <span
            className={`
              font-mono text-xs tracking-[0.3em] uppercase font-bold transition-colors duration-300
              ${isBranding ? 'text-gtl-red-bright' : 'text-gtl-ash'}
            `}
          >
            {isBranding
              ? '▸ BRANDING…'
              : name.length === 0
              ? 'AWAITING DECLARATION'
              : name.length >= MAX_LEN
              ? 'LIMIT REACHED'
              : 'ENGRAVING…'}
          </span>
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-gtl-red font-bold">
            {String(name.length).padStart(2, '0')} / {MAX_LEN}
          </span>
        </div>

        {/* Enter-to-brand hint — only visible when idle and there's a name */}
        {!isBranding && name.trim().length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-gtl-red/60" />
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-ash">
              PRESS
            </span>
            <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 border border-gtl-red text-gtl-red-bright font-mono text-[10px] tracking-[0.2em] font-bold">
              ENTER
            </span>
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-ash">
              TO BRAND
            </span>
            <div className="h-px w-10 bg-gtl-red/60" />
          </div>
        )}
      </section>

      {/* Footer slash */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center gap-4 px-8">
        <div className="h-px flex-1 bg-gtl-edge" />
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
          GRITTED TEETH LIFESTYLE / FITNESS PALACE / NAMING
        </div>
        <div className="h-px flex-1 bg-gtl-edge" />
      </div>

      {/* Fire transition overlay — plays after brand cools, then navigates */}
      <FireTransition active={isFireActive} onComplete={handleFireComplete} />
    </main>
  )
}
