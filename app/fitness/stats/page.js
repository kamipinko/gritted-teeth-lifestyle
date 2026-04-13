'use client'
/*
 * /fitness/stats — War Record screen.
 *
 * Full career overview: level, XP, total cycles, days completed,
 * muscle volume breakdown, and a per-cycle log.
 * All data is read from localStorage at mount — no server needed.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProfileGuard } from '../../../lib/useProfileGuard'
import { pk } from '../../../lib/storage'
import { useSound } from '../../../lib/useSound'

const MUSCLE_LABELS = {
  chest:      'CHEST',
  shoulders:  'SHOULDERS',
  back:       'BACK',
  biceps:     'BICEPS',
  triceps:    'TRICEPS',
  forearms:   'FOREARMS',
  abs:        'ABS',
  glutes:     'GLUTES',
  quads:      'QUADS',
  hamstrings: 'HAMSTRINGS',
  calves:     'CALVES',
}

function getLevelInfo(totalXP) {
  let level = 0
  let xpUsed = 0
  while (true) {
    const threshold = 15000 + level * 1000
    if (xpUsed + threshold > totalXP) {
      return { level, progress: totalXP - xpUsed, threshold }
    }
    xpUsed += threshold
    level++
  }
}

function repMult(r) {
  if (r >= 5 && r <= 15) return 1.0
  if (r < 5) return Math.exp(-Math.pow(r - 5, 2) / 8)
  return Math.exp(-Math.pow(r - 15, 2) / 32)
}

function loadStats() {
  try {
    const raw = localStorage.getItem(pk('cycles'))
    const allCycles = raw ? JSON.parse(raw) : []

    let totalXP = 0
    let daysScheduled = 0
    let daysCompleted = 0
    const muscleXP = {}   // muscleId → XP earned
    const cycleStats = []

    for (const cycle of allCycles) {
      if (!cycle.days || !cycle.dailyPlan) continue
      daysScheduled += cycle.days.length

      let cycleDone = 0
      let cycleXP = 0

      for (const iso of cycle.days) {
        const done = localStorage.getItem(pk(`done-${cycle.id}-${iso}`)) === 'true'
        if (!done) continue
        daysCompleted++
        cycleDone++

        for (const muscleId of (cycle.dailyPlan[iso] || [])) {
          const rRaw = localStorage.getItem(pk(`ex-${cycle.id}-${iso}-${muscleId}`))
          const wRaw = localStorage.getItem(pk(`wt-${cycle.id}-${iso}-${muscleId}`))
          const rData = rRaw ? JSON.parse(rRaw) : {}
          const wData = wRaw ? JSON.parse(wRaw) : {}
          for (const name of Object.keys(rData)) {
            const rArr = Array.isArray(rData[name]) ? rData[name] : [rData[name]]
            const wArr = Array.isArray(wData[name]) ? wData[name] : [wData[name] || 0]
            for (let i = 0; i < rArr.length; i++) {
              const reps = rArr[i] || 0
              const weight = wArr[i] || 0
              if (reps === 0) continue
              const mult = repMult(reps)
              const earned = weight > 0 ? weight * mult * reps : reps * mult
              muscleXP[muscleId] = (muscleXP[muscleId] || 0) + earned
              cycleXP += earned
              totalXP += earned
            }
          }
        }
      }

      cycleStats.push({
        id:        cycle.id,
        name:      cycle.name,
        scheduled: cycle.days.length,
        completed: cycleDone,
        xp:        cycleXP,
        createdAt: cycle.createdAt || null,
      })
    }

    // Sort muscles by XP earned desc, take top 5
    const topMuscles = Object.entries(muscleXP)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, xp]) => ({ id, label: MUSCLE_LABELS[id] || id.toUpperCase(), xp }))

    const maxMuscleXP = topMuscles[0]?.xp || 1

    return {
      totalXP,
      cycles: allCycles.length,
      daysScheduled,
      daysCompleted,
      topMuscles,
      maxMuscleXP,
      cycleLog: cycleStats,
    }
  } catch (_) {
    return {
      totalXP: 0,
      cycles: 0,
      daysScheduled: 0,
      daysCompleted: 0,
      topMuscles: [],
      maxMuscleXP: 1,
      cycleLog: [],
    }
  }
}

// Five badge positions around the star, matching P5 social stats layout
const BADGE_POSITIONS = [
  { top: '0%',   left: '50%',  tx: '-50%', ty: '0%'    }, // top-center
  { top: '38%',  left: '0%',   tx: '0%',   ty: '-50%'  }, // middle-left
  { top: '38%',  left: '100%', tx: '-100%',ty: '-50%'  }, // middle-right
  { top: '82%',  left: '18%',  tx: '-50%', ty: '-50%'  }, // bottom-left
  { top: '82%',  left: '82%',  tx: '-50%', ty: '-50%'  }, // bottom-right
]

function MuscleStatBadge({ label, xp, rank }) {
  return (
    <div className="text-center">
      {/* Gold badge */}
      <div
        className="inline-flex items-baseline gap-1 px-2 py-0.5 mb-1"
        style={{
          background: '#e4b022',
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
        }}
      >
        <span className="font-display text-sm leading-none text-gtl-ink italic">
          {label}
        </span>
        <span
          className="font-display text-[10px] leading-none text-gtl-ink italic"
          style={{ verticalAlign: 'super', fontSize: '0.6rem' }}
        >
          {rank}
        </span>
      </div>
      {/* XP sublabel */}
      <div className="font-mono text-[9px] tracking-[0.15em] text-gtl-chalk whitespace-nowrap">
        {Math.round(xp).toLocaleString()} XP
      </div>
    </div>
  )
}

function MuscleStarChart({ muscles, maxXP }) {
  // Pad to 5 slots
  const slots = [...muscles]
  while (slots.length < 5) slots.push(null)

  return (
    <div className="relative mx-auto" style={{ width: '100%', height: '300px' }}>
      {/* Outer dark star ring */}
      <div
        className="absolute"
        style={{
          width: '220px',
          height: '220px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -42%)',
          background: '#2a2a2a',
          clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      {/* Inner dark star (creates the ring effect) */}
      <div
        className="absolute"
        style={{
          width: '180px',
          height: '180px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -42%)',
          background: '#111',
          clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
          zIndex: 2,
        }}
        aria-hidden="true"
      />
      {/* Gold center star */}
      <div
        className="absolute"
        style={{
          width: '100px',
          height: '100px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -42%)',
          background: '#e4b022',
          clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
          zIndex: 3,
        }}
        aria-hidden="true"
      />

      {/* Stat badges */}
      {slots.map((m, i) => {
        if (!m) return null
        const pos = BADGE_POSITIONS[i]
        return (
          <div
            key={m.id}
            className="absolute"
            style={{
              top: pos.top,
              left: pos.left,
              transform: `translate(${pos.tx}, ${pos.ty})`,
              zIndex: 10,
            }}
          >
            <MuscleStatBadge label={m.label} xp={m.xp} rank={i + 1} />
          </div>
        )
      })}
    </div>
  )
}

function StatBox({ label, value, sub }) {
  return (
    <div className="relative">
      <div
        className="bg-gtl-surface px-4 py-4"
        style={{ clipPath: 'polygon(0 0, 96% 0, 93% 100%, 4% 100%)' }}
      >
        <div className="font-display text-4xl md:text-5xl leading-none text-gtl-chalk">{value}</div>
        {sub && (
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-gtl-red mt-1">{sub}</div>
        )}
        <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ash mt-2">{label}</div>
      </div>
    </div>
  )
}

function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href="/fitness/hub"
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div
        className={`absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}`}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span className={`font-display text-base leading-none transition-all duration-300
          ${hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-red translate-x-0'}`}>
          ◀
        </span>
        <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300
          ${hovered ? 'text-gtl-paper' : 'text-gtl-chalk'}`}>
          RETREAT
        </span>
      </div>
    </Link>
  )
}

export default function StatsPage() {
  useProfileGuard()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    setStats(loadStats())
  }, [])

  if (!stats) return null

  const { level, progress, threshold } = getLevelInfo(stats.totalXP)
  const xpPct = Math.round((progress / threshold) * 100)
  const completionPct = stats.daysScheduled > 0
    ? Math.round((stats.daysCompleted / stats.daysScheduled) * 100)
    : 0

  const hasData = stats.cycles > 0

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gtl-void">
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(122,14,20,0.22) 0%, transparent 40%, rgba(74,10,14,0.32) 100%)',
        }}
      />

      {/* Kanji watermark — 記 ("record") */}
      <div
        className="absolute -top-8 -right-8 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '36rem',
          lineHeight: '0.8',
          color: '#ffffff',
          opacity: 0.04,
          fontWeight: 900,
        }}
      >
        記
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <RetreatButton />
        <div className="hidden md:block font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / WAR RECORD
        </div>
      </nav>

      {/* Main content */}
      <section className="relative z-10 px-6 md:px-8 pt-8 pb-24 max-w-4xl mx-auto">

        {/* Headline */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-16 bg-gtl-red" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red">
              OPERATIVE FILE
            </span>
          </div>
          <h1 className="font-display text-[4.5rem] md:text-[7rem] leading-[0.9] text-gtl-chalk -rotate-1">
            WAR
            <br />
            <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-1">
              RECORD
            </span>
          </h1>
        </div>

        {!hasData ? (
          <div className="mt-16 text-center">
            <p className="font-display text-3xl text-gtl-ash">NO BATTLES LOGGED</p>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke mt-4">
              Forge your first cycle to start tracking.
            </p>
            <Link
              href="/fitness/hub"
              className="inline-block mt-8 font-mono text-xs tracking-[0.3em] uppercase text-gtl-red hover:text-gtl-red-bright transition-colors"
            >
              ← RETURN TO HUB
            </Link>
          </div>
        ) : (
          <>
            {/* ── Level + XP bar ──────────────────────────────────── */}
            <div className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-7xl md:text-8xl leading-none text-gtl-red">
                    {level}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-ash">
                    LEVEL
                  </span>
                </div>
                <span className="font-mono text-xs tracking-[0.2em] text-gtl-smoke">
                  {Math.round(stats.totalXP).toLocaleString()} XP TOTAL
                </span>
              </div>

              {/* XP bar */}
              <div className="relative h-3 bg-gtl-surface" style={{ clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)' }}>
                <div
                  className="absolute inset-y-0 left-0 bg-gtl-gold transition-all duration-700"
                  style={{ width: `${xpPct}%`, clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)' }}
                />
              </div>
            </div>

            {/* ── Key stats ───────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 mb-10">
              <StatBox label="CYCLES FORGED" value={stats.cycles} />
              <StatBox label="DAYS COMPLETED" value={stats.daysCompleted} />
              <StatBox label="COMPLETION RATE" value={`${completionPct}%`} />
            </div>

            {/* ── Top muscles — P5 social stats layout ────────────── */}
            {stats.topMuscles.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-red font-bold">
                    TOP TARGETS
                  </span>
                  <div className="h-px flex-1 bg-gtl-edge" />
                </div>

                <MuscleStarChart muscles={stats.topMuscles} maxXP={stats.maxMuscleXP} />
              </div>
            )}

            {/* ── Cycle log ───────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-4 mb-5">
                <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-red font-bold">
                  CYCLE LOG
                </span>
                <div className="h-px flex-1 bg-gtl-edge" />
              </div>

              <div className="space-y-3">
                {stats.cycleLog.map((c) => {
                  const pct = c.scheduled > 0 ? Math.round((c.completed / c.scheduled) * 100) : 0
                  const date = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
                    : null
                  return (
                    <div
                      key={c.id}
                      className="bg-gtl-surface px-5 py-4"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 99% 100%, 1% 100%)' }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <div className="font-display text-2xl md:text-3xl leading-none text-gtl-chalk truncate">
                            {c.name}
                          </div>
                          {date && (
                            <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-gtl-smoke mt-1">
                              FORGED {date}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-display text-3xl leading-none text-gtl-red">{pct}%</div>
                          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-ash mt-0.5">DONE</div>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="h-1.5 bg-gtl-ink" style={{ clipPath: 'polygon(0 0, 100% 0, 99% 100%, 1% 100%)' }}>
                        <div
                          className="h-full bg-gtl-red"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex gap-6 mt-2">
                        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-ash">
                          {c.completed}/{c.scheduled} DAYS
                        </span>
                        {c.xp > 0 && (
                          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-red">
                            {Math.round(c.xp).toLocaleString()} XP
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-16 flex items-center gap-4">
          <div className="h-px flex-1 bg-gtl-edge" />
          <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
            GRITTED TEETH LIFESTYLE / WAR RECORD
          </div>
          <div className="h-px flex-1 bg-gtl-edge" />
        </div>
      </section>
    </main>
  )
}
