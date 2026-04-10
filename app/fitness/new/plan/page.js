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
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../../lib/useSound'
import FireFadeIn from '../../../../components/FireFadeIn'
import FireTransition from '../../../../components/FireTransition'

const MUSCLE_LABELS = {
  chest: 'CHEST', back: 'BACK', shoulders: 'SHOULDERS',
  biceps: 'BICEPS', triceps: 'TRICEPS', forearms: 'FOREARMS',
  abs: 'ABS', glutes: 'GLUTES', quads: 'QUADS',
  hamstrings: 'HAMSTRINGS', calves: 'CALVES',
}

const DAY_SHORT   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

function colCount(n) {
  if (n <= 5)  return n
  if (n <= 10) return Math.ceil(n / 2)
  return Math.ceil(n / 3)
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

function MuscleChip({ id, active, onToggle }) {
  const { play } = useSound()
  return (
    <button
      type="button"
      onClick={() => { play('option-select'); onToggle(id) }}
      onMouseEnter={() => play('button-hover')}
      className={`px-2 py-1 border text-[9px] font-mono tracking-[0.15em] uppercase
        transition-colors duration-100 leading-none
        ${active
          ? 'bg-gtl-red border-gtl-red-bright text-gtl-paper'
          : 'bg-transparent border-gtl-edge text-gtl-ash hover:border-gtl-red hover:text-gtl-chalk'}`}
      style={{ clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
    >
      {MUSCLE_LABELS[id] || id.toUpperCase()}
    </button>
  )
}

function DayCard({ iso, targets, assigned, onToggle }) {
  const date    = parseDate(iso)
  const dayName = DAY_SHORT[date.getDay()]
  const dayNum  = date.getDate()
  const mon     = MONTH_SHORT[date.getMonth()]
  const count   = assigned.size

  return (
    <div
      className="flex flex-col h-full border border-gtl-edge bg-gtl-ink overflow-hidden"
      style={{ clipPath: 'polygon(0% 0%, 97% 0%, 100% 2%, 100% 100%, 3% 100%, 0% 98%)' }}
    >
      {/* Header */}
      <div className={`shrink-0 px-4 pt-4 pb-3 border-b transition-colors duration-200
        ${count > 0 ? 'border-gtl-red/50 bg-gtl-red/5' : 'border-gtl-edge'}`}>
        <div className="font-display text-3xl leading-none text-gtl-red tracking-wide">{dayName}</div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-display leading-none text-gtl-chalk" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)' }}>
            {dayNum}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-ash">{mon}</span>
        </div>
        <div className="font-mono text-[8px] tracking-[0.2em] uppercase mt-1">
          <span className={count > 0 ? 'text-gtl-red-bright' : 'text-gtl-smoke'}>
            {count > 0 ? `${count} / ${targets.length}` : '—'}
          </span>
          {count > 0 && <span className="text-gtl-smoke ml-1">ASSIGNED</span>}
        </div>
      </div>

      {/* Muscle chips */}
      <div className="flex-1 min-h-0 p-3 flex flex-wrap content-start gap-1.5 overflow-y-auto">
        {targets.map((id) => (
          <MuscleChip key={id} id={id} active={assigned.has(id)} onToggle={onToggle} />
        ))}
      </div>
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
function IgniteButton({ onFire, onHover }) {
  const [pressed,   setPressed]   = useState(false)
  const [overdrive, setOverdrive] = useState(false)

  const handleMouseUp = () => {
    setPressed(false)
    setOverdrive(true)
    // Let shapes spin wild for 600ms, then ignite
    setTimeout(() => onFire(), 600)
  }

  // Spinning durations — normal vs overdrive
  const d = overdrive
    ? { outer: '0.4s', mid: '0.25s', inner: '0.15s' }
    : { outer: '22s',  mid: '14s',   inner: '9s' }

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ right: '32px', bottom: '90px' }}
    >
      <div style={{ animation: 'forge-slam 700ms cubic-bezier(0.2, 1.2, 0.4, 1) forwards' }}>
        <div className="relative" style={{ width: '300px', height: '210px' }}>

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
              onMouseDown={() => setPressed(true)}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setPressed(false)}
              onMouseEnter={onHover}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMouseUp() }
              }}
              className="relative cursor-pointer select-none outline-none
                focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4"
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
                <div className="font-display text-4xl text-gtl-paper leading-none tracking-tight">IGNITE</div>
                <div className="font-display text-4xl text-gtl-paper leading-none tracking-tight">THE</div>
                <div className="font-display text-4xl text-gtl-paper leading-none tracking-tight">CYCLE</div>
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
  const router = useRouter()
  const { play } = useSound()

  const [days, setDays]             = useState([])
  const [targets, setTargets]       = useState([])
  const [assignments, setAssignments] = useState({})
  const [fireActive, setFireActive] = useState(false)
  const [ready, setReady]           = useState(false)

  useEffect(() => {
    try {
      const rawDays    = localStorage.getItem('gtl-training-days')
      const rawTargets = localStorage.getItem('gtl-muscle-targets')
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
      localStorage.setItem('gtl-daily-plan', JSON.stringify(serialized))
    } catch (_) {}
    setFireActive(true)
  }

  const cols = days.length > 0 ? colCount(days.length) : 1

  return (
    <main className="h-dvh flex flex-col overflow-hidden bg-gtl-void">
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

      {/* Nav */}
      <nav className="relative z-10 shrink-0 flex items-center justify-between px-8 py-5">
        <RetreatButton />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / NEW CYCLE / PLAN
        </div>
      </nav>

      {/* Headline */}
      <div className="relative z-10 shrink-0 px-8 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-0.5 w-12 bg-gtl-red" />
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-red font-bold">
            STEP / 04 / PLAN
          </span>
        </div>
        <h1 className="font-display text-5xl text-gtl-chalk leading-none -rotate-1">
          FORGE YOUR
          <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-1 ml-3">SESSIONS</span>
        </h1>
      </div>

      {/* Red slash divider */}
      <div
        className="relative z-10 shrink-0 mx-8 mb-4 h-[2px] bg-gtl-red"
        style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
      />

      {/* Day cards — fills remaining height */}
      <div className="relative z-10 flex-1 min-h-0 px-8 pb-[160px]">
        {ready && days.length === 0 ? (
          <div className="h-full flex items-center justify-center">
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
            className="h-full grid gap-2"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {days.map((iso) => (
              <DayCard
                key={iso}
                iso={iso}
                targets={targets}
                assigned={assignments[iso] || new Set()}
                onToggle={(muscleId) => toggleMuscle(iso, muscleId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* IGNITE THE CYCLE — absolute bottom-right, like FORGE CYCLE */}
      <IgniteButton
        onFire={handleIgnite}
        onHover={() => play('button-hover')}
      />

      <FireFadeIn duration={900} />
      <FireTransition
        active={fireActive}
        onComplete={() => router.push('/fitness/new/summary')}
      />
    </main>
  )
}
