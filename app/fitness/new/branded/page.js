'use client'
/*
 * /fitness/new/branded — Schedule & Forge Your Cycle (combined step 03 + 04).
 *
 * Calendar fills the page. Tapping an unmarked day marks it and selects it
 * for the bottom sheet. Tapping a marked day toggles its sheet-selection only
 * (the mark stays). >> week buttons mark all eligible days and toggle their
 * sheet-selection. The bottom sheet rises when 1+ days are selected, shows
 * which days are active, and lets the user assign muscle sessions that apply
 * to ALL selected days simultaneously. CARVE commits and navigates to /summary.
 */
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../../lib/useSound'
import { useProfileGuard } from '../../../../lib/useProfileGuard'
import { pk } from '../../../../lib/storage'
import FireFadeIn from '../../../../components/FireFadeIn'
import FireTransition from '../../../../components/FireTransition'

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]
const DAY_LABELS  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAY_SHORT   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const MUSCLE_LABELS = {
  chest: 'CHEST', back: 'BACK', shoulders: 'SHOULDERS', biceps: 'BICEPS',
  triceps: 'TRICEPS', forearms: 'FOREARMS', abs: 'ABS',
  glutes: 'GLUTES', quads: 'QUADS', hamstrings: 'HAMSTRINGS', calves: 'CALVES',
}
const MUSCLE_ORDER = [
  'chest', 'shoulders', 'back', 'biceps', 'triceps', 'forearms',
  'abs', 'glutes', 'quads', 'hamstrings', 'calves',
]

const CELL_CLIP = 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)'
const PARA_CLIP = 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)'


function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  let backHref = '/fitness/new/muscles'
  try { if (localStorage.getItem('gtl-back-to-edit') === '1') backHref = '/fitness/edit' } catch (_) {}
  return (
    <Link
      href={backHref}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div
        className={`absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}`}
        style={{ clipPath: PARA_CLIP }}
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

function MonthNavButton({ dir, onClick }) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  const clip = dir === 'prev'
    ? 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)'
    : 'polygon(0% 0%, 88% 0%, 100% 100%, 12% 100%)'
  return (
    <button
      type="button"
      onClick={() => { play('option-select'); onClick() }}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      className={`relative px-5 py-3 border transition-colors duration-150
        ${hovered ? 'bg-gtl-red border-gtl-red-bright' : 'bg-gtl-ink border-gtl-edge'}`}
      style={{ clipPath: clip }}
      aria-label={dir === 'prev' ? 'Previous month' : 'Next month'}
    >
      <span className={`font-display text-xl leading-none transition-colors duration-150
        ${hovered ? 'text-gtl-paper' : 'text-gtl-red'}`}>
        {dir === 'prev' ? '◀' : '▶'}
      </span>
    </button>
  )
}

/* Muscle chip — used in bottom sheet for session assignment */
function MuscleChip({ id, active, onClick, onHover }) {
  const [stamping, setStamping] = useState(false)
  const [wobbling, setWobbling] = useState(false)

  const handleClick = () => {
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
      className={`relative shrink-0 flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-all duration-150
        ${wobbling ? 'animate-row-wobble' : ''}
        ${active ? 'bg-gtl-red/20' : 'bg-white/[0.04] hover:bg-white/[0.08]'}`}
      style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }}
    >
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

/* Compact CARVE stamp face — reused in both floating and sheet positions */
function CarveStampFace({ count, onFire, onHover }) {
  const [pressed, setPressed] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Carve cycle — ${count} day${count !== 1 ? 's' : ''} scheduled`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onFire() }}
      onMouseLeave={() => setPressed(false)}
      onMouseEnter={onHover}
      onClick={onFire}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFire() } }}
      className="relative cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4"
      style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center center' }}
    >
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          transform: pressed ? 'translate(0, 0)' : 'translate(5px, 5px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      <div
        className="relative py-4 px-6"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : '#d4181f',
          transform: pressed ? 'translate(5px, 5px)' : 'translate(0, 0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className="font-display text-3xl text-gtl-paper leading-none tracking-tight">CARVE</div>
        <div className="font-mono text-[8px] tracking-[0.4em] uppercase text-gtl-paper/60 mt-2 border-t border-gtl-paper/20 pt-1.5">
          {count > 0 ? `${count} DAY${count !== 1 ? 'S' : ''} CARVED OUT ▸` : 'MARK DAYS FIRST ▸'}
        </div>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  useProfileGuard()
  const router = useRouter()
  const { play } = useSound()

  // Stable reference to today — computed once
  const [today] = useState(() => new Date())

  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  // trainingDays = set of isoKeys that are marked on the calendar
  // selectedDays = subset of trainingDays currently selected for the sheet
  const [trainingDays, setTrainingDays] = useState(new Set())
  const [selectedDays, setSelectedDays] = useState(new Set())
  // assignments = { [isoKey]: Set<muscleId> }
  const [assignments, setAssignments]   = useState({})
  const [targets, setTargets]           = useState([])
  const [fireActive, setFireActive]     = useState(false)

  // Enter-key nav for edit mode
  useEffect(() => {
    try { if (localStorage.getItem('gtl-back-to-edit') !== '1') return } catch (_) { return }
    const handleKey = (e) => {
      if (e.key === 'Enter' && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName))
        router.push('/fitness/edit')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  // Load muscle targets from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(pk('muscle-targets'))
      if (raw) setTargets(JSON.parse(raw))
    } catch (_) {}
  }, [])

  // Play stamp sound exactly once when the sheet first opens
  const prevSheetOpenRef = useRef(false)
  useEffect(() => {
    const open = selectedDays.size > 0
    if (open && !prevSheetOpenRef.current) play('stamp')
    prevSheetOpenRef.current = open
  }, [selectedDays.size, play])

  // ── Calendar math ──────────────────────────────────────────────────────
  const year  = displayDate.getFullYear()
  const month = displayDate.getMonth()

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth    = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const isoKey = (d) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isPast = (d) => {
    const cellDate  = new Date(year, month, d)
    const todayFlat = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return cellDate < todayFlat
  }

  // Tapping an unmarked day marks it and selects it for the sheet.
  // Tapping an already-marked day unmarks it and removes it from the sheet.
  const toggleDay = (d) => {
    if (isPast(d)) return
    play('option-select')
    const key = isoKey(d)
    if (!trainingDays.has(key)) {
      setTrainingDays((prev) => { const n = new Set(prev); n.add(key); return n })
      setSelectedDays((prev) => { const n = new Set(prev); n.add(key); return n })
      setAssignments((prev) => prev[key] !== undefined ? prev : { ...prev, [key]: new Set() })
    } else {
      setTrainingDays((prev) => { const n = new Set(prev); n.delete(key); return n })
      setSelectedDays((prev) => { const n = new Set(prev); n.delete(key); return n })
      setAssignments((prev) => { const next = { ...prev }; delete next[key]; return next })
    }
  }

  // Toggle a muscle across ALL currently selected days simultaneously.
  // If every selected day already has the muscle, remove it from all;
  // otherwise add it to any that are missing it.
  const toggleMuscleForSelected = (muscleId) => {
    play('option-select')
    const selArr = [...selectedDays]
    const allHave = selArr.every((key) => assignments[key]?.has(muscleId))
    setAssignments((prev) => {
      const next = { ...prev }
      selArr.forEach((key) => {
        const s = new Set(next[key] || [])
        if (allHave) s.delete(muscleId)
        else s.add(muscleId)
        next[key] = s
      })
      return next
    })
  }

  const prevMonth = () =>
    setDisplayDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d })
  const nextMonth = () =>
    setDisplayDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d })

  const trainingDayCount = trainingDays.size
  const sheetOpen        = selectedDays.size > 0

  const handleCarve = () => {
    play('card-confirm')
    try {
      localStorage.setItem(pk('training-days'), JSON.stringify([...trainingDays]))
      const serialized = {}
      Object.entries(assignments).forEach(([iso, set]) => { serialized[iso] = [...set] })
      localStorage.setItem(pk('daily-plan'), JSON.stringify(serialized))
    } catch (_) {}
    setFireActive(true)
  }

  // If no targets were stored from step 02, fall back to all muscles so the
  // session planner is always usable.
  const chipMuscles = (targets.length > 0 ? targets : MUSCLE_ORDER)
    .slice()
    .sort((a, b) => MUSCLE_ORDER.indexOf(a) - MUSCLE_ORDER.indexOf(b))

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gtl-void">
      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(122,14,20,0.25) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.35) 100%)',
        }}
      />

      {/* Kanji watermark — 暦 (almanac/calendar) */}
      <div
        className="absolute -top-8 -right-20 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '46rem',
          lineHeight: '0.8',
          color: '#ffffff',
          opacity: 0.04,
          fontWeight: 900,
        }}
      >
        暦
      </div>

      {/* Ghost "03" stamp */}
      <div
        className="absolute -top-24 -left-8 font-display leading-none text-gtl-red/[0.05] select-none pointer-events-none"
        style={{ fontSize: '28rem' }}
        aria-hidden="true"
      >
        03
      </div>

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <RetreatButton />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / NEW CYCLE / SCHEDULE
        </div>
      </nav>

      {/* Calendar */}
      <section className="relative z-10 px-8 pb-8 max-w-[1440px] mx-auto">
        {/* Month header */}
        <div className="flex items-end gap-6 mb-4">
          <MonthNavButton dir="prev" onClick={prevMonth} />
          <div className="flex-1 min-w-0">
            <div
              className="font-display text-7xl md:text-8xl xl:text-9xl text-gtl-chalk leading-none -rotate-1 truncate"
              style={{ letterSpacing: '-0.02em' }}
            >
              {MONTH_NAMES[month]}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-sm tracking-[0.4em] uppercase text-gtl-red font-bold">
                {year}
              </span>
              <div className="h-px w-8 bg-gtl-red/40" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-ash">
                {trainingDayCount > 0
                  ? `${trainingDayCount} DAY${trainingDayCount !== 1 ? 'S' : ''} MARKED`
                  : 'NO DAYS MARKED'}
              </span>
            </div>
          </div>
          <MonthNavButton dir="next" onClick={nextMonth} />
        </div>

        {/* Red slash divider */}
        <div
          className="h-[3px] bg-gtl-red mb-4"
          style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
        />

        {/* Day-of-week header */}
        <div className="flex gap-1 mb-1">
          <div className="grid grid-cols-7 gap-1 flex-1">
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={`py-2 text-center font-mono text-[10px] tracking-[0.25em] uppercase
                  ${i === 0 || i === 6 ? 'text-gtl-red/80' : 'text-gtl-ash'}`}
                style={{ clipPath: CELL_CLIP }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="w-10 shrink-0" aria-hidden="true" />
        </div>

        {/* Week rows with >> select buttons */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: cells.length / 7 }, (_, wi) => {
            const weekCells = cells.slice(wi * 7, wi * 7 + 7)
            const eligibleDays = weekCells.filter((d) => d !== null && !isPast(d))
            const allInSheet =
              eligibleDays.length > 0 &&
              eligibleDays.every((d) => selectedDays.has(isoKey(d)))

            const handleWeekSelect = () => {
              if (eligibleDays.length === 0) return
              play('option-select')
              if (allInSheet) {
                // Second press: fully remove all eligible days
                const keys = eligibleDays.map(isoKey)
                setTrainingDays((prev) => { const n = new Set(prev); keys.forEach((k) => n.delete(k)); return n })
                setSelectedDays((prev) => { const n = new Set(prev); keys.forEach((k) => n.delete(k)); return n })
                setAssignments((prev) => { const next = { ...prev }; keys.forEach((k) => delete next[k]); return next })
              } else {
                // First press: mark, init assignments, select all eligible
                setTrainingDays((prev) => {
                  const n = new Set(prev)
                  eligibleDays.forEach((d) => n.add(isoKey(d)))
                  return n
                })
                setAssignments((prev) => {
                  const next = { ...prev }
                  eligibleDays.forEach((d) => {
                    const k = isoKey(d)
                    if (next[k] === undefined) next[k] = new Set()
                  })
                  return next
                })
                setSelectedDays((prev) => {
                  const n = new Set(prev)
                  eligibleDays.forEach((d) => n.add(isoKey(d)))
                  return n
                })
              }
            }

            return (
              <div key={wi} className="flex gap-1 items-stretch">
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {weekCells.map((d, j) => {
                    if (d === null) return <div key={`pad-${wi}-${j}`} className="h-20" />

                    const key            = isoKey(d)
                    const marked         = trainingDays.has(key)
                    const selected       = selectedDays.has(key)
                    const todayCell      = isToday(d)
                    const past           = isPast(d)
                    const assignedCount  = assignments[key]?.size ?? 0

                    return (
                      <div
                        key={key}
                        onClick={() => toggleDay(d)}
                        className={`
                          relative h-20 flex flex-col items-center justify-center gap-0.5
                          border transition-all duration-150
                          ${past ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
                          ${selected
                            ? 'bg-gtl-red border-gtl-red-bright'
                            : marked
                            ? 'bg-gtl-red/20 border-gtl-red/60'
                            : todayCell
                            ? 'bg-gtl-ink border-gtl-gold'
                            : past
                            ? 'bg-gtl-ink border-gtl-edge'
                            : 'bg-gtl-ink border-gtl-edge hover:border-gtl-red hover:bg-gtl-surface'}
                        `}
                        style={{ clipPath: CELL_CLIP }}
                      >
                        {todayCell && !marked && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gtl-gold" aria-hidden="true" />
                        )}
                        <span
                          className={`font-display text-3xl leading-none
                            ${selected ? 'text-gtl-paper'
                              : marked ? 'text-gtl-red-bright'
                              : todayCell ? 'text-gtl-gold'
                              : 'text-gtl-chalk'}`}
                        >
                          {d}
                        </span>
                        {selected && (
                          <span className="font-display text-xs text-gtl-paper/70 leading-none -rotate-12" aria-hidden="true">✕</span>
                        )}
                        {marked && !selected && assignedCount > 0 && (
                          <span className="font-mono text-[7px] tracking-[0.15em] uppercase text-gtl-red/80 leading-none">
                            {assignedCount}M
                          </span>
                        )}
                        {todayCell && !marked && (
                          <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-gtl-gold leading-none">TODAY</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Week select button */}
                <button
                  type="button"
                  onClick={handleWeekSelect}
                  disabled={eligibleDays.length === 0}
                  className={`w-10 shrink-0 flex items-center justify-center font-mono text-[11px] font-bold tracking-wider border transition-colors duration-100
                    ${eligibleDays.length === 0
                      ? 'opacity-20 cursor-not-allowed bg-gtl-ink border-gtl-edge text-gtl-smoke'
                      : allInSheet
                      ? 'bg-gtl-red border-gtl-red-bright text-gtl-paper cursor-pointer'
                      : 'bg-gtl-ink border-gtl-edge text-gtl-chalk hover:border-gtl-red hover:bg-gtl-surface cursor-pointer'}`}
                  style={{ clipPath: 'polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%)' }}
                  aria-label={`Select all days in week ${wi + 1}`}
                >
                  {'>>'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Count strip */}
        <div className="mt-4 flex items-center gap-4">
          <div className="h-px flex-1 bg-gtl-edge" />
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-smoke">
            {trainingDayCount === 0
              ? 'MARK YOUR BATTLEDAYS'
              : `${trainingDayCount} BATTLEDAY${trainingDayCount !== 1 ? 'S' : ''} LOCKED`}
          </div>
          <div className="h-px flex-1 bg-gtl-edge" />
        </div>
      </section>

      {/* Inline assignment zone — slides in below calendar when days are selected */}
      <div
        className="relative z-10 px-8 max-w-[1440px] mx-auto overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: sheetOpen ? '600px' : '0px',
          opacity: sheetOpen ? 1 : 0,
        }}
      >
        {/* Red slash divider */}
        <div
          className="h-[3px] bg-gtl-red mb-6"
          style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
        />

        {/* Section header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-gtl-red mb-0.5">
              ASSIGN SESSIONS
            </div>
            <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-smoke">
              {selectedDays.size} DAY{selectedDays.size !== 1 ? 'S' : ''} SELECTED — APPLIES TO ALL
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDays(new Set())}
            className="font-mono text-[9px] tracking-[0.25em] uppercase text-gtl-ash border border-gtl-edge px-3 py-1.5 hover:text-gtl-red hover:border-gtl-red transition-colors duration-150"
            style={{ clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
          >
            CLEAR ✕
          </button>
        </div>

        {/* Muscle chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {chipMuscles.map((id) => {
            const allHave = [...selectedDays].every((key) => assignments[key]?.has(id))
            return (
              <MuscleChip
                key={id}
                id={id}
                active={allHave}
                onClick={() => toggleMuscleForSelected(id)}
                onHover={() => play('button-hover')}
              />
            )
          })}
        </div>

        {/* CARVE — right-aligned */}
        <div className="flex justify-end mb-8">
          <CarveStampFace
            count={trainingDayCount}
            onFire={handleCarve}
            onHover={() => play('button-hover')}
          />
        </div>
      </div>

      {/* Footer slash */}
      <div className="relative z-10 flex items-center gap-4 px-8 pb-8">
        <div className="h-px flex-1 bg-gtl-edge" />
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
          GRITTED TEETH LIFESTYLE / FITNESS PALACE / SCHEDULING
        </div>
        <div className="h-px flex-1 bg-gtl-edge" />
      </div>

      <FireFadeIn duration={900} />
      <FireTransition
        active={fireActive}
        onComplete={() => router.push('/fitness/new/summary')}
      />
    </main>
  )
}
