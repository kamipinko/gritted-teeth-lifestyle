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
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../../lib/useSound'
import { useProfileGuard } from '../../../../lib/useProfileGuard'
import { pk } from '../../../../lib/storage'
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

/* ── EXPORT — print/save as PDF ── */
function ExportButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={() => window.print()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4 no-print"
      style={{ transform: 'rotate(0.7deg)', transformOrigin: 'center center' }}
      aria-label="Export cycle summary as PDF"
    >
      {/* Shadow */}
      <div
        className="absolute inset-0 bg-gtl-edge"
        style={{
          clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
          transform: hovered ? 'translate(0,0)' : 'translate(5px, 5px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      {/* Face */}
      <div
        className="relative flex items-center gap-6 px-10 py-4"
        style={{
          clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
          background: hovered ? '#2a2a2e' : '#1a1a1e',
          border: '1px solid #3a3a42',
          transform: hovered ? 'translate(5px, 5px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className="font-display text-2xl text-gtl-ash leading-none tracking-tight">
          EXPORT
        </div>
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
          SAVE AS PDF / PRINT
        </div>
        <div className="font-display text-xl text-gtl-smoke/50 leading-none select-none ml-auto">
          ⬇
        </div>
      </div>
    </button>
  )
}

/* ── BEGIN — the final contract ── */
function BeginButton({ onFire, onHover }) {
  const [pressed, setPressed] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Etch the cycle"
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
            ETCH CYCLE
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
  useProfileGuard()
  const router = useRouter()
  const { play } = useSound()

  const [cycleName,   setCycleName]  = useState('NEW CYCLE')
  const [targets,     setTargets]    = useState([])
  const [days,        setDays]       = useState([])
  const [dailyPlan,   setDailyPlan]  = useState({})
  const [fireActive,  setFireActive] = useState(false)
  const [stampVisible, setStampVisible] = useState(false)
  const [stampLanded,  setStampLanded]  = useState(false)
  const mainRef = useRef(null)

  useEffect(() => {
    try {
      const name = localStorage.getItem(pk('cycle-name'))
      const rawT = localStorage.getItem(pk('muscle-targets'))
      const rawD = localStorage.getItem(pk('training-days'))
      const rawP = localStorage.getItem(pk('daily-plan'))
      if (name) setCycleName(name)
      if (rawT) setTargets(JSON.parse(rawT))
      if (rawD) setDays(JSON.parse(rawD).sort())
      if (rawP) setDailyPlan(JSON.parse(rawP))
    } catch (_) {}
  }, [])

  const handleBegin = () => {
    play('card-confirm')
    // Save or update the cycle in the persistent list
    try {
      const existing  = JSON.parse(localStorage.getItem(pk('cycles')) || '[]')
      const editingId = localStorage.getItem(pk('editing-cycle-id'))
      if (editingId) {
        // Update the existing cycle in place, preserve original createdAt
        const updated = existing.map((c) =>
          c.id === editingId
            ? { ...c, name: cycleName, targets, days, dailyPlan }
            : c
        )
        localStorage.setItem(pk('cycles'), JSON.stringify(updated))
        localStorage.removeItem(pk('editing-cycle-id'))
      } else {
        // Brand-new cycle
        const cycle = {
          id: Date.now().toString(),
          name: cycleName,
          targets,
          days,
          dailyPlan,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem(pk('cycles'), JSON.stringify([cycle, ...existing]))
      }
    } catch (_) {}
    setStampVisible(true)

    // Impact fires at 70% through the 950ms slam animation = ~665ms
    setTimeout(() => {
      play('stamp')
      setStampLanded(true)
      // Violent screen shake at impact
      if (mainRef.current) {
        mainRef.current.animate(
          [
            { transform: 'translate(0,0)' },
            { transform: 'translate(-16px, 10px)' },
            { transform: 'translate(14px, -14px)' },
            { transform: 'translate(-12px, -7px)' },
            { transform: 'translate(10px, 10px)' },
            { transform: 'translate(-8px, 5px)' },
            { transform: 'translate(6px, -8px)' },
            { transform: 'translate(-4px, 4px)' },
            { transform: 'translate(2px, -2px)' },
            { transform: 'translate(0,0)' },
          ],
          { duration: 500, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }
        )
      }
    }, 665)

    // Second stamp sound for extra weight
    setTimeout(() => play('stamp'), 750)

    // Fire transition after the stamp has been seen
    setTimeout(() => setFireActive(true), 1900)
  }

  const plannedSessions = days.filter((iso) => (dailyPlan[iso] || []).length > 0).length

  const cols = days.length <= 5 ? days.length
             : days.length <= 10 ? Math.ceil(days.length / 2)
             : Math.ceil(days.length / 3)

  return (
    <main ref={mainRef} className="relative min-h-screen overflow-x-hidden bg-gtl-void">

      {/* ── Print styles ────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { margin: 0.6in; size: portrait; }
          body { background: #ffffff !important; }
          /* Hide decorative / interactive layers */
          .no-print { display: none !important; }
          .gtl-noise { display: none !important; }
          /* Stamp overlay and fire transitions sit in fixed position — never print */
          .fixed { display: none !important; }
          /* Force color preservation so red slabs and gold numbers survive */
          * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

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

      {/* ── EXPORT + BEGIN ───────────────────────────────────────────── */}
      <section className="relative z-10 px-8 pb-20 pt-4 flex flex-col gap-4 no-print">
        <ExportButton />
        <BeginButton onFire={handleBegin} onHover={() => play('button-hover')} />
      </section>

      {/* ── DEADLINE STAMP OVERLAY ───────────────────────────────── */}
      {stampVisible && days.length > 0 && (() => {
        const lastDay  = days[days.length - 1]
        const date     = parseDate(lastDay)
        const dayName  = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][date.getDay()]
        const dayNum   = date.getDate()
        const month    = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][date.getMonth()]
        const year     = date.getFullYear()

        return (
          <div className="fixed inset-0 z-[9997] flex items-center justify-center pointer-events-none">
            <style>{`
              @keyframes deadline-slam {
                0%   { transform: translateY(-320px) scale(9) rotate(-18deg); opacity: 0; filter: blur(24px); }
                6%   { opacity: 1; filter: blur(14px); }
                45%  { transform: translateY(30px) scale(2.2) rotate(-10deg); opacity: 1; filter: blur(5px); }
                65%  { transform: translateY(-20px) scale(0.78) rotate(-9deg); opacity: 1; filter: blur(0); }
                78%  { transform: translateY(8px) scale(1.14) rotate(-10deg); opacity: 1; }
                88%  { transform: translateY(-4px) scale(0.97) rotate(-10deg); opacity: 1; }
                100% { transform: translateY(0) scale(1) rotate(-10deg); opacity: 1; }
              }
              @keyframes deadline-ring {
                0%   { transform: translate(-50%,-50%) scale(0); opacity: 0; border-width: 14px; }
                4%   { opacity: 1; }
                70%  { opacity: 0.5; border-width: 4px; }
                100% { transform: translate(-50%,-50%) scale(10); opacity: 0; border-width: 1px; }
              }
              @keyframes deadline-flash {
                0%   { opacity: 0; }
                12%  { opacity: 0.85; }
                100% { opacity: 0; }
              }
            `}</style>

            {/* White flash on impact */}
            {stampLanded && (
              <div
                className="absolute inset-0 bg-white"
                style={{ animation: 'deadline-flash 500ms cubic-bezier(0.3, 0, 0.5, 1) forwards', mixBlendMode: 'screen' }}
              />
            )}

            {/* Shockwave rings — 3 staggered, expand from stamp center */}
            {stampLanded && [0, 90, 180].map((delay, i) => (
              <div
                key={i}
                className="absolute rounded-full border-gtl-red"
                style={{
                  left: '50%', top: '50%',
                  width: '120px', height: '120px',
                  borderColor: i === 0 ? '#ffffff' : i === 1 ? '#ff2a36' : '#d4181f',
                  animation: `deadline-ring 900ms cubic-bezier(0.2, 0.8, 0.3, 1) ${delay}ms forwards`,
                  mixBlendMode: 'screen',
                }}
              />
            ))}

            {/* The stamp itself */}
            <div style={{ animation: 'deadline-slam 950ms cubic-bezier(0.18, 1.2, 0.35, 1) forwards' }}>
              <div className="relative">
                {/* Hard shadow slab */}
                <div
                  className="absolute inset-0 bg-gtl-red-deep"
                  style={{
                    transform: 'translate(18px, 18px)',
                    clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)',
                  }}
                  aria-hidden="true"
                />

                {/* Stamp face */}
                <div
                  className="relative px-14 py-10 bg-gtl-red border-4 border-gtl-red-deep"
                  style={{ clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)' }}
                >
                  {/* Top label */}
                  <div
                    className="font-mono text-[11px] tracking-[0.6em] uppercase text-gtl-paper/50 mb-2"
                    style={{ letterSpacing: '0.6em' }}
                  >
                    ◼ DEADLINE ◼
                  </div>

                  {/* Month */}
                  <div
                    className="font-display text-5xl text-gtl-paper leading-none"
                    style={{ textShadow: '3px 3px 0 #070708' }}
                  >
                    {month}
                  </div>

                  {/* Day number — the dominant element */}
                  <div
                    className="font-display text-gtl-paper leading-none"
                    style={{
                      fontSize: 'clamp(6rem, 16vw, 13rem)',
                      textShadow: '6px 6px 0 #070708, 12px 12px 0 rgba(0,0,0,0.4)',
                      lineHeight: '0.85',
                    }}
                  >
                    {String(dayNum).padStart(2, '0')}
                  </div>

                  {/* Day of week + year */}
                  <div
                    className="font-display text-3xl text-gtl-paper/80 leading-none mt-3"
                    style={{ textShadow: '2px 2px 0 #070708' }}
                  >
                    {dayName} · {year}
                  </div>

                  {/* Bottom border line */}
                  <div className="mt-6 h-0.5 bg-gtl-paper/30" />
                  <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-paper/40 mt-2">
                    GRITTED TEETH LIFESTYLE / YOUR FINAL BATTLEDAY
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <FireFadeIn duration={900} />
      <FireTransition active={fireActive} onComplete={() => router.push('/fitness/load')} />
    </main>
  )
}
