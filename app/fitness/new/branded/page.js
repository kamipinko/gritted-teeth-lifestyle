'use client'
/*
 * /fitness/new/branded — Schedule + Muscle Assignment (mobile).
 *
 * Always 5 calendar rows (overflow days wrap into row 1's empty slots).
 * Multi-day batch editing with swipe-to-select. Additive-first muscle
 * toggles. Date numbers as watermarks, kanji overlays in 2-col grid.
 * CARVE shows total days with muscles assigned.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
      className={`relative flex items-center justify-between px-3 py-2.5 border transition-colors duration-150
        ${active
          ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow'
          : 'bg-gtl-ink border-gtl-edge'}`}
      style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)', transform: 'skewX(-2deg)' }}
    >
      <span
        className={`font-mono text-[12px] tracking-[0.08em] uppercase leading-none font-bold
          ${active ? 'text-gtl-paper' : 'text-gtl-chalk'}`}
        style={{ transform: 'skewX(2deg)' }}
      >
        {label}
      </span>
      <span
        className={`leading-none ${active ? 'text-gtl-paper' : 'text-gtl-chalk/70'}`}
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '1.25rem',
          fontWeight: 400,
          textShadow: active ? '1px 1px 0 #070708' : 'none',
          transform: 'skewX(2deg)',
        }}
      >
        {kanji}
      </span>
    </button>
  )
}

function CarveContent({ enabled }) {
  const dayColor = enabled ? '#070708' : '#555'
  return (
    <>
      <div className="flex items-center gap-1.5" style={{ transform: 'skewX(2deg)' }}>
        <span className="leading-none"
          style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", serif', fontSize: '0.95rem', fontWeight: 400, color: dayColor }}>
          刻
        </span>
        <span className="font-display leading-none tracking-wide"
          style={{ fontSize: '0.75rem', fontWeight: 900, color: dayColor }}>
          CARVE
        </span>
      </div>
    </>
  )
}

function SheetCarveButton({ count, enabled, onFire, onHover, onSlash }) {
  // 0=idle, 1=slash-sweep, 2=slash-fade, 3=render-halves, 4=separate
  const [phase, setPhase] = useState(0)
  const mountedRef = useRef(true)
  const dayLabel = count === 1 ? '1 DAY' : count > 1 ? `${count} DAYS` : '—'

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // Phase 3→4: one-frame delay so halves render at initial position before transition
  useEffect(() => {
    if (phase !== 3) return
    const id = setTimeout(() => { if (mountedRef.current) setPhase(4) }, 16)
    return () => clearTimeout(id)
  }, [phase])

  // Timeline:
  //   0ms      phase 1  slash sweep starts (108ms)
  //   108ms    phase 2  slash begins fading (70ms)
  //   178ms             slash fully gone
  //   228ms    phase 3  halves render at initial position (50ms gap after slash gone)
  //   ~244ms   phase 4  halves start separating (via 16ms setTimeout)
  //   ~660ms            navigate
  const fire = () => {
    if (!enabled || phase > 0) return
    setPhase(1)
    if (onSlash) onSlash()
    setTimeout(() => { if (mountedRef.current) setPhase(2) }, 108)   // slash fade
    setTimeout(() => { if (mountedRef.current) setPhase(3) }, 228)   // render halves
    setTimeout(() => { if (mountedRef.current) onFire() }, 530)      // navigate
  }

  const goldBg = enabled ? '#e4b022' : '#2a2a30'
  const active = phase > 0

  return (
    <button
      type="button"
      aria-label="Carve cycle"
      data-carve=""
      onClick={fire}
      onMouseEnter={enabled && !active ? onHover : undefined}
      disabled={!enabled}
      className={`relative ${enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}`}
      style={{
        transform: 'skewX(-2deg)',
        clipPath: active ? 'none' : 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
        overflow: active ? 'visible' : 'hidden',
        background: 'transparent',
        border: 'none',
        animation: enabled && !active ? 'carve-pulse 3s ease-in-out infinite' : 'none',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        transition: 'none',
      }}
    >
      {/* Red glow between halves */}
      {phase >= 3 && (
        <div className="absolute inset-0 z-0" style={{
          background: '#d4181f', filter: 'blur(8px)', opacity: 0.95,
        }} />
      )}

      {/* Gold face — full during idle + slash, splits at phase 3+ */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center px-2 ${active ? 'z-50' : 'z-10'}`}
        style={{
          clipPath: phase >= 4 ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          background: goldBg,
          transform: phase >= 4 ? 'translate(-156px,-85px) rotate(-48deg)' : 'none',
          opacity: phase >= 4 ? 0 : 1,
          transition: phase >= 4
            ? 'transform 248ms cubic-bezier(0.7,0,1,1), opacity 245ms 137ms ease-out'
            : 'none',
        }}>
        <CarveContent enabled={enabled} />
        {phase < 1 && (
          <span className="font-mono leading-none mt-0.5"
            style={{ fontSize: '8px', letterSpacing: '0.1em', color: enabled ? '#070708' : '#555', opacity: 0.6, transform: 'skewX(2deg)' }}>
            {dayLabel}
          </span>
        )}
      </div>

      {/* Bottom-right half */}
      {phase >= 3 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-2"
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
            background: goldBg,
            transform: phase >= 4 ? 'translate(650px,221px) rotate(36deg) scale(0.95)' : 'none',
            opacity: phase >= 4 ? 0 : 1,
            transition: phase >= 4
              ? 'transform 212ms 25ms cubic-bezier(0.7,0,1,1), opacity 245ms 162ms ease-out'
              : 'none',
          }}>
          <CarveContent enabled={enabled} />
        </div>
      )}

      {/* Slash line — sweeps (phase 1), fades (phase 2), gone before phase 3 */}
      {phase >= 1 && phase < 3 && (
        <div className="absolute inset-0 z-50 pointer-events-none"
          style={{
            opacity: phase >= 2 ? 0 : 1,
            transition: 'opacity 70ms ease-out',
          }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom right, transparent calc(50% - 5px), #ff2a36 calc(50% - 3px), #ffffff 50%, #ff2a36 calc(50% + 3px), transparent calc(50% + 5px))',
            animation: 'carve-blade 108ms linear forwards',
            boxShadow: '0 0 8px rgba(255,42,54,0.6)',
          }} />
        </div>
      )}

      {/* Invisible spacer */}
      <div className="invisible flex flex-col items-center justify-center px-2" style={{ height: '100%' }}>
        <CarveContent enabled={enabled} />
        <span className="font-mono leading-none mt-0.5" style={{ fontSize: '8px' }}>{dayLabel}</span>
      </div>
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

  // Tap: toggle in/out of selection batch. Unselecting clears that day's muscles.
  const tapDay = useCallback((d) => {
    if (isPast(d)) return
    play('option-select')
    const key = isoKey(d)
    const wasSelected = selectedDays.has(key)
    setSelectedDays((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
    if (wasSelected) {
      setAssignments((prev) => {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }, [year, month, today, play, selectedDays])

  // Swipe helpers: add or remove based on mode. Removing clears assigned muscles.
  const swipeApply = useCallback((d, mode) => {
    if (isPast(d)) return
    const key = isoKey(d)
    setSelectedDays((prev) => {
      const n = new Set(prev)
      if (mode === 'add') n.add(key)
      else n.delete(key)
      return n
    })
    if (mode === 'remove') {
      setAssignments((prev) => {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }, [year, month, today])

  // Touch handlers for swipe-to-select/deselect.
  // Mode determined by first tile: start on unselected = add, start on selected = remove.
  const touchOriginRef = useRef(null)
  const swipeModeRef = useRef(null) // 'add' | 'remove'

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY }
    dragRef.current = false
    swipeModeRef.current = null
  }, [])

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0]
    const origin = touchOriginRef.current
    if (!dragRef.current && origin) {
      const dx = touch.clientX - origin.x
      const dy = touch.clientY - origin.y
      if (dx * dx + dy * dy < 64) return // 8px threshold
      dragRef.current = true
      // Determine mode from origin tile
      const startEl = document.elementFromPoint(origin.x, origin.y)?.closest('[data-day]')
      if (startEl) {
        const dayNum = Number(startEl.dataset.day)
        const key = isoKey(dayNum)
        swipeModeRef.current = selectedDays.has(key) ? 'remove' : 'add'
        swipeApply(dayNum, swipeModeRef.current)
      }
    }
    if (!dragRef.current) return
    e.preventDefault()
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const dayEl = el?.closest('[data-day]')
    if (dayEl && swipeModeRef.current) {
      swipeApply(Number(dayEl.dataset.day), swipeModeRef.current)
    }
  }, [swipeApply, selectedDays, isoKey])

  const handleTouchEnd = useCallback(() => {
    dragRef.current = false
    touchOriginRef.current = null
    swipeModeRef.current = null
  }, [])

  // Additive-first toggle
  const toggleMuscle = (muscleId) => {
    if (selectedDays.size === 0) return
    const keys = [...selectedDays]
    const allHave = keys.every((k) => (assignments[k] || new Set()).has(muscleId))
    play(allHave ? 'option-select' : 'stamp')
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
  }
  const nextMonth = () => {
    setDisplayDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d })
  }

  const sheetOpen = selectedDays.size > 0

  // Wrap-continuity pulse — bumps on month change so the paired (last-flow + wrapped) cells
  // re-trigger their CSS animation. Used as part of the cell key so React re-mounts the
  // wrap-continuity overlay when the month changes.
  const [pulseKey, setPulseKey] = useState(0)
  useEffect(() => {
    setPulseKey((k) => k + 1)
  }, [year, month])

  // Sorted selection drives the auto-rest gap fill: any unpicked day between the first
  // and last user-picked ISO date renders with a ✕ overlay (no red highlight) so it reads
  // as part of the cycle. P1 persistence: gap days are NOT saved, only user-picks are.
  const sortedSelected = useMemo(() => {
    if (selectedDays.size === 0) return []
    return [...selectedDays].sort()
  }, [selectedDays])
  const firstSelectedKey = sortedSelected[0]
  const lastSelectedKey  = sortedSelected[sortedSelected.length - 1]

  // Wrap-continuity: pair the last chronological cell that wasn't wrapped (e.g., May 30 in
  // a layout where May 31 wrapped into row 1) with the EARLIEST wrapped cell (firstWrapDay)
  // so the eye reads them as the connected endpoints. Static glyphs/edge accent live only on
  // the pair; the synchronized pulse spans flowEndDay + ALL wrap cells (group flash).
  const wrapActive = wrappedDays.size > 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let flowEndDay = null
  if (wrapActive) {
    for (let d = daysInMonth; d >= 1; d--) {
      if (!wrappedDays.has(d)) { flowEndDay = d; break }
    }
  }
  const firstWrapDay = wrapActive ? Math.min(...wrappedDays) : null
  const daysWithMuscles = Object.values(assignments).filter((s) => s.size > 0).length
  const carveEnabled = daysWithMuscles > 0

  const handleCarve = () => {
    if (!carveEnabled) return
    play('card-confirm')
    try {
      // Persist all user-picked days (including intentional-rest days with no muscles).
      // Auto-rest gap days are NOT saved — they're derived at render time on summary
      // from min/max of the persisted picks. P1 design.
      const trainingDays = [...selectedDays].sort()
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

  // Decorative month kanji — row 1 if ≥2 empty slots, else row 5
  const monthChars = [...MONTH_KANJI[month]]
  const row1Empty = cells.slice(0, 7).map((c, i) => c === null ? i : -1).filter((i) => i >= 0)
  const row5Empty = cells.slice(28, 35).map((c, i) => c === null ? i + 28 : -1).filter((i) => i >= 0)
  const targetSlots = row1Empty.length >= 2 ? row1Empty : row5Empty
  const startOffset = Math.max(0, Math.floor((targetSlots.length - monthChars.length) / 2))
  const emptyKanji = {}
  monthChars.forEach((ch, ci) => {
    const slotIdx = startOffset + ci
    if (slotIdx < targetSlots.length) {
      emptyKanji[targetSlots[slotIdx]] = ch
    }
  })

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="relative h-screen flex flex-col overflow-hidden bg-gtl-void">
      {/* Kanji stamp animation */}
      <style>{`
        @keyframes kanji-stamp {
          0%   { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1.0); opacity: 1; }
        }
        .kanji-stamp { animation: kanji-stamp 150ms ease-out both; }
        @keyframes carve-blade {
          0%   { clip-path: inset(0 0 100% 100%); opacity: 0; }
          5%   { opacity: 1; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        button[data-carve]:active,
        button[data-carve]:focus {
          transform: skewX(-2deg) !important;
        }
        @keyframes carve-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(228,176,34,0.4); }
          50%      { box-shadow: 0 0 20px rgba(228,176,34,0.8), 0 0 40px rgba(228,176,34,0.3); }
        }
        @keyframes wrap-continuity-pulse {
          0%   { box-shadow: inset 0 0 0 0 rgba(228, 176, 34, 0); }
          20%  { box-shadow: inset 0 0 0 3px rgba(228, 176, 34, 0.85); }
          100% { box-shadow: inset 0 0 0 0 rgba(228, 176, 34, 0); }
        }
        .wrap-continuity-pulse { animation: wrap-continuity-pulse 1000ms ease-out 200ms both; }
      `}</style>
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
                        fontSize: '4rem',
                        color: 'rgba(212, 24, 31, 0.7)',
                        fontWeight: 700,
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
            const autoRest   = !selected
                              && firstSelectedKey
                              && key > firstSelectedKey
                              && key < lastSelectedKey
            const todayCell  = isToday(d)
            const past       = isPast(d)
            const isWrapped   = wrappedDays.has(d)
            const isFlowEnd   = wrapActive && d === flowEndDay
            const isFirstWrap = wrapActive && d === firstWrapDay
            // Pulse fires for the full group (flow-end + every wrap cell). Static glyphs +
            // edge accents stay restricted to the pair (flow-end + first wrap).
            const pulseGroup  = isFlowEnd || isWrapped
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
                    : todayCell
                    ? 'bg-gtl-ink border-gtl-gold'
                    : 'bg-gtl-ink border-gtl-edge'}
                  ${pulseGroup ? 'wrap-continuity-pulse' : ''}
                `}
                style={{ clipPath: CELL_CLIP, height: `${ROW_H}px` }}
              >
                {todayCell && !hasMuscles && !selected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gtl-gold" aria-hidden="true" />
                )}

                {/* Wrap-continuity cues — only on the paired flow-end / wrapped cells. */}
                {isFlowEnd && (
                  <>
                    <div className="absolute top-0 right-0 bottom-0 w-[2px] pointer-events-none"
                         style={{ background: '#e4b022', boxShadow: '0 0 6px rgba(228,176,34,0.7)' }}
                         aria-hidden="true" />
                    <span className="absolute top-1 right-1 font-mono text-[12px] font-semibold leading-none pointer-events-none select-none"
                          style={{ color: '#e4b022' }}
                          aria-hidden="true">↗</span>
                  </>
                )}
                {isFirstWrap && (
                  <>
                    <div className="absolute top-0 left-0 bottom-0 w-[2px] pointer-events-none"
                         style={{ background: '#e4b022', boxShadow: '0 0 6px rgba(228,176,34,0.7)' }}
                         aria-hidden="true" />
                    <span className="absolute bottom-1 left-1 font-mono text-[12px] font-semibold leading-none pointer-events-none select-none"
                          style={{ color: '#e4b022' }}
                          aria-hidden="true">↙</span>
                  </>
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

                {/* Kanji overlay — progressive sizing based on count */}
                {hasMuscles && (() => {
                  const count = badges.length
                  const kanjiColor = selected ? '#f5f0e8' : '#d4181f'
                  const shadow = '1px 1px 0 rgba(0,0,0,0.5)'
                  const serif = '"Noto Serif JP", "Yu Mincho", serif'
                  if (count === 1) {
                    return (
                      <span className="absolute inset-0 z-10 flex items-center justify-center select-none pointer-events-none kanji-stamp"
                        key={badges[0]}
                        style={{ fontFamily: serif, fontSize: '3.5rem', color: kanjiColor, textShadow: shadow, lineHeight: 1 }} aria-hidden="true">
                        {MUSCLE_KANJI[badges[0]]}
                      </span>
                    )
                  }
                  if (count <= 3) {
                    const sz = count === 2 ? '2.2rem' : '1.6rem'
                    return (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center select-none pointer-events-none"
                        style={{ fontFamily: serif, fontSize: sz, color: kanjiColor, textShadow: shadow, lineHeight: 1.2, gap: '2px' }} aria-hidden="true">
                        {badges.map((m) => <span key={m} className="kanji-stamp">{MUSCLE_KANJI[m]}</span>)}
                      </div>
                    )
                  }
                  // 4-6 → 2-column at 22px
                  if (count <= 6) {
                    return (
                      <div className="absolute inset-0 z-10 grid grid-cols-2 gap-x-3 gap-y-0 justify-items-center content-center px-1 select-none pointer-events-none"
                        style={{ fontFamily: serif, fontSize: '1.4rem', lineHeight: '1.25', color: kanjiColor, textShadow: shadow }} aria-hidden="true">
                        {badges.map((m) => <span key={m} className="kanji-stamp">{MUSCLE_KANJI[m]}</span>)}
                      </div>
                    )
                  }
                  // 7+ → 2-column compact
                  return (
                    <div className="absolute inset-0 z-10 grid grid-cols-2 gap-x-2 gap-y-0 justify-items-center content-center px-0.5 select-none pointer-events-none"
                      style={{ fontFamily: serif, fontSize: '0.9rem', lineHeight: '1.2', color: kanjiColor, textShadow: shadow }} aria-hidden="true">
                      {badges.map((m) => <span key={m} className="kanji-stamp">{MUSCLE_KANJI[m]}</span>)}
                    </div>
                  )
                })()}

                {/* Rest indicator — shown for both intentional rest (selected, no muscles)
                    and auto-rest gaps (unselected day between first/last picked). */}
                {((selected && !hasMuscles) || autoRest) && (
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
              style={{ width: 226, height: 226, borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Muscle grid — slides in when days selected */}
        {sheetOpen && (
          <div className="px-3 pt-1 pb-1">
            <div className="grid grid-cols-2 grid-rows-6 gap-1" style={{ overflow: 'visible' }}>
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
                onSlash={() => play(Math.random() < 0.2 ? 'slash-alt' : 'slash')}
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
