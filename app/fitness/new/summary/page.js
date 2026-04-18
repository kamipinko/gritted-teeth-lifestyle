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

// Build SVG path string from array of {x,y} points
function ptsToPath(pts) {
  return 'M ' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
}

// Generate hamon (temper line): wavy sine path offset inward from the ha edge
function buildHamon(haTop, haCp, haTip, inset, steps = 50) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = qBez(haTop, haCp, haTip, t)
    const wave = Math.sin(t * Math.PI * 9 + 0.7) * 3 + Math.sin(t * Math.PI * 5.5 + 2) * 2
    pts.push({ x: p.x - inset + wave, y: p.y })
  }
  return ptsToPath(pts)
}

// Sample the mune (spine) as a path for textPath inscription
function buildMunePath(muneTop, muneCp, muneTip, steps = 30) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push(qBez(muneTop, muneCp, muneTip, t))
  }
  return ptsToPath(pts)
}

function CycleBlade({ days, dailyPlan }) {
  const count = days.length
  const type = count <= 2 ? 'knife' : count <= 4 ? 'wakizashi' : 'katana'

  const first = days[0] ? parseDate(days[0]) : null
  const last  = days[days.length - 1] ? parseDate(days[days.length - 1]) : null
  const dateRange = first && last
    ? `${MONTH_SHORT[first.getMonth()]} ${first.getDate()} — ${MONTH_SHORT[last.getMonth()]} ${last.getDate()}`
    : ''

  // ── Dimensions: WIDE blades, TALL weapons ──
  const cfg = {
    knife:     { svgW: 400, bladeLen: 340, bladeW: 20, handleLen: 110, muneCurve: 0,  haCurve: 0,  tsubaR: 0  },
    wakizashi: { svgW: 420, bladeLen: 460, bladeW: 22, handleLen: 130, muneCurve: 18, haCurve: 35, tsubaR: 25 },
    katana:    { svgW: 440, bladeLen: 620, bladeW: 24, handleLen: 160, muneCurve: 30, haCurve: 55, tsubaR: 30 },
  }[type]

  const { svgW, bladeLen, bladeW, handleLen, muneCurve, haCurve, tsubaR } = cfg
  const cx = svgW / 2
  const handleTop = 36
  const handleBot = handleTop + handleLen
  const tsubaCy = handleBot + (tsubaR > 0 ? tsubaR + 8 : 0)
  const bladeTop = tsubaR > 0 ? tsubaCy + tsubaR + 4 : handleBot + 6
  const tipY = bladeTop + bladeLen
  const svgH = tipY + 28

  // ── Blade Bezier geometry ──
  const muneTop = { x: cx - bladeW / 2, y: bladeTop }
  const muneCp  = { x: cx - bladeW / 2 + muneCurve * 0.5, y: bladeTop + bladeLen * 0.5 }
  const muneTip = { x: cx + (muneCurve + haCurve) * 0.15 - 2, y: tipY }
  const haTop   = { x: cx + bladeW / 2, y: bladeTop }
  const haCp    = { x: cx + bladeW / 2 + haCurve * 0.85, y: bladeTop + bladeLen * 0.4 }
  const haTip   = { x: cx + (muneCurve + haCurve) * 0.15 + 2, y: tipY }
  const tipPt   = { x: cx + (muneCurve + haCurve) * 0.15, y: tipY + 16 }

  const bladeOutline = [
    `M ${muneTop.x} ${muneTop.y}`,
    `Q ${muneCp.x} ${muneCp.y} ${muneTip.x} ${muneTip.y}`,
    `L ${tipPt.x} ${tipPt.y}`,
    `L ${haTip.x} ${haTip.y}`,
    `Q ${haCp.x} ${haCp.y} ${haTop.x} ${haTop.y}`,
    'Z',
  ].join(' ')

  const haEdge = `M ${haTop.x} ${haTop.y} Q ${haCp.x} ${haCp.y} ${haTip.x} ${haTip.y} L ${tipPt.x} ${tipPt.y}`

  // Hamon (all weapons get one — even knife gets a straight one)
  const hamonInset = bladeW * 0.5
  const hamon = buildHamon(haTop, haCp, { x: haTip.x, y: haTip.y - 10 }, hamonInset)

  // Mune path for textPath inscription
  const muneSpinePath = buildMunePath(
    { x: muneTop.x + 3, y: muneTop.y + 10 },
    { x: muneCp.x + 3, y: muneCp.y },
    { x: muneTip.x + 2, y: muneTip.y - 20 }
  )

  // Handle wrap diamonds (dense — 8+ crossings)
  const wraps = []
  const wrapH = bladeW * 0.4
  for (let y = handleTop + 8; y < handleBot - 4; y += 8) wraps.push(y)

  // Halo center
  const haloCy = bladeTop + bladeLen * 0.3
  const haloR = type === 'katana' ? 180 : type === 'wakizashi' ? 140 : 100

  // Day inscription along the spine
  const inscription = days.map((iso) => {
    const d = parseDate(iso)
    const num = String(d.getDate()).padStart(2, '0')
    const dow = DAY_SHORT[d.getDay()]
    const muscles = dailyPlan[iso] || []
    if (muscles.length === 0) return `${num}·${dow}·休`
    const kanji = muscles.slice(0, 3).map((m) => MUSCLE_KANJI[m] || '?').join('')
    return `${num}·${dow}·${kanji}`
  }).join('  ◆  ')

  // Day positions for side labels
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
          <filter id="neon" x="-60%" y="-20%" width="220%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-soft" x="-80%" y="-30%" width="260%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>
          <filter id="glow-med" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
          <path id="spine-text-path" d={muneSpinePath} />
        </defs>

        {/* ══════ ALCHEMICAL HALO ══════ */}
        <g opacity="0.12">
          {/* Concentric arc segments (incomplete circles) */}
          {[0.35, 0.55, 0.75, 0.95].map((r, ri) => (
            <g key={ri}>
              <path d={`M ${cx + haloR * r} ${haloCy} A ${haloR * r} ${haloR * r} 0 0 1 ${cx - haloR * r * 0.7} ${haloCy + haloR * r * 0.7}`}
                fill="none" stroke="#ff2a36" strokeWidth={ri === 3 ? '1.2' : '0.6'} />
              <path d={`M ${cx - haloR * r * 0.5} ${haloCy - haloR * r * 0.85} A ${haloR * r} ${haloR * r} 0 0 1 ${cx + haloR * r * 0.85} ${haloCy - haloR * r * 0.2}`}
                fill="none" stroke="#ff2a36" strokeWidth="0.5" />
            </g>
          ))}
          {/* Radial rays — 16 fine lines */}
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            const r1 = haloR * 0.3, r2 = haloR * 0.95
            return <line key={i} x1={cx + Math.cos(a) * r1} y1={haloCy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2} y2={haloCy + Math.sin(a) * r2}
              stroke="#ff2a36" strokeWidth="0.4" />
          })}
          {/* Geometric symbols at cardinal points */}
          {[0, 90, 180, 270].map((deg) => {
            const a = deg * Math.PI / 180
            const sx = cx + Math.cos(a) * haloR * 0.85, sy = haloCy + Math.sin(a) * haloR * 0.85
            return <polygon key={deg}
              points={`${sx},${sy - 4} ${sx + 3.5},${sy + 2.5} ${sx - 3.5},${sy + 2.5}`}
              fill="none" stroke="#ff2a36" strokeWidth="0.5" />
          })}
          {/* Diagonal crosses at ordinal points */}
          {[45, 135, 225, 315].map((deg) => {
            const a = deg * Math.PI / 180
            const sx = cx + Math.cos(a) * haloR * 0.8, sy = haloCy + Math.sin(a) * haloR * 0.8
            return <g key={deg}>
              <line x1={sx - 3} y1={sy - 3} x2={sx + 3} y2={sy + 3} stroke="#ff2a36" strokeWidth="0.4" />
              <line x1={sx + 3} y1={sy - 3} x2={sx - 3} y2={sy + 3} stroke="#ff2a36" strokeWidth="0.4" />
            </g>
          })}
        </g>

        {/* ══════ KASHIRA (pommel cap) ══════ */}
        <rect x={cx - bladeW/2 - 5} y={handleTop - 6} width={bladeW + 10} height={10} rx={3}
          fill="none" stroke="#ff2a36" strokeWidth="1.5" opacity="0.8" />
        <line x1={cx - bladeW/2 + 2} y1={handleTop - 1} x2={cx + bladeW/2 - 2} y2={handleTop - 1}
          stroke="#e8e6e0" strokeWidth="0.5" opacity="0.3" />

        {/* ══════ TSUKA (handle) ══════ */}
        <rect x={cx - bladeW/2 - 2} y={handleTop} width={bladeW + 4} height={handleLen} rx={2}
          fill="none" stroke="#ff2a36" strokeWidth="1.2" opacity="0.6" />
        {/* Dense diamond ito wrap */}
        {wraps.map((wy, wi) => (
          <g key={wi}>
            <line x1={cx - bladeW/2 - 1} y1={wy} x2={cx + bladeW/2 + 1} y2={wy + wrapH}
              stroke="#e8e6e0" strokeWidth="0.7" opacity="0.35" />
            <line x1={cx + bladeW/2 + 1} y1={wy} x2={cx - bladeW/2 - 1} y2={wy + wrapH}
              stroke="#e8e6e0" strokeWidth="0.7" opacity="0.35" />
          </g>
        ))}
        {/* Menuki (handle ornament) */}
        <circle cx={cx} cy={handleTop + handleLen * 0.4} r={3}
          fill="none" stroke="#e8e6e0" strokeWidth="0.5" opacity="0.25" />
        <circle cx={cx} cy={handleTop + handleLen * 0.65} r={3}
          fill="none" stroke="#e8e6e0" strokeWidth="0.5" opacity="0.25" />

        {/* ══════ TSUBA (guard) — alchemical ornament ══════ */}
        {tsubaR > 0 && (
          <g>
            {/* Wide glow */}
            <circle cx={cx} cy={tsubaCy} r={tsubaR + 4}
              fill="none" stroke="#ff2a36" strokeWidth="2" opacity="0.1" filter="url(#glow-soft)" />
            {/* Outer ring */}
            <circle cx={cx} cy={tsubaCy} r={tsubaR}
              fill="none" stroke="#ff2a36" strokeWidth="1.8" opacity="0.85" />
            {/* Inner ring */}
            <circle cx={cx} cy={tsubaCy} r={tsubaR * 0.55}
              fill="none" stroke="#ff2a36" strokeWidth="1" opacity="0.5" />
            {/* Innermost ring */}
            <circle cx={cx} cy={tsubaCy} r={tsubaR * 0.25}
              fill="none" stroke="#ff2a36" strokeWidth="0.6" opacity="0.3" />
            {/* 8 radial spokes between inner and outer */}
            {Array.from({ length: 8 }, (_, si) => {
              const a = (si / 8) * Math.PI * 2
              return <line key={si}
                x1={cx + Math.cos(a) * tsubaR * 0.55} y1={tsubaCy + Math.sin(a) * tsubaR * 0.55}
                x2={cx + Math.cos(a) * tsubaR * 0.92} y2={tsubaCy + Math.sin(a) * tsubaR * 0.92}
                stroke="#ff2a36" strokeWidth="0.6" opacity="0.45" />
            })}
            {/* Diamond (hishi) points at 4 cardinal positions */}
            {[0, 90, 180, 270].map((deg) => {
              const a = deg * Math.PI / 180
              const dx = cx + Math.cos(a) * tsubaR, dy = tsubaCy + Math.sin(a) * tsubaR
              return <polygon key={deg}
                points={`${dx},${dy - 3.5} ${dx + 2.5},${dy} ${dx},${dy + 3.5} ${dx - 2.5},${dy}`}
                fill="none" stroke="#ff2a36" strokeWidth="0.7" opacity="0.6" />
            })}
            {/* Center kanji 刻 */}
            <text x={cx} y={tsubaCy + 5} textAnchor="middle"
              style={{ fontFamily: '"Noto Serif JP", serif', fontSize: '13px', fill: '#ff2a36', opacity: 0.75 }}>
              刻
            </text>
          </g>
        )}

        {/* Habaki (blade collar) */}
        <rect x={cx - bladeW/2 - 1} y={bladeTop - 4} width={bladeW + 2} height={7} rx={1}
          fill="none" stroke="#e4b022" strokeWidth="0.8" opacity="0.5" />

        {/* ══════ BLADE — unfilled line art with neon glow ══════ */}
        {/* Outermost soft glow */}
        <path d={bladeOutline} fill="none" stroke="#ff2a36" strokeWidth="5" opacity="0.08" filter="url(#glow-soft)" />
        {/* Medium glow */}
        <path d={bladeOutline} fill="none" stroke="#ff2a36" strokeWidth="3" opacity="0.2" filter="url(#glow-med)" />
        {/* Sharp outline */}
        <path d={bladeOutline} fill="none" stroke="#ff2a36" strokeWidth="1.5" opacity="0.9" />

        {/* Ha edge extra brightness */}
        <path d={haEdge} fill="none" stroke="#ff2a36" strokeWidth="2.5" opacity="0.15" filter="url(#glow-med)" />

        {/* ══════ HAMON temper line ══════ */}
        <path d={hamon} fill="none" stroke="#e8e6e0" strokeWidth="1" opacity="0.7" />

        {/* ══════ INSCRIPTION along blade spine (textPath) ══════ */}
        <text style={{ fontFamily: 'Georgia, serif', fontSize: '8px', letterSpacing: '0.12em', fill: '#e8e6e0', opacity: 0.4 }}>
          <textPath href="#spine-text-path" startOffset="2%">
            {inscription}
          </textPath>
        </text>

        {/* ══════ DAY LABELS beside the blade ══════ */}
        {dayPos.map(({ y, muneX, haX }, i) => {
          const iso = days[i]
          const d = parseDate(iso)
          const num = String(d.getDate()).padStart(2, '0')
          const dow = DAY_SHORT[d.getDay()]
          const muscles = dailyPlan[iso] || []
          const hasWork = muscles.length > 0
          const isLeft = i % 2 === 0
          const kanjiList = muscles.slice(0, 3).map((m) => MUSCLE_KANJI[m] || '?')

          const edgeX = isLeft ? muneX - 8 : haX + 8
          const textX = isLeft ? edgeX - 18 : edgeX + 18
          const anchor = isLeft ? 'end' : 'start'

          return (
            <g key={iso}>
              <line x1={edgeX} y1={y} x2={textX + (isLeft ? 6 : -6)} y2={y}
                stroke="#ff2a36" strokeWidth="0.5" opacity="0.25" />
              <text x={textX} y={y + 2} textAnchor={anchor}
                style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 300, letterSpacing: '0.05em',
                  fill: hasWork ? '#e8e6e0' : 'rgba(200,200,200,0.2)' }}>
                {num}
              </text>
              <text x={textX} y={y + 13} textAnchor={anchor}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '6.5px', letterSpacing: '0.2em',
                  fill: hasWork ? '#5a5a62' : '#2a2a32' }}>
                {dow}
              </text>
              <text x={textX} y={y + 34} textAnchor={anchor}
                style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", serif', fontSize: '22px', fontWeight: 400,
                  fill: hasWork ? '#e8e6e0' : '#e4b022' }}>
                {hasWork ? kanjiList.join('  ') : '休'}
              </text>
            </g>
          )
        })}

        {/* Date range */}
        <text x={cx} y={handleTop - 14} textAnchor="middle"
          style={{ fontFamily: 'Georgia, serif', fontSize: '10px', letterSpacing: '0.2em', fill: '#5a5a62' }}>
          {dateRange}
        </text>
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
