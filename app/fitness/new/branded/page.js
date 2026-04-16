'use client'
/*
 * /fitness/new/branded — Combined Schedule + Muscle Assignment (mobile).
 *
 * Tap a calendar day → becomes the active day, bottom sheet rises covering
 * the decorative zone below the calendar. User toggles muscles in the sheet;
 * kanji badges appear beneath the day tile live. ◀ ▶ in the sheet cycle
 * through all marked days. CARVE commits when every marked day has ≥1
 * muscle and routes to /fitness/new/summary.
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
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAY_SHORT  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/* Muscle order for the sheet — canonical order, kanji paired. */
const SHEET_MUSCLES = [
  { id: 'chest',      kanji: '胸', label: 'CHEST' },
  { id: 'shoulders',  kanji: '肩', label: 'SHOULDERS' },
  { id: 'back',       kanji: '背', label: 'BACK' },
  { id: 'forearms',   kanji: '腕', label: 'FOREARMS' },
  { id: 'quads',      kanji: '腿', label: 'QUADS' },
  { id: 'hamstrings', kanji: '裏', label: 'HAMSTRINGS' },
  { id: 'calves',     kanji: '脛', label: 'CALVES' },
  { id: 'biceps',     kanji: '二', label: 'BICEPS' },
  { id: 'triceps',    kanji: '三', label: 'TRICEPS' },
  { id: 'glutes',     kanji: '尻', label: 'GLUTES' },
  { id: 'abs',        kanji: '腹', label: 'ABS' },
]
const MUSCLE_ORDER = SHEET_MUSCLES.map((m) => m.id)
const MUSCLE_KANJI = Object.fromEntries(SHEET_MUSCLES.map((m) => [m.id, m.kanji]))

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
      className="group relative inline-flex items-center shrink-0"
    >
      <div
        className={`absolute inset-0 -inset-x-1 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}`}
        style={{ clipPath: PARA_CLIP }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2 px-3 py-1.5">
        <span className={`font-display text-sm leading-none transition-all duration-300
          ${hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-red'}`}>◀</span>
      </div>
    </Link>
  )
}

function MonthNavButton({ dir, onClick }) {
  const { play } = useSound()
  const clip = dir === 'prev'
    ? 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)'
    : 'polygon(0% 0%, 88% 0%, 100% 100%, 12% 100%)'
  return (
    <button
      type="button"
      onClick={() => { play('option-select'); onClick() }}
      className="relative px-3 py-1.5 border bg-gtl-ink border-gtl-edge active:bg-gtl-red active:border-gtl-red-bright transition-colors duration-100 shrink-0"
      style={{ clipPath: clip }}
      aria-label={dir === 'prev' ? 'Previous month' : 'Next month'}
    >
      <span className="font-display text-base leading-none text-gtl-red">
        {dir === 'prev' ? '◀' : '▶'}
      </span>
    </button>
  )
}

/* Muscle button inside the sheet — kanji + English label */
function SheetMuscleButton({ kanji, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 py-2 px-2 border transition-colors duration-150
        ${active
          ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow'
          : 'bg-gtl-ink border-gtl-edge hover:border-gtl-red'}`}
      style={{ clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)' }}
    >
      <span
        className={`leading-none ${active ? 'text-gtl-paper' : 'text-gtl-chalk'}`}
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '1.25rem',
          textShadow: active ? '2px 2px 0 #070708' : 'none',
        }}
      >
        {kanji}
      </span>
      <span
        className={`font-mono text-[8px] tracking-[0.15em] uppercase leading-none
          ${active ? 'text-gtl-paper/80' : 'text-gtl-ash'}`}
      >
        {label}
      </span>
    </button>
  )
}

/* CARVE button sized to fill the 12th grid slot next to ABS */
function SheetCarveButton({ enabled, onFire, onHover }) {
  return (
    <button
      type="button"
      aria-label="Carve cycle"
      onClick={() => { if (enabled) onFire() }}
      onMouseEnter={enabled ? onHover : undefined}
      disabled={!enabled}
      className={`relative flex items-center justify-center gap-2 py-2 px-2 border transition-colors duration-150
        ${enabled
          ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow cursor-pointer hover:bg-gtl-red-bright'
          : 'bg-gtl-ink border-gtl-edge cursor-not-allowed opacity-40'}`}
      style={{ clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)' }}
    >
      <span
        className={`font-display leading-none ${enabled ? 'text-gtl-paper' : 'text-gtl-smoke'}`}
        style={{ fontSize: '1.3rem', textShadow: enabled ? '2px 2px 0 #8a0e13' : 'none' }}
      >
        CARVE ▸
      </span>
      <span
        className={`font-mono text-[8px] tracking-[0.2em] uppercase leading-none mt-0.5
          ${enabled ? 'text-gtl-paper/80' : 'text-gtl-ash'}`}
      >
        {enabled ? 'READY' : 'ASSIGN ALL DAYS'}
      </span>
    </button>
  )
}

export default function SchedulePage() {
  useProfileGuard()
  const router = useRouter()
  const { play } = useSound()

  const [today] = useState(() => new Date())
  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  // trainingDays = set of isoKeys that are marked on the calendar
  const [trainingDays, setTrainingDays] = useState(new Set())
  // activeDay = single isoKey currently focused in the sheet (null = sheet closed)
  const [activeDay,    setActiveDay]    = useState(null)
  // assignments = { [isoKey]: Set<muscleId> }
  const [assignments,  setAssignments]  = useState({})
  const [fireActive,   setFireActive]   = useState(false)

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

  // Play stamp sound once when the sheet first opens
  const prevOpenRef = useRef(false)
  useEffect(() => {
    const open = activeDay !== null
    if (open && !prevOpenRef.current) play('stamp')
    prevOpenRef.current = open
  }, [activeDay, play])

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

  // Tap logic:
  //   unmarked → mark + activate
  //   marked & not active → activate
  //   active → unmark + clear muscles + close sheet
  const tapDay = (d) => {
    if (isPast(d)) return
    play('option-select')
    const key = isoKey(d)
    if (!trainingDays.has(key)) {
      setTrainingDays((prev) => { const n = new Set(prev); n.add(key); return n })
      setAssignments((prev) => prev[key] !== undefined ? prev : { ...prev, [key]: new Set() })
      setActiveDay(key)
    } else if (activeDay !== key) {
      setActiveDay(key)
    } else {
      setTrainingDays((prev) => { const n = new Set(prev); n.delete(key); return n })
      setAssignments((prev) => { const next = { ...prev }; delete next[key]; return next })
      setActiveDay(null)
    }
  }

  // Toggle a muscle for the active day. If the day isn't marked yet,
  // auto-mark it so battleday + assignment happen in a single tap.
  const toggleMuscle = (muscleId) => {
    if (!activeDay) return
    play('option-select')
    setAssignments((prev) => {
      const next = { ...prev }
      const s = new Set(next[activeDay] || [])
      if (s.has(muscleId)) s.delete(muscleId)
      else s.add(muscleId)
      next[activeDay] = s
      return next
    })
    if (!trainingDays.has(activeDay)) {
      setTrainingDays((prev) => { const n = new Set(prev); n.add(activeDay); return n })
    }
  }

  const prevMonth = () => {
    setDisplayDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d })
    setActiveDay(null)
  }
  const nextMonth = () => {
    setDisplayDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d })
    setActiveDay(null)
  }

  const trainingDayCount = trainingDays.size
  const sheetOpen        = activeDay !== null

  // Sorted list of all marked days (kept for other consumers)
  const sortedMarked = [...trainingDays].sort()

  // CARVE: enabled only when every marked day has ≥1 muscle
  const allAssigned =
    trainingDayCount > 0 &&
    sortedMarked.every((k) => (assignments[k]?.size ?? 0) > 0)

  const handleCarve = () => {
    if (!allAssigned) return
    play('card-confirm')
    try {
      localStorage.setItem(pk('training-days'), JSON.stringify([...trainingDays]))
      const serialized = {}
      Object.entries(assignments).forEach(([iso, set]) => { serialized[iso] = [...set] })
      localStorage.setItem(pk('daily-plan'), JSON.stringify(serialized))
    } catch (_) {}
    setFireActive(true)
  }

  const activeMuscles = activeDay ? (assignments[activeDay] || new Set()) : new Set()

  // Order muscles in canonical order for a given day
  const badgeMuscles = (key) => {
    const set = assignments[key]
    if (!set || set.size === 0) return []
    return MUSCLE_ORDER.filter((m) => set.has(m))
  }

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

      {/* Kanji watermark — 暦 (calendar) */}
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

      {/* ── Compact header ──────────────────────────────────────────────── */}
      <nav
        className="relative z-10 flex items-center gap-3 px-4 h-12 border-b border-gtl-edge/40"
      >
        <RetreatButton />
        <MonthNavButton dir="prev" onClick={prevMonth} />
        <div className="flex-1 min-w-0 flex items-baseline gap-2 justify-center">
          <span className="font-display text-xl leading-none text-gtl-chalk tracking-tight truncate">
            {MONTH_NAMES[month]}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-gtl-red font-bold">
            {year}
          </span>
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-gtl-ash hidden sm:inline">
            · {trainingDayCount > 0 ? `${trainingDayCount} DAY${trainingDayCount !== 1 ? 'S' : ''}` : 'NO DAYS'}
          </span>
        </div>
        <MonthNavButton dir="next" onClick={nextMonth} />
      </nav>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-3 pt-3 pb-0">
        {/* Red slash divider */}
        <div
          className="h-[2px] bg-gtl-red mb-2"
          style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
        />

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`py-1 text-center font-mono text-[9px] tracking-[0.2em] uppercase
                ${i === 0 || i === 6 ? 'text-gtl-red/80' : 'text-gtl-ash'}`}
              style={{ clipPath: CELL_CLIP }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`pad-${i}`} className="min-h-16" />

            const key           = isoKey(d)
            const marked        = trainingDays.has(key)
            const isActive      = activeDay === key
            const todayCell     = isToday(d)
            const past          = isPast(d)
            const badges        = marked ? badgeMuscles(key) : []
            const visibleBadges = badges.slice(0, 3)
            const overflow      = badges.length - visibleBadges.length

            return (
              <button
                key={key}
                type="button"
                onClick={() => tapDay(d)}
                disabled={past}
                className={`
                  relative min-h-16 flex flex-col items-center justify-start pt-1 pb-1.5 gap-0.5
                  border transition-colors duration-150
                  ${past ? 'opacity-25 cursor-not-allowed' : ''}
                  ${isActive
                    ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow'
                    : marked
                    ? 'bg-gtl-red/20 border-gtl-red/60'
                    : todayCell
                    ? 'bg-gtl-ink border-gtl-gold'
                    : 'bg-gtl-ink border-gtl-edge active:bg-gtl-surface'}
                `}
                style={{ clipPath: CELL_CLIP }}
              >
                {todayCell && !marked && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gtl-gold" aria-hidden="true" />
                )}
                <span
                  className={`font-display text-xl leading-none
                    ${isActive ? 'text-gtl-paper'
                      : marked ? 'text-gtl-red-bright'
                      : todayCell ? 'text-gtl-gold'
                      : 'text-gtl-chalk'}`}
                >
                  {d}
                </span>

                {/* Today label if not marked */}
                {todayCell && !marked && (
                  <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-gtl-gold leading-none">TODAY</span>
                )}

                {/* Kanji badges — stacked vertically, one per line */}
                {visibleBadges.length > 0 && (
                  <div
                    className="flex flex-col items-center leading-none select-none mt-0.5"
                    style={{
                      fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                      fontSize: '11px',
                      lineHeight: '1.15',
                      color: isActive ? 'rgba(245,240,232,0.95)' : 'rgba(212,24,31,0.85)',
                    }}
                    aria-hidden="true"
                  >
                    {visibleBadges.map((m) => (
                      <span key={m}>{MUSCLE_KANJI[m]}</span>
                    ))}
                    {overflow > 0 && (
                      <span className="font-mono text-[8px] tracking-normal mt-0.5"
                        style={{ color: isActive ? 'rgba(245,240,232,0.75)' : 'rgba(212,24,31,0.7)' }}>
                        +{overflow}
                      </span>
                    )}
                  </div>
                )}

                {/* Active indicator when no muscles yet */}
                {isActive && badges.length === 0 && (
                  <span className="font-display text-[10px] text-gtl-paper/70 leading-none -rotate-12 mt-0.5" aria-hidden="true">✕</span>
                )}
              </button>
            )
          })}
        </div>

      </section>

      {/* ── Bottom sheet ───────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-gtl-void"
        style={{
          transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.3, 1)',
          borderTop: '2px solid #d4181f',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          height: '49vh',
          minHeight: '390px',
          boxShadow: '0 -20px 40px rgba(0,0,0,0.6)',
        }}
        aria-hidden={!sheetOpen}
      >
        {/* Noise on sheet */}
        <div className="absolute inset-0 gtl-noise opacity-40 pointer-events-none" />

        <div className="relative h-full flex flex-col px-3 pt-1 pb-2">
          {/* 2-col grid: 11 muscles + CARVE in slot 12 */}
          <div className="grid grid-cols-2 grid-rows-6 gap-1.5 flex-1">
            {SHEET_MUSCLES.map((m) => (
              <SheetMuscleButton
                key={m.id}
                kanji={m.kanji}
                label={m.label}
                active={activeMuscles.has(m.id)}
                onClick={() => toggleMuscle(m.id)}
              />
            ))}
            <SheetCarveButton
              enabled={allAssigned}
              onFire={handleCarve}
              onHover={() => play('button-hover')}
            />
          </div>
        </div>
      </div>

      <FireFadeIn duration={900} />
      <FireTransition
        active={fireActive}
        onComplete={() => router.push('/fitness/new/summary')}
      />
    </main>
  )
}
