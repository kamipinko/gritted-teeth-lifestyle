'use client'
/*
 * /fitness/new/summary — Mission Briefing. The payoff screen.
 *
 * The user named their cycle, picked their targets, carved their schedule,
 * and assigned every session. This page makes them feel it. The cycle name
 * dominates the hero band in white on red. Stats flash in gold. Muscle
 * targets are stamped in big rotated parallelogram slabs. Day cards are
 * tilted dossiers. BEGIN is the final contract.
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

const DAY_SHORT   = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

// Alternating slab rotations — varied enough to feel handmade
const SLAB_ROTATIONS = ['-1.5deg','1deg','-0.8deg','1.5deg','-1.2deg','0.8deg','-1.8deg','1.2deg','-0.6deg','1.4deg','-1deg']
const CARD_ROTATIONS = ['-0.8deg','0.6deg','-0.5deg','0.9deg','-0.7deg','0.4deg','-1deg','0.7deg','-0.6deg','0.8deg']

function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

/* ── Muscle slab — big stamped parallelogram ── */
function MuscleSlab({ id, index }) {
  const rot = SLAB_ROTATIONS[index % SLAB_ROTATIONS.length]
  return (
    <div
      className="px-6 py-3 bg-gtl-red border-2 border-gtl-red-bright shadow-red-glow shrink-0"
      style={{
        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
        transform: `rotate(${rot})`,
        transformOrigin: 'center center',
      }}
    >
      <div className="font-display text-2xl text-gtl-paper leading-none tracking-wide whitespace-nowrap">
        {MUSCLE_LABELS[id] || id.toUpperCase()}
      </div>
    </div>
  )
}

/* ── Compact muscle chip — mini slab, same energy as the top ones ── */
function MuscleChip({ id, index = 0 }) {
  const rot = SLAB_ROTATIONS[index % SLAB_ROTATIONS.length]
  return (
    <div
      className="px-4 py-2 bg-gtl-red border border-gtl-red-bright shadow-red-glow shrink-0"
      style={{
        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
        transform: `rotate(${rot})`,
        transformOrigin: 'center center',
      }}
    >
      <div className="font-display text-base text-gtl-paper leading-none whitespace-nowrap">
        {MUSCLE_LABELS[id] || id.toUpperCase()}
      </div>
    </div>
  )
}

/* ── Day dossier card ── */
function DayCard({ iso, muscles, index }) {
  const date    = parseDate(iso)
  const dayName = DAY_SHORT[date.getDay()]
  const dayNum  = date.getDate()
  const mon     = MONTH_SHORT[date.getMonth()]
  const hasWork = muscles.length > 0
  const rot     = CARD_ROTATIONS[index % CARD_ROTATIONS.length]

  return (
    <div
      className={`flex flex-col border-l-4 bg-gtl-ink border-r border-t border-b
        ${hasWork ? 'border-l-gtl-red border-t-gtl-edge border-r-gtl-edge border-b-gtl-edge' : 'border-l-gtl-smoke border-t-gtl-edge border-r-gtl-edge border-b-gtl-edge'}`}
      style={{ transform: `rotate(${rot})`, transformOrigin: 'center top', overflow: 'visible' }}
    >
      {/* Date block */}
      <div className="px-4 pt-4 pb-3">
        <div className={`font-display text-3xl leading-none tracking-widest ${hasWork ? 'text-gtl-red' : 'text-gtl-smoke'}`}>
          {dayName}
        </div>
        <div className="flex items-baseline gap-2 mt-0">
          <span className={`font-display leading-none ${hasWork ? 'text-gtl-chalk' : 'text-gtl-ash'}`}
                style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}>
            {dayNum}
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">{mon}</span>
        </div>
      </div>

      {/* Red slash divider — only on active days */}
      {hasWork && (
        <div className="mx-4 mb-3 h-0.5 bg-gtl-red" style={{ transform: 'skewX(-8deg)' }} />
      )}

      {/* Muscles */}
      <div className="px-4 pb-6 pt-1 flex flex-wrap gap-x-3 gap-y-4 min-h-[2rem]" style={{ overflow: 'visible' }}>
        {hasWork
          ? muscles.map((id, i) => <MuscleChip key={id} id={id} index={i} />)
          : <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-gtl-smoke self-center">REST</span>}
      </div>
    </div>
  )
}

/* ── Stat block — gold number + mono label ── */
function StatBlock({ number, label }) {
  return (
    <div className="flex flex-col items-start">
      <div
        className="font-display leading-none"
        style={{
          fontSize: 'clamp(4rem, 8vw, 7rem)',
          color: '#e4b022',
          textShadow: '3px 3px 0 #8a6612, 5px 5px 0 #070708',
        }}
      >
        {String(number).padStart(2, '0')}
      </div>
      <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-gtl-ash mt-1">
        {label}
      </div>
    </div>
  )
}

/* ── BEGIN — the final contract ── */
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
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFire() } }}
      className="relative w-full cursor-pointer select-none outline-none
        focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4"
      style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center center' }}
    >
      {/* Shadow slab */}
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(10px, 10px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      {/* Face */}
      <div
        className="relative flex items-center justify-between px-12 py-8"
        style={{
          clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : '#d4181f',
          transform: pressed ? 'translate(10px, 10px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div>
          <div className="font-display text-8xl text-gtl-paper leading-none tracking-tight">
            BEGIN
          </div>
          <div className="font-mono text-[10px] tracking-[0.5em] uppercase text-gtl-paper/50 mt-2">
            LAUNCH THE FORGE / THE CYCLE STARTS NOW
          </div>
        </div>
        <div className="font-display text-6xl text-gtl-paper/30 leading-none select-none">
          ▸
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
  const [days,       setDays]       = useState([])
  const [dailyPlan,  setDailyPlan]  = useState({})
  const [fireActive, setFireActive] = useState(false)

  useEffect(() => {
    try {
      const name = localStorage.getItem('gtl-cycle-name')
      const rawT = localStorage.getItem('gtl-muscle-targets')
      const rawD = localStorage.getItem('gtl-training-days')
      const rawP = localStorage.getItem('gtl-daily-plan')
      if (name) setCycleName(name)
      if (rawT) setTargets(JSON.parse(rawT))
      if (rawD) setDays(JSON.parse(rawD).sort())
      if (rawP) setDailyPlan(JSON.parse(rawP))
    } catch (_) {}
  }, [])

  const handleBegin = () => {
    play('card-confirm')
    setFireActive(true)
  }

  const plannedSessions = days.filter((iso) => (dailyPlan[iso] || []).length > 0).length

  const cols = days.length <= 5 ? days.length
             : days.length <= 10 ? Math.ceil(days.length / 2)
             : Math.ceil(days.length / 3)

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gtl-void">

      {/* ── Atmospherics ────────────────────────────────────────────── */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, rgba(122,14,20,0.18) 0%, transparent 45%, rgba(74,10,14,0.28) 100%)' }} />

      {/* Kanji watermark — 完 (complete) — stronger than usual */}
      <div
        className="absolute -top-16 -right-24 pointer-events-none select-none"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '52rem', lineHeight: '0.8',
          color: '#d4181f', opacity: 0.055, fontWeight: 900,
          animation: 'flicker 6s ease-in-out infinite',
        }}
      >
        完
      </div>

      {/* ── HERO BAND — cycle name on full-width red ──────────────── */}
      <section className="relative z-10 overflow-hidden">
        {/* The red band itself — skewed so it bleeds off both edges */}
        <div
          className="absolute inset-0 bg-gtl-red"
          style={{ transform: 'skewY(-1.5deg)', transformOrigin: 'top left' }}
          aria-hidden="true"
        />

        {/* "FORGED" ghost text on the band — big, rotated, proud */}
        <div
          className="absolute right-4 top-2 font-display text-[10rem] leading-none select-none pointer-events-none"
          aria-hidden="true"
          style={{ color: 'rgba(0,0,0,0.18)', transform: 'rotate(6deg)', transformOrigin: 'right top' }}
        >
          FORGED
        </div>

        {/* Content on top of red band */}
        <div className="relative px-8 pt-8 pb-14">
          {/* Breadcrumb */}
          <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-paper/40 mb-6">
            PALACE / FITNESS / NEW CYCLE / MISSION BRIEF
          </div>

          {/* Step tag — counter-rotated */}
          <div className="inline-flex items-center gap-3 mb-4" style={{ transform: 'rotate(1deg)' }}>
            <div className="h-0.5 w-10 bg-gtl-paper/40" />
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-paper/70 font-bold">
              STEP 05 / REVIEW
            </span>
          </div>

          {/* THE CYCLE NAME — the whole reason we're here */}
          <h1
            className="font-display text-gtl-paper leading-none"
            style={{
              fontSize: 'clamp(3.5rem, 11vw, 9rem)',
              transform: 'rotate(-2deg)',
              transformOrigin: 'left center',
              textShadow: '5px 5px 0 #070708, 10px 10px 0 rgba(0,0,0,0.4)',
              letterSpacing: '-0.02em',
            }}
          >
            {cycleName}
          </h1>

          {/* "CYCLE DESIGNATION" label below name — counter-rotated for tension */}
          <div
            className="font-mono text-[10px] tracking-[0.5em] uppercase text-gtl-paper/50 mt-4"
            style={{ transform: 'rotate(0.8deg)' }}
          >
            CYCLE DESIGNATION / AUTHORIZED
          </div>
        </div>
      </section>

      {/* ── STATS ROW — gold numbers, earned ────────────────────────── */}
      <section className="relative z-10 px-8 py-10">
        <div className="flex items-start gap-8 flex-wrap">
          <StatBlock number={days.length}       label="BATTLEDAYS" />

          {/* Red slash separator */}
          <div className="self-stretch flex items-center">
            <div className="w-1 h-full min-h-[5rem] bg-gtl-red" style={{ transform: 'skewX(-12deg)' }} />
          </div>

          <StatBlock number={targets.length}    label="TARGETS LOCKED" />

          <div className="self-stretch flex items-center">
            <div className="w-1 h-full min-h-[5rem] bg-gtl-red" style={{ transform: 'skewX(-12deg)' }} />
          </div>

          <StatBlock number={plannedSessions}   label="SESSIONS MAPPED" />
        </div>
      </section>

      {/* Red slash divider */}
      <div className="relative z-10 mx-8 mb-10 h-[3px] bg-gtl-red"
           style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }} />

      {/* ── SCHEDULE — tilted day dossiers ───────────────────────────── */}
      <section className="relative z-10 px-8 mb-12">
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-ash mb-8 flex items-center gap-4">
          <span>BATTLE SCHEDULE</span>
          <div className="h-px flex-1 bg-gtl-edge" />
          <span className="text-gtl-red">{days.length} DAY{days.length !== 1 ? 'S' : ''} FORGED</span>
        </div>

        {days.length === 0 ? (
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gtl-smoke">
            NO DAYS SCHEDULED
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(cols, days.length)}, 1fr)` }}
          >
            {days.map((iso, i) => (
              <DayCard
                key={iso}
                iso={iso}
                muscles={dailyPlan[iso] || []}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── BEGIN — the final signature ──────────────────────────────── */}
      <section className="relative z-10 px-8 pb-20 pt-4">
        <BeginButton onFire={handleBegin} onHover={() => play('button-hover')} />
      </section>

      <FireFadeIn duration={900} />
      <FireTransition active={fireActive} onComplete={() => router.push('/fitness')} />
    </main>
  )
}
