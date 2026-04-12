'use client'
/*
 * /fitness/new/plan — Assign muscles to each training day.
 *
 * Reads scheduled training days and locked muscle targets from localStorage.
 * Each day is a full-height card. Muscle chips toggle assignment per day.
 * IGNITE THE CYCLE button mirrors FORGE CYCLE: absolutely positioned,
 * concentric spinning shapes, presses on mousedown, overdrive-spins on
 * mouseup then fires the full FireTransition to /fitness/new/summary.
 */
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../../lib/useSound'
import { useProfileGuard } from '../../../../lib/useProfileGuard'
import { pk } from '../../../../lib/storage'
import FireFadeIn from '../../../../components/FireFadeIn'
import FireTransition from '../../../../components/FireTransition'

const MUSCLE_LABELS = {
  chest: 'CHEST', back: 'BACK', shoulders: 'SHOULDERS',
  biceps: 'BICEPS', triceps: 'TRICEPS', forearms: 'FOREARMS',
  abs: 'ABS', glutes: 'GLUTES', quads: 'QUADS',
  hamstrings: 'HAMSTRINGS', calves: 'CALVES',
}

const MUSCLE_ORDER = ['chest','shoulders','back','biceps','triceps','forearms','abs','glutes','quads','hamstrings','calves']


const DAY_SHORT   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

function colCount(n) {
  if (n <= 5)  return n
  if (n <= 10) return Math.ceil(n / 2)
  let cols = Math.ceil(n / 3)
  // Ensure the last row always has ≥2 empty cells so the IGNITE button has space
  const rows = Math.ceil(n / cols)
  if (cols * rows - n < 2) cols++
  return cols
}

function MuscleChip({ id, active, disabled, onClick, onHover }) {
  const [stamping, setStamping] = useState(false)
  const [wobbling, setWobbling] = useState(false)

  const handleClick = () => {
    if (disabled) return
    if (!active) {
      setStamping(true)
      setTimeout(() => setStamping(false), 700)
    }
    setWobbling(true)
    setTimeout(() => setWobbling(false), 400)
    onClick()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={onHover}
      disabled={disabled}
      className={`relative shrink-0 flex items-center gap-1.5 px-2 py-1 transition-all duration-150
        ${wobbling ? 'animate-row-wobble' : ''}
        ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}
        ${active ? 'bg-gtl-red/20' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}
      style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }}
    >
      {/* P5 checkbox */}
      <div
        className={`relative w-4 h-4 shrink-0 flex items-center justify-center border
          ${stamping ? 'animate-checkbox-stamp' : ''}
          ${active ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow' : 'bg-gtl-ink border-gtl-edge'}`}
        style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)', transformOrigin: 'center' }}
      >
        {active && (
          <span className="font-display text-white text-[9px] leading-none -rotate-12 select-none">✕</span>
        )}
      </div>
      <span className={`font-mono text-[9px] tracking-[0.15em] uppercase leading-none ${active ? 'text-white' : 'text-gtl-chalk'}`}>
        {MUSCLE_LABELS[id]}
      </span>
    </button>
  )
}

function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href="/fitness/new/branded"
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


function DayCard({ iso, assigned, compact, selected, onClick }) {
  const { play } = useSound()
  const date    = parseDate(iso)
  const dayName = DAY_SHORT[date.getDay()]
  const dayNum  = date.getDate()
  const mon     = MONTH_SHORT[date.getMonth()]
  const muscles = [...assigned]

  const cardRef = useRef(null)
  const [cardH, setCardH] = useState(80)
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setCardH(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Scale date relative to 80px baseline; clamp so it never gets absurd
  const scale = Math.max(0.7, Math.min(3, cardH / 80))
  const dayNameSize = `${Math.round(11 * scale)}px`
  const dayNumSize  = `${(1.1 * scale).toFixed(2)}rem`
  const monSize     = `${Math.round(7 * scale)}px`

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => { play('option-select'); onClick(iso) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(iso) } }}
      className="flex flex-col h-full overflow-hidden cursor-pointer select-none outline-none transition-all duration-150"
      style={{
        clipPath: 'polygon(0% 0%, 97% 0%, 100% 2%, 100% 100%, 3% 100%, 0% 98%)',
        border: selected ? '2px solid #ff2a36' : '1px solid #2a2a30',
        background: selected ? '#150508' : '#0d0d10',
        boxShadow: selected ? '0 0 20px rgba(212,24,31,0.35), inset 0 0 20px rgba(212,24,31,0.05)' : 'none',
      }}
    >
      <div className={`shrink-0 transition-colors duration-150 ${compact ? 'px-2 pt-1.5 pb-1' : 'px-3 pt-2 pb-1.5'}`}>
        <div className={`font-display leading-none tracking-wide ${selected ? 'text-gtl-red-bright' : 'text-gtl-red'}`}
             style={{ fontSize: dayNameSize }}>
          {dayName}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-display leading-none text-gtl-chalk" style={{ fontSize: dayNumSize }}>
            {dayNum}
          </span>
          <span className="font-mono tracking-[0.2em] uppercase text-gtl-ash" style={{ fontSize: monSize }}>{mon}</span>
        </div>
      </div>

      {/* Assigned muscle indicators */}
      {muscles.length > 0 && (
        <div className={`flex flex-wrap overflow-hidden ${compact ? 'px-1 pb-1 gap-0.5' : 'px-2 pb-1.5 gap-0.5'}`}>
          {muscles.map(id => (
            <span key={id}
              className="font-mono uppercase leading-none font-bold text-white"
              style={{
                fontSize: compact ? '10.5px' : '11.5px',
                letterSpacing: '0.08em',
                background: selected ? '#c0141a' : '#7a0e14',
                clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)',
                padding: compact ? '2px 5px' : '2px 6px',
              }}>
              {MUSCLE_LABELS[id] || id}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/*
 * IgniteButton — mirrors the FORGE CYCLE stamp widget:
 *   - Absolutely positioned bottom-right
 *   - Three concentric shapes spinning CW/CCW/CW at slow rates
 *   - Stamp face presses down on mousedown (face translates to shadow)
 *   - On mouseup: shapes enter overdrive spin, then fire transition fires
 */
function IgniteButton({ onFire, onHover, disabled }) {
  const [pressed,   setPressed]   = useState(false)
  const [overdrive, setOverdrive] = useState(false)

  const handleMouseUp = () => {
    if (disabled) return
    setPressed(false)
    setOverdrive(true)
    setTimeout(() => onFire(), 600)
  }

  // Spinning durations — normal vs overdrive
  const d = overdrive
    ? { outer: '0.4s', mid: '0.25s', inner: '0.15s' }
    : { outer: '22s',  mid: '14s',   inner: '9s' }

  return (
    <div className="absolute z-20 pointer-events-none" style={{ right: '16px', bottom: '16px', opacity: disabled ? 0.3 : 1, transition: 'opacity 300ms ease' }}>
      <div style={{ animation: 'forge-slam 700ms cubic-bezier(0.2, 1.2, 0.4, 1) forwards' }}>
        <div className="relative" style={{ width: 'min(300px, 80vw)', height: 'min(210px, 56vw)' }}>

          {/* Shape 1 — large parallelogram, CW */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ animation: `spin-cw ${d.outer} linear infinite`, transformOrigin: 'center center' }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 border-2 border-gtl-red/15"
                 style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }} />
          </div>

          {/* Shape 2 — diamond, CCW */}
          <div
            className="absolute inset-4 pointer-events-none"
            style={{ animation: `spin-ccw ${d.mid} linear infinite`, transformOrigin: 'center center' }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 border border-gtl-red/20 rotate-45" />
          </div>

          {/* Shape 3 — smaller parallelogram, CW */}
          <div
            className="absolute inset-8 pointer-events-none"
            style={{ animation: `spin-cw ${d.inner} linear infinite`, transformOrigin: 'center center' }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 border border-gtl-red/25"
                 style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }} />
          </div>

          {/* Stamp face */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div
              role="button"
              tabIndex={0}
              aria-label="Ignite the cycle"
              onMouseDown={() => { if (!disabled) setPressed(true) }}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setPressed(false)}
              onMouseEnter={() => { if (!disabled) onHover() }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMouseUp() }
              }}
              className={`relative select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ transform: 'rotate(-2.5deg)', transformOrigin: 'center center' }}
            >
              {/* Shadow slab */}
              <div
                className="absolute inset-0 bg-gtl-red-deep"
                style={{
                  clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)',
                  transform: pressed ? 'translate(0,0)' : 'translate(8px, 8px)',
                  transition: 'transform 80ms ease-out',
                }}
                aria-hidden="true"
              />
              {/* Face */}
              <div
                className="relative py-5 px-8"
                style={{
                  clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)',
                  background: pressed ? '#ff2a36' : '#d4181f',
                  transform: pressed ? 'translate(8px, 8px)' : 'translate(0,0)',
                  transition: 'transform 80ms ease-out, background 80ms ease-out',
                }}
              >
                <div className="font-display text-2xl md:text-4xl text-gtl-paper leading-none tracking-tight">IGNITE</div>
                <div className="font-display text-2xl md:text-4xl text-gtl-paper leading-none tracking-tight">THE</div>
                <div className="font-display text-2xl md:text-4xl text-gtl-paper leading-none tracking-tight">CYCLE</div>
                <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-paper/60 mt-3 border-t border-gtl-paper/20 pt-2">
                  PIERCE THE LIMIT ▸
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function PlanPage() {
  useProfileGuard()
  const router = useRouter()
  const { play } = useSound()

  const [days, setDays]             = useState([])
  const [targets, setTargets]       = useState([])
  const [assignments, setAssignments] = useState({})
  const [fireActive, setFireActive] = useState(false)
  const [ready, setReady]           = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    try {
      const rawDays    = localStorage.getItem(pk('training-days'))
      const rawTargets = localStorage.getItem(pk('muscle-targets'))
      if (rawDays) {
        const sorted = JSON.parse(rawDays).sort()
        setDays(sorted)
        const init = {}
        sorted.forEach((d) => { init[d] = new Set() })
        setAssignments(init)
      }
      if (rawTargets) setTargets(JSON.parse(rawTargets))
    } catch (_) {}
    setReady(true)
  }, [])

  const toggleMuscle = (dayIso, muscleId) => {
    setAssignments((prev) => {
      const set = new Set(prev[dayIso] || [])
      if (set.has(muscleId)) set.delete(muscleId)
      else set.add(muscleId)
      return { ...prev, [dayIso]: set }
    })
  }

  const handleIgnite = () => {
    play('card-confirm')
    try {
      const serialized = {}
      Object.entries(assignments).forEach(([iso, set]) => {
        serialized[iso] = [...set]
      })
      localStorage.setItem(pk('daily-plan'), JSON.stringify(serialized))
    } catch (_) {}
    setFireActive(true)
  }

  const cols    = days.length > 0 ? colCount(days.length) : 1
  const rows    = days.length > 0 ? Math.ceil(days.length / cols) : 1
  const compact = days.length > 10

  const handleDayClick = (iso) => setSelectedDay(prev => prev === iso ? null : iso)
  const handleMuscleClick = (id) => {
    if (!selectedDay) return
    play('option-select')
    toggleMuscle(selectedDay, id)
  }
  const anyAssigned = Object.values(assignments).some(s => s.size > 0)

  return (
    <main className="h-dvh flex flex-col overflow-hidden bg-gtl-void" style={{ maxHeight: '100dvh' }}>
      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(122,14,20,0.20) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.30) 100%)',
        }}
      />

      {/* Kanji watermark — 鍛 (forge/temper) */}
      <div
        className="absolute -bottom-20 -left-16 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '40rem', lineHeight: '0.8',
          color: '#ffffff', opacity: 0.035, fontWeight: 900,
        }}
      >
        鍛
      </div>

      {/* Nav + Headline + Muscle bar */}
      <nav className="relative z-10 shrink-0 flex flex-col gap-2 px-4 md:px-8 py-3" style={{ background: 'rgba(7,7,8,0.75)', borderBottom: '1px solid rgba(212,24,31,0.25)' }}>
        {/* Top row: back + title + count */}
        <div className="flex items-center gap-3">
          <RetreatButton />
          <h1 className={`font-display text-white leading-none -rotate-1 shrink-0 flex-1 min-w-0 ${compact ? 'text-lg' : 'text-2xl md:text-5xl'}`}>
            FORGE YOUR <span className="text-gtl-red gtl-headline-shadow-soft">SESSIONS</span>
          </h1>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className="font-display leading-none" style={{ fontSize: '1.1rem', color: '#e4b022', textShadow: '1px 1px 0 #8a6612' }}>
              {Object.values(assignments).filter(s => s.size > 0).length}
              <span className="font-mono text-[9px] tracking-[0.2em] text-white ml-1">/ {days.length}</span>
            </div>
          </div>
        </div>

        {/* Muscle bar — below heading on all sizes */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Day prompt */}
          <div className="relative shrink-0 flex items-center">
            <div className="absolute inset-0" style={{ background: selectedDay ? '#d4181f' : '#1a1a1e', clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)' }} />
            <span className="relative font-display text-[11px] tracking-[0.2em] uppercase leading-none px-3 py-1.5 pr-6 whitespace-nowrap">
              {selectedDay
                ? <span className="font-bold" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)', fontSize: '13px' }}>{DAY_SHORT[parseDate(selectedDay).getDay()]} {parseDate(selectedDay).getDate()}</span>
                : <span className="text-gtl-ash">SELECT DAY</span>
              }
            </span>
          </div>

          {[...targets].sort((a, b) => MUSCLE_ORDER.indexOf(a) - MUSCLE_ORDER.indexOf(b)).map(id => {
            const active = selectedDay && assignments[selectedDay]?.has(id)
            return (
              <MuscleChip
                key={id}
                id={id}
                active={!!active}
                disabled={!selectedDay}
                onClick={() => handleMuscleClick(id)}
                onHover={() => play('button-hover')}
              />
            )
          })}
        </div>
      </nav>

      {/* Red slash divider */}
      <div
        className="relative z-10 shrink-0 mx-8 mb-2 h-[2px] bg-gtl-red"
        style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
      />

      {/* Day cards — fills remaining height */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden flex flex-col px-8 pb-4">
        {ready && days.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="font-display text-4xl text-gtl-ash mb-3">NO DAYS SCHEDULED</div>
              <Link href="/fitness/new/branded"
                className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red hover:text-gtl-red-bright transition-colors">
                ← RETURN TO CALENDAR
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 min-h-0 grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {days.map((iso) => (
              <DayCard
                key={iso}
                iso={iso}
                assigned={assignments[iso] || new Set()}
                compact={compact}
                selected={selectedDay === iso}
                onClick={handleDayClick}
              />
            ))}
          </div>
        )}
      </div>

      <IgniteButton
        onFire={handleIgnite}
        onHover={() => play('button-hover')}
        disabled={!anyAssigned}
      />

      <FireFadeIn duration={900} />
      <FireTransition
        active={fireActive}
        onComplete={() => router.push('/fitness/new/summary')}
      />
    </main>
  )
}
