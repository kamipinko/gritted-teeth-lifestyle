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
function CycleBlade({ days, dailyPlan, glowing = false, bursting = false }) {
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

  const renderDayInscription = (dl, { outline = false, glow = false, glowFill = null, maskFill = null } = {}) => {
    const { num, kanjiStr } = dl
    const kanjiChars = kanjiStr.split('')
    const n = kanjiChars.length
    const baseColor = maskFill || glowFill || (glow ? '#ffdd00' : '#d4181f')
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
            {/* Inscription-window mask — white-filled glyph duplicates inside an
                otherwise-black rect. Everything drawn with mask='url(#inscription-window)'
                is clipped to the glyph silhouettes: visible inside letters, hidden
                outside. Used to turn the inscriptions into flame-filled windows. */}
            <mask id="inscription-window" maskUnits="userSpaceOnUse" x="668" y="-635" width="1136" height="2642">
              <rect x="668" y="-635" width="1136" height="2642" fill="black"/>
              {dayLabels.map((dl) => (
                <g key={`mask-${dl.iso}`} transform={`translate(${dl.cx},${dl.cy}) rotate(${dl.angle - 90})`}>
                  {renderDayInscription(dl, { maskFill: 'white' })}
                </g>
              ))}
            </mask>
            {/* Ray shaft gradient — bright at the base (polygon's narrow end, near the
                inscription), fading to transparent at the tip. objectBoundingBox runs
                the gradient along each polygon's local y-axis regardless of rotation. */}
            <linearGradient id="ray-shaft" x1="0.5" y1="1" x2="0.5" y2="0" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="white"   stopOpacity="0.95"/>
              <stop offset="35%"  stopColor="#fff4c9" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0"/>
            </linearGradient>
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
              {/* Particles clipped to the inscription silhouettes via SVG mask.
                  Wide horizontal spread (±90 viewBox units, broader than glyph width)
                  gives the particles material to flow through the glyph 'windows'.
                  SVG <animateTransform> ensures the rise direction is in the blade's
                  tilted local frame — particles flow up-along-blade through the cutouts.
                  Deterministic per-index delay keeps SSR/CSR consistent. */}
              <g mask="url(#inscription-window)" className="inscription-etching" style={{ pointerEvents: 'none' }}>
                {/* Dark underlay — same rect as the mask region, filled gtl-void so the
                    glyph windows show near-black instead of the red blade. Orange particles
                    on black = high contrast regardless of position; orange on red bled. */}
                <rect x="668" y="-635" width="1136" height="2642" fill="#0a0a0a"/>
                {(() => {
                  // GLSL-style fractional-sin hash — adjacent integer seeds produce wildly
                  // uncorrelated outputs in [0, 1). Same input → same output (SSR/CSR safe),
                  // but no visible banding the way (k*97) % 1000 has.
                  const hash01 = (n) => {
                    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
                    return x - Math.floor(x)
                  }
                  return dayLabels.flatMap((dl, dayIdx) => {
                    const PARTS = 12
                    return Array.from({ length: PARTS }).map((_, i) => {
                      const k = i + dayIdx * 23
                      const rX      = hash01(k * 1)
                      const rXj     = hash01(k * 2 + 5)
                      const rDly    = hash01(k * 3 + 11)
                      const rDur    = hash01(k * 5 + 17)
                      const rRise   = hash01(k * 7 + 19)
                      const rSize   = hash01(k * 11 + 23)
                      const rPeak   = hash01(k * 13 + 29)
                      const rDrft   = hash01(k * 17 + 31)
                      const rStartJ = hash01(k * 19 + 37)
                      const rEndR   = hash01(k * 23 + 41)

                      const xOff   = (rX - 0.5) * 200 + (rXj - 0.5) * 60
                      const delay  = (rDly * 540 + dayIdx * 131) % 600       // 0-600ms spawn window, stagger via 131
                      const dur    = 130 + rDur * 150                        // 130-280ms (2x faster — pixel-per-ms doubled)
                      const rise   = 280 + rRise * 200                       // 280-480 vb units
                      const size   = 20 + rSize * 38                         // r 20-58
                      const peakA  = 0.5 + rPeak * 0.5                       // 0.5-1.0
                      const driftX = (rDrft - 0.5) * 180                     // ±90 lateral
                      const startY = 120 + (rStartJ - 0.5) * 140             // ±70 start-y jitter
                      const endR   = 2 + rEndR * 4                           // 2-6 shrink-to-dot

                      return (
                        <circle
                          key={`${dl.iso}-sp${i}`}
                          cx={dl.cx + xOff}
                          cy={dl.cy + startY}
                          r={size}
                          fill="#ff5000"
                          opacity={0}
                        >
                          <animateTransform attributeName="transform" type="translate"
                            values={`0 0; ${(driftX * 0.4).toFixed(2)} -${(rise * 0.5).toFixed(2)}; ${driftX.toFixed(2)} -${rise.toFixed(2)}`}
                            dur={`${dur.toFixed(0)}ms`}
                            begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                          {/* Trapezoidal opacity: ignite in 4%, hold 71% at peak, 25% fade. Constant burn. */}
                          <animate attributeName="opacity"
                            values={`0; ${peakA.toFixed(2)}; ${peakA.toFixed(2)}; 0`}
                            keyTimes="0; 0.04; 0.75; 1"
                            dur={`${dur.toFixed(0)}ms`}
                            begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                          <animate attributeName="r"
                            values={`${size.toFixed(2)}; ${size.toFixed(2)}; ${endR.toFixed(2)}`}
                            dur={`${dur.toFixed(0)}ms`}
                            begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                        </circle>
                      )
                    })
                  })
                })()}
              </g>
            </>
          )}
          {/* Difference-blend base inscriptions. Hidden during glow: the masked
              particle layer above supplies the glyph visuals (flame-filled windows),
              and keeping the black etched text visible would occlude them. Fade
              smoothly back in once the glow ends. */}
          <g style={{ mixBlendMode: 'difference', opacity: glowing ? 0 : 1, transition: 'opacity 150ms ease-out' }}>
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
          {/* Last day's LEFT half — outside the difference group so the design-line crossing stays plain red.
              Same opacity gating as the difference-blend group above so the masked particles show cleanly. */}
          {lastDay && (
            <g transform={`translate(${lastDay.cx},${lastDay.cy}) rotate(${lastDay.angle - 90})`}
               style={{ opacity: glowing ? 0 : 1, transition: 'opacity 150ms ease-out' }}>
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
          {/* God-rays burst — tapered polygon rays per inscription. Polygon is narrow
              at the base (y=0, near inscription) and wider at the tip (y=-180), which
              reads as a 3D shaft approaching the viewer. 12 rays per inscription at 30°
              spacing. plus-lighter blend brightens blade + inscription holes behind. */}
          {bursting && (
            <>
              <style>{`
                @keyframes burst-appear {
                  0%   { opacity: 0; }
                  25%  { opacity: 1; }
                  75%  { opacity: 1; }
                  100% { opacity: 0; }
                }
                .burst-group { animation: burst-appear 500ms ease-out forwards; }
              `}</style>
              <g className="burst-group" style={{ mixBlendMode: 'plus-lighter' }}>
                {dayLabels.map((dl) => {
                  const RAYS = 12
                  return (
                    <g key={`burst-${dl.iso}`} transform={`translate(${dl.cx},${dl.cy})`}>
                      {Array.from({ length: RAYS }).map((_, i) => {
                        const angle = (360 / RAYS) * i
                        return (
                          <polygon
                            key={i}
                            points="-2,0 2,0 15,-180 -15,-180"
                            fill="url(#ray-shaft)"
                            transform={`rotate(${angle})`}
                          />
                        )
                      })}
                      <circle cx="0" cy="0" r="10" fill="white" opacity="0.9"/>
                      <circle cx="0" cy="0" r="5"  fill="#fffbe0"/>
                    </g>
                  )
                })}
              </g>
            </>
          )}
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
// Gurren flame outline — path data lifted from public/reference/gurren_flame.svg
// (same asset the <img src> was loading). Inlined so we can apply SVG-mask-window
// effects (particles rising through the silhouette on press).
const GURREN_FLAME_D = 'M23.2,520.6c5.4-0.2,10.8-0.3,16.2,1.1c5.1,1.4,10.2,4.3,13.1,8.5c3.7,5.5,3.5,13.2,2.3,20.3c-2,11.8-6.6,21.8-11.8,31.8c-6.9,13.3-14.8,26.6-17.3,41.5c-2.5,14.9,0.5,31.4,8.9,44c5.9,8.8,14.6,15.8,24.1,20.2c10.9,5.1,22.9,6.9,34.9,8.7c-5.5-5.1-10.9-10.2-15.8-16c-4.8-5.8-9-12.4-11.2-19.6c-2-6.9-2.2-14.5-0.6-21.6c1.3-5.7,3.7-11,6.1-16.4c-0.7,5.5-1.3,11-0.5,16.4c1.2,7.5,5.3,14.6,10.6,20.5c5.3,5.8,11.7,10.4,18.9,12.7c4.1,1.3,8.5,1.8,12.8,2.2c-2.1-3.8-4.2-7.5-5.9-11.6c-2.4-5.7-4-12-4.1-18.1c-0.2-13.7,6.8-27,15.9-37.3c8-9,17.6-15.7,23-26.8c4-8.1,5.7-18.5,7.2-27.7c2.7,6.5,4,12.1,4.1,17.9c0.2,10.3-3.4,20.7-8,30.1c-5.1,10.3-11.6,19.4-16,29.8c-2.9,6.9-4.9,14.5-4.8,21.9c0,5.3,1.1,10.6,2.2,15.9c7.5-2.9,14.9-5.8,21.5-10.1c6.7-4.5,12.4-10.6,17.4-17.1c3.5-4.5,6.5-9.3,9.6-14c0,7.1-0.1,14.2-1.8,21.2c-1.4,5.6-3.8,11.2-6.7,16.2c-4.1,7.2-9.3,13.3-15,18.5c-5,4.5-10.3,8.2-16.7,11.9c10.6-0.3,20.8-1.9,31.1-4.6c11.8-3.1,23.8-7.8,34.4-16.1c9.9-7.7,18.6-18.7,24-31c10.3-23.7,7.9-52.4-1.3-74.7c-4.4-10.7-10.3-19.8-13.1-29.8c0,10.5-0.7,19.3-2.5,27.7c-1.8,8.4-4.6,16.3-10.6,22.3c-3.8,3.8-8.8,6.7-15.4,7.6c4.1-6.9,8.2-13.8,10.8-21.2c3.1-8.9,4-18.4,2.3-27.9c-1.9-10.9-7.2-21.7-14.3-30.3c-5.9-7.1-13.1-12.7-19.5-19c-9.7-9.5-17.8-20.7-23.2-32.9c-4.2-9.5-6.7-19.7-5.6-34c-10.3,16-11.6,28.8-10.4,40.7c0.6,6.4,1.9,12.6,7.1,24.7c-9.4-4.6-16.1-11.8-20.8-19.8c-6.9-11.6-9.6-25.1-9.1-37.7c0.5-10.8,3.4-20.9,7.5-30.1c3.2-7.3,7-14,10.8-20.7c-6.3,4.1-12.6,8.2-18.6,13c-7.4,6-14.3,13.1-19.1,21.3c-7.4,12.7-9.7,28.1-7.6,42.4c1.4,9.1,4.6,17.8,8.5,26.2c6.6,14.1,15.3,27.1,19.6,43.1c2.5,9,3.6,18.9,2,27.8c-1.4,7.9-5,15-11,17.2c-3,1.1-6.5,1.1-9.3-0.8c-2.8-1.9-4.8-5.8-5.9-9.4c-1.7-5.6-1.4-10.8-1.5-16.4c-0.2-7.8-1.3-16.5-5.3-23.7c-3.2-5.8-8.4-10.6-14.2-13.2c-5.9-2.7-12.4-3.1-19-1.8C32.2,515.3,27.8,517,23.2,520.6z'

function BeginButton({ onFire, onHover, label = 'ETCH CYCLE' }) {
  const [pressed, setPressed] = useState(false)
  const [flickering, setFlickering] = useState(false)

  const triggerFlicker = () => {
    // Ignite. No reset timer — flame burns through the full etch sequence until
    // the page navigates away and BeginButton unmounts.
    setFlickering(true)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Etch the cycle"
      onMouseDown={() => { setPressed(true); triggerFlicker() }}
      onMouseUp={() => { setPressed(false); onFire() }}
      onMouseLeave={() => setPressed(false)}
      onMouseEnter={onHover}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFlicker(); onFire() } }}
      className="fixed bottom-5 right-5 z-40 no-print cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-paper focus-visible:outline-offset-2"
      style={{ width: 72, height: 72 }}
    >
      <svg
        viewBox="23.2 388.8 208.8 307.9"
        width={72}
        height={72}
        className="relative z-10 block"
        aria-hidden="true"
        style={{
          filter: 'drop-shadow(2px 2px 0 #000) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
          transform: pressed ? 'translate(2px, 2px)' : 'none',
          transition: 'transform 80ms ease-out',
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Mask defining the flame silhouette as the 'window' — white-filled path
              inside a black rect. Particles clipped through this reveal only inside
              the Gurren flame shape. */}
          <mask id="btn-flame-window" maskUnits="userSpaceOnUse" x="23.2" y="388.8" width="208.8" height="307.9">
            <rect x="23.2" y="388.8" width="208.8" height="307.9" fill="black"/>
            <path d={GURREN_FLAME_D} fill="white"/>
          </mask>
        </defs>
        {/* Static flame silhouette. Red at rest; void-black when flickering so the
            masked orange particles pop through a dark window instead of the red fill. */}
        <path d={GURREN_FLAME_D} fill={flickering ? '#0a0a0a' : '#d4181f'}/>
        {flickering && (
          <g mask="url(#btn-flame-window)">
            {(() => {
              const hash01 = (n) => {
                const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
                return x - Math.floor(x)
              }
              const PARTS = 10
              return Array.from({ length: PARTS }).map((_, i) => {
                const rX      = hash01(i * 1)
                const rXj     = hash01(i * 2 + 5)
                const rDly    = hash01(i * 3 + 11)
                const rDur    = hash01(i * 5 + 17)
                const rRise   = hash01(i * 7 + 19)
                const rSize   = hash01(i * 11 + 23)
                const rPeak   = hash01(i * 13 + 29)
                const rDrft   = hash01(i * 17 + 31)
                const rStartJ = hash01(i * 19 + 37)

                const cxBase = 23.2 + 104.4                              // viewBox horizontal center
                const xOff   = (rX - 0.5) * 140 + (rXj - 0.5) * 40       // within flame silhouette width
                const delay  = (rDly * 540) % 600                        // ~600ms window
                const dur    = 130 + rDur * 150                          // 130-280ms (matches inscriptions)
                const rise   = 200 + rRise * 100                         // 200-300 viewBox units
                const size   = 14 + rSize * 26                           // r 14-40
                const peakA  = 0.5 + rPeak * 0.5                         // 0.5-1.0
                const driftX = (rDrft - 0.5) * 80                        // ±40 lateral
                const startY = 630 + (rStartJ - 0.5) * 60                // near the BOTTOM of the flame (high viewBox y)

                return (
                  <circle key={`btn-sp${i}`}
                    cx={cxBase + xOff} cy={startY}
                    r={size} fill="#ff5000" opacity={0}>
                    <animateTransform attributeName="transform" type="translate"
                      values={`0 0; ${(driftX * 0.4).toFixed(2)} -${(rise * 0.5).toFixed(2)}; ${driftX.toFixed(2)} -${rise.toFixed(2)}`}
                      dur={`${dur.toFixed(0)}ms`}
                      begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                    <animate attributeName="opacity"
                      values={`0; ${peakA.toFixed(2)}; ${peakA.toFixed(2)}; 0`}
                      keyTimes="0; 0.08; 0.55; 1"
                      dur={`${dur.toFixed(0)}ms`}
                      begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                    <animate attributeName="r"
                      values={`${size.toFixed(2)}; ${size.toFixed(2)}; ${(2 + rPeak * 4).toFixed(2)}`}
                      dur={`${dur.toFixed(0)}ms`}
                      begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                  </circle>
                )
              })
            })()}
          </g>
        )}
      </svg>
    </div>
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
  const [bursting, setBursting] = useState(false)
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
    // Press-absolute beats:
    //  200-1500  inscription particle flames
    //  1500-2000 god-rays burst (HTML sunrays overlay)
    //  2000      stamp flies in (after burst completes)
    //  2665      stamp lands
    //  4700      fire transition / navigate
    setTimeout(() => setInscriptionsGlowing(true),   200)
    setTimeout(() => setInscriptionsGlowing(false), 1500)
    setTimeout(() => setBursting(true),             1500)
    setTimeout(() => setBursting(false),            2000)
    setTimeout(() => setStampVisible(true),         2000)

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
    }, 2665)   // stamp lands (665ms after fly-in; shifted from 2365)

    setTimeout(() => play('stamp'),       2750)
    setTimeout(() => setFireActive(true), 4700)
  }

  const cols = days.length <= 5 ? days.length
             : days.length <= 10 ? Math.ceil(days.length / 2)
             : Math.ceil(days.length / 3)

  return (
    <main ref={mainRef} className="relative h-[100dvh] overflow-hidden bg-gtl-void">

      {/* ── Shared SVG filter defs (accessible via CSS filter: url(#…) from any element) ──
           flame-outer-btn is a button-scaled version of the inscription flame-outer filter:
           smaller displacement (72px canvas vs viewBox-compressed inscription SVG), tighter
           blur, coarser dropout so holes are still readable at the button render size. Same
           turbulence type, same animated baseFrequency technique, same amber palette. */}
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
        <CycleBlade days={days} dailyPlan={dailyPlan} glowing={inscriptionsGlowing} bursting={bursting} />
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
