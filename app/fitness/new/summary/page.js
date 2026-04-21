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
   THE BLADE — potrace-traced wakizashi for cycles < 7 days.
   Source: public/reference/wakizashi.png → threshold → potrace → SVG.
   Diagonal pose: hilt upper-right, tip lower-left.
   ══════════════════════════════════════════════════════════════════════════ */
function CycleBlade({ days, dailyPlan }) {
  const first = days[0] ? parseDate(days[0]) : null
  const last  = days[days.length - 1] ? parseDate(days[days.length - 1]) : null
  const dateRange = first && last
    ? `${MONTH_SHORT[first.getMonth()]} ${first.getDate()} — ${MONTH_SHORT[last.getMonth()]} ${last.getDate()}`
    : ''

  // Interior anchors — on the mune-side edge of the hi (fuller/blood groove).
  // This is the red-to-dark transition line INSIDE the blade face, ~45% from mune edge.
  // ~140px margin to mune, ~175px margin to ha — plenty of room for inscriptions.
  const INTERIOR_ANCHORS = [
    { x: 1355.48, y: 541.87, angle: 94.4 },
    { x: 1339.68, y: 758.88, angle: 95.1 },
    { x: 1318.07, y: 974.92, angle: 96.5 },
    { x: 1291.49, y: 1190.98, angle: 98.0 },
    { x: 1258.11, y: 1408.07, angle: 100.2 },
    { x: 1214.47, y: 1624.14, angle: 101.5 },
  ]
  // For weekday side label positioning (uses y-values only)
  const FACE_ANCHORS = INTERIOR_ANCHORS.map(a => [a.x, a.y])

  const dayLabels = days.map((iso, i) => {
    const d = parseDate(iso)
    const num = String(d.getDate())
    const muscles = dailyPlan[iso] || []
    const hasWork = muscles.length > 0
    const kanjiStr = hasWork
      ? muscles.map((m) => MUSCLE_KANJI[m] || '?').join('')
      : '休'
    const anchor = INTERIOR_ANCHORS[i] || INTERIOR_ANCHORS[INTERIOR_ANCHORS.length - 1]
    return { num, hasWork, kanjiStr, iso, cx: anchor.x, cy: anchor.y, angle: anchor.angle }
  })

  const renderDayInscription = (dl, { outline = false } = {}) => {
    const { num, hasWork, kanjiStr } = dl
    const kanjiChars = kanjiStr.split('')
    const n = kanjiChars.length
    const baseColor = '#d4181f'
    const baseOpacity = hasWork ? 0.8 : 0.9
    const font = '"Shippori Mincho", "Noto Serif JP", "Yu Mincho", Georgia, serif'
    const outlineProps = outline
      ? { stroke: '#000', strokeWidth: 1, paintOrder: 'stroke' }
      : {}

    const numEls = (
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" {...outlineProps}
        style={{ fontFamily: font, fontSize: '68px', fontWeight: 600, fill: baseColor, opacity: baseOpacity }}>
        {num}
      </text>
    )

    let kanjiEls
    if (n === 1) {
      kanjiEls = (
        <text x={0} y={78} textAnchor="middle" dominantBaseline="central" {...outlineProps}
          style={{ fontFamily: font, fontSize: '104px', fontWeight: 600, fill: baseColor, opacity: baseOpacity }}>
          {kanjiChars[0]}
        </text>
      )
    } else {
      // General pattern for n >= 2: pair columns in rows of 2; an odd last kanji sits centered in the final row.
      // Per-bucket sizing keeps large counts from clipping the blade tip.
      let fontSize, colSpacing, baseY, rowYStep
      if (n <= 4) {
        fontSize = 56; colSpacing = 56; baseY = 78; rowYStep = 58
      } else if (n <= 6) {
        fontSize = 48; colSpacing = n === 5 ? 57 : 44; baseY = 60; rowYStep = 42
      } else if (n <= 8) {
        fontSize = 28; colSpacing = 33; baseY = 52; rowYStep = 25
      } else if (n <= 10) {
        fontSize = 24; colSpacing = 28; baseY = 50; rowYStep = 22
      } else {
        fontSize = 22; colSpacing = 26; baseY = 48; rowYStep = 20
      }
      kanjiEls = kanjiChars.map((k, ki) => {
        const row = Math.floor(ki / 2)
        const isOddLast = n % 2 === 1 && ki === n - 1
        const x = isOddLast ? 0 : (ki % 2 - 0.5) * colSpacing
        const y = baseY + row * rowYStep
        return (
          <text key={ki} x={x} y={y} textAnchor="middle" dominantBaseline="central" {...outlineProps}
            style={{ fontFamily: font, fontSize: `${fontSize}px`, fontWeight: 600, fill: baseColor, opacity: baseOpacity }}>
            {k}
          </text>
        )
      })
    }

    return <>{numEls}{kanjiEls}</>
  }

  const lastIdx = dayLabels.length - 1
  const lastDay = lastIdx >= 0 ? dayLabels[lastIdx] : null

  return (
    <section className="relative z-10 py-2 px-2">
      {false && (
      <div className="text-center mb-1">
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '0.2em', color: '#5a5a62' }}>
          {dateRange}
        </span>
      </div>
      )}

      <div className="relative">
        {/* Blade container — 180vw overflow wrapper */}
        <div className="relative" style={{ width: '180vw', maxWidth: 'none', marginLeft: 'calc(-40vw - 85px)', marginTop: '-100px' }}>
          {/* Potrace-traced wakizashi — rotated -45deg, tight viewBox 668,-635,1136,2642 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/reference/wakizashi_styled.svg"
          alt="Wakizashi"
          className="block w-full h-auto opacity-85"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
        />

        {/* Engraved day labels along the blade spine — same viewBox as weapon SVG */}
        <svg
          viewBox="668 -635 1136 2642"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ top: '-15px', left: '0px' }}
          aria-hidden="true"
        >
          <defs>
            {/* Blade silhouette clip — spine edge + ha edge */}
            <clipPath id="blade-clip">
              <polygon points="
                1180,180 1100,520 1010,880 920,1240 860,1490 840,1600
                925,1655
                1010,1710 1130,1610 1225,1420 1330,1040 1400,700 1460,380
              " />
            </clipPath>
            {/* Half-plane clips in each glyph's local rotated frame — split the last day across the interior design line */}
            <clipPath id="last-day-left" clipPathUnits="userSpaceOnUse">
              <rect x="-500" y="-500" width="500" height="1000" />
            </clipPath>
            <clipPath id="last-day-right" clipPathUnits="userSpaceOnUse">
              <rect x="0" y="-500" width="500" height="1000" />
            </clipPath>
          </defs>
          <g style={{ mixBlendMode: 'difference' }}>
            {dayLabels.map((dl, i) => {
              const textAngle = dl.angle - 90
              const isLast = i === lastIdx
              return (
                <g key={dl.iso} transform={`translate(${dl.cx},${dl.cy}) rotate(${textAngle})`}>
                  {isLast ? (
                    // Last day's RIGHT half — stays in difference blend (reads black over solid blade)
                    <g clipPath="url(#last-day-right)">{renderDayInscription(dl)}</g>
                  ) : (
                    renderDayInscription(dl)
                  )}
                </g>
              )
            })}
          </g>
          {/* Last day's LEFT half — outside the difference group so the design-line crossing stays plain red */}
          {lastDay && (
            <g transform={`translate(${lastDay.cx},${lastDay.cy}) rotate(${lastDay.angle - 90})`}>
              <g clipPath="url(#last-day-left)">{renderDayInscription(lastDay, { outline: true })}</g>
            </g>
          )}
          {/* Weekday side labels — share the viewBox so they align vertically with each inscription */}
          {dayLabels.map((dl, i) => {
            const dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][parseDate(dl.iso).getDay()]
            const isLeftSide = i < 3
            // Right-side labels need a down-nudge to align visually with inscription center; ~10 viewBox units ≈ 6 screen-px
            const yNudge = isLeftSide ? 0 : 10
            return (
              <text
                key={`dow-${dl.iso}`}
                x={isLeftSide ? 1070 : 1664}
                y={dl.cy + yNudge}
                textAnchor={isLeftSide ? 'start' : 'end'}
                dominantBaseline="central"
                style={{
                  fontFamily: '"Noto Serif JP", Georgia, serif',
                  fontSize: '45px',
                  fontWeight: 700,
                  fill: '#b0a898',
                  letterSpacing: '0.2em',
                  opacity: 0.7,
                }}
              >
                {dow}
              </text>
            )
          })}
        </svg>
        </div>
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
      className="relative w-full max-w-[480px] mx-auto cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-4"
      style={{ transform: 'rotate(-1.5deg)', transformOrigin: 'center center' }}
    >
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(7px, 7px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      <div
        className="relative flex items-center justify-between px-8 py-5"
        style={{
          clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : '#d4181f',
          transform: pressed ? 'translate(7px, 7px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div>
          <div className="font-display text-4xl text-gtl-paper leading-none tracking-tight">{label}</div>
          <div className="font-mono text-[8px] tracking-[0.4em] uppercase text-gtl-paper/50 mt-1">
            LAUNCH THE FORGE
          </div>
        </div>
        <div className="font-display text-3xl text-gtl-paper/30 leading-none select-none">▸</div>
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

      {/* ── Nav bar ── */}
      <section className="relative z-10">
        <div className="relative px-8 pt-6 pb-2">
          <div className="flex items-center gap-4">
            <RetreatButton />
            <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke/60 overflow-hidden truncate">
              PALACE / FITNESS / NEW CYCLE / MISSION BRIEF
            </div>
          </div>
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

      {/* ── EXPORT + BEGIN (temporarily hidden for weapon sizing) ── */}
      {false && (
      <section className="relative z-10 px-8 pb-20 pt-4 flex flex-col gap-4 no-print">
        <ExportButton />
        <BeginButton
          onFire={handleBegin}
          onHover={() => play('button-hover')}
          label={(() => { try { return localStorage.getItem('gtl-back-to-edit') === '1' ? 'RE-ETCH CYCLE' : 'ETCH CYCLE' } catch (_) { return 'ETCH CYCLE' } })()}
        />
      </section>
      )}

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
