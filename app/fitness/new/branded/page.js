'use client'
/*
 * /fitness/new/branded — Schedule + Muscle Assignment (mobile).
 *
 * Always 5 calendar rows (overflow days wrap into row 1's empty slots).
 * Multi-day batch editing with swipe-to-select. Additive-first muscle
 * toggles. Date numbers as watermarks, kanji overlays in 2-col grid.
 * CARVE shows total days with muscles assigned.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
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

// Japanese month names for decorative empty slots
const MONTH_KANJI = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
]

const CELL_CLIP = 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)'
const PARA_CLIP = 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)'
const ROW_H = 95

// Build a 5-row × 7-col grid. Overflow days from would-be row 6 wrap into
// row 1's leading empty slots.
function buildGrid(year, month) {
  const firstDow  = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Standard cells: leading nulls + days + trailing nulls to fill 7-col rows
  const raw = []
  for (let i = 0; i < firstDow; i++) raw.push(null)
  for (let d = 1; d <= daysInMonth; d++) raw.push(d)
  while (raw.length % 7 !== 0) raw.push(null)

  if (raw.length <= 35) {
    // Already 5 rows — return as-is
    return { grid: raw.slice(0, 35), wrapped: new Set() }
  }

  // 6 rows — wrap overflow (row 6 days) into row 1's nulls
  const row1 = raw.slice(0, 7)
  const overflow = raw.slice(35)
  const wrappedDays = new Set()
  for (let col = 0; col < 7; col++) {
    if (row1[col] === null && overflow[col] !== null) {
      row1[col] = overflow[col]
      wrappedDays.add(overflow[col])
    }
  }
  return { grid: [...row1, ...raw.slice(7, 35)], wrapped: wrappedDays }
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

function SheetMuscleButton({ kanji, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-between px-3 py-1 border transition-colors duration-150
        ${active
          ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow'
          : 'bg-gtl-ink border-gtl-edge'}`}
      style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)', transform: 'skewX(-2deg)' }}
    >
      <span
        className={`font-mono text-[11px] tracking-[0.1em] uppercase leading-none
          ${active ? 'text-gtl-paper' : 'text-gtl-ash'}`}
        style={{ transform: 'skewX(2deg)' }}
      >
        {label}
      </span>
      <span
        className={`leading-none font-bold ${active ? 'text-gtl-paper' : 'text-gtl-chalk'}`}
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '1.25rem',
          textShadow: active ? '1px 1px 0 #070708' : 'none',
          transform: 'skewX(2deg)',
        }}
      >
        {kanji}
      </span>
    </button>
  )
}

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

  const [selectedDays, setSelectedDays] = useState(new Set())
  const [assignments,  setAssignments]  = useState({})
  const [fireActive,   setFireActive]   = useState(false)
  const dragRef = useRef(false) // true during swipe-select
  const gridRef = useRef(null)

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

  // Stamp sound on first sheet open
  const prevOpenRef = useRef(false)
  useEffect(() => {
    const open = selectedDays.size > 0
    if (open && !prevOpenRef.current) play('stamp')
    prevOpenRef.current = open
  }, [selectedDays.size, play])

  // ── Calendar math ──────────────────────────────────────────────────────
  const year  = displayDate.getFullYear()
  const month = displayDate.getMonth()

  const { grid: cells, wrapped: wrappedDays } = buildGrid(year, month)

  const isoKey = (d) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isPast = (d) => {
    const cellDate  = new Date(year, month, d)
    const todayFlat = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return cellDate < todayFlat
  }

  // Tap: toggle in/out of selection batch. Keep assigned muscles on deselect.
  const tapDay = useCallback((d) => {
    if (isPast(d)) return
    play('option-select')
    const key = isoKey(d)
    setSelectedDays((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }, [year, month, today, play])

  // Swipe-select: add only (never deselect mid-drag)
  const selectDay = useCallback((d) => {
    if (isPast(d)) return
    const key = isoKey(d)
    setSelectedDays((prev) => {
      if (prev.has(key)) return prev
      const n = new Set(prev)
      n.add(key)
      return n
    })
  }, [year, month, today])

  // Touch handlers for swipe-to-select.
  // touchstart: record origin, do NOT select yet (that's onClick's job for taps).
  // touchmove: if finger moved, begin drag mode and select days under finger.
  // touchend: clear drag state.
  const touchOriginRef = useRef(null)

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY }
    dragRef.current = false
  }, [])

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0]
    const origin = touchOriginRef.current
    // Activate drag only after finger moves ≥8px (avoids false activation on taps)
    if (!dragRef.current && origin) {
      const dx = touch.clientX - origin.x
      const dy = touch.clientY - origin.y
      if (dx * dx + dy * dy < 64) return // 8px threshold
      dragRef.current = true
      // Select the origin day too
      const startEl = document.elementFromPoint(origin.x, origin.y)?.closest('[data-day]')
      if (startEl) selectDay(Number(startEl.dataset.day))
    }
    if (!dragRef.current) return
    e.preventDefault() // prevent click from firing after swipe
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const dayEl = el?.closest('[data-day]')
    if (dayEl) selectDay(Number(dayEl.dataset.day))
  }, [selectDay])

  const handleTouchEnd = useCallback(() => {
    dragRef.current = false
    touchOriginRef.current = null
  }, [])

  // Additive-first toggle
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

  const batchMuscleState = (muscleId) => {
    if (selectedDays.size === 0) return false
    return [...selectedDays].every((k) => (assignments[k] || new Set()).has(muscleId))
  }

  const badgeMuscles = (key) => {
    const set = assignments[key]
    if (!set || set.size === 0) return []
    return MUSCLE_ORDER.filter((m) => set.has(m))
  }

  // Decorative month kanji for empty calendar slots
  const monthChars = [...MONTH_KANJI[month]]
  const emptyIndices = cells.map((c, i) => c === null ? i : -1).filter((i) => i >= 0)
  // Center the characters within the empty slots
  const startOffset = Math.max(0, Math.floor((emptyIndices.length - monthChars.length) / 2))
  const emptyKanji = {} // { cellIndex: character }
  monthChars.forEach((ch, ci) => {
    const slotIdx = startOffset + ci
    if (slotIdx < emptyIndices.length) {
      emptyKanji[emptyIndices[slotIdx]] = ch
    }
  })

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="relative h-screen flex flex-col overflow-hidden bg-gtl-void">
      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(122,14,20,0.25) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.35) 100%)' }} />

      {/* Kanji watermark */}
      <div className="absolute -top-8 -right-20 pointer-events-none select-none animate-flicker" aria-hidden="true"
        style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", serif', fontSize: '46rem', lineHeight: '0.8', color: '#ffffff', opacity: 0.04, fontWeight: 900 }}>
        暦
      </div>
      <div className="absolute -top-24 -left-8 font-display leading-none text-gtl-red/[0.05] select-none pointer-events-none"
        style={{ fontSize: '28rem' }} aria-hidden="true">
        03
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
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
      <section className="relative z-10 px-3 pt-1 pb-0 shrink-0">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`py-0.5 text-center font-mono text-[9px] tracking-[0.2em] uppercase
                ${i === 0 || i === 6 ? 'text-gtl-red/80' : 'text-gtl-ash'}`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 5-row day grid — fixed 99px rows */}
        <div
          ref={gridRef}
          className="grid grid-cols-7 grid-rows-5 gap-1"
          style={{ height: `${ROW_H * 5 + 4 * 4}px` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {cells.map((d, i) => {
            if (d === null) {
              const ch = emptyKanji[i]
              return (
                <div key={`pad-${i}`} className="relative overflow-hidden border border-transparent" style={{ clipPath: CELL_CLIP, height: `${ROW_H}px` }}>
                  {ch && (
                    <span
                      className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
                      style={{
                        fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                        fontSize: '2.2rem',
                        opacity: 0.08,
                        color: '#d4181f',
                      }}
                      aria-hidden="true"
                    >
                      {ch}
                    </span>
                  )}
                </div>
              )
            }

            const key        = isoKey(d)
            const selected   = selectedDays.has(key)
            const todayCell  = isToday(d)
            const past       = isPast(d)
            const isWrapped  = wrappedDays.has(d)
            const badges     = badgeMuscles(key)
            const hasMuscles = badges.length > 0

            return (
              <button
                key={`${key}-${i}`}
                type="button"
                data-day={d}
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
                style={{ clipPath: CELL_CLIP, height: `${ROW_H}px` }}
              >
                {todayCell && !hasMuscles && !selected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gtl-gold" aria-hidden="true" />
                )}

                {/* Date watermark */}
                <span
                  className="absolute inset-0 flex items-center justify-center font-display leading-none select-none pointer-events-none"
                  style={{
                    fontSize: '2.5rem',
                    opacity: isWrapped ? 0.12 : (hasMuscles ? 0.15 : (selected ? 0.25 : 0.18)),
                    color: selected ? '#f5f0e8' : todayCell ? '#e4b022' : '#c8c0b0',
                  }}
                  aria-hidden="true"
                >
                  {d}
                </span>

                {/* 2-column kanji overlay — absolute, from top */}
                {hasMuscles && (
                  <div
                    className="absolute inset-0 z-10 grid grid-cols-2 gap-x-0.5 gap-y-0 justify-items-center content-start pt-1 px-0.5 select-none pointer-events-none"
                    style={{
                      fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                      fontSize: '12px',
                      lineHeight: '1.35',
                      color: selected ? '#f5f0e8' : '#d4181f',
                      textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                    }}
                    aria-hidden="true"
                  >
                    {badges.map((m) => (
                      <span key={m}>{MUSCLE_KANJI[m]}</span>
                    ))}
                  </div>
                )}

                {/* Selected indicator — no muscles yet */}
                {selected && !hasMuscles && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center font-display text-lg text-gtl-paper/60 leading-none -rotate-12 pointer-events-none">✕</span>
                )}

                {/* TODAY */}
                {todayCell && !hasMuscles && !selected && (
                  <span className="absolute bottom-1 left-0 right-0 z-10 text-center font-mono text-[6px] tracking-[0.2em] uppercase text-gtl-gold leading-none pointer-events-none">TODAY</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Logo (empty state) / Muscle grid ─────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Red accent line */}
        <div className="h-[2px] bg-gtl-red shrink-0" />

        {/* Logo — visible when no days selected */}
        {!sheetOpen && (
          <div className="flex-1 flex items-center justify-center opacity-30">
            <img
              src="/logo.png"
              alt="Gritted Teeth Lifestyle"
              className="-rotate-6"
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Muscle grid — slides in when days selected */}
        {sheetOpen && (
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
        )}
      </div>

      <FireFadeIn duration={900} />
      <FireTransition
        active={fireActive}
        onComplete={() => router.push('/fitness/new/summary')}
      />
    </main>
  )
}
