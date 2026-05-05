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
import FireTransition from '../../../../components/FireTransition'
import SlashWipe from '../../../../components/SlashWipe'
import SpeedLines from '../../../../components/SpeedLines'
import RetreatButton from '../../../../components/RetreatButton'

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
const ROW_H = 75

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
        {dir === 'prev' ? '◀︎' : '▶︎'}
      </span>
    </button>
  )
}

function SheetMuscleButton({ kanji, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-between px-3 py-1.5 min-h-[46px] border transition-colors duration-150
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
  const dayColor = enabled ? '#070708' : '#e4b022'
  return (
    <div className="flex items-center" style={{ transform: 'skewX(2deg)' }}>
      <span className="font-display leading-none tracking-wide"
        style={{ fontSize: '1.1rem', fontWeight: 900, color: dayColor }}>
        CARVE
      </span>
    </div>
  )
}

/**
 * AttuneMovementsButton — entry point to the Attune Movements page.
 * Visually mirrors SheetCarveButton's gold-on-dim P5/Gurren palette and
 * skewed clip-path slash. Day-selection-gated (CARVE-button parity) but
 * does NOT require muscle assignments — the user discovers the empty
 * state inside the Attune page if they entered without muscles.
 *
 * No slash-cut animation here — this is a navigation entry, not the
 * commit/forge moment that SheetCarveButton's blade-swing earns.
 */
function AttuneMovementsButton({ enabled, onTap, onHover }) {
  // CRITICAL: no transform, no opacity, no z-index on the button itself.
  // Each of those creates a stacking context that isolates the text's
  // mix-blend-mode from the kanji backdrop. The wrapper around this
  // component (in the grid render) must also avoid stacking context
  // creators for the same reason.
  // Inactive dimming uses an rgba color (0.4 alpha) on the text + stroke
  // instead of element opacity, since rgba color doesn't isolate.
  const textColor = enabled ? '#d4181f' : 'rgba(212, 24, 31, 0.4)'
  return (
    <button
      type="button"
      aria-label="Attune Movements"
      onClick={enabled ? onTap : undefined}
      onMouseEnter={enabled ? onHover : undefined}
      disabled={!enabled}
      className={`relative ${enabled ? 'cursor-pointer' : 'cursor-not-allowed'} w-full h-full block`}
      style={{
        background: 'transparent',
        border: 'none',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        padding: 0,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <polygon
          points="4,0 100,0 96,100 0,100"
          fill="none"
          stroke={enabled ? '#d4181f' : 'rgba(212,24,31,0.4)'}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative w-full h-full flex flex-col items-center justify-center px-1 gap-0.5">
        <span
          className="font-display leading-none whitespace-nowrap"
          style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            color: textColor,
            letterSpacing: '0.05em',
          }}
        >
          ATTUNE
        </span>
        <span
          className="font-display leading-none whitespace-nowrap"
          style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            color: textColor,
            letterSpacing: '0.05em',
          }}
        >
          MOVEMENTS
        </span>
      </div>
    </button>
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
  const timersRef = useRef([])
  const firedRef = useRef(false)
  const fire = () => {
    if (!enabled || phase > 0) return
    setPhase(1)
    if (onSlash) onSlash()
    timersRef.current.push(setTimeout(() => { if (mountedRef.current) setPhase(2) }, 108))
    timersRef.current.push(setTimeout(() => { if (mountedRef.current) setPhase(3) }, 228))
    timersRef.current.push(setTimeout(() => {
      if (mountedRef.current && !firedRef.current) { firedRef.current = true; onFire() }
    }, 530))
  }
  // Tap during the slash sequence → clear all pending timers and navigate
  // immediately. Once phase > 0 we're committed; a follow-up tap should not
  // re-fire — just collapse the visual tail.
  useEffect(() => {
    if (phase === 0) return
    const handler = () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      if (!firedRef.current) { firedRef.current = true; onFire() }
    }
    window.addEventListener('pointerdown', handler, { capture: true })
    window.addEventListener('touchstart',  handler, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', handler, { capture: true })
      window.removeEventListener('touchstart',  handler, { capture: true })
    }
  }, [phase, onFire])

  const goldBg = enabled ? '#e4b022' : '#3a2f12'
  const active = phase > 0

  return (
    <button
      type="button"
      aria-label="Carve cycle"
      data-carve=""
      onClick={fire}
      onMouseEnter={enabled && !active ? onHover : undefined}
      disabled={!enabled}
      className={`relative ${enabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
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
            style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: enabled ? '#070708' : '#e4b022', opacity: enabled ? 0.85 : 1, transform: 'skewX(2deg)' }}>
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
        <span className="font-mono leading-none mt-0.5" style={{ fontSize: '12px', fontWeight: 700 }}>{dayLabel}</span>
      </div>
    </button>
  )
}

export default function SchedulePage() {
  useProfileGuard()
  const router = useRouter()
  const { play } = useSound()
  let backHref = '/fitness/new/muscles'
  try {
    if (localStorage.getItem('gtl-back-to-edit') === '1') backHref = '/fitness/edit'
    else if (localStorage.getItem('gtl-quick-forge') === '1') backHref = '/fitness/new'
  } catch (_) {}

  const [today] = useState(() => new Date())
  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const [selectedDays, setSelectedDays] = useState(new Set())
  const [assignments,  setAssignments]  = useState({})
  const [fireActive,   setFireActive]   = useState(false)
  const [quickHeistActive, setQuickHeistActive] = useState(false)
  const [quickForgeRunning, setQuickForgeRunning] = useState(false)
  // Measured rect (top/left/width/height) for the Attune Movements button
  // overlay. Computed from the kanji cells' DOMRect so the button sits
  // exactly over the watermark without claiming any grid track space.
  const [attuneRect, setAttuneRect] = useState(null)
  const dragRef = useRef(false) // true during swipe-select
  const gridRef = useRef(null)
  const NEXT_TARGET = '/fitness/new/summary'
  const skippedRef = useRef(false)
  const skipNow = () => {
    if (skippedRef.current) return
    skippedRef.current = true
    router.push(NEXT_TARGET)
  }
  // Window pointerdown+touchstart listener while transitions are active —
  // tap anywhere routes immediately. data-retreat excluded for back nav.
  useEffect(() => {
    if (!fireActive && !quickHeistActive) return
    const handler = (e) => {
      if (e.target?.closest?.('[data-retreat]')) return
      skipNow()
    }
    window.addEventListener('pointerdown', handler, { capture: true })
    window.addEventListener('touchstart',  handler, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', handler, { capture: true })
      window.removeEventListener('touchstart',  handler, { capture: true })
    }
  }, [fireActive, quickHeistActive])

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
  // CARVE activates on any day selection — muscle assignment is no longer
  // a prerequisite. (Used to require daysWithMuscles > 0; now mirrors the
  // Attune button's gating so both light up together when at least one
  // day is picked.)
  const carveEnabled = selectedDays.size > 0
  // Total cycle days = contiguous span from first to last user-pick (inclusive of any
  // auto-rest gap days). What the carve button surfaces — "5 DAYS" of cycle, not "3
  // muscle-assigned days". 0 when no picks.
  const cycleDays = (firstSelectedKey && lastSelectedKey)
    ? Math.round((new Date(lastSelectedKey + 'T00:00:00Z') - new Date(firstSelectedKey + 'T00:00:00Z')) / 86400000) + 1
    : 0

  // Quick-forge auto-progression: build 6-day cycle (today + 5 future, last is
  // rest), all training days assigned all muscles, then auto-press CARVE.
  useEffect(() => {
    let isQuickForge = false
    try { isQuickForge = localStorage.getItem('gtl-quick-forge') === '1' } catch (_) {}
    if (!isQuickForge) return
    setQuickForgeRunning(true)
    let cancelled = false
    const t = setTimeout(() => {
      if (cancelled) return
      const allMuscles = MUSCLE_ORDER
      const today = new Date()
      const days = []
      for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
        const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        days.push(iso)
      }
      const newSelected = new Set(days)
      const newAssignments = {}
      // First 5 days = all muscles; last day = rest (no muscles).
      for (let i = 0; i < days.length - 1; i++) {
        newAssignments[days[i]] = new Set(allMuscles)
      }
      newAssignments[days[days.length - 1]] = new Set()
      setSelectedDays(newSelected)
      setAssignments(newAssignments)
      // Persist + HeistTransition (red slash) to summary. No FireTransition.
      const t2 = setTimeout(() => {
        if (cancelled) return
        try {
          localStorage.setItem(pk('training-days'), JSON.stringify(days))
          const serialized = {}
          for (const [iso, set] of Object.entries(newAssignments)) {
            if (set.size > 0) serialized[iso] = [...set]
          }
          localStorage.setItem(pk('daily-plan'), JSON.stringify(serialized))
        } catch (_) {}
        setQuickHeistActive(true)
      }, 600)
      return () => clearTimeout(t2)
    }, 700)
    return () => { cancelled = true; clearTimeout(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  // The cell indices where the month kanji renders. The Attune Movements
  // button is positioned absolutely over these same cells (out of grid
  // flow, so calendar cells lay out exactly as production).
  const kanjiCells = []
  monthChars.forEach((ch, ci) => {
    const slotIdx = startOffset + ci
    if (slotIdx < targetSlots.length) {
      emptyKanji[targetSlots[slotIdx]] = ch
      kanjiCells.push(targetSlots[slotIdx])
    }
  })
  // Stable cache key so the measurement effect only re-runs on month change.
  const kanjiCellsKey = kanjiCells.join(',')

  // Measure the kanji cells' bounding box and write the result to
  // `attuneRect`. Position-absolute overlay below reads this; keeps the
  // Attune button out of the CSS grid's auto-placement so the calendar
  // cells lay out exactly as if no button existed.
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || kanjiCells.length === 0) {
      setAttuneRect(null)
      return
    }
    const measure = () => {
      const cellEls = grid.children
      const firstIdx = Math.min(...kanjiCells)
      const lastIdx = Math.max(...kanjiCells)
      const firstEl = cellEls[firstIdx]
      const lastEl = cellEls[lastIdx]
      if (!firstEl || !lastEl) {
        setAttuneRect(null)
        return
      }
      const gridRect = grid.getBoundingClientRect()
      const firstCellRect = firstEl.getBoundingClientRect()
      const lastCellRect = lastEl.getBoundingClientRect()
      setAttuneRect({
        top: firstCellRect.top - gridRect.top,
        left: firstCellRect.left - gridRect.left,
        width: lastCellRect.right - firstCellRect.left,
        height: firstCellRect.height,
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(grid)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [kanjiCellsKey])

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="relative h-[100dvh] flex flex-col overflow-hidden bg-gtl-void">
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
          0%   { box-shadow: inset 0 0 0 0 rgba(212, 24, 31, 0); }
          20%  { box-shadow: inset 0 0 0 3px rgba(212, 24, 31, 0.85); }
          100% { box-shadow: inset 0 0 0 0 rgba(212, 24, 31, 0); }
        }
        .wrap-continuity-pulse { animation: wrap-continuity-pulse 1000ms ease-out 200ms both; }
      `}</style>
      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(122,14,20,0.25) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.35) 100%)' }} />

      {/* Content wrapper — atmospheric layers paint full-bleed (incl. safe area). */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <nav
        className="relative flex items-center justify-center gap-4 px-4 pb-1 border-b border-gtl-edge/40 shrink-0"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        {/* RetreatButton self-positions fixed top-left (canonical component);
            the prev/label/next centered group below is naturally symmetric. */}
        <RetreatButton href={backHref} />
        <MonthNavButton dir="prev" onClick={prevMonth} />
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl leading-none text-gtl-chalk tracking-tight">
            {MONTH_NAMES[month]}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-gtl-red font-bold">
            {year}
          </span>
        </div>
        <MonthNavButton dir="next" onClick={nextMonth} />
      </nav>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-3 pt-0 pb-0 shrink-0">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`py-0.5 text-center font-mono text-[14px] tracking-wide font-bold uppercase
                ${i === 0 || i === 6 ? 'text-gtl-red/80' : 'text-gtl-ash'}`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 5-row day grid — fixed 75px rows. relative positioning context
            for the Attune Movements absolute overlay rendered below.
            isolation:isolate scopes the Attune button's mix-blend-difference
            to this subtree (kanji backdrop + Attune text), which Safari/iOS
            WebKit needs to apply the blend correctly. */}
        <div
          ref={gridRef}
          className="relative grid grid-cols-7 grid-rows-5 gap-1"
          style={{ height: `${ROW_H * 5 + 4 * 4}px`, isolation: 'isolate' }}
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
                        color: '#d4181f',
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

                {/* Wrap-continuity cues — only on the paired flow-end / wrapped cells.
                    GTL red (#d4181f) so they read with the rest of the palette
                    instead of fighting today's gold border. */}
                {isFlowEnd && (
                  <>
                    <div className="absolute top-0 right-0 bottom-0 w-[2px] pointer-events-none"
                         style={{ background: '#d4181f', boxShadow: '0 0 6px rgba(212,24,31,0.7)' }}
                         aria-hidden="true" />
                    <span className="absolute top-1 right-1 font-mono text-[12px] font-semibold leading-none pointer-events-none select-none"
                          style={{ color: '#d4181f' }}
                          aria-hidden="true">↗</span>
                  </>
                )}
                {isFirstWrap && (
                  <>
                    <div className="absolute top-0 left-0 bottom-0 w-[2px] pointer-events-none"
                         style={{ background: '#d4181f', boxShadow: '0 0 6px rgba(212,24,31,0.7)' }}
                         aria-hidden="true" />
                    <span className="absolute bottom-1 left-1 font-mono text-[12px] font-semibold leading-none pointer-events-none select-none"
                          style={{ color: '#d4181f' }}
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

          {/* Attune Movements entry — absolute overlay measured to the
              kanji cells' bounding box (see attuneRect useEffect above).
              Out of grid flow → does not displace calendar auto-placement.
              Always rendered when the kanji has a position; activates the
              moment any day is selected. */}
          {attuneRect && (
            <div
              style={{
                position: 'absolute',
                top: `${attuneRect.top}px`,
                left: `${attuneRect.left}px`,
                width: `${attuneRect.width}px`,
                height: `${attuneRect.height}px`,
                // mix-blend-mode on the wrapper (not on the inner spans) so
                // the entire overlay layer — SVG outline + text glyphs —
                // composites against the kanji backdrop as one operation.
                // On a span, the blend was getting promoted into a separate
                // compositor layer that didn't see the kanji as backdrop;
                // the wrapper-level blend keeps everything in one pass.
                mixBlendMode: 'difference',
                // clipPath restricts the click area to the slash silhouette,
                // so taps in the wrapper's bounding-box corners pass through
                // to underlying day cells.
                clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
              }}
            >
              <AttuneMovementsButton
                enabled={selectedDays.size > 0}
                onTap={() => { play('option-select'); router.push('/attune') }}
                onHover={() => play('button-hover')}
              />
            </div>
          )}
        </div>
      </section>

      {/* Red accent line */}
      <div className="h-[2px] bg-gtl-red shrink-0" />

      {/* Logo — visible when no days selected */}
      {!sheetOpen && (
        <div className="flex-1 flex items-center justify-center opacity-30 overflow-hidden">
          <img
            src="/logo.png"
            alt="Gritted Teeth Lifestyle"
            className="-rotate-6"
            style={{ width: 226, height: 226, borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Muscle grid — fills remaining viewport, scrolls internally if needed.
          Calendar above is shrink-0 (always full 5 rows visible, never scrolls). */}
      {sheetOpen && (
        <div className="flex-1 overflow-y-auto px-3 pt-0 pb-1">
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
              count={cycleDays}
              enabled={carveEnabled}
              onFire={handleCarve}
              onHover={() => play('button-hover')}
              onSlash={() => play(Math.random() < 0.2 ? 'slash-alt' : 'slash')}
            />
          </div>
        </div>
      )}

      </div>
      <FireTransition
        active={fireActive}
        onComplete={() => { if (!skippedRef.current) router.push(NEXT_TARGET) }}
      />
      <SlashWipe
        active={quickHeistActive}
        onComplete={() => { if (!skippedRef.current) router.push(NEXT_TARGET) }}
      />
      <SpeedLines active={quickForgeRunning} />
    </main>
  )
}
