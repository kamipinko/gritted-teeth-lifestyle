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

// 5 body regions — each star point represents one
const BODY_REGIONS = [
  { id: 'front', label: 'FRONT', muscles: ['chest', 'shoulders'] },
  { id: 'arms',  label: 'ARMS',  muscles: ['biceps', 'triceps', 'forearms'] },
  { id: 'legs',  label: 'LEGS',  muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { id: 'core',  label: 'CORE',  muscles: ['abs'] },
  { id: 'back',  label: 'BACK',  muscles: ['back'] },
]

// Build a lookup: muscleId → regionIndex
const MUSCLE_TO_REGION = {}
BODY_REGIONS.forEach((r, i) => r.muscles.forEach(m => { MUSCLE_TO_REGION[m] = i }))

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
    const regionXP = [0, 0, 0, 0, 0]  // one per BODY_REGIONS entry
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
              const ri = MUSCLE_TO_REGION[muscleId]
              if (ri !== undefined) regionXP[ri] += earned
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

    return {
      totalXP,
      cycles: allCycles.length,
      daysScheduled,
      daysCompleted,
      regionXP,
      cycleLog: cycleStats,
    }
  } catch (_) {
    return {
      totalXP: 0,
      cycles: 0,
      daysScheduled: 0,
      daysCompleted: 0,
      regionXP: [0, 0, 0, 0, 0],
      cycleLog: [],
    }
  }
}

// SVG canvas
const VW = 340
const VH = 310
const CX = 170
const CY = 148

const OUTER_MAX_R = 108  // max spike length at full XP
const INNER_R     = 22   // fixed inner indent of the star
const BADGE_R     = 138  // radius for badge anchor dots (outside max star)

// 5 region angles clockwise from top (FRONT, ARMS, LEGS, CORE, BACK)
const REGION_ANGLES = BODY_REGIONS.map((_, i) => -Math.PI / 2 + i * (2 * Math.PI / 5))
// 5 inner angles sit halfway between outer angles
const INNER_ANGLES = REGION_ANGLES.map(a => a + Math.PI / 5)

// XP thresholds for levels 1–5 per region
const REGION_XP_LEVELS = [0, 90000, 300000, 750000, 1800000]

function getRegionLevel(xp) {
  let level = 0
  for (const threshold of REGION_XP_LEVELS) {
    if (xp >= threshold) level++
    else break
  }
  return level  // 0–5
}

function levelToR(level) {
  return INNER_R + (level / 5) * (OUTER_MAX_R - INNER_R)
}

// Radii for the 5 level rings
const LEVEL_RING_RADII = [1, 2, 3, 4, 5].map(levelToR)

function buildStarPath(regionXP) {
  const pts = []
  for (let i = 0; i < 5; i++) {
    const level = getRegionLevel(regionXP[i])
    const r = levelToR(level)
    pts.push(`${CX + r * Math.cos(REGION_ANGLES[i])},${CY + r * Math.sin(REGION_ANGLES[i])}`)
    pts.push(`${CX + INNER_R * Math.cos(INNER_ANGLES[i])},${CY + INNER_R * Math.sin(INNER_ANGLES[i])}`)
  }
  return `M ${pts.join(' L ')} Z`
}

function buildGhostPath() {
  const pts = []
  for (let i = 0; i < 5; i++) {
    pts.push(`${CX + OUTER_MAX_R * Math.cos(REGION_ANGLES[i])},${CY + OUTER_MAX_R * Math.sin(REGION_ANGLES[i])}`)
    pts.push(`${CX + INNER_R * Math.cos(INNER_ANGLES[i])},${CY + INNER_R * Math.sin(INNER_ANGLES[i])}`)
  }
  return `M ${pts.join(' L ')} Z`
}

// Badge anchor dots in SVG coords
function badgeAnchor(i) {
  return {
    x: CX + BADGE_R * Math.cos(REGION_ANGLES[i]),
    y: CY + BADGE_R * Math.sin(REGION_ANGLES[i]),
  }
}

// Badge CSS positions — fixed outside the star regardless of XP
// Computed from BADGE_R + small extra margin
const BADGE_MARGIN = 18
function badgeCSS(i) {
  const angle = REGION_ANGLES[i]
  const r = BADGE_R + BADGE_MARGIN
  const x = CX + r * Math.cos(angle)
  const y = CY + r * Math.sin(angle)
  // Anchor point alignment per quadrant
  let tx = '-50%', ty = '-50%'
  if (i === 0) { ty = '0%' }           // top: anchor at top-center
  else if (i === 1) { tx = '0%' }       // right: anchor at left
  else if (i === 2) { ty = '-100%' }    // bottom-right: anchor at bottom
  else if (i === 3) { ty = '-100%' }    // bottom-left: anchor at bottom
  else if (i === 4) { tx = '-100%' }    // left: anchor at right
  return {
    left: `${(x / VW) * 100}%`,
    top:  `${(y / VH) * 100}%`,
    transform: `translate(${tx}, ${ty})`,
  }
}

function RegionBadge({ region, xp }) {
  const level = getRegionLevel(xp)
  return (
    <div className="text-center">
      <div
        className="inline-flex items-baseline gap-0.5 px-2 py-0.5"
        style={{ background: '#e4b022', clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }}
      >
        <span className="font-display text-xs leading-none text-gtl-ink" style={{ fontStyle: 'italic' }}>
          {region.label}
        </span>
        <span className="font-mono text-[9px] leading-none text-gtl-ink" style={{ verticalAlign: 'super', fontSize: '0.55rem' }}>
          {level}
        </span>
      </div>
      <div className="font-mono text-[8px] tracking-[0.1em] text-gtl-ash whitespace-nowrap mt-0.5">
        {xp > 0 ? `${Math.round(xp).toLocaleString()} XP` : '—'}
      </div>
    </div>
  )
}

function BodyStarChart({ regionXP }) {
  const starPath  = buildStarPath(regionXP)
  const ghostPath = buildGhostPath()

  return (
    <div className="relative mx-auto" style={{ width: '100%', maxWidth: `${VW}px`, height: `${VH}px` }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${VW} ${VH}`}
        aria-hidden="true"
      >
        {/* Level rings — each ring = one level threshold */}
        {LEVEL_RING_RADII.map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r}
            fill="none"
            stroke={i === 4 ? '#3a3a3a' : '#252525'}
            strokeWidth={i === 4 ? 1.5 : 1}
          />
        ))}

        {/* Radial guide lines */}
        {REGION_ANGLES.map((angle, i) => {
          const tip = badgeAnchor(i)
          return (
            <line key={i}
              x1={CX} y1={CY} x2={tip.x} y2={tip.y}
              stroke="#2e2e2e" strokeWidth="1" strokeDasharray="4 3"
            />
          )
        })}

        {/* Ghost star — max potential, faint outline */}
        <path d={ghostPath} fill="none" stroke="#3a3a3a" strokeWidth="1" />

        {/* Filled XP star */}
        <path d={starPath} fill="rgba(228,176,34,0.18)" stroke="#e4b022" strokeWidth="1.5" />

        {/* Gold dots at badge anchors */}
        {REGION_ANGLES.map((_, i) => {
          const { x, y } = badgeAnchor(i)
          return <circle key={i} cx={x} cy={y} r={3} fill="#e4b022" />
        })}

        {/* Small center dot */}
        <circle cx={CX} cy={CY} r={4} fill="#e4b022" />
      </svg>

      {/* Region badges */}
      {BODY_REGIONS.map((region, i) => (
        <div
          key={region.id}
          className="absolute"
          style={{ ...badgeCSS(i), zIndex: 10 }}
        >
          <RegionBadge region={region} xp={regionXP[i]} />
        </div>
      ))}
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
            {stats.regionXP.some(x => x > 0) && (
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-red font-bold">
                    TOP TARGETS
                  </span>
                  <div className="h-px flex-1 bg-gtl-edge" />
                </div>

                <BodyStarChart regionXP={stats.regionXP} />
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
