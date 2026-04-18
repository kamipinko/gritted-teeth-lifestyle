'use client'
/*
 * /fitness/new/summary — Mission Briefing.
 *
 * For short cycles (<7 days): THE BLADE — a vertical katana with days
 * etched along it. For longer cycles (>=7 days): classic day card grid.
 */
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
const MUSCLE_KANJI = {
  chest: '胸', shoulders: '肩', back: '背', biceps: '二', triceps: '三',
  forearms: '腕', quads: '腿', hamstrings: '裏', calves: '脛', glutes: '尻', abs: '腹',
}

const DAY_SHORT   = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

const CARD_ROTATIONS = ['-0.8deg','0.6deg','-0.5deg','0.9deg','-0.7deg','0.4deg','-1deg','0.7deg','-0.6deg','0.8deg']
const SLAB_ROTATIONS = ['-1.5deg','1deg','-0.8deg','1.5deg','-1.2deg','0.8deg','-1.8deg','1.2deg','-0.6deg','1.4deg','-1deg']

function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}

/* ── Compact muscle chip ── */
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

/* ── Day dossier card (used for >= 7 day cycles) ── */
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
      {hasWork && (
        <div className="mx-4 mb-3 h-0.5 bg-gtl-red" style={{ transform: 'skewX(-8deg)' }} />
      )}
      <div className="px-4 pb-6 pt-1 flex flex-wrap gap-x-3 gap-y-4 min-h-[2rem]" style={{ overflow: 'visible' }}>
        {hasWork
          ? muscles.map((id, i) => <MuscleChip key={id} id={id} index={i} />)
          : <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-gtl-smoke self-center">REST</span>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   THE BLADE — SVG weapon for cycles < 7 days
   1-2 days: KNIFE (tanto)  |  3-4 days: WAKIZASHI  |  5-6 days: KATANA
   ══════════════════════════════════════════════════════════════════════════ */

// Quadratic Bezier point at t
function qBez(p0, cp, p1, t) {
  const u = 1 - t
  return { x: u*u*p0.x + 2*u*t*cp.x + t*t*p1.x, y: u*u*p0.y + 2*u*t*cp.y + t*t*p1.y }
}

// Array of {x,y} → SVG path
function ptsPath(pts) {
  return 'M ' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
}

// Sample a Bezier curve into a path string
function sampleBez(p0, cp, p1, steps = 30) {
  const pts = []
  for (let i = 0; i <= steps; i++) pts.push(qBez(p0, cp, p1, i / steps))
  return ptsPath(pts)
}

// Hamon: wavy path offset inward from the ha edge
function buildHamon(haTop, haCp, haTip, inset, steps = 50) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = qBez(haTop, haCp, haTip, t)
    const wave = Math.sin(t * Math.PI * 8.5 + 0.7) * 2.5 + Math.sin(t * Math.PI * 5 + 2) * 1.8
    pts.push({ x: p.x - inset + wave, y: p.y })
  }
  return ptsPath(pts)
}

// Shinogi: ridge line offset inward from mune
function buildShinogi(muneTop, muneCp, muneTip, offset, steps = 30) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = qBez(muneTop, muneCp, muneTip, t)
    pts.push({ x: p.x + offset, y: p.y })
  }
  return ptsPath(pts)
}

/* ══════════════════════════════════════════════════════════════════════════
   THE BLADE — line-art SVG weapons traced from reference wakizashi.
   Oriented vertically: handle at top, kissaki tip at bottom.
   1-2 days = knife (tanto), 3-4 = wakizashi, 5-6 = katana.
   ══════════════════════════════════════════════════════════════════════════ */
function CycleBlade({ days, dailyPlan }) {
  const count = days.length
  const type = count <= 2 ? 'knife' : count <= 4 ? 'wakizashi' : 'katana'

  const first = days[0] ? parseDate(days[0]) : null
  const last  = days[days.length - 1] ? parseDate(days[days.length - 1]) : null
  const dateRange = first && last
    ? `${MONTH_SHORT[first.getMonth()]} ${first.getDate()} — ${MONTH_SHORT[last.getMonth()]} ${last.getDate()}`
    : ''

  // ── Weapon dimensions (vertical: handle top, tip bottom) ──
  //   bladeW = visual width, sori = how far ha bows rightward
  const cfg = {
    knife:     { svgW: 400, bladeLen: 220, bladeW: 20, sori: 0,  handleLen: 100, tsubaR: 0  },
    wakizashi: { svgW: 420, bladeLen: 340, bladeW: 22, sori: 30, handleLen: 120, tsubaR: 25 },
    katana:    { svgW: 440, bladeLen: 560, bladeW: 24, sori: 50, handleLen: 150, tsubaR: 32 },
  }[type]

  const { svgW, bladeLen, bladeW, sori, handleLen, tsubaR } = cfg
  const cx = svgW / 2
  const S = '#ff2a36'  // stroke color
  const IV = '#e8e6e0' // ivory

  // ── Layout positions ──
  const kasTop = 30                                 // kashira top
  const kasH = 12
  const hTop = kasTop + kasH + 2                    // handle top
  const hBot = hTop + handleLen                     // handle bottom
  const tsubaCy = tsubaR > 0 ? hBot + tsubaR + 6 : hBot + 2
  const habTop = tsubaR > 0 ? tsubaCy + tsubaR + 3 : hBot + 4
  const habH = 8
  const bTop = habTop + habH + 2                    // blade top
  const bBot = bTop + bladeLen                      // blade bottom (before tip)
  const tipY = bBot + 18                            // kissaki point
  const svgH = tipY + 30                            // sageo cord space above kashira

  // ── Blade Bezier: mune (spine/left, less curve), ha (edge/right, more curve) ──
  const muneTop = { x: cx - bladeW / 2,       y: bTop }
  const muneCp  = { x: cx - bladeW / 2 + sori * 0.15, y: bTop + bladeLen * 0.5 }
  const muneTip = { x: cx + sori * 0.12 - 2,  y: bBot }
  const haTop   = { x: cx + bladeW / 2,       y: bTop }
  const haCp    = { x: cx + bladeW / 2 + sori, y: bTop + bladeLen * 0.38 }
  const haTip   = { x: cx + sori * 0.12 + 2,  y: bBot }
  const tipPt   = { x: cx + sori * 0.12,      y: tipY }

  // Blade outline path
  const blade = [
    `M ${muneTop.x} ${muneTop.y}`,
    `Q ${muneCp.x} ${muneCp.y} ${muneTip.x} ${muneTip.y}`,
    `L ${tipPt.x} ${tipPt.y}`,
    `L ${haTip.x} ${haTip.y}`,
    `Q ${haCp.x} ${haCp.y} ${haTop.x} ${haTop.y}`,
    'Z',
  ].join(' ')

  // Shinogi (ridge line) — offset from mune by ~35% blade width
  const shinogiOff = bladeW * 0.35
  const shinogi = buildShinogi(muneTop, muneCp, muneTip, shinogiOff)

  // Hamon (temper line near ha edge)
  const hamonInset = bladeW * 0.4
  const hamon = buildHamon(haTop, haCp, { x: haTip.x, y: haTip.y - 8 }, hamonInset)

  // Mune path for textPath inscription
  const spinePath = sampleBez(
    { x: muneTop.x + 4, y: muneTop.y + 12 },
    { x: muneCp.x + 4, y: muneCp.y },
    { x: muneTip.x + 3, y: muneTip.y - 15 }
  )

  // Handle wrapping: dense diamonds — 10+ crossings
  const wrapSpacing = 9
  const wraps = []
  for (let y = hTop + 6; y < hBot - 4; y += wrapSpacing) wraps.push(y)
  const wrapDy = wrapSpacing * 0.7
  const hLeft = cx - bladeW / 2 - 3
  const hRight = cx + bladeW / 2 + 3

  // Day inscription text
  const inscription = days.map((iso) => {
    const d = parseDate(iso)
    const num = String(d.getDate()).padStart(2, '0')
    const dow = DAY_SHORT[d.getDay()]
    const muscles = dailyPlan[iso] || []
    if (muscles.length === 0) return `${num} ${dow} 休`
    return `${num} ${dow} ${muscles.slice(0, 3).map((m) => MUSCLE_KANJI[m] || '?').join(' ')}`
  }).join('  ◆  ')

  // Day label positions along blade
  const dayPos = days.map((_, i) => {
    const t = (i + 0.5) / days.length
    const mp = qBez(muneTop, muneCp, muneTip, t)
    const hp = qBez(haTop, haCp, haTip, t)
    return { y: (mp.y + hp.y) / 2, muneX: mp.x, haX: hp.x }
  })

  return (
    <section className="relative z-10 flex justify-center py-6 px-2">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block mx-auto">
        <defs>
          <filter id="neon-glow" x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="soft-glow" x="-80%" y="-20%" width="260%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>
          <path id="spine-path" d={spinePath} />
        </defs>

        {/* ════ DATE RANGE ════ */}
        <text x={cx} y={kasTop - 10} textAnchor="middle"
          style={{ fontFamily: 'Georgia, serif', fontSize: '10px', letterSpacing: '0.2em', fill: '#5a5a62' }}>
          {dateRange}
        </text>

        {/* ════ SAGEO (cord/tassel) ════ */}
        <path d={`M ${cx - 6} ${kasTop + 4} C ${cx - 20} ${kasTop - 20} ${cx - 35} ${kasTop + 10} ${cx - 28} ${kasTop + 35}
                  C ${cx - 22} ${kasTop + 50} ${cx - 30} ${kasTop + 60} ${cx - 25} ${kasTop + 72}`}
          fill="none" stroke={S} strokeWidth="1.2" opacity="0.5" />
        <path d={`M ${cx + 6} ${kasTop + 4} C ${cx + 18} ${kasTop - 18} ${cx + 32} ${kasTop + 15} ${cx + 26} ${kasTop + 40}
                  C ${cx + 20} ${kasTop + 55} ${cx + 28} ${kasTop + 65} ${cx + 22} ${kasTop + 75}`}
          fill="none" stroke={S} strokeWidth="1.2" opacity="0.5" />

        {/* ════ KASHIRA (pommel cap) ════ */}
        <rect x={hLeft - 2} y={kasTop} width={hRight - hLeft + 4} height={kasH} rx={4}
          fill="none" stroke={S} strokeWidth="1.8" opacity="0.85" />
        {/* Interior texture lines */}
        <line x1={hLeft + 2} y1={kasTop + 4} x2={hRight - 2} y2={kasTop + 4}
          stroke={IV} strokeWidth="0.4" opacity="0.2" />
        <line x1={hLeft + 2} y1={kasTop + 7} x2={hRight - 2} y2={kasTop + 7}
          stroke={IV} strokeWidth="0.4" opacity="0.15" />

        {/* ════ TSUKA (handle) ════ */}
        {/* Outline — slightly tapered (wider at middle) */}
        <path d={`M ${hLeft} ${hTop} L ${hLeft - 1} ${hTop + handleLen * 0.5} L ${hLeft} ${hBot}
                  L ${hRight} ${hBot} L ${hRight + 1} ${hTop + handleLen * 0.5} L ${hRight} ${hTop} Z`}
          fill="none" stroke={S} strokeWidth="1.3" opacity="0.65" />
        {/* Dense diamond ito wrap — 10+ crossings, thicker lines */}
        {wraps.map((wy, wi) => (
          <g key={wi}>
            <line x1={hLeft} y1={wy} x2={hRight} y2={wy + wrapDy}
              stroke={IV} strokeWidth="1" opacity="0.5" />
            <line x1={hRight} y1={wy} x2={hLeft} y2={wy + wrapDy}
              stroke={IV} strokeWidth="1" opacity="0.5" />
          </g>
        ))}
        {/* Menuki ornaments */}
        <circle cx={cx - 3} cy={hTop + handleLen * 0.35} r={2.5}
          fill="none" stroke={IV} strokeWidth="0.6" opacity="0.35" />
        <circle cx={cx + 3} cy={hTop + handleLen * 0.65} r={2.5}
          fill="none" stroke={IV} strokeWidth="0.6" opacity="0.35" />

        {/* ════ TSUBA (guard disc) ════ */}
        {tsubaR > 0 && (
          <g>
            {/* Glow */}
            <circle cx={cx} cy={tsubaCy} r={tsubaR + 3}
              fill="none" stroke={S} strokeWidth="2" opacity="0.1" filter="url(#soft-glow)" />
            {/* Outer ring */}
            <circle cx={cx} cy={tsubaCy} r={tsubaR}
              fill="none" stroke={S} strokeWidth="2" opacity="0.9" />
            {/* Inner ring (shows disc thickness) */}
            <circle cx={cx} cy={tsubaCy} r={tsubaR * 0.7}
              fill="none" stroke={S} strokeWidth="0.8" opacity="0.4" />
            {/* Blade hole (nakago-ana) */}
            <rect x={cx - bladeW / 2 - 1} y={tsubaCy - 5} width={bladeW + 2} height={10} rx={1}
              fill="none" stroke={S} strokeWidth="0.6" opacity="0.3" />
            {/* 刻 */}
            <text x={cx + tsubaR * 0.35} y={tsubaCy + 4} textAnchor="middle"
              style={{ fontFamily: '"Noto Serif JP", serif', fontSize: '10px', fill: S, opacity: 0.6 }}>
              刻
            </text>
          </g>
        )}

        {/* ════ HABAKI (blade collar) ════ */}
        <path d={`M ${cx - bladeW/2 - 3} ${habTop} L ${cx - bladeW/2} ${habTop + habH}
                  L ${cx + bladeW/2} ${habTop + habH} L ${cx + bladeW/2 + 3} ${habTop} Z`}
          fill="none" stroke="#e4b022" strokeWidth="1" opacity="0.6" />
        <line x1={cx - bladeW/2 + 1} y1={habTop + 3} x2={cx + bladeW/2 - 1} y2={habTop + 3}
          stroke="#e4b022" strokeWidth="0.4" opacity="0.3" />

        {/* ════ BLADE ════ */}
        {/* Soft glow */}
        <path d={blade} fill="none" stroke={S} strokeWidth="5" opacity="0.06" filter="url(#soft-glow)" />
        {/* Neon glow */}
        <path d={blade} fill="none" stroke={S} strokeWidth="2.5" opacity="0.25" filter="url(#neon-glow)" />
        {/* Sharp outline */}
        <path d={blade} fill="none" stroke={S} strokeWidth="1.8" opacity="0.95" />

        {/* Shinogi (ridge line) */}
        <path d={shinogi} fill="none" stroke={S} strokeWidth="0.6" opacity="0.25" />

        {/* Hamon (temper line) — clearly visible ivory wave */}
        <path d={hamon} fill="none" stroke={IV} strokeWidth="1" opacity="0.7" />

        {/* Ha edge extra glow */}
        <path d={`M ${haTop.x} ${haTop.y} Q ${haCp.x} ${haCp.y} ${haTip.x} ${haTip.y}`}
          fill="none" stroke={S} strokeWidth="3" opacity="0.12" filter="url(#neon-glow)" />

        {/* ════ INSCRIPTION along spine (textPath) ════ */}
        <text style={{ fontFamily: 'Georgia, serif', fontSize: '7.5px', letterSpacing: '0.1em', fill: IV, opacity: 0.35 }}>
          <textPath href="#spine-path" startOffset="2%">
            {inscription}
          </textPath>
        </text>

        {/* ════ DAY LABELS beside blade ════ */}
        {dayPos.map(({ y, muneX, haX }, i) => {
          const iso = days[i]
          const d = parseDate(iso)
          const num = String(d.getDate()).padStart(2, '0')
          const dow = DAY_SHORT[d.getDay()]
          const muscles = dailyPlan[iso] || []
          const hasWork = muscles.length > 0
          const isLeft = i % 2 === 0
          const kanjiList = muscles.slice(0, 3).map((m) => MUSCLE_KANJI[m] || '?')

          const edgeX = isLeft ? muneX - 10 : haX + 10
          const textX = isLeft ? edgeX - 20 : edgeX + 20
          const anchor = isLeft ? 'end' : 'start'

          return (
            <g key={iso}>
              <line x1={edgeX} y1={y} x2={textX + (isLeft ? 6 : -6)} y2={y}
                stroke={S} strokeWidth="0.5" opacity="0.2" />
              <text x={textX} y={y + 2} textAnchor={anchor}
                style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 300, letterSpacing: '0.05em',
                  fill: hasWork ? IV : 'rgba(200,200,200,0.18)' }}>
                {num}
              </text>
              <text x={textX} y={y + 13} textAnchor={anchor}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '6.5px', letterSpacing: '0.2em',
                  fill: hasWork ? '#5a5a62' : '#2a2a32' }}>
                {dow}
              </text>
              <text x={textX} y={y + 34} textAnchor={anchor}
                style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", serif', fontSize: '22px', fontWeight: 400,
                  fill: hasWork ? IV : '#e4b022' }}>
                {hasWork ? kanjiList.join('  ') : '休'}
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}

/* ── EXPORT ── */
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
      <div
        className="absolute inset-0 bg-gtl-edge"
        style={{
          clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
          transform: hovered ? 'translate(0,0)' : 'translate(5px, 5px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
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
        <div className="font-display text-2xl text-gtl-ash leading-none tracking-tight">EXPORT</div>
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">SAVE AS PDF / PRINT</div>
        <div className="font-display text-xl text-gtl-smoke/50 leading-none select-none ml-auto">⬇</div>
      </div>
    </button>
  )
}

/* ── BEGIN ── */
function BeginButton({ onFire, onHover, label = 'ETCH CYCLE' }) {
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
      className="relative w-full cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4"
      style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center center' }}
    >
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(10px, 10px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
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
          <div className="font-display text-8xl text-gtl-paper leading-none tracking-tight">{label}</div>
          <div className="font-mono text-[10px] tracking-[0.5em] uppercase text-gtl-paper/50 mt-2">
            LAUNCH THE FORGE / THE CYCLE STARTS NOW
          </div>
        </div>
        <div className="font-display text-6xl text-gtl-paper/30 leading-none select-none">▸</div>
      </div>
    </div>
  )
}

function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  let backHref = '/fitness/new/branded'
  try { if (localStorage.getItem('gtl-back-to-edit') === '1') backHref = '/fitness/edit' } catch (_) {}
  return (
    <Link
      href={backHref}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div
        className={`absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-paper opacity-20' : 'bg-gtl-paper opacity-10'}`}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span className={`font-display text-base leading-none transition-all duration-300
          ${hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-paper/60'}`}>◀</span>
        <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300
          ${hovered ? 'text-gtl-paper' : 'text-gtl-paper/60'}`}>RETREAT</span>
      </div>
    </Link>
  )
}

export default function SummaryPage() {
  useProfileGuard()
  const router = useRouter()
  const { play } = useSound()
  useEffect(() => {
    try { if (localStorage.getItem('gtl-back-to-edit') !== '1') return } catch (_) { return }
    const handleKey = (e) => {
      if (e.key === 'Enter' && !['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement?.tagName))
        router.push('/fitness/edit')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

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
    try {
      const existing  = JSON.parse(localStorage.getItem(pk('cycles')) || '[]')
      const editingId = localStorage.getItem(pk('editing-cycle-id'))
      if (editingId) {
        const updated = existing.map((c) =>
          c.id === editingId ? { ...c, name: cycleName, targets, days, dailyPlan } : c
        )
        localStorage.setItem(pk('cycles'), JSON.stringify(updated))
        localStorage.removeItem(pk('editing-cycle-id'))
      } else {
        const cycle = {
          id: Date.now().toString(),
          name: cycleName, targets, days, dailyPlan,
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem(pk('cycles'), JSON.stringify([cycle, ...existing]))
      }
    } catch (_) {}
    setStampVisible(true)

    setTimeout(() => {
      play('stamp')
      setStampLanded(true)
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

    setTimeout(() => play('stamp'), 750)
    setTimeout(() => setFireActive(true), 1900)
  }

  const cols = days.length <= 5 ? days.length
             : days.length <= 10 ? Math.ceil(days.length / 2)
             : Math.ceil(days.length / 3)

  return (
    <main ref={mainRef} className="relative min-h-screen overflow-x-hidden bg-gtl-void">

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          @page { margin: 0.6in; size: portrait; }
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .gtl-noise { display: none !important; }
          .fixed { display: none !important; }
          * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* ── Atmospherics ── */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, rgba(122,14,20,0.18) 0%, transparent 45%, rgba(74,10,14,0.28) 100%)' }} />

      {/* 完 kanji watermark */}
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

      {/* Cycle designation — top right */}
      <div className="absolute top-4 right-6 z-10 font-mono text-[8px] tracking-[0.4em] uppercase text-gtl-smoke/40">
        CYCLE DESIGNATION: AUTHORIZED
      </div>

      {/* ── HERO — cycle name (no red slab) ── */}
      <section className="relative z-10 overflow-hidden">
        <div className="relative px-8 pt-8 pb-14">
          {/* Nav row */}
          <div className="flex items-center gap-4 mb-6">
            <RetreatButton />
            <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke/60 overflow-hidden truncate">
              PALACE / FITNESS / NEW CYCLE / MISSION BRIEF
            </div>
          </div>

          {/* Step tag */}
          <div className="inline-flex items-center gap-3 mb-4" style={{ transform: 'rotate(1deg)' }}>
            <div className="h-0.5 w-10 bg-gtl-red/40" />
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-red/70 font-bold">
              STEP 05 / REVIEW
            </span>
          </div>

          {/* THE CYCLE NAME */}
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

          {/* CYCLE DESIGNATION moved to top-right corner */}
        </div>
      </section>

      {/* ── THE BLADE (< 7 days) or DAY CARDS (>= 7 days) ── */}
      {days.length > 0 && days.length < 7 && (
        <CycleBlade days={days} dailyPlan={dailyPlan} />
      )}

      {days.length >= 7 && (
        <section className="relative z-10 px-8 mb-12">
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
        </section>
      )}

      {days.length === 0 && (
        <section className="relative z-10 px-8 py-12">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-gtl-smoke">
            NO DAYS SCHEDULED
          </div>
        </section>
      )}

      {/* ── EXPORT + BEGIN ── */}
      <section className="relative z-10 px-8 pb-20 pt-4 flex flex-col gap-4 no-print">
        <ExportButton />
        <BeginButton
          onFire={handleBegin}
          onHover={() => play('button-hover')}
          label={(() => { try { return localStorage.getItem('gtl-back-to-edit') === '1' ? 'RE-ETCH CYCLE' : 'ETCH CYCLE' } catch (_) { return 'ETCH CYCLE' } })()}
        />
      </section>

      {/* ── DEADLINE STAMP OVERLAY ── */}
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

            {stampLanded && (
              <div className="absolute inset-0 bg-white"
                style={{ animation: 'deadline-flash 500ms cubic-bezier(0.3, 0, 0.5, 1) forwards', mixBlendMode: 'screen' }} />
            )}

            {stampLanded && [0, 90, 180].map((delay, i) => (
              <div key={i} className="absolute rounded-full border-gtl-red"
                style={{
                  left: '50%', top: '50%', width: '120px', height: '120px',
                  borderColor: i === 0 ? '#ffffff' : i === 1 ? '#ff2a36' : '#d4181f',
                  animation: `deadline-ring 900ms cubic-bezier(0.2, 0.8, 0.3, 1) ${delay}ms forwards`,
                  mixBlendMode: 'screen',
                }} />
            ))}

            <div style={{ animation: 'deadline-slam 950ms cubic-bezier(0.18, 1.2, 0.35, 1) forwards' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gtl-red-deep"
                  style={{ transform: 'translate(18px, 18px)', clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)' }}
                  aria-hidden="true" />
                <div className="relative px-8 md:px-14 py-10 bg-gtl-red border-4 border-gtl-red-deep"
                  style={{ clipPath: 'polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)' }}>
                  <div className="font-mono text-[11px] tracking-[0.6em] uppercase text-gtl-paper/50 mb-2"
                    style={{ letterSpacing: '0.6em' }}>◼ DEADLINE ◼</div>
                  <div className="font-display text-3xl md:text-5xl text-gtl-paper leading-none"
                    style={{ textShadow: '3px 3px 0 #070708' }}>{month}</div>
                  <div className="flex items-center gap-16">
                    <div className="font-display text-gtl-paper leading-none"
                      style={{ fontSize: 'clamp(6rem, 16vw, 13rem)', textShadow: '6px 6px 0 #070708, 12px 12px 0 rgba(0,0,0,0.4)', lineHeight: '0.85' }}>
                      {String(dayNum).padStart(2, '0')}
                    </div>
                    <img src="/logo.png" alt="Gritted Teeth" className="-rotate-12 opacity-90"
                      style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  </div>
                  <div className="font-display text-3xl text-gtl-paper/80 leading-none mt-3"
                    style={{ textShadow: '2px 2px 0 #070708' }}>{dayName} · {year}</div>
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
