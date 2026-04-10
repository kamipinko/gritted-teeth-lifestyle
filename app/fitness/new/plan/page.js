'use client'
/*
 * /fitness/new/plan — Assign muscles to each training day.
 *
 * Reads the scheduled training days and locked muscle targets from
 * localStorage. Displays each day as a large card filling the screen.
 * Each card has clickable muscle chips — tap to toggle that muscle
 * onto that day's session. Red = assigned, outlined = available.
 *
 * IGNITE THE CYCLE fires FireTransition and navigates to /fitness.
 */
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../../lib/useSound'
import FireFadeIn from '../../../../components/FireFadeIn'
import FireTransition from '../../../../components/FireTransition'

const MUSCLE_LABELS = {
  chest:      'CHEST',
  shoulders:  'SHOULDERS',
  biceps:     'BICEPS',
  triceps:    'TRICEPS',
  forearms:   'FOREARMS',
  abs:        'ABS',
  glutes:     'GLUTES',
  quads:      'QUADS',
  hamstrings: 'HAMSTRINGS',
  calves:     'CALVES',
}

const DAY_SHORT   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                     'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

// Parse ISO date string safely (avoid UTC-midnight timezone shift)
function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

// How many grid columns for N days — tries to stay ≤ 2 rows
function colCount(n) {
  if (n <= 5) return n
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
      className={`relative px-2 py-1 border text-[9px] font-mono tracking-[0.15em] uppercase
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
      {/* ── Card header ── */}
      <div
        className={`shrink-0 px-4 pt-4 pb-3 border-b transition-colors duration-200
          ${count > 0 ? 'border-gtl-red/50 bg-gtl-red/5' : 'border-gtl-edge'}`}
      >
        {/* Day of week */}
        <div className="font-display text-3xl leading-none text-gtl-red tracking-wide">
          {dayName}
        </div>

        {/* Date number + month */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-display leading-none text-gtl-chalk" style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>
            {dayNum}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-ash">
            {mon}
          </span>
        </div>

        {/* Assignment count */}
        <div className="font-mono text-[8px] tracking-[0.2em] uppercase mt-1">
          <span className={count > 0 ? 'text-gtl-red-bright' : 'text-gtl-smoke'}>
            {count > 0 ? `${count} / ${targets.length}` : '—'}
          </span>
          {count > 0 && (
            <span className="text-gtl-smoke ml-1">ASSIGNED</span>
          )}
        </div>
      </div>

      {/* ── Muscle chips ── */}
      <div className="flex-1 min-h-0 p-3 flex flex-wrap content-start gap-1.5 overflow-y-auto">
        {targets.map((id) => (
          <MuscleChip
            key={id}
            id={id}
            active={assigned.has(id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

function IgniteButton({ onFire, onHover }) {
  const [pressed, setPressed] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Ignite the cycle"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onFire() }}
      onMouseLeave={() => setPressed(false)}
      onMouseEnter={onHover}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFire() }
      }}
      className="relative cursor-pointer select-none outline-none
        focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4"
      style={{ transform: 'rotate(-1deg)', transformOrigin: 'center center' }}
    >
      {/* Shadow */}
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(6px, 5px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      {/* Face */}
      <div
        className="relative px-12 py-4"
        style={{
          clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : '#d4181f',
          transform: pressed ? 'translate(6px, 5px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className="font-display text-4xl text-gtl-paper leading-none tracking-tight whitespace-nowrap">
          IGNITE THE CYCLE
        </div>
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-paper/60 mt-2 border-t border-gtl-paper/20 pt-1.5 text-center">
          PIERCE THE LIMIT ▸
        </div>
      </div>
    </div>
  )
}

export default function PlanPage() {
  const router = useRouter()
  const { play } = useSound()

  const [days, setDays]         = useState([])  // sorted ISO date strings
  const [targets, setTargets]   = useState([])  // muscle IDs in order
  const [assignments, setAssignments] = useState({}) // { iso: Set<muscleId> }
  const [fireActive, setFireActive] = useState(false)
  const [ready, setReady] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const rawDays = localStorage.getItem('gtl-training-days')
      const rawTargets = localStorage.getItem('gtl-muscle-targets')
      if (rawDays) {
        const sorted = JSON.parse(rawDays).sort()
        setDays(sorted)
        // Pre-populate assignments with empty Sets
        const init = {}
        sorted.forEach((d) => { init[d] = new Set() })
        setAssignments(init)
      }
      if (rawTargets) {
        setTargets(JSON.parse(rawTargets))
      }
    } catch (_) {}
    setReady(true)
  }, [])

  const toggleMuscle = (dayIso, muscleId) => {
    setAssignments((prev) => {
      const set  = new Set(prev[dayIso] || [])
      if (set.has(muscleId)) set.delete(muscleId)
      else set.add(muscleId)
      return { ...prev, [dayIso]: set }
    })
  }

  const handleIgnite = () => {
    play('card-confirm')
    // Serialize assignments for storage
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
          background:
            'linear-gradient(135deg, rgba(122,14,20,0.20) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.30) 100%)',
        }}
      />

      {/* Kanji watermark — 鍛 (forge/temper) */}
      <div
        className="absolute -bottom-20 -left-16 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '40rem',
          lineHeight: '0.8',
          color: '#ffffff',
          opacity: 0.035,
          fontWeight: 900,
        }}
      >
        鍛
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="relative z-10 shrink-0 flex items-center justify-between px-8 py-5">
        <RetreatButton />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / NEW CYCLE / PLAN
        </div>
      </nav>

      {/* ── Headline strip ──────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 px-8 pb-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-0.5 w-12 bg-gtl-red" />
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-red font-bold">
              STEP / 04 / PLAN
            </span>
          </div>
          <h1 className="font-display text-5xl text-gtl-chalk leading-none -rotate-1">
            FORGE YOUR
            <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-1 ml-3">
              SESSIONS
            </span>
          </h1>
        </div>

        {/* IGNITE button — top right, always visible */}
        <div className="shrink-0">
          <IgniteButton
            onFire={handleIgnite}
            onHover={() => play('button-hover')}
          />
        </div>
      </div>

      {/* Red slash divider */}
      <div
        className="relative z-10 shrink-0 mx-8 mb-4 h-[2px] bg-gtl-red"
        style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
      />

      {/* ── Day card grid — fills all remaining vertical space ──────── */}
      <div className="relative z-10 flex-1 min-h-0 px-8 pb-6">
        {ready && days.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="font-display text-4xl text-gtl-ash mb-3">NO DAYS SCHEDULED</div>
              <Link
                href="/fitness/new/branded"
                className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red hover:text-gtl-red-bright transition-colors"
              >
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

      <FireFadeIn duration={900} />
      <FireTransition
        active={fireActive}
        onComplete={() => router.push('/fitness')}
      />
    </main>
  )
}
