'use client'
/*
 * /fitness/new/branded — Schedule Your Cycle screen.
 *
 * The user just survived the fire transition from muscle targeting.
 * They land here staring at a full P5-style monthly calendar.
 * Clicking any future date toggles it as a training day (red fill).
 * Today is accented in gold. Past days are ghosted and unclickable.
 *
 * Right sidebar shows the cycle name + locked muscle targets from
 * localStorage. LOCK IN CYCLE stamp button fires a full FireTransition
 * and navigates to /fitness.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../../lib/useSound'
import FireFadeIn from '../../../../components/FireFadeIn'
import FireTransition from '../../../../components/FireTransition'

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const MUSCLE_LABELS = {
  chest: 'CHEST', shoulders: 'SHOULDERS', biceps: 'BICEPS',
  triceps: 'TRICEPS', forearms: 'FOREARMS', abs: 'ABS',
  glutes: 'GLUTES', quads: 'QUADS', hamstrings: 'HAMSTRINGS', calves: 'CALVES',
}

// Parallelogram clip for consistent P5 shapes
const PARA_CLIP  = 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)'
const CELL_CLIP  = 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)'
const CARD_CLIP  = 'polygon(0% 0%, 97% 0%, 100% 5%, 100% 100%, 3% 100%, 0% 95%)'

function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href="/fitness/new/muscles"
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

function LockButton({ count, onFire, onHover }) {
  const [pressed, setPressed] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Lock in cycle — ${count} training day${count !== 1 ? 's' : ''} scheduled`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onFire() }}
      onMouseLeave={() => setPressed(false)}
      onMouseEnter={onHover}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFire() }
      }}
      className="relative cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4 w-full"
      style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center center' }}
    >
      {/* Shadow slab */}
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          transform: pressed ? 'translate(0, 0)' : 'translate(6px, 6px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      {/* Face */}
      <div
        className="relative py-5 px-6"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : '#d4181f',
          transform: pressed ? 'translate(6px, 6px)' : 'translate(0, 0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className="font-display text-4xl text-gtl-paper leading-none tracking-tight text-center">LOCK IN</div>
        <div className="font-display text-4xl text-gtl-paper leading-none tracking-tight text-center">CYCLE</div>
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-paper/60 mt-3 border-t border-gtl-paper/20 pt-2 text-center">
          {count > 0
            ? `${count} DAY${count !== 1 ? 'S' : ''} FORGED ▸`
            : 'PIERCE THE LIMIT ▸'}
        </div>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const router = useRouter()
  const { play } = useSound()

  const [cycleName, setCycleName] = useState('NEW CYCLE')
  const [targets, setTargets] = useState([])
  const [trainingDays, setTrainingDays] = useState(new Set())
  const [fireActive, setFireActive] = useState(false)

  // Stable reference to today — computed once, never changes
  const [today] = useState(() => new Date())

  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  // Load stored cycle data from localStorage
  useEffect(() => {
    try {
      const name = localStorage.getItem('gtl-cycle-name')
      if (name) setCycleName(name)
      const raw = localStorage.getItem('gtl-muscle-targets')
      if (raw) setTargets(JSON.parse(raw))
    } catch (_) {}
  }, [])

  // ── Calendar math ────────────────────────────────────────────────────
  const year  = displayDate.getFullYear()
  const month = displayDate.getMonth()

  const firstDayOfWeek = new Date(year, month, 1).getDay()  // 0 = Sun
  const daysInMonth    = new Date(year, month + 1, 0).getDate()

  // Build flat cell array — null for padding, number for real days
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

  const toggleDay = (d) => {
    if (isPast(d)) return
    play('option-select')
    const key = isoKey(d)
    setTrainingDays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const prevMonth = () =>
    setDisplayDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })

  const nextMonth = () =>
    setDisplayDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })

  const trainingDayCount = trainingDays.size

  const handleLockIn = () => {
    play('card-confirm')
    try {
      localStorage.setItem('gtl-training-days', JSON.stringify([...trainingDays]))
    } catch (_) {}
    setFireActive(true)
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden bg-gtl-void">
      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(122,14,20,0.25) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.35) 100%)',
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

      {/* Ghost "03" stamp number */}
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

      {/* Headline */}
      <section className="relative z-10 px-8 pb-6 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-0.5 w-16 bg-gtl-red" />
          <span className="font-mono text-xs tracking-[0.4em] uppercase text-gtl-red font-bold">
            STEP / 03 / SCHEDULE
          </span>
          <div className="h-0.5 w-16 bg-gtl-red" />
        </div>
        <h1 className="font-display text-6xl md:text-7xl text-gtl-chalk leading-none -rotate-1">
          MARK YOUR
          <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-2 ml-4">
            DAYS
          </span>
        </h1>
        <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-gtl-ash mt-4 max-w-xl">
          Click any day to mark it as a training day. Past days cannot be scheduled.
        </p>
      </section>

      {/* Main 2-column layout */}
      <section className="relative z-10 px-8 pb-24 max-w-[1440px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-10">

        {/* ── Calendar column ──────────────────────────────────────────── */}
        <div>
          {/* Month header row */}
          <div className="flex items-end gap-6 mb-4">
            <MonthNavButton dir="prev" onClick={prevMonth} />

            <div className="flex-1 min-w-0">
              {/* Huge month name */}
              <div
                className="font-display text-7xl md:text-8xl xl:text-9xl text-gtl-chalk leading-none -rotate-1 truncate"
                style={{ letterSpacing: '-0.02em' }}
              >
                {MONTH_NAMES[month]}
              </div>
              {/* Year + day count */}
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

          {/* Day-of-week header row */}
          <div className="grid grid-cols-7 gap-1 mb-1">
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

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) {
                return <div key={`pad-${i}`} className="h-20" />
              }

              const key      = isoKey(d)
              const selected = trainingDays.has(key)
              const todayCell = isToday(d)
              const past     = isPast(d)

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
                      : todayCell
                      ? 'bg-gtl-ink border-gtl-gold'
                      : past
                      ? 'bg-gtl-ink border-gtl-edge'
                      : 'bg-gtl-ink border-gtl-edge hover:border-gtl-red hover:bg-gtl-surface'}
                  `}
                  style={{ clipPath: CELL_CLIP }}
                >
                  {/* Top accent line for today */}
                  {todayCell && !selected && (
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 bg-gtl-gold"
                      aria-hidden="true"
                    />
                  )}

                  {/* Day number */}
                  <span
                    className={`font-display text-3xl leading-none
                      ${selected ? 'text-gtl-paper' : todayCell ? 'text-gtl-gold' : 'text-gtl-chalk'}`}
                  >
                    {d}
                  </span>

                  {/* Selected mark */}
                  {selected && (
                    <span
                      className="font-display text-xs text-gtl-paper/70 leading-none -rotate-12"
                      aria-hidden="true"
                    >
                      ✕
                    </span>
                  )}

                  {/* Today label */}
                  {todayCell && !selected && (
                    <span className="font-mono text-[7px] tracking-[0.2em] uppercase text-gtl-gold leading-none">
                      TODAY
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Total count strip */}
          <div className="mt-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-gtl-edge" />
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-smoke">
              {trainingDayCount === 0
                ? 'MARK YOUR BATTLEDAYS'
                : `${trainingDayCount} BATTLEDAY${trainingDayCount !== 1 ? 'S' : ''} LOCKED`}
            </div>
            <div className="h-px flex-1 bg-gtl-edge" />
          </div>
        </div>

        {/* ── Right sidebar — cycle summary ─────────────────────────── */}
        <aside className="flex flex-col gap-4">

          {/* Cycle name card */}
          <div
            className="border border-gtl-edge bg-gtl-ink p-4"
            style={{ clipPath: CARD_CLIP }}
          >
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red mb-2">
              CYCLE DESIGNATION
            </div>
            <div className="font-display text-3xl text-gtl-chalk leading-tight break-words -rotate-1">
              {cycleName}
            </div>
          </div>

          {/* Target muscles card */}
          <div
            className="border border-gtl-edge bg-gtl-ink p-4"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 3% 100%, 0% 94%)' }}
          >
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red mb-3">
              TARGET MUSCLES
            </div>
            {targets.length === 0 ? (
              <div className="font-mono text-[10px] text-gtl-smoke">NO TARGETS STORED</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {targets.map((id) => (
                  <div
                    key={id}
                    className="px-2 py-1 bg-gtl-red/15 border border-gtl-red/40"
                    style={{ clipPath: PARA_CLIP }}
                  >
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-red-bright">
                      {MUSCLE_LABELS[id] || id.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="font-mono text-[8px] text-gtl-smoke mt-3 border-t border-gtl-edge pt-2">
              {targets.length} / 10 TARGETS LOCKED
            </div>
          </div>

          {/* Training days summary */}
          {trainingDayCount > 0 && (
            <div className="border border-gtl-red/30 bg-gtl-red/5 p-4">
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red mb-1">
                BATTLEDAYS
              </div>
              <div className="font-display text-5xl text-gtl-red leading-none">
                {String(trainingDayCount).padStart(2, '0')}
              </div>
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-ash mt-1">
                DAY{trainingDayCount !== 1 ? 'S' : ''} SCHEDULED
              </div>
            </div>
          )}

          {/* Spacer pushes button to bottom */}
          <div className="flex-1" />

          {/* Lock In Cycle button */}
          <LockButton
            count={trainingDayCount}
            onFire={handleLockIn}
            onHover={() => play('button-hover')}
          />
        </aside>
      </section>

      {/* Footer slash */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center gap-4 px-8">
        <div className="h-px flex-1 bg-gtl-edge" />
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
          GRITTED TEETH LIFESTYLE / FITNESS PALACE / SCHEDULING
        </div>
        <div className="h-px flex-1 bg-gtl-edge" />
      </div>

      {/* Fire fade-in — hides the cut from the previous screen */}
      <FireFadeIn duration={900} />

      {/* Fire transition — erupts on LOCK IN, navigates on complete */}
      <FireTransition
        active={fireActive}
        onComplete={() => router.push('/fitness/new/plan')}
      />
    </main>
  )
}
