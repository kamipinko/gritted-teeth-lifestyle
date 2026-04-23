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
function CycleBlade({ days, dailyPlan, glowing = false }) {
  const first = days[0] ? parseDate(days[0]) : null
  const last  = days[days.length - 1] ? parseDate(days[days.length - 1]) : null
  const dateRange = first && last
    ? `${MONTH_SHORT[first.getMonth()]} ${first.getDate()} — ${MONTH_SHORT[last.getMonth()]} ${last.getDate()}`
    : ''

  // Backdrop renders client-side only — guarantees no hydration mismatch even if the bundler/browser
  // serializes the extra <img> differently between server and client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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

  const renderDayInscription = (dl, { outline = false, glow = false, glowFill = null } = {}) => {
    const { num, kanjiStr } = dl
    const kanjiChars = kanjiStr.split('')
    const n = kanjiChars.length
    const baseColor = glowFill || (glow ? '#ffdd00' : '#d4181f')
    const baseOpacity = 1.0
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
        <text x={0} y={60} textAnchor="middle" dominantBaseline="central" {...outlineProps}
          style={{ fontFamily: font, fontSize: '104px', fontWeight: 600, fill: baseColor, opacity: baseOpacity }}>
          {kanjiChars[0]}
        </text>
      )
    } else if (n <= 7) {
      // n=2..7: pair columns in rows of 2; an odd last kanji sits centered in the final row.
      let fontSize, colSpacing, baseY, rowYStep
      if (n <= 4) {
        fontSize = 56; colSpacing = 56; baseY = 60; rowYStep = 58
      } else if (n <= 6) {
        fontSize = 48; colSpacing = n === 5 ? 57 : 44; baseY = 46; rowYStep = 42
      } else {
        // n === 7 — 4 rows × 2 cols, last row is a centered singleton
        fontSize = 38; colSpacing = 44; baseY = 42; rowYStep = 36
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
    } else if (n <= 11) {
      // n=8..11: 4 columns × 2 rows (squat wide grid). n=9/10/11 add a row 3 with 1/2/3 kanji
      // at the midpoint gaps between adjacent columns of the 4-col grid above.
      const fontSize = 28
      const P = 30           // column pitch — columns at -1.5P, -0.5P, +0.5P, +1.5P
      const baseY = 38
      const rowYStep = 28
      // Row-3 gap positions (midpoints between adjacent columns): -P, 0, +P
      const row3Positions = n === 9 ? [0] : n === 10 ? [-P, P] : n === 11 ? [-P, 0, P] : null
      kanjiEls = kanjiChars.map((k, ki) => {
        let x, y
        if (ki < 8) {
          const row = Math.floor(ki / 4)
          const col = ki % 4
          x = (col - 1.5) * P
          y = baseY + row * rowYStep
        } else {
          x = row3Positions[ki - 8]
          y = baseY + 2 * rowYStep
        }
        return (
          <text key={ki} x={x} y={y} textAnchor="middle" dominantBaseline="central" {...outlineProps}
            style={{ fontFamily: font, fontSize: `${fontSize}px`, fontWeight: 600, fill: baseColor, opacity: baseOpacity }}>
            {k}
          </text>
        )
      })
    } else {
      // n=12 speculative (max live n=11): every column of the 4-col grid takes a 3rd kanji.
      const fontSize = 28
      const P = 30
      const baseY = 38
      const rowYStep = 28
      kanjiEls = kanjiChars.map((k, ki) => {
        const x = ((ki % 4) - 1.5) * P
        const y = baseY + Math.floor(ki / 4) * rowYStep
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
    <section className="relative z-10 py-2 px-2 pointer-events-none min-h-[calc(100vh-7px)]">
      {false && (
      <div className="text-center mb-1">
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '0.2em', color: '#5a5a62' }}>
          {dateRange}
        </span>
      </div>
      )}

      <div>
        {/* Blade container — 180vw overflow wrapper, bottom-anchored to the section so the tip sits ~24px above the viewport bottom.
            The section's pointer-events-none keeps the blade's overflow from swallowing clicks on the nav and fixed button above. */}
        <div style={{ position: 'absolute', bottom: '6px', left: 0, width: '180vw', maxWidth: 'none', marginLeft: 'calc(-40vw - 80px)', transform: 'rotate(11deg) scale(0.5625)', transformOrigin: '34.4% 97.7%' }}>
          {/* Black backdrop — outer-subpath-only SVG (inner hole subpaths stripped out).
              Same viewBox + same rotate/translate/scale transforms as the red weapon,
              so it aligns pixel-exact. No interior holes means the page gradient can't
              bleed through handle binding, tsuba interior, or blade interior.
              Rendered post-mount to sidestep any SSR/CSR hydration mismatch. */}
          {mounted && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/reference/wakizashi_solid_silhouette.svg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 block w-full h-auto"
            />
          )}
          {/* Potrace-traced wakizashi — rotated -45deg, tight viewBox 668,-635,1136,2642 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/reference/wakizashi_styled.svg"
          alt="Wakizashi"
          className="relative block w-full h-auto"
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
            {/* Flame aura filters — feTurbulence drives feDisplacementMap to push the
                duplicated-text alpha into wavering tongues, then feFlood+feComposite
                recolors to flame hues. The <animate> elements keep the noise field
                evolving so edges dance rather than repeat. */}
            <filter id="flame-outer" x="-50%" y="-80%" width="200%" height="260%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015 0.06" numOctaves="2" seed="3" result="noise">
                <animate attributeName="baseFrequency" values="0.015 0.06;0.012 0.08;0.018 0.05;0.015 0.06" dur="1400ms" repeatCount="indefinite"/>
                <animate attributeName="seed" values="3;7;2;5;3" dur="900ms" repeatCount="indefinite"/>
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
              <feGaussianBlur in="displaced" stdDeviation="1.8" result="blurred"/>
              <feFlood floodColor="#fff0a0" floodOpacity="0.9" result="tipColor"/>
              <feComposite in="tipColor" in2="blurred" operator="in"/>
            </filter>
            <filter id="flame-inner" x="-50%" y="-80%" width="200%" height="260%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="2" seed="11" result="noise">
                <animate attributeName="baseFrequency" values="0.02 0.09;0.024 0.07;0.018 0.11;0.02 0.09" dur="1100ms" repeatCount="indefinite"/>
                <animate attributeName="seed" values="11;4;9;2;11" dur="1300ms" repeatCount="indefinite"/>
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
              <feGaussianBlur in="displaced" stdDeviation="1.0" result="blurred"/>
              <feFlood floodColor="#ff7a00" floodOpacity="1" result="midColor"/>
              <feComposite in="midColor" in2="blurred" operator="in"/>
            </filter>
          </defs>
          {/* Flame-aura overlay — mounts only while `glowing` is true. Sits BEHIND the
              difference-blend text so the dancing tongues lick around the crisp etched
              glyphs without obscuring them. */}
          {glowing && (
            <>
              <style>{`
                @keyframes inscription-etch {
                  0%   { opacity: 0; }
                  12%  { opacity: 1; }
                  85%  { opacity: 1; }
                  100% { opacity: 0; }
                }
                .inscription-etching { animation: inscription-etch 1500ms ease-in-out forwards; }
              `}</style>
              <g className="inscription-etching" style={{ pointerEvents: 'none' }}>
                {/* Outer hot tips — lighter/broader aura, heavier displacement */}
                <g filter="url(#flame-outer)">
                  {dayLabels.map((dl) => (
                    <g key={`flame-outer-${dl.iso}`} transform={`translate(${dl.cx},${dl.cy}) rotate(${dl.angle - 90})`}>
                      {renderDayInscription(dl, { glowFill: '#fff0a0' })}
                    </g>
                  ))}
                </g>
                {/* Inner mid-heat — orange aura hugging the glyphs */}
                <g filter="url(#flame-inner)">
                  {dayLabels.map((dl) => (
                    <g key={`flame-inner-${dl.iso}`} transform={`translate(${dl.cx},${dl.cy}) rotate(${dl.angle - 90})`}>
                      {renderDayInscription(dl, { glowFill: '#ffaa00' })}
                    </g>
                  ))}
                </g>
              </g>
            </>
          )}
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
          {/* Weekday side labels — share the viewBox so they align vertically with each inscription.
              Per-row x calibration equalizes the on-screen gap between each label and the blade
              silhouette; a single x isn't enough because the 11deg blade rotation makes the right-
              side blade edge recede as y increases. See verify_weekday_gaps.py for the measurement. */}
          {dayLabels.map((dl, i) => {
            const dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][parseDate(dl.iso).getDay()]
            const isLeftSide = i < 3
            // Right-side labels need a down-nudge to align visually with inscription center; ~10 viewBox units ≈ 6 screen-px
            const yNudge = isLeftSide ? 0 : 10
            const LEFT_X  = [1001,  998, 1001]  // i = 0,1,2
            const RIGHT_X = [1597, 1572, 1542]  // i-3 = 0,1,2
            const labelX = isLeftSide ? LEFT_X[i] : RIGHT_X[i - 3]
            const labelY = dl.cy + yNudge
            return (
              <text
                key={`dow-${dl.iso}`}
                x={labelX}
                y={labelY}
                textAnchor={isLeftSide ? 'start' : 'end'}
                dominantBaseline="central"
                transform={`rotate(-11 ${labelX} ${labelY})`}
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
  const [flickering, setFlickering] = useState(false)

  const triggerFlicker = () => {
    setFlickering(true)
    setTimeout(() => setFlickering(false), 500)
  }
  const handlePressStart = () => { setPressed(true); triggerFlicker() }
  const handlePressEnd = () => { setPressed(false); onFire() }
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      triggerFlicker()
      onFire()
    }
  }

  return (
    <>
      <style>{`
        @keyframes flame-dance {
          0%   { transform: translate(0, 0) scale(1) rotate(0deg);
                 filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 8px rgba(255,69,0,0.6))  hue-rotate(0deg)  saturate(1.3) brightness(1.1); }
          15%  { transform: translate(-1px, -1.5px) scale(1.03) rotate(-0.6deg);
                 filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 14px rgba(255,140,0,0.75)) hue-rotate(20deg) saturate(1.6) brightness(1.3); }
          28%  { transform: translate(1px, -2px) scale(1.01) rotate(0.8deg);
                 filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 10px rgba(255,170,0,0.8))  hue-rotate(40deg) saturate(1.8) brightness(1.35); }
          45%  { transform: translate(-1.5px, -1px) scale(1.04) rotate(-0.8deg);
                 filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 18px rgba(255,204,0,0.85)) hue-rotate(60deg) saturate(2.0) brightness(1.45); }
          60%  { transform: translate(0, -2px) scale(1.02) rotate(0.3deg);
                 filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 12px rgba(255,140,0,0.7))  hue-rotate(35deg) saturate(1.7) brightness(1.25); }
          78%  { transform: translate(1px, -1px) scale(1.01) rotate(-0.2deg);
                 filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 10px rgba(255,69,0,0.6))   hue-rotate(10deg) saturate(1.4) brightness(1.15); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg);
                 filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 8px rgba(255,69,0,0.6))    hue-rotate(0deg)  saturate(1.3) brightness(1.1); }
        }
        .flicker-flame { animation: flame-dance 500ms cubic-bezier(0.4, 0, 0.6, 1); }
      `}</style>
      <div
        role="button"
        tabIndex={0}
        aria-label="Etch the cycle"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={() => setPressed(false)}
        onMouseEnter={onHover}
        onKeyDown={handleKey}
        className="fixed bottom-5 right-5 z-40 no-print cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-paper focus-visible:outline-offset-2"
      >
        <img
          src="/reference/gurren_flame.svg"
          alt=""
          aria-hidden="true"
          className={`block w-[72px] h-[72px] ${flickering ? 'flicker-flame' : ''}`}
          style={{
            filter: flickering
              ? undefined
              : 'drop-shadow(2px 2px 0 #000) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
            transition: 'filter 120ms ease-out',
          }}
        />
      </div>
    </>
  )
}

function RetreatButton() {
  const { play } = useSound()
  let backHref = '/fitness/new/branded'
  try { if (localStorage.getItem('gtl-back-to-edit') === '1') backHref = '/fitness/edit' } catch (_) {}
  return (
    <Link
      href={backHref}
      onMouseEnter={() => play('button-hover')}
      onClick={() => play('menu-close')}
      className="group inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-smoke/70 hover:text-gtl-red transition-colors duration-200"
    >
      <span className="text-[11px] leading-none transition-transform duration-200 group-hover:-translate-x-0.5">◀</span>
      <span>RETREAT</span>
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
  const [inscriptionsGlowing, setInscriptionsGlowing] = useState(false)
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

    // handleBegin fires immediately on press (no onFire delay).
    // All timers are press-absolute from t=0.
    setTimeout(() => setInscriptionsGlowing(true),   200)   // glow begins (overlaps tail of flicker)
    setTimeout(() => setInscriptionsGlowing(false), 1700)   // glow complete (1500ms window)
    setTimeout(() => setStampVisible(true),         1700)   // stamp flies in

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
    }, 2365)   // stamp lands (665ms after fly-in)

    setTimeout(() => play('stamp'),       2450)
    setTimeout(() => setFireActive(true), 3600)
  }

  const cols = days.length <= 5 ? days.length
             : days.length <= 10 ? Math.ceil(days.length / 2)
             : Math.ceil(days.length / 3)

  return (
    <main ref={mainRef} className="relative h-[100dvh] overflow-hidden bg-gtl-void">

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

      {/* ── Nav bar ── */}
      <section className="relative z-10">
        <div className="relative px-8 pt-6 pb-2">
          <div className="flex items-center gap-4">
            <RetreatButton />
          </div>
        </div>
      </section>

      {/* ── THE BLADE (< 7 days) or DAY CARDS (>= 7 days) ── */}
      {days.length > 0 && days.length < 7 && (
        <CycleBlade days={days} dailyPlan={dailyPlan} glowing={inscriptionsGlowing} />
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

      {/* ── ETCH CYCLE (fixed bottom-right CTA) ── */}
      <BeginButton
        onFire={handleBegin}
        onHover={() => play('button-hover')}
        label={(() => { try { return localStorage.getItem('gtl-back-to-edit') === '1' ? 'RE-ETCH CYCLE' : 'ETCH CYCLE' } catch (_) { return 'ETCH CYCLE' } })()}
      />

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
