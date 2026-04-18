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

// Generate a wavy hamon line path along the blade edge
function hamonPath(cx, bladeW, startY, endY, curve, steps = 20) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = startY + (endY - startY) * t
    // Base x follows the blade edge curve
    const edgeX = cx + bladeW / 2 + curve * Math.sin(t * Math.PI * 0.8) * 0.7
    // Hamon wave offset inward from edge
    const wave = Math.sin(t * Math.PI * 6 + 1.5) * 3 + Math.sin(t * Math.PI * 3.5) * 2
    pts.push(`${edgeX - 8 + wave},${y}`)
  }
  return 'M ' + pts.join(' L ')
}

function CycleBlade({ days, dailyPlan }) {
  const count = days.length
  const type = count <= 2 ? 'knife' : count <= 4 ? 'wakizashi' : 'katana'

  const first = days[0] ? parseDate(days[0]) : null
  const last  = days[days.length - 1] ? parseDate(days[days.length - 1]) : null
  const dateRange = first && last
    ? `${MONTH_SHORT[first.getMonth()]} ${first.getDate()} — ${MONTH_SHORT[last.getMonth()]} ${last.getDate()}`
    : ''

  // Dimensions per weapon type
  const cfg = {
    knife:     { svgW: 340, bladeLen: 280, bladeW: 24, curve: 0,  handleLen: 100, guardW: 0,  guardH: 0,  perspective: 'perspective(1400px) rotateY(-10deg) rotateZ(-2deg)' },
    wakizashi: { svgW: 360, bladeLen: 400, bladeW: 28, curve: 18, handleLen: 120, guardW: 60, guardH: 14, perspective: 'perspective(1400px) rotateY(-14deg) rotateZ(-2deg)' },
    katana:    { svgW: 380, bladeLen: 560, bladeW: 32, curve: 28, handleLen: 150, guardW: 72, guardH: 16, perspective: 'perspective(1400px) rotateY(-14deg) rotateZ(-2deg)' },
  }[type]

  const { svgW, bladeLen, bladeW, curve, handleLen, guardW, guardH } = cfg
  const cx = svgW / 2
  const handleTop = 20
  const handleBot = handleTop + handleLen
  const guardY = handleBot
  const bladeTop = guardY + guardH
  const bladeBot = bladeTop + bladeLen
  const svgH = bladeBot + 30 // extra space for tip

  // Blade path with Bezier curve (mune=back/left, ha=edge/right)
  const muneTopX = cx - bladeW / 2
  const haTopX   = cx + bladeW / 2
  // Control points for the curve
  const muneCpX = cx - bladeW / 2 + curve * 0.2
  const muneCpY = bladeTop + bladeLen * 0.55
  const haCpX   = cx + bladeW / 2 + curve * 0.75
  const haCpY   = bladeTop + bladeLen * 0.45
  // Tip (kissaki) — offset by curve
  const tipX = cx + curve * 0.35
  const tipY = bladeBot + 15

  const bladePath = [
    `M ${muneTopX} ${bladeTop}`,
    `Q ${muneCpX} ${muneCpY} ${tipX - 3} ${tipY - 8}`,
    `L ${tipX} ${tipY}`,
    `L ${tipX + 3} ${tipY - 8}`,
    `Q ${haCpX} ${haCpY} ${haTopX} ${bladeTop}`,
    'Z',
  ].join(' ')

  // Handle wrapping diamond pattern
  const handleWraps = []
  const wrapSpacing = 14
  for (let y = handleTop + 10; y < handleBot - 5; y += wrapSpacing) {
    handleWraps.push(y)
  }

  // Hamon line
  const hamon = hamonPath(cx, bladeW, bladeTop + 20, bladeBot - 30, curve)

  // Day positions along the blade — distribute evenly
  const dayPositions = days.map((_, i) => {
    const t = (i + 0.5) / days.length
    const y = bladeTop + 20 + (bladeLen - 50) * t
    // X offset follows the blade curve
    const xOff = curve * Math.sin(t * Math.PI * 0.8) * 0.5
    return { y, xOff }
  })

  return (
    <section className="relative z-10 flex justify-center py-8 px-4">
      <div
        className="relative"
        style={{ transform: cfg.perspective, transformStyle: 'preserve-3d' }}
      >
        {/* Date range label */}
        <div className="text-center mb-3">
          <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-gtl-ash">
            {dateRange}
          </span>
        </div>

        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="block mx-auto"
          style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))' }}
        >
          <defs>
            {/* Steel gradient — cold blue-tint */}
            <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2a2e34" />
              <stop offset="25%" stopColor="#4a5058" />
              <stop offset="40%" stopColor="#6a7078" />
              <stop offset="50%" stopColor="#8a9098" />
              <stop offset="60%" stopColor="#6a7078" />
              <stop offset="75%" stopColor="#4a5058" />
              <stop offset="100%" stopColor="#2a2e34" />
            </linearGradient>
            {/* Handle gradient */}
            <linearGradient id="handle-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1a1a1e" />
              <stop offset="50%" stopColor="#2a2a30" />
              <stop offset="100%" stopColor="#1a1a1e" />
            </linearGradient>
            {/* Red edge glow filter */}
            <filter id="edge-glow" x="-50%" y="-10%" width="200%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
          </defs>

          {/* ── Handle (tsuka) ── */}
          <rect
            x={cx - bladeW / 2 - 2} y={handleTop}
            width={bladeW + 4} height={handleLen}
            rx={3}
            fill="url(#handle-grad)"
            stroke="#3a3a42" strokeWidth="1"
          />
          {/* Diamond wrap pattern */}
          {handleWraps.map((wy, i) => (
            <g key={i}>
              <line
                x1={cx - bladeW / 2 - 1} y1={wy}
                x2={cx + bladeW / 2 + 1} y2={wy + wrapSpacing / 2}
                stroke="#3a3a42" strokeWidth="0.8"
              />
              <line
                x1={cx + bladeW / 2 + 1} y1={wy}
                x2={cx - bladeW / 2 - 1} y2={wy + wrapSpacing / 2}
                stroke="#3a3a42" strokeWidth="0.8"
              />
            </g>
          ))}
          {/* Kashira (pommel cap) */}
          <rect
            x={cx - bladeW / 2 - 3} y={handleTop - 4}
            width={bladeW + 6} height={8}
            rx={2}
            fill="#3a3a42" stroke="#5a5a62" strokeWidth="0.5"
          />

          {/* ── Tsuba (guard) — only for wakizashi/katana ── */}
          {guardW > 0 && (
            <ellipse
              cx={cx} cy={guardY + guardH / 2}
              rx={guardW / 2} ry={guardH / 2 + 2}
              fill="#2e2e34" stroke="#5a5a62" strokeWidth="1"
            />
          )}

          {/* ── Blade ── */}
          <path d={bladePath} fill="url(#steel)" stroke="#5a5a62" strokeWidth="0.5" />

          {/* Red edge glow along ha (cutting edge) */}
          <path
            d={`M ${haTopX} ${bladeTop} Q ${haCpX} ${haCpY} ${tipX + 3} ${tipY - 8} L ${tipX} ${tipY}`}
            fill="none" stroke="#ff2a36" strokeWidth="2" opacity="0.3"
            filter="url(#edge-glow)"
          />

          {/* Hamon line */}
          <path
            d={hamon}
            fill="none" stroke="rgba(180,190,200,0.25)" strokeWidth="1.5"
            strokeDasharray="none"
          />

          {/* Highlight line down the center */}
          <line
            x1={cx + curve * 0.1} y1={bladeTop + 10}
            x2={tipX - 1} y2={tipY - 20}
            stroke="rgba(200,210,220,0.12)" strokeWidth="1"
          />

          {/* ── Days etched along the blade ── */}
          {days.map((iso, i) => {
            const date    = parseDate(iso)
            const dayNum  = date.getDate()
            const dayName = DAY_SHORT[date.getDay()]
            const muscles = dailyPlan[iso] || []
            const hasWork = muscles.length > 0
            const isLeft  = i % 2 === 0
            const { y, xOff } = dayPositions[i]
            const textX = isLeft ? cx - bladeW - 20 + xOff : cx + bladeW + 20 + xOff
            const anchor = isLeft ? 'end' : 'start'

            const kanjiList = muscles.slice(0, 3).map((m) => MUSCLE_KANJI[m] || '?')

            return (
              <g key={iso}>
                {/* Connector line from blade to text */}
                <line
                  x1={isLeft ? cx - bladeW / 2 + xOff : cx + bladeW / 2 + xOff}
                  y1={y}
                  x2={textX + (isLeft ? 8 : -8)}
                  y2={y}
                  stroke="rgba(255,42,54,0.15)" strokeWidth="0.5"
                />
                {/* Day number */}
                <text
                  x={textX} y={y}
                  textAnchor={anchor}
                  className="font-display"
                  style={{
                    fontSize: '38px',
                    fill: hasWork ? '#f5f0e8' : 'rgba(200,200,200,0.3)',
                    textShadow: hasWork ? '2px 2px 0 #070708' : 'none',
                  }}
                >
                  {String(dayNum).padStart(2, '0')}
                </text>
                {/* Day of week */}
                <text
                  x={textX} y={y + 16}
                  textAnchor={anchor}
                  style={{
                    fontSize: '9px',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.3em',
                    fill: hasWork ? '#6a6a72' : '#3a3a42',
                    textTransform: 'uppercase',
                  }}
                >
                  {dayName}
                </text>
                {/* Muscle kanji or 休 */}
                <text
                  x={textX} y={y + 42}
                  textAnchor={anchor}
                  style={{
                    fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
                    fontSize: '28px',
                    fontWeight: 400,
                    fill: hasWork ? '#ff2a36' : '#e4b022',
                    transform: `rotate(${isLeft ? -3 : 3}deg)`,
                    transformOrigin: `${textX}px ${y + 42}px`,
                  }}
                >
                  {hasWork ? kanjiList.join('  ') : '休'}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Floating shadow */}
        <div className="mx-auto mt-2"
          style={{ width: '100px', height: '10px', background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)', filter: 'blur(6px)' }} />
      </div>
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
