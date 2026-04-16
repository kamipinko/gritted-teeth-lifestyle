'use client'
/*
 * /fitness/new/branded — Schedule + Muscle Assignment (mobile).
 *
 * Multi-day batch editing: tap multiple days to select them, then toggle
 * muscles in the grid below. Toggles are additive-first: if ANY selected
 * day is missing a muscle, tapping adds it to all; only removes when all
 * already have it. Kanji overlay on tiles shows assigned muscles; date
 * number renders as a large semi-transparent watermark behind.
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

/* Muscle button — vertical kanji + label, ~44px tall */
function SheetMuscleButton({ kanji, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-1.5 px-1 border transition-colors duration-150
        ${active
          ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow'
          : 'bg-gtl-ink border-gtl-edge'}`}
      style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)', transform: 'skewX(-2deg)' }}
    >
      <span
        className={`leading-none font-bold ${active ? 'text-gtl-paper' : 'text-gtl-chalk'}`}
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '1.15rem',
          textShadow: active ? '1px 1px 0 #070708' : 'none',
          transform: 'skewX(2deg)',
        }}
      >
        {kanji}
      </span>
      <span
        className={`font-mono text-[7px] tracking-[0.12em] uppercase leading-none mt-0.5
          ${active ? 'text-gtl-paper/80' : 'text-gtl-ash'}`}
        style={{ transform: 'skewX(2deg)' }}
      >
        {label}
      </span>
    </button>
  )
}

/* CARVE button — 12th grid slot, shows total days count */
function SheetCarveButton({ count, enabled, onFire, onHover }) {
  return (
    <button
      type="button"
      aria-label="Carve cycle"
      onClick={() => { if (enabled) onFire() }}
      onMouseEnter={enabled ? onHover : undefined}
      disabled={!enabled}
      className={`relative flex flex-col items-center justify-center py-1.5 px-1 border transition-colors duration-150
        ${enabled
          ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow cursor-pointer'
          : 'bg-gtl-ink border-gtl-edge cursor-not-allowed opacity-40'}`}
      style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)', transform: 'skewX(-2deg)' }}
    >
      <span
        className={`font-display leading-none ${enabled ? 'text-gtl-paper' : 'text-gtl-smoke'}`}
        style={{ fontSize: '0.85rem', textShadow: enabled ? '1px 1px 0 #8a0e13' : 'none', transform: 'skewX(2deg)' }}
      >
        CARVE
      </span>
      <span
        className={`font-mono text-[7px] tracking-[0.12em] uppercase leading-none mt-0.5
          ${enabled ? 'text-gtl-paper/70' : 'text-gtl-ash'}`}
        style={{ transform: 'skewX(2deg)' }}
      >
        {count > 0 ? `${count} DAY${count !== 1 ? 'S' : ''}` : 'NO DAYS'}
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

  // selectedDays = set of isoKeys currently in the editing batch
  const [selectedDays, setSelectedDays] = useState(new Set())
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
    const open = selectedDays.size > 0
    if (open && !prevOpenRef.current) play('stamp')
    prevOpenRef.current = open
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

  // Tap: toggle in/out of the selection batch. Keep assigned muscles on deselect.
  const tapDay = (d) => {
    if (isPast(d)) return
    play('option-select')
    const key = isoKey(d)
    setSelectedDays((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  // Additive-first toggle: if ANY selected day is missing this muscle, add to ALL.
  // Only remove when ALL selected days already have it.
  const toggleMuscle = (muscleId) => {
    if (selectedDays.size === 0) return
    play('option-select')
    const keys = [...selectedDays]
    const allHave = keys.every((k) => (assignments[k] || new Set()).has(muscleId))
    setAssignments((prev) => {
      const next = { ...prev }
      keys.forEach((k) => {
        const s = new Set(next[k] || [])
        if (allHave) s.delete(muscleId)
        else s.add(muscleId)
        next[k] = s
      })
      return next
    })
  }

  const prevMonth = () => {
    setDisplayDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d })
    setSelectedDays(new Set())
  }
  const nextMonth = () => {
    setDisplayDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d })
    setSelectedDays(new Set())
  }

  const sheetOpen = selectedDays.size > 0

  // Total days with ≥1 muscle (across entire calendar, not just selection)
  const daysWithMuscles = Object.values(assignments).filter((s) => s.size > 0).length
  const carveEnabled = daysWithMuscles > 0

  const handleCarve = () => {
    if (!carveEnabled) return
    play('card-confirm')
    try {
      const trainingDays = Object.entries(assignments)
        .filter(([_, s]) => s.size > 0)
        .map(([iso]) => iso)
      localStorage.setItem(pk('training-days'), JSON.stringify(trainingDays))
      const serialized = {}
      Object.entries(assignments).forEach(([iso, set]) => {
        if (set.size > 0) serialized[iso] = [...set]
      })
      localStorage.setItem(pk('daily-plan'), JSON.stringify(serialized))
    } catch (_) {}
    setFireActive(true)
  }

  // For the muscle grid: a button is "active" when ALL selected days have it
  const batchMuscleState = (muscleId) => {
    if (selectedDays.size === 0) return false
    return [...selectedDays].every((k) => (assignments[k] || new Set()).has(muscleId))
  }

  // Kanji badges for a day tile (canonical order)
  const badgeMuscles = (key) => {
    const set = assignments[key]
    if (!set || set.size === 0) return []
    return MUSCLE_ORDER.filter((m) => set.has(m))
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="relative h-screen flex flex-col overflow-hidden bg-gtl-void">
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
      <nav className="relative z-10 flex items-center gap-3 px-4 h-12 border-b border-gtl-edge/40 shrink-0">
        <RetreatButton />
        <MonthNavButton dir="prev" onClick={prevMonth} />
        <div className="flex-1 min-w-0 flex items-baseline gap-2 justify-center">
          <span className="font-display text-xl leading-none text-gtl-chalk tracking-tight truncate">
            {MONTH_NAMES[month]}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-gtl-red font-bold">
            {year}
          </span>
        </div>
        <MonthNavButton dir="next" onClick={nextMonth} />
      </nav>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-3 pt-2 pb-0 flex-1 flex flex-col overflow-hidden">
        {/* Red slash divider */}
        <div
          className="h-[2px] bg-gtl-red mb-1 shrink-0"
          style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
        />

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`py-0.5 text-center font-mono text-[9px] tracking-[0.2em] uppercase
                ${i === 0 || i === 6 ? 'text-gtl-red/80' : 'text-gtl-ash'}`}
              style={{ clipPath: CELL_CLIP }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day grid — fills remaining calendar space */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`pad-${i}`} />

            const key         = isoKey(d)
            const selected    = selectedDays.has(key)
            const todayCell   = isToday(d)
            const past        = isPast(d)
            const badges      = badgeMuscles(key)
            const hasMuscles  = badges.length > 0
            const visibleBadges = badges.slice(0, 3)
            const overflow    = badges.length - visibleBadges.length

            return (
              <button
                key={key}
                type="button"
                onClick={() => tapDay(d)}
                disabled={past}
                className={`
                  relative overflow-hidden border transition-colors duration-150
                  ${past ? 'opacity-25 cursor-not-allowed' : ''}
                  ${selected
                    ? 'bg-gtl-red/30 border-gtl-red-bright'
                    : hasMuscles
                    ? 'bg-gtl-red/10 border-gtl-red/50'
                    : todayCell
                    ? 'bg-gtl-ink border-gtl-gold'
                    : 'bg-gtl-ink border-gtl-edge'}
                `}
                style={{ clipPath: CELL_CLIP }}
              >
                {todayCell && !hasMuscles && !selected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gtl-gold" aria-hidden="true" />
                )}

                {/* Date number watermark — large, semi-transparent, centered */}
                <span
                  className="absolute inset-0 flex items-center justify-center font-display leading-none select-none pointer-events-none"
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    opacity: hasMuscles ? 0.12 : (selected ? 0.25 : 0.2),
                    color: selected ? '#f5f0e8' : todayCell ? '#e4b022' : '#c8c0b0',
                  }}
                  aria-hidden="true"
                >
                  {d}
                </span>

                {/* Kanji overlay — stacked from top, full opacity */}
                {hasMuscles && (
                  <div
                    className="relative z-10 flex flex-col items-center pt-1 leading-none select-none"
                    style={{
                      fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                      fontSize: '13px',
                      lineHeight: '1.3',
                      color: selected ? '#f5f0e8' : '#d4181f',
                      textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                    }}
                    aria-hidden="true"
                  >
                    {visibleBadges.map((m) => (
                      <span key={m}>{MUSCLE_KANJI[m]}</span>
                    ))}
                    {overflow > 0 && (
                      <span className="font-mono text-[8px] tracking-normal mt-0.5"
                        style={{ color: selected ? 'rgba(245,240,232,0.7)' : 'rgba(212,24,31,0.7)' }}>
                        +{overflow}
                      </span>
                    )}
                  </div>
                )}

                {/* Selected indicator when no muscles yet */}
                {selected && !hasMuscles && (
                  <span className="relative z-10 font-display text-sm text-gtl-paper/70 leading-none -rotate-12" aria-hidden="true">✕</span>
                )}

                {/* TODAY label */}
                {todayCell && !hasMuscles && !selected && (
                  <span className="absolute bottom-1 left-0 right-0 text-center font-mono text-[6px] tracking-[0.2em] uppercase text-gtl-gold leading-none">TODAY</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Muscle grid ─────────────────────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: sheetOpen ? '300px' : '0px',
          borderTop: sheetOpen ? '2px solid #d4181f' : '2px solid transparent',
        }}
      >
        <div className="px-3 pt-1 pb-1">
          <div className="grid grid-cols-2 grid-rows-6 gap-1">
            {SHEET_MUSCLES.map((m) => (
              <SheetMuscleButton
                key={m.id}
                kanji={m.kanji}
                label={m.label}
                active={batchMuscleState(m.id)}
                onClick={() => toggleMuscle(m.id)}
              />
            ))}
            <SheetCarveButton
              count={daysWithMuscles}
              enabled={carveEnabled}
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
