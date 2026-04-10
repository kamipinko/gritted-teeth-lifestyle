'use client'
/*
 * /fitness/new/summary — Cycle summary screen.
 *
 * Reads everything from localStorage and presents the full cycle
 * as a visual mission briefing: cycle name, target muscles, and
 * each training day with its assigned muscles. P5 aesthetic.
 *
 * BEGIN fires a FireTransition to /fitness.
 */
import { useState, useEffect } from 'react'
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

const DAY_FULL  = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const DAY_SHORT = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

function MuscleTag({ id, dim = false }) {
  return (
    <div
      className={`px-2.5 py-1.5 border text-[10px] font-mono tracking-[0.2em] uppercase leading-none
        ${dim
          ? 'border-gtl-edge text-gtl-smoke bg-transparent'
          : 'border-gtl-red/60 text-gtl-red-bright bg-gtl-red/10'}`}
      style={{ clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
    >
      {MUSCLE_LABELS[id] || id.toUpperCase()}
    </div>
  )
}

function DaySummaryCard({ iso, muscles }) {
  const date    = parseDate(iso)
  const dayName = DAY_SHORT[date.getDay()]
  const dayNum  = date.getDate()
  const mon     = MONTH_SHORT[date.getMonth()]
  const hasWork = muscles.length > 0

  return (
    <div
      className={`flex flex-col border transition-colors duration-200
        ${hasWork ? 'border-gtl-red/40 bg-gtl-ink' : 'border-gtl-edge bg-gtl-ink/50'}`}
      style={{ clipPath: 'polygon(0% 0%, 96% 0%, 100% 3%, 100% 100%, 4% 100%, 0% 97%)' }}
    >
      {/* Day header */}
      <div className={`px-4 py-3 border-b ${hasWork ? 'border-gtl-red/30' : 'border-gtl-edge'}`}>
        <div className={`font-display text-2xl leading-none tracking-wide ${hasWork ? 'text-gtl-red' : 'text-gtl-smoke'}`}>
          {dayName}
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className={`font-display text-4xl leading-none ${hasWork ? 'text-gtl-chalk' : 'text-gtl-ash'}`}>
            {dayNum}
          </span>
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-smoke">{mon}</span>
        </div>
      </div>

      {/* Muscle list */}
      <div className="p-3 flex flex-wrap gap-1.5">
        {hasWork
          ? muscles.map((id) => <MuscleTag key={id} id={id} />)
          : <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-smoke">REST DAY</span>}
      </div>
    </div>
  )
}

function BeginButton({ onFire, onHover }) {
  const [pressed, setPressed] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Begin the cycle"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onFire() }}
      onMouseLeave={() => setPressed(false)}
      onMouseEnter={onHover}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFire() }
      }}
      className="relative cursor-pointer select-none outline-none
        focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4"
      style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center center' }}
    >
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(6px, 6px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      <div
        className="relative px-16 py-5"
        style={{
          clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : '#d4181f',
          transform: pressed ? 'translate(6px, 6px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className="font-display text-5xl text-gtl-paper leading-none tracking-tight whitespace-nowrap">
          BEGIN
        </div>
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-paper/60 mt-2 border-t border-gtl-paper/20 pt-1.5 text-center">
          LAUNCH THE FORGE ▸
        </div>
      </div>
    </div>
  )
}

export default function SummaryPage() {
  const router = useRouter()
  const { play } = useSound()

  const [cycleName,  setCycleName]  = useState('NEW CYCLE')
  const [targets,    setTargets]    = useState([])
  const [days,       setDays]       = useState([])   // sorted ISO strings
  const [dailyPlan,  setDailyPlan]  = useState({})   // { iso: muscleId[] }
  const [fireActive, setFireActive] = useState(false)

  useEffect(() => {
    try {
      const name    = localStorage.getItem('gtl-cycle-name')
      const rawT    = localStorage.getItem('gtl-muscle-targets')
      const rawD    = localStorage.getItem('gtl-training-days')
      const rawP    = localStorage.getItem('gtl-daily-plan')
      if (name)  setCycleName(name)
      if (rawT)  setTargets(JSON.parse(rawT))
      if (rawD)  setDays(JSON.parse(rawD).sort())
      if (rawP)  setDailyPlan(JSON.parse(rawP))
    } catch (_) {}
  }, [])

  const handleBegin = () => {
    play('card-confirm')
    setFireActive(true)
  }

  // Grid columns for the day cards — same logic as plan page
  const cols = days.length <= 5 ? days.length
             : days.length <= 10 ? Math.ceil(days.length / 2)
             : Math.ceil(days.length / 3)

  return (
    <main className="relative min-h-screen overflow-hidden bg-gtl-void">
      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(122,14,20,0.22) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.32) 100%)',
        }}
      />

      {/* Kanji watermark — 完 (complete/perfect) */}
      <div
        className="absolute -top-8 -right-20 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '44rem', lineHeight: '0.8',
          color: '#ffffff', opacity: 0.04, fontWeight: 900,
        }}
      >
        完
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / NEW CYCLE / SUMMARY
        </div>
      </nav>

      {/* ── Headline + cycle name ── */}
      <section className="relative z-10 px-8 pb-8 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-0.5 w-16 bg-gtl-red" />
          <span className="font-mono text-xs tracking-[0.4em] uppercase text-gtl-red font-bold">
            STEP / 05 / REVIEW
          </span>
          <div className="h-0.5 w-16 bg-gtl-red" />
        </div>

        {/* Cycle name — the hero element */}
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-ash mb-1">
              CYCLE DESIGNATION
            </div>
            <h1
              className="font-display text-6xl md:text-8xl text-gtl-chalk leading-none -rotate-1"
              style={{ letterSpacing: '-0.02em' }}
            >
              {cycleName}
            </h1>
          </div>
          <BeginButton onFire={handleBegin} onHover={() => play('button-hover')} />
        </div>
      </section>

      {/* Red slash divider */}
      <div
        className="relative z-10 mx-8 mb-6 h-[3px] bg-gtl-red"
        style={{ transform: 'skewX(-5deg)', transformOrigin: 'left center' }}
      />

      {/* ── Target muscles strip ── */}
      <section className="relative z-10 px-8 mb-8 max-w-[1440px] mx-auto">
        <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red mb-3">
          TARGET MUSCLES — {targets.length} / 11 LOCKED
        </div>
        <div className="flex flex-wrap gap-2">
          {targets.map((id) => (
            <MuscleTag key={id} id={id} />
          ))}
        </div>
      </section>

      {/* ── Training day cards ── */}
      <section className="relative z-10 px-8 pb-24 max-w-[1440px] mx-auto">
        <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red mb-3">
          SCHEDULE — {days.length} DAY{days.length !== 1 ? 'S' : ''} FORGED
        </div>

        {days.length === 0 ? (
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gtl-smoke">
            NO DAYS SCHEDULED
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(cols, days.length)}, 1fr)` }}
          >
            {days.map((iso) => (
              <DaySummaryCard
                key={iso}
                iso={iso}
                muscles={dailyPlan[iso] || []}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center gap-4 px-8">
        <div className="h-px flex-1 bg-gtl-edge" />
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
          GRITTED TEETH LIFESTYLE / FITNESS PALACE / BRIEFING
        </div>
        <div className="h-px flex-1 bg-gtl-edge" />
      </div>

      <FireFadeIn duration={900} />
      <FireTransition active={fireActive} onComplete={() => router.push('/fitness')} />
    </main>
  )
}
