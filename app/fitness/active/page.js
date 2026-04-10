'use client'
/*
 * /fitness/active — The live cycle view.
 *
 * Shows the loaded cycle: name hero band, gold stats, and a grid of
 * day cards. Clicking a day triggers a camera-zoom transition: a fullscreen
 * panel expands from the card's position, taking over the entire viewport
 * and showing just that day's muscles. ESC or BACK collapses it.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSound } from '../../../lib/useSound'
import FireFadeIn from '../../../components/FireFadeIn'

const MUSCLE_LABELS = {
  chest: 'CHEST', back: 'BACK', shoulders: 'SHOULDERS',
  biceps: 'BICEPS', triceps: 'TRICEPS', forearms: 'FOREARMS',
  abs: 'ABS', glutes: 'GLUTES', quads: 'QUADS',
  hamstrings: 'HAMSTRINGS', calves: 'CALVES',
}
const DAY_FULL   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const DAY_SHORT  = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const MONTH_FULL  = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']

const SLAB_ROTATIONS = ['-1.5deg','1deg','-0.8deg','1.5deg','-1.2deg','0.8deg','-1.8deg','1.2deg','-0.6deg','1.4deg','-1deg']
const CARD_ROTATIONS = ['-0.8deg','0.6deg','-0.5deg','0.9deg','-0.7deg','0.4deg','-1deg','0.7deg','-0.6deg','0.8deg']

const EXERCISES = {
  chest:      ['BARBELL BENCH PRESS','INCLINE DUMBBELL PRESS','DECLINE BENCH PRESS','DUMBBELL FLY','CABLE CROSSOVER','PEC DECK FLY','PUSH-UP','DIP','LANDMINE PRESS','SVEND PRESS'],
  back:       ['DEADLIFT','PULL-UP','CHIN-UP','BARBELL ROW','DUMBBELL ROW','SEATED CABLE ROW','LAT PULLDOWN','T-BAR ROW','FACE PULL','STRAIGHT-ARM PULLDOWN','RACK PULL','PENDLAY ROW'],
  shoulders:  ['OVERHEAD PRESS','DUMBBELL SHOULDER PRESS','LATERAL RAISE','FRONT RAISE','REAR DELT FLY','UPRIGHT ROW','ARNOLD PRESS','FACE PULL','CABLE LATERAL RAISE','PUSH PRESS'],
  biceps:     ['BARBELL CURL','DUMBBELL CURL','HAMMER CURL','PREACHER CURL','INCLINE DUMBBELL CURL','CABLE CURL','CONCENTRATION CURL','EZ-BAR CURL','SPIDER CURL','REVERSE CURL'],
  triceps:    ['CLOSE-GRIP BENCH PRESS','SKULL CRUSHER','TRICEP PUSHDOWN','OVERHEAD EXTENSION','DIP','DIAMOND PUSH-UP','CABLE OVERHEAD EXTENSION','KICKBACK','JM PRESS','TATE PRESS'],
  forearms:   ['WRIST CURL','REVERSE WRIST CURL','HAMMER CURL','REVERSE CURL','FARMER CARRY','DEAD HANG','PLATE PINCH','BARBELL HOLD','WRIST ROLLER','ZOTTMAN CURL'],
  abs:        ['CRUNCH','PLANK','HANGING LEG RAISE','CABLE CRUNCH','AB WHEEL ROLLOUT','RUSSIAN TWIST','DECLINE SIT-UP','HOLLOW BODY HOLD','DRAGON FLAG','SIDE PLANK','TOE-TO-BAR','PALLOF PRESS'],
  glutes:     ['HIP THRUST','SQUAT','ROMANIAN DEADLIFT','BULGARIAN SPLIT SQUAT','CABLE KICKBACK','SUMO DEADLIFT','GLUTE BRIDGE','STEP-UP','GOOD MORNING','LATERAL BAND WALK'],
  quads:      ['SQUAT','LEG PRESS','LEG EXTENSION','HACK SQUAT','FRONT SQUAT','WALKING LUNGE','BULGARIAN SPLIT SQUAT','STEP-UP','WALL SIT','SPANISH SQUAT'],
  hamstrings: ['ROMANIAN DEADLIFT','LEG CURL','STIFF-LEG DEADLIFT','NORDIC CURL','GLUTE-HAM RAISE','GOOD MORNING','SUMO DEADLIFT','SEATED LEG CURL','CABLE PULL-THROUGH','HIP THRUST'],
  calves:     ['STANDING CALF RAISE','SEATED CALF RAISE','DONKEY CALF RAISE','LEG PRESS CALF RAISE','SINGLE-LEG CALF RAISE','JUMP ROPE','BOX JUMP','TIBIALIS RAISE','CALF PRESS'],
}

function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href="/fitness/load"
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div
        className={`absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}`}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span className={`font-display text-base leading-none transition-all duration-300
          ${hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-red'}`}>◀</span>
        <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300
          ${hovered ? 'text-gtl-paper' : 'text-gtl-chalk'}`}>RETREAT</span>
      </div>
    </Link>
  )
}

function MuscleChip({ id, index }) {
  const rot = SLAB_ROTATIONS[index % SLAB_ROTATIONS.length]
  return (
    <div
      className="px-4 py-2 bg-gtl-red border border-gtl-red-bright shadow-red-glow shrink-0"
      style={{
        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
        transform: `rotate(${rot})`,
      }}
    >
      <div className="font-display text-base text-gtl-paper leading-none whitespace-nowrap">
        {MUSCLE_LABELS[id] || id.toUpperCase()}
      </div>
    </div>
  )
}

/* ── Overview day card — clickable, zooms into focus view ── */
function DayCard({ iso, muscles, index, onClick }) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  const [done, setDone]       = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    try { setDone(localStorage.getItem(`gtl-done-${iso}`) === 'true') } catch (_) {}
  }, [iso])
  const date    = parseDate(iso)
  const dayName = DAY_SHORT[date.getDay()]
  const dayNum  = date.getDate()
  const mon     = MONTH_SHORT[date.getMonth()]
  const hasWork = muscles.length > 0
  const rot     = CARD_ROTATIONS[index % CARD_ROTATIONS.length]

  const handleClick = () => {
    play('option-select')
    const rect = cardRef.current?.getBoundingClientRect() ?? null
    onClick(iso, rect)
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`View ${DAY_FULL[date.getDay()]} ${dayNum} ${MONTH_FULL[date.getMonth()]}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col cursor-pointer select-none outline-none
        focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4
        transition-all duration-200"
      style={{
        transform: hovered
          ? `rotate(${rot}) translateY(-6px) scale(1.03)`
          : `rotate(${rot})`,
        transformOrigin: 'center top',
        overflow: 'visible',
        borderLeft: hasWork ? '4px solid #d4181f' : '4px solid #3a3a42',
        border: hovered ? '1px solid #d4181f' : '1px solid #2a2a30',
        background: hovered ? '#111115' : '#0d0d10',
        boxShadow: hovered ? '0 0 28px rgba(212,24,31,0.2)' : 'none',
      }}
    >
      {/* Date block */}
      <div className="px-4 pt-4 pb-3">
        <div className={`font-display text-3xl leading-none tracking-widest transition-colors duration-200
          ${hasWork ? (hovered ? 'text-gtl-red-bright' : 'text-gtl-red') : 'text-gtl-smoke'}`}>
          {dayName}
        </div>
        <div className="flex items-baseline gap-2 mt-0">
          <span className={`font-display leading-none transition-colors duration-200
            ${hasWork ? 'text-gtl-chalk' : 'text-gtl-ash'}`}
                style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}>
            {dayNum}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">{mon}</span>
        </div>
      </div>

      {hasWork && (
        <div className="mx-4 mb-3 h-0.5 bg-gtl-red" style={{ transform: 'skewX(-8deg)' }} />
      )}

      {/* Muscles */}
      <div className="px-4 pb-6 pt-1 flex flex-wrap gap-x-3 gap-y-4 min-h-[2rem]" style={{ overflow: 'visible' }}>
        {hasWork
          ? muscles.map((id, i) => <MuscleChip key={id} id={id} index={i} />)
          : <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-gtl-smoke self-center">REST</span>}
      </div>

      {/* Tap hint */}
      <div className={`px-4 pb-3 font-mono text-[8px] tracking-[0.3em] uppercase transition-colors duration-200
        ${hovered ? 'text-gtl-red' : 'text-gtl-smoke/0'}`}>
        TAP TO FOCUS ▸
      </div>

      {/* Done X stamp overlay */}
      {done && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <div
            className="font-display leading-none select-none"
            style={{
              fontSize: 'clamp(5rem, 10vw, 12rem)',
              color: 'rgba(212,24,31,0.35)',
              textShadow: '3px 3px 0 rgba(0,0,0,0.5)',
              transform: 'rotate(-6deg)',
              lineHeight: 1,
            }}
          >
            X
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Interactive muscle slab in the day focus view ── */
function MuscleSlab({ id, rot, delay, onClick }) {
  const { play } = useSound()
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onClick(rect)
  }

  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={handleClick}
      onMouseLeave={() => { setPressed(false); setHovered(false) }}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e) } }}
      className="relative cursor-pointer select-none outline-none shrink-0
        focus-visible:outline-2 focus-visible:outline-gtl-paper focus-visible:outline-offset-4"
      style={{
        transform: `rotate(${rot})`,
        animation: `focus-content-in 300ms ${delay}ms ease-out both`,
        overflow: 'visible',
      }}
      aria-label={`View exercises for ${MUSCLE_LABELS[id] || id}`}
    >
      {/* Shadow */}
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(6px, 6px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      {/* Face */}
      <div
        className="relative px-8 py-4"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : hovered ? '#e01e25' : '#d4181f',
          border: hovered ? '2px solid #ff6b6b' : '2px solid #ff2a36',
          transform: pressed ? 'translate(6px, 6px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className="font-display text-gtl-paper leading-none tracking-wide whitespace-nowrap"
             style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>
          {MUSCLE_LABELS[id] || id.toUpperCase()}
        </div>
        {hovered && (
          <div className="font-mono text-[8px] tracking-[0.3em] uppercase text-gtl-paper/60 mt-1">
            TAP FOR EXERCISES ▸
          </div>
        )}
      </div>
    </button>
  )
}

/* ── Reps counter popup ── */
function RepsPopup({ exerciseName, initialReps, rowRect, onClose, onSave }) {
  const { play } = useSound()
  const [reps, setReps]           = useState(initialReps)
  const [pressUp, setPressUp]     = useState(false)
  const [pressDown, setPressDown] = useState(false)
  const [numKey, setNumKey]       = useState(0)   // re-key to replay number pulse
  const [numDir, setNumDir]       = useState('up')
  const [slamming, setSlamming]   = useState(false)
  const [setPressed, setSetPressed] = useState(false)

  const POPUP_WIDTH  = 380
  const POPUP_HEIGHT = 560 // estimated

  // Vertically align popup with the clicked row, clamped to viewport
  const popupTop = rowRect
    ? Math.max(20, Math.min(rowRect.top - POPUP_HEIGHT / 2 + rowRect.height / 2, window.innerHeight - POPUP_HEIGHT - 20))
    : Math.max(20, (window.innerHeight - POPUP_HEIGHT) / 2)

  // Translation for slam-exit: move popup center → row center
  const slamDX = rowRect
    ? (rowRect.left + rowRect.width / 2) - (window.innerWidth / 2)
    : 0
  const slamDY = rowRect
    ? (rowRect.top + rowRect.height / 2) - (popupTop + POPUP_HEIGHT / 2)
    : 200

  // Flame grows with reps: scale 0 at 0 reps, full at ~20 reps
  const flameScale  = Math.min(0.25 + reps * 0.13, 3.0)
  const flameOpacity = Math.min(0.3 + reps * 0.07, 1.0)

  const increment = () => {
    play('option-select')
    setReps((n) => n + 1)
    setNumDir('up')
    setNumKey((k) => k + 1)
  }

  const decrement = () => {
    if (reps <= 0) return
    play('button-hover')
    setReps((n) => n - 1)
    setNumDir('down')
    setNumKey((k) => k + 1)
  }

  const handleSetReps = () => {
    play('stamp')
    setTimeout(() => play('stamp'), 120)
    onSave(reps)
    setSlamming(true)
    setTimeout(onClose, 550)
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')    { onSave(reps); onClose() }
      if (e.key === 'ArrowUp')   { e.preventDefault(); increment() }
      if (e.key === 'ArrowDown') { e.preventDefault(); decrement() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [reps])

  return (
    <>
      <style>{`
        @keyframes reps-in {
          0%   { transform: scale(0.06); opacity: 0; filter: blur(14px); }
          50%  { opacity: 1; filter: blur(2px); }
          70%  { transform: scale(1.06) rotate(-2deg); filter: blur(0); }
          85%  { transform: scale(0.97) rotate(-1deg); }
          100% { transform: scale(1) rotate(-1.5deg); opacity: 1; }
        }
        @keyframes reps-slam-exit {
          0%   { transform: scale(1); opacity: 1; }
          12%  { transform: scale(1.06) rotate(-1deg); opacity: 1; }
          100% { transform: translate(${slamDX}px, ${slamDY}px) scale(0.08) rotate(-6deg); opacity: 0; }
        }
        @keyframes num-up {
          0%   { transform: scale(1); }
          25%  { transform: scale(1.22) translateY(-8px); filter: brightness(1.5); }
          60%  { transform: scale(1.05) translateY(-2px); }
          100% { transform: scale(1) translateY(0); filter: brightness(1); }
        }
        @keyframes num-down {
          0%   { transform: scale(1); }
          20%  { transform: scale(0.82) translateY(6px); filter: brightness(0.7); }
          60%  { transform: scale(0.96) translateY(1px); }
          100% { transform: scale(1) translateY(0); filter: brightness(1); }
        }
        @keyframes flame-core {
          0%,100% { transform: scaleY(1)    scaleX(1)    rotate(-1deg); }
          30%     { transform: scaleY(1.18) scaleX(0.84) rotate(2deg);  }
          65%     { transform: scaleY(0.88) scaleX(1.12) rotate(-3deg); }
        }
        @keyframes flame-mid {
          0%,100% { transform: scaleY(1)    scaleX(1)   rotate(1deg);  }
          40%     { transform: scaleY(1.22) scaleX(0.8) rotate(-2deg); }
          70%     { transform: scaleY(0.9)  scaleX(1.1) rotate(3deg);  }
        }
        @keyframes flame-tip {
          0%,100% { transform: translateY(0)   scaleX(1)    rotate(0deg); opacity: 0.8; }
          50%     { transform: translateY(-10px) scaleX(0.6) rotate(5deg); opacity: 0.5; }
        }
        @keyframes set-reps-glow {
          0%,100% { box-shadow: 0 0 12px rgba(212,24,31,0.3); }
          50%     { box-shadow: 0 0 32px rgba(212,24,31,0.7), 0 0 60px rgba(212,24,31,0.3); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999]"
        style={{ background: 'rgba(7,7,8,0.80)', backdropFilter: 'blur(3px)' }}
        onClick={() => { onSave(reps); onClose() }}
      />

      {/* Outer — position only, zero animation so centering never shifts */}
      <div
        className="fixed z-[10000]"
        style={{
          width: '380px',
          left: '50%',
          marginLeft: '-190px',          /* half of 380px — no transform needed */
          top: popupTop != null ? `${popupTop}px` : '50%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner — animation only, separate element so parent centering is untouched */}
        <div style={{ animation: slamming ? 'reps-slam-exit 500ms cubic-bezier(0.4,0,1,1) forwards' : 'reps-in 500ms cubic-bezier(0.18,1.2,0.35,1) forwards' }}>
        <div
          className="relative w-full flex flex-col items-center px-12 py-10 bg-gtl-ink"
          style={{ clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)' }}
        >
          {/* Atmospherics */}
          <div className="absolute inset-0 gtl-noise pointer-events-none opacity-60" />

          {/* Hard shadow */}
          <div
            className="absolute inset-0 bg-gtl-red-deep -z-10"
            style={{
              clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
              transform: 'translate(10px, 10px)',
            }}
            aria-hidden="true"
          />

          {/* REPS label */}
          <div className="relative font-mono text-[13px] tracking-[0.7em] uppercase text-gtl-red mb-1">
            REPS
          </div>

          {/* Exercise name */}
          <div
            className="relative font-display text-gtl-smoke leading-none mb-6 text-center"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1.4rem)', transform: 'rotate(0.4deg)' }}
          >
            {exerciseName}
          </div>

          {/* ── UP BUTTON + FLAME ── */}
          <div className="relative flex flex-col items-center mb-2">

            {/* Flame — lives above the arrow, scales with reps */}
            <div
              className="pointer-events-none select-none"
              style={{
                height: '80px',
                width: '60px',
                position: 'relative',
                opacity: flameOpacity,
                transform: `scale(${flameScale})`,
                transformOrigin: 'center bottom',
                transition: 'transform 200ms ease-out, opacity 200ms ease-out',
                marginBottom: reps > 0 ? `${Math.min(reps * 4, 60)}px` : '0px',
              }}
              aria-hidden="true"
            >
              {/* Outer flame — orange */}
              <div className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse 55% 80% at 50% 90%, #ff6a00 0%, #ff2a00 40%, transparent 100%)',
                  borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
                  animation: 'flame-core 0.9s ease-in-out infinite',
                  transformOrigin: 'center bottom',
                }} />
              {/* Mid flame — red/yellow */}
              <div className="absolute inset-x-2 inset-y-0"
                style={{
                  background: 'radial-gradient(ellipse 50% 75% at 50% 90%, #ffd200 0%, #ff4500 50%, transparent 100%)',
                  borderRadius: '50% 50% 30% 30% / 55% 55% 45% 45%',
                  animation: 'flame-mid 0.65s ease-in-out infinite',
                  transformOrigin: 'center bottom',
                }} />
              {/* Tip — white/yellow */}
              <div className="absolute inset-x-4 top-0"
                style={{
                  height: '50%',
                  background: 'radial-gradient(ellipse 40% 60% at 50% 90%, #fff7a0 0%, #ffe000 50%, transparent 100%)',
                  borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%',
                  animation: 'flame-tip 0.5s ease-in-out infinite',
                  transformOrigin: 'center bottom',
                }} />
            </div>

            {/* ▲ button */}
            <button
              type="button"
              onMouseDown={() => setPressUp(true)}
              onMouseUp={() => { setPressUp(false); increment() }}
              onMouseLeave={() => setPressUp(false)}
              onMouseEnter={() => play('button-hover')}
              className="relative cursor-pointer select-none outline-none
                focus-visible:outline-2 focus-visible:outline-gtl-red"
              aria-label="Increase reps"
            >
              {/* Shadow */}
              <div className="absolute inset-0 bg-gtl-red-deep"
                style={{
                  clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)',
                  transform: pressUp ? 'translate(0,0)' : 'translate(4px, 4px)',
                  transition: 'transform 60ms ease-out',
                }} aria-hidden="true" />
              {/* Face */}
              <div
                className="relative px-10 py-3"
                style={{
                  clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)',
                  background: pressUp ? '#ff2a36' : '#d4181f',
                  transform: pressUp ? 'translate(4px, 4px)' : 'translate(0,0)',
                  transition: 'transform 60ms ease-out, background 60ms',
                }}
              >
                <div className="font-display text-gtl-paper leading-none"
                     style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>▲</div>
              </div>
            </button>
          </div>

          {/* Number */}
          <div
            key={numKey}
            className="relative font-display leading-none my-2"
            style={{
              fontSize: 'clamp(6rem, 16vw, 12rem)',
              color: reps > 0 ? '#e4b022' : '#c8c8c8',
              textShadow: reps > 0
                ? '5px 5px 0 #8a6612, 10px 10px 0 #070708'
                : '4px 4px 0 #070708',
              lineHeight: '1',
              animation: numKey > 0
                ? `${numDir === 'up' ? 'num-up' : 'num-down'} 300ms ease-out forwards`
                : 'none',
            }}
          >
            {String(reps).padStart(2, '0')}
          </div>

          {/* ▼ button */}
          <button
            type="button"
            onMouseDown={() => setPressDown(true)}
            onMouseUp={() => { setPressDown(false); decrement() }}
            onMouseLeave={() => setPressDown(false)}
            onMouseEnter={() => reps > 0 && play('button-hover')}
            className="relative cursor-pointer select-none outline-none mt-2
              focus-visible:outline-2 focus-visible:outline-gtl-red"
            aria-label="Decrease reps"
            disabled={reps === 0}
          >
            {/* Shadow */}
            <div className="absolute inset-0"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)',
                background: reps === 0 ? '#1a1a1e' : '#8a0e13',
                transform: pressDown ? 'translate(0,0)' : 'translate(4px, 4px)',
                transition: 'transform 60ms ease-out',
              }} aria-hidden="true" />
            {/* Face */}
            <div
              className="relative px-10 py-3"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)',
                background: reps === 0 ? '#1a1a1e' : pressDown ? '#ff2a36' : '#d4181f',
                transform: pressDown ? 'translate(4px, 4px)' : 'translate(0,0)',
                transition: 'transform 60ms ease-out, background 60ms',
              }}
            >
              <div
                className="font-display leading-none"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                  color: reps === 0 ? '#3a3a42' : '#ffffff',
                }}
              >▼</div>
            </div>
          </button>

          {/* SET REPS — the big dramatic confirm */}
          <div className="relative w-full mt-8">
            {/* Spinning ring animation when reps > 0 */}
            {reps > 0 && (
              <div
                className="absolute -inset-1 pointer-events-none"
                style={{
                  clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
                  animation: 'set-reps-glow 1.8s ease-in-out infinite',
                }}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onMouseDown={() => setSetPressed(true)}
              onMouseUp={() => { setSetPressed(false); handleSetReps() }}
              onMouseLeave={() => setSetPressed(false)}
              onMouseEnter={() => play('button-hover')}
              className="relative w-full cursor-pointer select-none outline-none
                focus-visible:outline-2 focus-visible:outline-gtl-red"
              style={{ transform: 'rotate(-1deg)' }}
            >
              {/* Shadow slab */}
              <div
                className="absolute inset-0 bg-gtl-red-deep"
                style={{
                  clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
                  transform: setPressed ? 'translate(0,0)' : 'translate(8px, 8px)',
                  transition: 'transform 80ms ease-out',
                }}
                aria-hidden="true"
              />
              {/* Face */}
              <div
                className="relative flex items-center justify-between px-8 py-5"
                style={{
                  clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
                  background: setPressed ? '#ff2a36' : reps > 0 ? '#d4181f' : '#3a1014',
                  transform: setPressed ? 'translate(8px, 8px)' : 'translate(0,0)',
                  transition: 'transform 80ms ease-out, background 100ms',
                }}
              >
                <div>
                  <div
                    className="font-display text-gtl-paper leading-none tracking-tight"
                    style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
                  >
                    SET REPS
                  </div>
                  <div className="font-mono text-[8px] tracking-[0.4em] uppercase text-gtl-paper/50 mt-1">
                    {reps > 0 ? `${reps} REP${reps !== 1 ? 'S' : ''} / LOCK IT IN` : 'SET A REP COUNT FIRST'}
                  </div>
                </div>
                <div className="font-display text-gtl-paper/40 leading-none"
                     style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
                  ▸
                </div>
              </div>
            </button>
          </div>

        </div>{/* card */}
        </div>{/* animation wrapper */}
      </div>{/* positioning wrapper */}
    </>
  )
}

/* ── Weight setter popup — same drama as RepsPopup, opens first ── */
function WeightPopup({ exerciseName, initialWeight, rowRect, onClose, onSave }) {
  const { play } = useSound()
  const [weight, setWeight]         = useState(initialWeight)
  const [pressUp, setPressUp]       = useState(false)
  const [pressDown, setPressDown]   = useState(false)
  const [numKey, setNumKey]         = useState(0)
  const [numDir, setNumDir]         = useState('up')
  const [slamming, setSlamming]     = useState(false)
  const [setPressed, setSetPressed] = useState(false)

  const POPUP_WIDTH  = 380
  const POPUP_HEIGHT = 560

  const popupTop = rowRect
    ? Math.max(20, Math.min(rowRect.top - POPUP_HEIGHT / 2 + rowRect.height / 2, window.innerHeight - POPUP_HEIGHT - 20))
    : Math.max(20, (window.innerHeight - POPUP_HEIGHT) / 2)

  const slamDX = rowRect ? (rowRect.left + rowRect.width / 2) - (window.innerWidth / 2) : 0
  const slamDY = rowRect ? (rowRect.top + rowRect.height / 2) - (popupTop + POPUP_HEIGHT / 2) : 200

  const flameScale   = Math.min(0.25 + weight * 0.013, 3.0)
  const flameOpacity = Math.min(0.3 + weight * 0.007, 1.0)

  const increment = () => {
    play('option-select')
    setWeight((n) => n + 5)
    setNumDir('up')
    setNumKey((k) => k + 1)
  }

  const decrement = () => {
    if (weight <= 0) return
    play('button-hover')
    setWeight((n) => Math.max(0, n - 5))
    setNumDir('down')
    setNumKey((k) => k + 1)
  }

  const handleSetWeight = () => {
    play('stamp')
    setTimeout(() => play('stamp'), 120)
    onSave(weight)
    setSlamming(true)
    setTimeout(onClose, 550)
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')    { onSave(weight); onClose() }
      if (e.key === 'ArrowUp')   { e.preventDefault(); increment() }
      if (e.key === 'ArrowDown') { e.preventDefault(); decrement() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [weight])

  return (
    <>
      <style>{`
        @keyframes weight-in {
          0%   { transform: scale(0.06); opacity: 0; filter: blur(14px); }
          50%  { opacity: 1; filter: blur(2px); }
          70%  { transform: scale(1.06) rotate(-2deg); filter: blur(0); }
          85%  { transform: scale(0.97) rotate(-1deg); }
          100% { transform: scale(1) rotate(-1.5deg); opacity: 1; }
        }
        @keyframes weight-slam-exit {
          0%   { transform: scale(1); opacity: 1; }
          12%  { transform: scale(1.06) rotate(-1deg); opacity: 1; }
          100% { transform: translate(${slamDX}px, ${slamDY}px) scale(0.08) rotate(-6deg); opacity: 0; }
        }
      `}</style>

      <div className="fixed inset-0 z-[9999]"
        style={{ background: 'rgba(7,7,8,0.80)', backdropFilter: 'blur(3px)' }}
        onClick={() => { onSave(weight); onClose() }}
      />

      <div className="fixed z-[10000]"
        style={{ width: '380px', left: '50%', marginLeft: '-190px', top: `${popupTop}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ animation: slamming ? 'weight-slam-exit 500ms cubic-bezier(0.4,0,1,1) forwards' : 'weight-in 500ms cubic-bezier(0.18,1.2,0.35,1) forwards' }}>
        <div className="relative w-full flex flex-col items-center px-12 py-10 bg-gtl-ink"
          style={{ clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)' }}>
          <div className="absolute inset-0 gtl-noise pointer-events-none opacity-60" />
          <div className="absolute inset-0 bg-gtl-red-deep -z-10"
            style={{ clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)', transform: 'translate(10px, 10px)' }}
            aria-hidden="true" />

          <div className="relative font-mono text-[13px] tracking-[0.7em] uppercase text-gtl-red mb-1">WEIGHT</div>
          <div className="relative font-display text-gtl-smoke leading-none mb-6 text-center"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1.4rem)', transform: 'rotate(0.4deg)' }}>
            {exerciseName}
          </div>

          {/* UP + FLAME */}
          <div className="relative flex flex-col items-center mb-2">
            <div className="pointer-events-none select-none"
              style={{
                height: '80px', width: '60px', position: 'relative',
                opacity: flameOpacity,
                transform: `scale(${flameScale})`, transformOrigin: 'center bottom',
                transition: 'transform 200ms ease-out, opacity 200ms ease-out',
                marginBottom: weight > 0 ? `${Math.min(weight * 0.3, 60)}px` : '0px',
              }}
              aria-hidden="true">
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 80% at 50% 90%, #ff6a00 0%, #ff2a00 40%, transparent 100%)', borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%', animation: 'flame-core 0.9s ease-in-out infinite', transformOrigin: 'center bottom' }} />
              <div className="absolute inset-x-2 inset-y-0" style={{ background: 'radial-gradient(ellipse 50% 75% at 50% 90%, #ffd200 0%, #ff4500 50%, transparent 100%)', borderRadius: '50% 50% 30% 30% / 55% 55% 45% 45%', animation: 'flame-mid 0.65s ease-in-out infinite', transformOrigin: 'center bottom' }} />
              <div className="absolute inset-x-4 top-0" style={{ height: '50%', background: 'radial-gradient(ellipse 40% 60% at 50% 90%, #fff7a0 0%, #ffe000 50%, transparent 100%)', borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%', animation: 'flame-tip 0.5s ease-in-out infinite', transformOrigin: 'center bottom' }} />
            </div>
            <button type="button"
              onMouseDown={() => setPressUp(true)}
              onMouseUp={() => { setPressUp(false); increment() }}
              onMouseLeave={() => setPressUp(false)}
              onMouseEnter={() => play('button-hover')}
              className="relative cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red"
              aria-label="Increase weight">
              <div className="absolute inset-0 bg-gtl-red-deep" style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)', transform: pressUp ? 'translate(0,0)' : 'translate(4px, 4px)', transition: 'transform 60ms ease-out' }} aria-hidden="true" />
              <div className="relative px-10 py-3" style={{ clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)', background: pressUp ? '#ff2a36' : '#d4181f', transform: pressUp ? 'translate(4px, 4px)' : 'translate(0,0)', transition: 'transform 60ms ease-out, background 60ms' }}>
                <div className="font-display text-gtl-paper leading-none" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>▲</div>
              </div>
            </button>
          </div>

          {/* Number */}
          <div key={numKey} className="relative font-display leading-none my-2"
            style={{
              fontSize: 'clamp(6rem, 16vw, 12rem)',
              color: weight > 0 ? '#e4b022' : '#c8c8c8',
              textShadow: weight > 0 ? '5px 5px 0 #8a6612, 10px 10px 0 #070708' : '4px 4px 0 #070708',
              lineHeight: '1',
              animation: numKey > 0 ? `${numDir === 'up' ? 'num-up' : 'num-down'} 300ms ease-out forwards` : 'none',
            }}>
            {weight}
          </div>
          <div className="relative font-mono text-[11px] tracking-[0.5em] uppercase text-gtl-smoke/60 mb-2">LBS</div>

          {/* DOWN */}
          <button type="button"
            onMouseDown={() => setPressDown(true)}
            onMouseUp={() => { setPressDown(false); decrement() }}
            onMouseLeave={() => setPressDown(false)}
            onMouseEnter={() => weight > 0 && play('button-hover')}
            className="relative cursor-pointer select-none outline-none mt-2 focus-visible:outline-2 focus-visible:outline-gtl-red"
            aria-label="Decrease weight" disabled={weight === 0}>
            <div className="absolute inset-0" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)', background: weight === 0 ? '#1a1a1e' : '#8a0e13', transform: pressDown ? 'translate(0,0)' : 'translate(4px, 4px)', transition: 'transform 60ms ease-out' }} aria-hidden="true" />
            <div className="relative px-10 py-3" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)', background: weight === 0 ? '#1a1a1e' : pressDown ? '#ff2a36' : '#d4181f', transform: pressDown ? 'translate(4px, 4px)' : 'translate(0,0)', transition: 'transform 60ms ease-out, background 60ms' }}>
              <div className="font-display leading-none" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: weight === 0 ? '#3a3a42' : '#ffffff' }}>▼</div>
            </div>
          </button>

          {/* SET WEIGHT */}
          <div className="relative w-full mt-8">
            {weight > 0 && (
              <div className="absolute -inset-1 pointer-events-none"
                style={{ clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)', animation: 'set-reps-glow 1.8s ease-in-out infinite' }}
                aria-hidden="true" />
            )}
            <button type="button"
              onMouseDown={() => setSetPressed(true)}
              onMouseUp={() => { setSetPressed(false); handleSetWeight() }}
              onMouseLeave={() => setSetPressed(false)}
              onMouseEnter={() => play('button-hover')}
              className="relative w-full cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red"
              style={{ transform: 'rotate(-1deg)' }}>
              <div className="absolute inset-0 bg-gtl-red-deep" style={{ clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)', transform: setPressed ? 'translate(0,0)' : 'translate(8px, 8px)', transition: 'transform 80ms ease-out' }} aria-hidden="true" />
              <div className="relative flex items-center justify-between px-8 py-5"
                style={{ clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)', background: setPressed ? '#ff2a36' : weight > 0 ? '#d4181f' : '#3a1014', transform: setPressed ? 'translate(8px, 8px)' : 'translate(0,0)', transition: 'transform 80ms ease-out, background 100ms' }}>
                <div>
                  <div className="font-display text-gtl-paper leading-none tracking-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>SET WEIGHT</div>
                  <div className="font-mono text-[8px] tracking-[0.4em] uppercase text-gtl-paper/50 mt-1">
                    {weight > 0 ? `${weight} LBS / LOCK IT IN` : 'SET A WEIGHT FIRST'}
                  </div>
                </div>
                <div className="font-display text-gtl-paper/40 leading-none" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>▸</div>
              </div>
            </button>
          </div>

        </div>{/* card */}
        </div>{/* animation wrapper */}
      </div>{/* positioning wrapper */}
    </>
  )
}

/* ── Single exercise row — click opens reps popup ── */
function ExerciseRow({ name, index, reps, weight, onOpen }) {
  const { play } = useSound()
  const [pressed, setPressed] = useState(false)
  const rowRef = useRef(null)
  const selected = reps > 0

  const handleOpen = () => {
    const rect = rowRef.current?.getBoundingClientRect() ?? null
    onOpen(rect)
  }

  return (
    <li ref={rowRef} style={{ animation: `focus-content-in 250ms ${200 + index * 45}ms ease-out both`, listStyle: 'none' }}>
      <button
        type="button"
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => { setPressed(false); handleOpen() }}
        onMouseLeave={() => setPressed(false)}
        onMouseEnter={() => play('button-hover')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen() } }}
        className="w-full text-left cursor-pointer select-none outline-none
          focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-2"
        aria-label={`Set weight and reps for ${name}${weight > 0 ? ` (${weight}lbs` : ''}${reps > 0 ? ` × ${reps})` : weight > 0 ? ')' : ''}`}
      >
        <div
          className="flex items-center gap-6 py-4 border-b transition-all duration-100"
          style={{
            borderColor: selected ? 'rgba(212,24,31,0.6)' : 'rgba(58,58,66,0.5)',
            background: selected ? 'rgba(212,24,31,0.08)' : 'transparent',
            borderLeft: selected ? '3px solid #d4181f' : '3px solid transparent',
            paddingLeft: '8px',
            transform: pressed ? 'translateY(2px)' : 'translateY(0)',
            transition: 'transform 80ms ease-out, background 100ms, border-color 100ms',
          }}
        >
          {/* Index number */}
          <span
            className="font-display shrink-0 leading-none transition-colors duration-100"
            style={{
              fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
              color: selected ? '#ff2a36' : '#e4b022',
              textShadow: selected ? '2px 2px 0 #8a0e13' : '2px 2px 0 #8a6612',
              minWidth: '2.5rem',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Exercise name */}
          <span
            className="font-display leading-none transition-colors duration-100 flex-1"
            style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
              color: selected ? '#ffffff' : '#c8c8c8',
              transform: index % 2 === 0 ? 'rotate(-0.3deg)' : 'rotate(0.2deg)',
            }}
          >
            {name}
          </span>

          {/* Weight + reps badge — centered between name and right edge */}
          {weight > 0 || reps > 0 ? (
            <div className="shrink-0 flex items-baseline gap-2">
              {weight > 0 && (
                <span className="font-display leading-none"
                  style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: '#e4b022', textShadow: '2px 2px 0 #8a6612, 4px 4px 0 #070708' }}>
                  {weight}<span style={{ fontSize: '0.5em', opacity: 0.7 }}>lbs</span>
                </span>
              )}
              {weight > 0 && reps > 0 && (
                <span className="font-display leading-none" style={{ fontSize: 'clamp(1rem, 2vw, 1.6rem)', color: 'rgba(212,24,31,0.6)' }}>/</span>
              )}
              {reps > 0 && (
                <span className="font-display leading-none"
                  style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: '#e4b022', textShadow: '2px 2px 0 #8a6612, 4px 4px 0 #070708' }}>
                  {reps}×
                </span>
              )}
            </div>
          ) : (
            <span className="font-display shrink-0 leading-none"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: 'rgba(58,58,66,0.4)' }}>◻</span>
          )}
          {/* Right spacer — equal to name's flex-1, pushes badge to center */}
          <div className="flex-1" aria-hidden="true" />
        </div>
      </button>
    </li>
  )
}

/* ── Exercise list panel — zooms from the tapped muscle slab ── */
function ExercisePanel({ muscleId, dayIso, originRect, onClose }) {
  const { play } = useSound()
  const [closing, setClosing]           = useState(false)
  const [reps, setReps]                 = useState({})
  const [weights, setWeights]           = useState({})
  const [activeExercise, setActiveExercise] = useState(null)
  const [activeExerciseRect, setActiveExerciseRect] = useState(null)
  const [phase, setPhase]               = useState(null) // 'weight' | 'reps'
  const exercises    = EXERCISES[muscleId] || []
  const label        = MUSCLE_LABELS[muscleId] || muscleId.toUpperCase()
  const storageKey   = `gtl-ex-${dayIso}-${muscleId}`
  const weightKey    = `gtl-wt-${dayIso}-${muscleId}`

  const originX = originRect ? `${originRect.left + originRect.width / 2}px` : '50vw'
  const originY = originRect ? `${originRect.top + originRect.height / 2}px` : '50vh'

  // Load persisted reps + weights on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setReps(JSON.parse(raw))
    } catch (_) {}
    try {
      const raw = localStorage.getItem(weightKey)
      if (raw) setWeights(JSON.parse(raw))
    } catch (_) {}
  }, [storageKey, weightKey])

  const saveReps = (name, value) => {
    setReps((prev) => {
      const next = { ...prev, [name]: value }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch (_) {}
      return next
    })
  }

  const saveWeight = (name, value) => {
    setWeights((prev) => {
      const next = { ...prev, [name]: value }
      try { localStorage.setItem(weightKey, JSON.stringify(next)) } catch (_) {}
      return next
    })
  }

  const openExercise = (name, rect) => {
    play('option-select')
    setActiveExercise(name)
    setActiveExerciseRect(rect)
    setPhase('weight')
  }

  const closePopup = () => {
    setActiveExercise(null)
    setActiveExerciseRect(null)
    setPhase(null)
  }

  const handleClose = useCallback(() => {
    play('menu-close')
    setClosing(true)
    setTimeout(onClose, 320)
  }, [onClose, play])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  return (
    <div
      className="fixed inset-0 z-[9995] bg-gtl-void overflow-hidden"
      style={{
        transformOrigin: `${originX} ${originY}`,
        animation: closing
          ? 'day-focus-out 320ms cubic-bezier(0.4, 0, 1, 1) forwards'
          : 'day-focus-in 380ms cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
      }}
    >
      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, rgba(122,14,20,0.25) 0%, transparent 50%, rgba(74,10,14,0.35) 100%)' }} />

      {/* Muscle name watermark */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="font-display text-gtl-red leading-none"
          style={{
            fontSize: 'clamp(10rem, 22vw, 22rem)',
            opacity: 0.06,
            transform: 'rotate(8deg)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      </div>

      <div
        className="relative z-10 h-full flex flex-col px-10 py-8 overflow-y-auto"
        style={{ animation: 'focus-content-in 280ms 250ms ease-out both' }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={handleClose}
          className="group self-start relative inline-flex items-center mb-8 outline-none
            focus-visible:outline-2 focus-visible:outline-gtl-red shrink-0"
        >
          <div
            className="absolute inset-0 -inset-x-2 bg-gtl-edge opacity-50 group-hover:bg-gtl-red group-hover:opacity-100 transition-all duration-300"
            style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-3 px-4 py-2">
            <span className="font-display text-base text-gtl-red group-hover:text-gtl-paper group-hover:-translate-x-1 transition-all duration-300 leading-none">◀</span>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase font-bold text-gtl-chalk group-hover:text-gtl-paper transition-colors duration-300">BACK</span>
          </div>
        </button>

        {/* Muscle name header */}
        <div className="shrink-0 mb-2">
          <div className="font-mono text-[10px] tracking-[0.5em] uppercase text-gtl-red mb-3">
            EXERCISES / {label}
          </div>
          <div
            className="font-display text-gtl-chalk leading-none"
            style={{
              fontSize: 'clamp(4rem, 12vw, 10rem)',
              textShadow: '5px 5px 0 #070708',
              transform: 'rotate(-1.5deg)',
              transformOrigin: 'left center',
            }}
          >
            {label}
          </div>
        </div>

        {/* Red slash */}
        <div className="my-8 h-[3px] bg-gtl-red shrink-0"
             style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center', maxWidth: '700px' }} />

        {/* Logged count */}
        {Object.values(reps).filter(v => v > 0).length > 0 && (
          <div className="mb-4 shrink-0 font-mono text-[9px] tracking-[0.35em] uppercase text-gtl-red">
            {Object.values(reps).filter(v => v > 0).length} EXERCISE{Object.values(reps).filter(v => v > 0).length !== 1 ? 'S' : ''} LOGGED
          </div>
        )}

        {/* Exercise list */}
        <ol className="flex flex-col gap-0 shrink-0">
          {exercises.map((name, i) => (
            <ExerciseRow
              key={name}
              name={name}
              index={i}
              reps={reps[name] ?? 0}
              weight={weights[name] ?? 0}
              onOpen={(rect) => openExercise(name, rect)}
            />
          ))}
        </ol>

        {/* Weight popup — opens first */}
        {activeExercise && phase === 'weight' && (
          <WeightPopup
            key={`weight-${activeExercise}`}
            exerciseName={activeExercise}
            initialWeight={weights[activeExercise] ?? 0}
            rowRect={activeExerciseRect}
            onSave={(val) => saveWeight(activeExercise, val)}
            onClose={() => setPhase('reps')}
          />
        )}

        {/* Reps popup — opens after weight */}
        {activeExercise && phase === 'reps' && (
          <RepsPopup
            key={`reps-${activeExercise}`}
            exerciseName={activeExercise}
            initialReps={reps[activeExercise] ?? 0}
            rowRect={activeExerciseRect}
            onSave={(val) => saveReps(activeExercise, val)}
            onClose={closePopup}
          />
        )}

        {/* Bottom breadcrumb */}
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke mt-10 shrink-0">
          PALACE / FITNESS / ACTIVE CYCLE / {label} / EXERCISES
        </div>
      </div>
    </div>
  )
}

/* ── Full-screen day focus — zooms in from the card's position ── */
function DayFocus({ iso, muscles, originRect, onClose }) {
  const { play } = useSound()
  const [closing, setClosing]           = useState(false)
  const [focusMuscle, setFocusMuscle]   = useState(null)
  const [focusMuscleRect, setFocusMuscleRect] = useState(null)
  const date    = parseDate(iso)
  const dayName = DAY_FULL[date.getDay()]
  const dayNum  = date.getDate()
  const month   = MONTH_FULL[date.getMonth()]
  const year    = date.getFullYear()
  const hasWork = muscles.length > 0

  const [allReps, setAllReps]       = useState({})
  const [allWeights, setAllWeights] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [stamped, setStamped]       = useState(() => {
    try { return localStorage.getItem(`gtl-done-${iso}`) === 'true' } catch { return false }
  })

  const handleStamp = () => {
    if (stamped) return
    play('option-select')
    try { localStorage.setItem(`gtl-done-${iso}`, 'true') } catch (_) {}
    setStamped(true)
  }

  // Load all exercise reps + weights for this day's muscles from localStorage
  useEffect(() => {
    if (!hasWork) return
    const loadedReps = {}, loadedWeights = {}
    for (const muscleId of muscles) {
      try {
        const raw = localStorage.getItem(`gtl-ex-${iso}-${muscleId}`)
        if (raw) loadedReps[muscleId] = JSON.parse(raw)
      } catch (_) {}
      try {
        const raw = localStorage.getItem(`gtl-wt-${iso}-${muscleId}`)
        if (raw) loadedWeights[muscleId] = JSON.parse(raw)
      } catch (_) {}
    }
    setAllReps(loadedReps)
    setAllWeights(loadedWeights)
  }, [iso, muscles, refreshKey])

  // Compute transform-origin from the card rect (center of the clicked card)
  const originX = originRect
    ? `${originRect.left + originRect.width / 2}px`
    : '50vw'
  const originY = originRect
    ? `${originRect.top + originRect.height / 2}px`
    : '50vh'

  const handleClose = useCallback(() => {
    play('menu-close')
    setClosing(true)
    setTimeout(onClose, 350)
  }, [onClose, play])

  // Lock body scroll while open
  useEffect(() => {
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  return (
    <>
      <style>{`
        @keyframes day-focus-in {
          0%   { transform: scale(0.08); opacity: 0; filter: blur(12px); }
          40%  { opacity: 1; filter: blur(2px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes day-focus-out {
          0%   { transform: scale(1); opacity: 1; filter: blur(0); }
          100% { transform: scale(0.08); opacity: 0; filter: blur(12px); }
        }
        @keyframes focus-content-in {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes stamp-slam {
          0%   { transform: scale(3) rotate(-8deg); opacity: 0; }
          25%  { opacity: 1; }
          55%  { transform: scale(0.93) rotate(-6deg); }
          70%  { transform: scale(1.04) rotate(-5.5deg); }
          85%  { transform: scale(0.98) rotate(-6deg); }
          100% { transform: scale(1) rotate(-6deg); opacity: 1; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9990] bg-gtl-void overflow-hidden"
        style={{
          transformOrigin: `${originX} ${originY}`,
          animation: closing
            ? 'day-focus-out 350ms cubic-bezier(0.4, 0, 1, 1) forwards'
            : 'day-focus-in 420ms cubic-bezier(0.0, 0.0, 0.2, 1) forwards',
        }}
      >
        {/* Atmospherics */}
        <div className="absolute inset-0 gtl-noise pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(160deg, rgba(122,14,20,0.22) 0%, transparent 50%, rgba(74,10,14,0.32) 100%)' }} />

        {/* Giant day name watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="font-display text-gtl-red leading-none"
            style={{
              fontSize: 'clamp(12rem, 28vw, 26rem)',
              opacity: 0.06,
              transform: 'rotate(-8deg)',
              whiteSpace: 'nowrap',
            }}
          >
            {dayName}
          </div>
        </div>

        {/* Content — delayed fade in after zoom lands */}
        <div
          className="relative z-10 h-full flex flex-col px-10 py-8 overflow-hidden"
          style={{ animation: 'focus-content-in 300ms 280ms ease-out both' }}
        >
          {/* X stamp overlay — inside content div so it can't escape overflow bounds */}
          {stamped && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{ zIndex: 0 }}
            >
              <div
                className="font-display leading-none pointer-events-none"
                style={{
                  fontSize: 'clamp(40vw, 60vw, 90vh)',
                  color: 'rgba(212,24,31,0.18)',
                  textShadow: '0 0 80px rgba(212,24,31,0.12)',
                  transform: 'rotate(-6deg)',
                  animation: 'stamp-slam 500ms cubic-bezier(0.2, 0, 0.4, 1) both',
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                }}
              >
                X
              </div>
            </div>
          )}

          {/* Back button */}
          <button
            type="button"
            onClick={handleClose}
            className="group self-start relative inline-flex items-center mb-auto outline-none
              focus-visible:outline-2 focus-visible:outline-gtl-red"
            style={{ zIndex: 1 }}
          >
            <div
              className="absolute inset-0 -inset-x-2 bg-gtl-edge opacity-50 group-hover:bg-gtl-red group-hover:opacity-100 transition-all duration-300"
              style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3 px-4 py-2">
              <span className="font-display text-base text-gtl-red group-hover:text-gtl-paper group-hover:-translate-x-1 transition-all duration-300 leading-none">◀</span>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase font-bold text-gtl-chalk group-hover:text-gtl-paper transition-colors duration-300">BACK</span>
            </div>
          </button>

          {/* Two-column layout: date+muscles left, exercise log right */}
          <div className="flex-1 relative min-h-0">

            {/* Left column — date display + muscle slabs, absolutely positioned so it doesn't push grid */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center" style={{ zIndex: 1 }}>

              {/* Month + year */}
              <div className="font-mono text-[11px] tracking-[0.5em] uppercase text-gtl-red mb-4">
                {month} · {year}
              </div>

              {/* Day number — dominant */}
              <div
                className="font-display text-gtl-chalk leading-none"
                style={{
                  fontSize: 'clamp(8rem, 22vw, 20rem)',
                  textShadow: '8px 8px 0 #070708, 16px 16px 0 rgba(0,0,0,0.4)',
                  lineHeight: '0.85',
                }}
              >
                {String(dayNum).padStart(2, '0')}
              </div>

              {/* Day of week */}
              <div
                className="font-display text-gtl-red leading-none mt-2"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 7rem)',
                  textShadow: '4px 4px 0 #070708',
                  transform: 'rotate(-1deg)',
                }}
              >
                {dayName}
              </div>

              {/* Red slash divider */}
              <div
                className="my-8 h-[3px] bg-gtl-red"
                style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center', maxWidth: '600px' }}
              />

              {/* Muscle slabs or REST */}
              {hasWork ? (
                <div className="flex flex-wrap gap-x-4 gap-y-6" style={{ overflow: 'visible' }}>
                  {muscles.map((id, i) => {
                    const rot = SLAB_ROTATIONS[i % SLAB_ROTATIONS.length]
                    return (
                      <MuscleSlab
                        key={id}
                        id={id}
                        rot={rot}
                        delay={320 + i * 60}
                        onClick={(rect) => { play('option-select'); setFocusMuscle(id); setFocusMuscleRect(rect) }}
                      />
                    )
                  })}
                </div>
              ) : (
                <div
                  className="font-display text-gtl-smoke leading-none"
                  style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', transform: 'rotate(-1deg)' }}
                >
                  REST DAY
                </div>
              )}
            </div>

            {/* Exercise summary grid — full width, left-padded to clear the date column */}
            {hasWork && (
              <div
                className="absolute inset-0 py-6"
                style={{ paddingLeft: 'clamp(180px, 28vw, 340px)', display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, muscles.filter(id => Object.values(allReps[id] || {}).some(v => v > 0)).length)}, 1fr)`, gap: '1rem 1.5rem', alignContent: 'center', animation: 'focus-content-in 350ms 400ms ease-out both' }}
              >
                {muscles.every(id => !Object.values(allReps[id] || {}).some(v => v > 0)) ? (
                  <div style={{ transform: 'rotate(-1deg)' }}>
                    <div
                      className="font-display text-gtl-smoke/20 leading-none"
                      style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', textShadow: '3px 3px 0 #070708' }}
                    >
                      NO REPS
                    </div>
                    <div
                      className="font-display text-gtl-smoke/10 leading-none"
                      style={{ fontSize: 'clamp(1rem, 2vw, 1.6rem)', marginTop: '0.4em' }}
                    >
                      SET LOGGED YET
                    </div>
                  </div>
                ) : muscles.map((muscleId, si) => {
                  const muscleReps = allReps[muscleId] || {}
                  const logged = Object.entries(muscleReps).filter(([, v]) => v > 0)
                  if (logged.length === 0) return null
                  const rot = SLAB_ROTATIONS[si % SLAB_ROTATIONS.length]

                  return (
                    <div
                      key={muscleId}
                      style={{
                        animation: `focus-content-in 300ms ${si * 90}ms ease-out both`,
                        minWidth: 0,
                      }}
                    >
                      {/* Muscle name slab — block wrapper forces it to its own line */}
                      <div style={{ display: 'block', marginBottom: '0.6rem' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            position: 'relative',
                            transform: `rotate(${rot})`,
                            transformOrigin: 'left center',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute', inset: 0,
                              background: '#8a0e13',
                              clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
                              transform: 'translate(4px,4px)',
                            }}
                            aria-hidden="true"
                          />
                          <div
                            style={{
                              position: 'relative',
                              padding: '2px 16px',
                              background: '#d4181f',
                              clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
                            }}
                          >
                            <span
                              className="font-display text-gtl-paper leading-none whitespace-nowrap"
                              style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.3rem)' }}
                            >
                              {MUSCLE_LABELS[muscleId] || muscleId.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Exercise entries */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {logged.map(([name, reps], ei) => {
                          const w = (allWeights[muscleId] || {})[name] ?? 0
                          return (
                            <div
                              key={name}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '0.1rem',
                                animation: `focus-content-in 220ms ${si * 90 + ei * 50 + 80}ms ease-out both`,
                                transform: ei % 2 === 0 ? 'rotate(-0.4deg)' : 'rotate(0.3deg)',
                                transformOrigin: 'left center',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {/* Reps — big gold on the left */}
                                <div className="font-display leading-none shrink-0"
                                  style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#e4b022', textShadow: '2px 2px 0 #8a6612, 4px 4px 0 #070708' }}>
                                  {reps}×
                                </div>
                                {/* Weight + name stacked to the right */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                  {w > 0 && (
                                    <div className="font-display leading-none"
                                      style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#e4b022', textShadow: '2px 2px 0 #8a6612, 3px 3px 0 #070708', opacity: 0.9 }}>
                                      {w}<span style={{ fontSize: '0.6em', opacity: 0.7, marginLeft: '0.2em' }}>lbs</span>
                                    </div>
                                  )}
                                  <div className="font-display text-gtl-chalk leading-none"
                                    style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', lineHeight: '1.2' }}>
                                    {name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom row: breadcrumb + stamp button */}
          <div className="mt-auto pt-6 flex items-end justify-between gap-4">
            <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
              PALACE / FITNESS / ACTIVE CYCLE / {dayName}
            </div>

            {/* BRING ON TOMORROW button */}
            <button
              type="button"
              onClick={handleStamp}
              disabled={stamped}
              className="group relative inline-flex items-center shrink-0 outline-none
                focus-visible:outline-2 focus-visible:outline-gtl-red"
              style={{ opacity: stamped ? 0.4 : 1, transition: 'opacity 200ms' }}
            >
              <div
                className="absolute inset-0 -inset-x-2 transition-all duration-300"
                style={{
                  clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                  background: stamped ? '#3a3a42' : '#d4181f',
                  boxShadow: stamped ? 'none' : '0 0 24px rgba(212,24,31,0.5)',
                }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 px-6 py-3">
                <span
                  className="font-display leading-none"
                  style={{ fontSize: 'clamp(1rem, 1.8vw, 1.4rem)', color: '#f5f0e8', textShadow: '2px 2px 0 #070708' }}
                >
                  {stamped ? 'TOMORROW WILL COME' : 'BRING ON TOMORROW'}
                </span>
                {!stamped && (
                  <span className="font-display text-gtl-paper leading-none" style={{ fontSize: '1.2rem' }}>▶</span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Exercise panel — zooms from the tapped muscle slab */}
        {focusMuscle && (
          <ExercisePanel
            key={focusMuscle}
            muscleId={focusMuscle}
            dayIso={iso}
            originRect={focusMuscleRect}
            onClose={() => { setFocusMuscle(null); setFocusMuscleRect(null); setRefreshKey(k => k + 1) }}
          />
        )}
      </div>
    </>
  )
}

function StatBlock({ number, label }) {
  return (
    <div className="flex flex-col items-start">
      <div
        className="font-display leading-none"
        style={{
          fontSize: 'clamp(4rem, 8vw, 7rem)',
          color: '#e4b022',
          textShadow: '3px 3px 0 #8a6612, 5px 5px 0 #070708',
        }}
      >
        {String(number).padStart(2, '0')}
      </div>
      <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-gtl-ash mt-1">
        {label}
      </div>
    </div>
  )
}

export default function ActiveCyclePage() {
  const { play } = useSound()

  const [cycleName,  setCycleName]  = useState('ACTIVE CYCLE')
  const [targets,    setTargets]    = useState([])
  const [days,       setDays]       = useState([])
  const [dailyPlan,  setDailyPlan]  = useState({})
  const [ready,      setReady]      = useState(false)
  const [focusDay,   setFocusDay]   = useState(null)   // ISO string | null
  const [focusRect,  setFocusRect]  = useState(null)   // DOMRect | null

  useEffect(() => {
    try {
      const name = localStorage.getItem('gtl-cycle-name')
      const rawT = localStorage.getItem('gtl-muscle-targets')
      const rawD = localStorage.getItem('gtl-training-days')
      const rawP = localStorage.getItem('gtl-daily-plan')
      if (name) setCycleName(name)
      if (rawT) setTargets(JSON.parse(rawT))
      if (rawD) setDays(JSON.parse(rawD).sort())
      if (rawP) setDailyPlan(JSON.parse(rawP))
    } catch (_) {}
    setReady(true)
  }, [])

  const handleDayClick = (iso, rect) => {
    setFocusRect(rect)
    setFocusDay(iso)
  }

  const handleCloseFocus = () => {
    setFocusDay(null)
    setFocusRect(null)
  }

  const plannedSessions = days.filter((iso) => (dailyPlan[iso] || []).length > 0).length

  const cols = days.length <= 4 ? days.length
             : days.length <= 8 ? Math.ceil(days.length / 2)
             : Math.ceil(days.length / 3)

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gtl-void">

      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, rgba(122,14,20,0.18) 0%, transparent 45%, rgba(74,10,14,0.28) 100%)' }} />

      {/* Kanji watermark — 動 (motion/active) */}
      <div
        className="absolute -top-16 -right-24 pointer-events-none select-none"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '52rem', lineHeight: '0.8',
          color: '#d4181f', opacity: 0.045, fontWeight: 900,
        }}
      >
        動
      </div>

      {/* Nav */}
      <nav className="relative z-10 shrink-0 flex items-center justify-between px-8 py-5">
        <RetreatButton />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / ACTIVE CYCLE
        </div>
      </nav>

      {/* ── HERO BAND ── */}
      <section className="relative z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-gtl-red"
          style={{ transform: 'skewY(-1.5deg)', transformOrigin: 'top left' }}
          aria-hidden="true"
        />
        <div
          className="absolute right-4 top-2 font-display text-[10rem] leading-none select-none pointer-events-none"
          aria-hidden="true"
          style={{ color: 'rgba(0,0,0,0.18)', transform: 'rotate(6deg)', transformOrigin: 'right top' }}
        >
          ACTIVE
        </div>
        <div className="relative px-8 pt-8 pb-14">
          <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-paper/40 mb-6">
            PALACE / FITNESS / ACTIVE CYCLE
          </div>
          <h1
            className="font-display text-gtl-paper leading-none"
            style={{
              fontSize: 'clamp(3.5rem, 11vw, 9rem)',
              transform: 'rotate(-2deg)',
              transformOrigin: 'left center',
              textShadow: '5px 5px 0 #070708, 10px 10px 0 rgba(0,0,0,0.4)',
              letterSpacing: '-0.02em',
            }}
          >
            {cycleName}
          </h1>
          <div
            className="font-mono text-[10px] tracking-[0.5em] uppercase text-gtl-paper/50 mt-4"
            style={{ transform: 'rotate(0.8deg)' }}
          >
            CYCLE IN PROGRESS / TAP A DAY TO FOCUS
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 px-8 py-10">
        <div className="flex items-start gap-8 flex-wrap">
          <StatBlock number={days.length}      label="BATTLEDAYS" />
          <div className="self-stretch flex items-center">
            <div className="w-1 h-full min-h-[5rem] bg-gtl-red" style={{ transform: 'skewX(-12deg)' }} />
          </div>
          <StatBlock number={targets.length}   label="TARGETS LOCKED" />
          <div className="self-stretch flex items-center">
            <div className="w-1 h-full min-h-[5rem] bg-gtl-red" style={{ transform: 'skewX(-12deg)' }} />
          </div>
          <StatBlock number={plannedSessions}  label="SESSIONS MAPPED" />
        </div>
      </section>

      {/* Red slash divider */}
      <div className="relative z-10 mx-8 mb-10 h-[3px] bg-gtl-red"
           style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }} />

      {/* ── DAY GRID ── */}
      <section className="relative z-10 px-8 pb-24">
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-ash mb-8 flex items-center gap-4">
          <span>BATTLE SCHEDULE</span>
          <div className="h-px flex-1 bg-gtl-edge" />
          <span className="text-gtl-red">{days.length} DAY{days.length !== 1 ? 'S' : ''}</span>
        </div>

        {ready && days.length === 0 ? (
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gtl-smoke py-20">
            NO DAYS SCHEDULED
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(cols, days.length)}, 1fr)`, overflow: 'visible' }}
          >
            {days.map((iso, i) => (
              <DayCard
                key={iso}
                iso={iso}
                muscles={dailyPlan[iso] || []}
                index={i}
                onClick={handleDayClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── DAY FOCUS OVERLAY ── */}
      {focusDay && (
        <DayFocus
          key={focusDay}
          iso={focusDay}
          muscles={dailyPlan[focusDay] || []}
          originRect={focusRect}
          onClose={handleCloseFocus}
        />
      )}

      <FireFadeIn duration={900} />
    </main>
  )
}
