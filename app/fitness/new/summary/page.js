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

// Per-element randomized CSS vars for the flame-engulf bloom. Each seed yields a unique
// duration/blur/glow combo so no two blooms render identically across the cascade.
function engulfVars(seed) {
  const h = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
  const r1 = h(seed * 7 + 3)
  const r2 = h(seed * 11 + 17)
  const r3 = h(seed * 13 + 29)
  return {
    '--engulf-dur': `${220 + r1 * 120}ms`,
    '--engulf-opacity-start': `${0.45 + r2 * 0.25}`,
    '--engulf-glow-1':  `${4  + r1 * 6}px`,
    '--engulf-glow-1b': `${12 + r2 * 10}px`,
    '--engulf-glow-1c': `${22 + r3 * 14}px`,
    '--engulf-glow-2':  `${8  + r1 * 6}px`,
    '--engulf-glow-2b': `${20 + r3 * 10}px`,
    '--engulf-blur-1':  `${1.0 + r2 * 1.2}px`,
    '--engulf-blur-2':  `${2.2 + r3 * 2.0}px`,
    '--engulf-blur-3':  `${4.0 + r1 * 2.5}px`,
  }
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
function CycleBlade({ days, dailyPlan, glowingDays = [], glowIntensity = 'off', hotDays = [], cooledDays = [], weekdaysIgnited = [], weekdaysCooled = false }) {
  const anyGlowing = glowingDays.some(Boolean)
  const anyWeekdayIgnited = Array.isArray(weekdaysIgnited) && weekdaysIgnited.some(Boolean)
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

  const renderDayInscription = (dl, { outline = false, maskFill = null, hot = false } = {}) => {
    const { num, kanjiStr } = dl
    const kanjiChars = kanjiStr.split('')
    const n = kanjiChars.length
    const baseOpacity = 1.0
    const font = '"Shippori Mincho", "Noto Serif JP", "Yu Mincho", Georgia, serif'
    const outlineProps = outline
      ? { stroke: '#000', strokeWidth: 1, paintOrder: 'stroke' }
      : {}

    // 3D embossed depth: 4 stacked layers with progressive y-offset + darkening ramp.
    // Red stack is the default pre-ignition color; hot stack is the dark-orange ignited
    // state (post-flame, persists until navigation). maskFill (mask + zoom-burst passes)
    // collapses to a single flat layer so the silhouette stays crisp.
    const DEPTH_STACK_RED = [
      { dy: 3, fill: '#3a0608' },
      { dy: 2, fill: '#6b0b10' },
      { dy: 1, fill: '#9e1118' },
      { dy: 0, fill: '#d4181f' },
    ]
    const DEPTH_STACK_HOT = [
      { dy: 3, fill: '#ffffff' },
      { dy: 2, fill: '#ffe0a0' },
      { dy: 1, fill: '#d85a10' },
      { dy: 0, fill: '#ff6600' },
    ]
    const stack = hot ? DEPTH_STACK_HOT : DEPTH_STACK_RED
    const layers = maskFill ? [{ dy: 0, fill: maskFill }] : stack

    // Dark stroke on the face layer of the HOT base inscription only. Creates a consistent
    // dark neighborhood around each letter so simultaneous-contrast doesn't make the orange
    // read as different colors over the red blade vs the black background. Mask/zoom passes
    // use maskFill (no stroke); depth layers dy=3/2/1 stay stroke-free to keep the extrusion
    // shadows clean.
    const hotStrokeProps = (isFace) =>
      (hot && !maskFill && isFace)
        ? { stroke: '#1a0500', strokeWidth: 2, paintOrder: 'stroke' }
        : {}

    const renderText = (keyBase, x, y, fontSize, char) => layers.map((layer, li) => {
      const isFace = li === layers.length - 1
      return (
        <text key={`${keyBase}-${li}`} x={x} y={y + layer.dy} textAnchor="middle" dominantBaseline="central"
          {...outlineProps} {...hotStrokeProps(isFace)}
          style={{ fontFamily: font, fontSize: `${fontSize}px`, fontWeight: 600, fill: layer.fill, opacity: baseOpacity }}>
          {char}
        </text>
      )
    })

    const numEls = renderText('num', 0, 0, 68, num)

    let kanjiEls
    if (n === 1) {
      kanjiEls = renderText('kj0', 0, 60, 104, kanjiChars[0])
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
      kanjiEls = kanjiChars.flatMap((k, ki) => {
        const row = Math.floor(ki / 2)
        const isOddLast = n % 2 === 1 && ki === n - 1
        const x = isOddLast ? 0 : (ki % 2 - 0.5) * colSpacing
        const y = baseY + row * rowYStep
        return renderText(`kj${ki}`, x, y, fontSize, k)
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
      kanjiEls = kanjiChars.flatMap((k, ki) => {
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
        return renderText(`kj${ki}`, x, y, fontSize, k)
      })
    } else {
      // n=12 speculative (max live n=11): every column of the 4-col grid takes a 3rd kanji.
      const fontSize = 28
      const P = 30
      const baseY = 38
      const rowYStep = 28
      kanjiEls = kanjiChars.flatMap((k, ki) => {
        const x = ((ki % 4) - 1.5) * P
        const y = baseY + Math.floor(ki / 4) * rowYStep
        return renderText(`kj${ki}`, x, y, fontSize, k)
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
              {/* Only currently-glowing days contribute to the mask. Once a day transitions to
                  hot, dropping it from the mask lets the dark-underlay rect stop bleeding through
                  that glyph, exposing the hot-orange base inscription cleanly. */}
              {dayLabels.map((dl, i) => glowingDays[i] ? (
                <g key={`mask-${dl.iso}`} transform={`translate(${dl.cx},${dl.cy}) rotate(${dl.angle - 90})`}>
                  {renderDayInscription(dl, { maskFill: 'white' })}
                </g>
              ) : null)}
            </mask>
            {/* Weekday-label yakiire mask — white-filled weekday glyphs carved into the
                overlay's viewBox. Particles clipped through this appear inside the SUN/MON/…
                letters only. Mask is built unconditionally; the particle group below only
                renders while weekdaysIgnited && !weekdaysCooled. */}
            <mask id="weekday-window" maskUnits="userSpaceOnUse" x="668" y="-635" width="1136" height="2642">
              <rect x="668" y="-635" width="1136" height="2642" fill="black"/>
              {dayLabels.map((dl, i) => {
                const dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][parseDate(dl.iso).getDay()]
                const isLeftSide = i < 3
                const yNudge = isLeftSide ? 0 : 10
                const LEFT_X  = [1001,  998, 1001]
                const RIGHT_X = [1597, 1572, 1542]
                const labelX = isLeftSide ? LEFT_X[i] : RIGHT_X[i - 3]
                const labelY = dl.cy + yNudge
                return (
                  <text key={`wd-mask-${dl.iso}`}
                    x={labelX} y={labelY}
                    textAnchor={isLeftSide ? 'start' : 'end'}
                    dominantBaseline="central"
                    transform={`rotate(-11 ${labelX} ${labelY})`}
                    style={{
                      fontFamily: '"Noto Serif JP", Georgia, serif',
                      fontSize: '45px',
                      fontWeight: 700,
                      letterSpacing: '0.2em',
                      fill: 'white',
                    }}
                  >
                    {dow}
                  </text>
                )
              })}
            </mask>
          </defs>
          {/* Flame-aura overlay — mounts while ANY inscription is still glowing. Per-day
              particle subsets unmount as each day transitions out of glowing, so the flames
              retract one-by-one in sync with the cascade. */}
          {anyGlowing && (
            <>
              {/* Particles clipped to the inscription silhouettes via SVG mask.
                  Wide horizontal spread (±90 viewBox units, broader than glyph width)
                  gives the particles material to flow through the glyph 'windows'.
                  SVG <animateTransform> ensures the rise direction is in the blade's
                  tilted local frame — particles flow up-along-blade through the cutouts.
                  Deterministic per-index delay keeps SSR/CSR consistent. */}
              <g mask="url(#inscription-window)" style={{ pointerEvents: 'none' }}>
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
                    if (!glowingDays[dayIdx]) return []
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
          {/* Base inscriptions — per-day wrapper so each day can flip to hot independently.
              Pre-ignition: difference-blend red (reads dark carved). Post-ignition: normal blend
              over dark-orange DEPTH_STACK_HOT + warm drop-shadow halo that ramps in over 300ms. */}
          {/* Two decoupled animations: hot-hold keeps the bright glow in place as long as the
              .inscription-hot class is applied; cool-down plays once over 700ms when cooledDays
              flips and the class swaps to .inscription-cooled. Both ends declare 4 drop-shadows
              so CSS can smoothly interpolate between HOT and COOLED filter stacks. */}
          <style>{`
            @keyframes inscription-hot-hold {
              from, to { filter: drop-shadow(0 0 4px #fff4c9) drop-shadow(0 0 10px #ffa840) drop-shadow(0 0 22px rgba(255, 120, 0, 0.85)) drop-shadow(0 0 36px rgba(255, 80, 0, 0.5)); }
            }
            @keyframes inscription-cool-down {
              0%   { filter: drop-shadow(0 0 4px #fff4c9) drop-shadow(0 0 10px #ffa840) drop-shadow(0 0 22px rgba(255, 120, 0, 0.85)) drop-shadow(0 0 36px rgba(255, 80, 0, 0.5)); }
              100% { filter: drop-shadow(0 0 1.5px #ff8800) drop-shadow(0 0 4px rgba(255, 122, 0, 0.55)) drop-shadow(0 0 7px rgba(255, 80, 0, 0.2)) drop-shadow(0 0 7px rgba(255, 80, 0, 0)); }
            }
            .inscription-hot    { animation: inscription-hot-hold 100ms forwards; }
            .inscription-cooled { animation: inscription-cool-down 700ms ease-out forwards; }
          `}</style>
          {dayLabels.map((dl, i) => {
            const textAngle = dl.angle - 90
            const isLast = i === lastIdx
            const hot = !!hotDays[i]
            const cooled = !!cooledDays[i]
            const flameOn = !!glowingDays[i]
            const cls = cooled ? 'inscription-cooled' : (hot ? 'inscription-hot' : '')
            return (
              <g key={dl.iso}
                 className={cls}
                 style={{
                   mixBlendMode: hot ? 'normal' : 'difference',
                   opacity: flameOn ? 0 : 1,
                   transition: 'opacity 0ms',
                 }}>
                <g transform={`translate(${dl.cx},${dl.cy}) rotate(${textAngle})`}>
                  {isLast ? (
                    <g clipPath="url(#last-day-right)">{renderDayInscription(dl, { hot })}</g>
                  ) : (
                    renderDayInscription(dl, { hot })
                  )}
                </g>
              </g>
            )
          })}
          {/* Last day's LEFT half — outside the main group so the design-line crossing stays plain
              (no difference blend) even in the red state. Uses hotDays[lastIdx] to sync with the
              last day's right half. */}
          {lastDay && (
            <g className={cooledDays[lastIdx] ? 'inscription-cooled' : (hotDays[lastIdx] ? 'inscription-hot' : '')}
               style={{
                 opacity: glowingDays[lastIdx] ? 0 : 1,
                 transition: 'opacity 0ms',
               }}>
              <g transform={`translate(${lastDay.cx},${lastDay.cy}) rotate(${lastDay.angle - 90})`}>
                <g clipPath="url(#last-day-left)">{renderDayInscription(lastDay, { outline: true, hot: !!hotDays[lastIdx] })}</g>
              </g>
            </g>
          )}
          {/* Zoom-burst finale — fires during the 'peak' glow phase. Each inscription
              spawns a bright near-white duplicate that rapidly scales from 1x to 12x
              while fading to zero. plus-lighter blend reads as light 'punching toward
              the viewer'. Inner <g> holds the scale animation so the outer <g>'s
              translate/rotate SVG attribute isn't clobbered by the CSS transform. */}
          {glowIntensity === 'peak' && (
            <>
              <style>{`
                @keyframes inscription-zoom {
                  0%   { transform: scale(1);    opacity: 1.0; }
                  30%  { transform: scale(1.4);  opacity: 1.0; }
                  70%  { transform: scale(1.68); opacity: 0.9; }
                  100% { transform: scale(1.85); opacity: 0; }
                }
                .inscription-zoom-burst .zoom-glyph {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: inscription-zoom 340ms ease-out forwards;
                  mix-blend-mode: plus-lighter;
                  filter: drop-shadow(0 0 6px #ff6600) drop-shadow(0 0 16px #ff4400);
                  /* Invisible before (during staggered delay) and after the animation — only
                     visible while the 280ms keyframes are running. Keyframe opacity drives reveal. */
                  opacity: 0;
                }
              `}</style>
              <g className="inscription-zoom-burst" style={{ mixBlendMode: 'plus-lighter', pointerEvents: 'none' }}>
                {dayLabels.map((dl, i) => (
                  <g key={`zoom-${dl.iso}`} transform={`translate(${dl.cx},${dl.cy}) rotate(${dl.angle - 90})`}>
                    <g className="zoom-glyph" style={{ animationDelay: `${i * 220}ms` }}>
                      {renderDayInscription(dl, { maskFill: '#ff6600' })}
                    </g>
                  </g>
                ))}
                {lastDay && (
                  <g transform={`translate(${lastDay.cx},${lastDay.cy}) rotate(${lastDay.angle - 90})`}>
                    <g className="zoom-glyph" style={{ animationDelay: `${lastIdx * 220}ms` }}>
                      <g clipPath="url(#last-day-left)">{renderDayInscription(lastDay, { maskFill: '#ff6600' })}</g>
                    </g>
                  </g>
                )}
              </g>
            </>
          )}
          {/* Weekday labels — per-day ignition gate. Each text hides once its own weekday
              ignites (inscription cheat), so the staggered particle flames are the sole
              visible content inside that letter silhouette. Class goes on the <text> level
              so each weekday's hot-glow keyframe fires on its own schedule. */}
          <g>
            {dayLabels.map((dl, i) => {
              const isIgnited = !!(Array.isArray(weekdaysIgnited) ? weekdaysIgnited[i] : weekdaysIgnited)
              const dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][parseDate(dl.iso).getDay()]
              const isLeftSide = i < 3
              const yNudge = isLeftSide ? 0 : 10
              const LEFT_X  = [1001,  998, 1001]
              const RIGHT_X = [1597, 1572, 1542]
              const labelX = isLeftSide ? LEFT_X[i] : RIGHT_X[i - 3]
              const labelY = dl.cy + yNudge
              const fill = weekdaysCooled ? '#d4181f' : '#b0a898'
              const baseAlpha = weekdaysCooled ? 1 : 0.7
              const textOpacity = isIgnited ? 0 : baseAlpha
              return (
                <g key={`dow-${dl.iso}`}>
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={isLeftSide ? 'start' : 'end'}
                    dominantBaseline="central"
                    transform={`rotate(-11 ${labelX} ${labelY})`}
                    className={isIgnited ? 'inscription-hot' : ''}
                    style={{
                      fontFamily: '"Noto Serif JP", Georgia, serif',
                      fontSize: '45px',
                      fontWeight: 700,
                      fill,
                      letterSpacing: '0.2em',
                      opacity: textOpacity,
                      transition: 'opacity 0ms',
                    }}
                  >
                    {dow}
                  </text>
                  {isIgnited && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={isLeftSide ? 'start' : 'end'}
                      dominantBaseline="central"
                      transform={`rotate(-11 ${labelX} ${labelY})`}
                      className="weekday-flame-engulf"
                      style={{
                        ...engulfVars(i + 7),
                        fontFamily: '"Noto Serif JP", Georgia, serif',
                        fontSize: '45px',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                      }}
                    >
                      {dow}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
          {/* Weekday particle flames AFTER — clipped to weekday letter silhouettes via the
              weekday-window mask. Each weekday's particle subset mounts when its own
              weekdaysIgnited[wi] flips, producing the 60ms cascade. */}
          {anyWeekdayIgnited && (
            <g mask="url(#weekday-window)" style={{ pointerEvents: 'none' }}>
              {(() => {
                const hash01 = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
                const PARTS_PER_WEEKDAY = 45
                return dayLabels.flatMap((dl, wi) => {
                  if (!weekdaysIgnited[wi]) return []
                  const isLeftSide = wi < 3
                  // Per-day labelX drifts across the blade's rotated right edge, so use the
                  // SAME table the mask uses, then shift to the text center (±65 since text
                  // is ~130 viewBox units wide). Without this, right-side particles all cluster
                  // near x=1599 and miss the leftward-drifting 5th/6th labels.
                  const LEFT_X  = [1001,  998, 1001]
                  const RIGHT_X = [1597, 1572, 1542]
                  const labelX  = isLeftSide ? LEFT_X[wi] : RIGHT_X[wi - 3]
                  const baseX   = isLeftSide ? (labelX + 65) : (labelX - 65)
                  return Array.from({ length: PARTS_PER_WEEKDAY }).map((_, i) => {
                    const k = i + wi * 23
                    const rX    = hash01(k * 1)
                    const rDly  = hash01(k * 3 + 11)
                    const rDur  = hash01(k * 5 + 17)
                    const rSize = hash01(k * 11 + 23)
                    const rPeak = hash01(k * 13 + 29)
                    const xOff  = (rX - 0.5) * 220
                    const delay = rDly * 300
                    const dur   = 130 + rDur * 150
                    const size  = 18 + rSize * 24
                    const peakA = 0.55 + rPeak * 0.45
                    return (
                      <circle key={`wd${wi}-${i}`} cx={baseX + xOff} cy={dl.cy + 120} r={size} fill="#ff5000" opacity={0}>
                        <animateTransform attributeName="transform" type="translate"
                          values={`0 0; 0 -${180 + rSize * 40}`}
                          dur={`${dur.toFixed(0)}ms`} begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                        <animate attributeName="opacity"
                          values={`0; ${peakA.toFixed(2)}; 0`}
                          keyTimes="0; 0.2; 1"
                          dur={`${dur.toFixed(0)}ms`} begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                      </circle>
                    )
                  })
                })
              })()}
            </g>
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

function BeginButton({ onFire, onHover, onTriggerFlicker, flickering = false, label = 'ETCH CYCLE' }) {
  const [pressed, setPressed] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Etch the cycle"
      onMouseDown={() => { setPressed(true); onTriggerFlicker && onTriggerFlicker() }}
      onMouseUp={() => { setPressed(false); onFire() }}
      onMouseLeave={() => setPressed(false)}
      onMouseEnter={onHover}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTriggerFlicker && onTriggerFlicker(); onFire() } }}
      className="fixed bottom-5 right-5 z-40 no-print cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-paper focus-visible:outline-offset-2"
      style={{ width: 128, height: 128 }}
    >
      <svg
        viewBox="23.2 388.8 208.8 307.9"
        width={128}
        height={128}
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
                const xOff   = (rX - 0.5) * 190 + (rXj - 0.5) * 60       // ±125 spread — fills the 128px button silhouette
                const delay  = (rDly * 540) % 600                        // ~600ms window
                const dur    = 130 + rDur * 150                          // 130-280ms (matches inscriptions)
                const rise   = 200 + rRise * 100                         // 200-300 viewBox units
                const size   = 20 + rSize * 34                           // r 20-54 — bigger min for a fuller fire
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
  // Per-day flame gate — activates all at t=200 for a unified flame phase, then deactivates
  // one-by-one on the same 140ms stagger as hotDays / zoom-burst so flame-off, hot-on, and
  // zoom-fire all happen at the same moment per inscription.
  const [glowingDays, setGlowingDays] = useState(() => Array(6).fill(false))
  // Glow state machine: 'off' → 'peak' (zoom-burst one-shot) → 'off' again.
  const [glowIntensity, setGlowIntensity] = useState('off')
  // Per-day ignition flags — each inscription flips hot at the same moment its zoom-burst
  // fires, so the color/glow transition cascades in sync with the zoom wave. Never flips back.
  const [hotDays, setHotDays] = useState(() => Array(6).fill(false))
  // Dissipation — slow cascade, decoupled from zoom/hot. Flips true 800+i*450ms after press
  // so each inscription holds its full hot state well after the faster zoom cascade completes.
  const [cooledDays, setCooledDays] = useState(() => Array(6).fill(false))
  // Button flicker state lifted to SummaryPage so the watermark can co-ignite with the button.
  const [flickering, setFlickering] = useState(false)
  // Weekday side labels ignite all-at-once right after the last inscription's cascade slot.
  const [weekdaysIgnited, setWeekdaysIgnited] = useState(() => Array(6).fill(false))
  const [weekdaysCooled, setWeekdaysCooled] = useState(false)
  // Watermark per-line ignition: [ETCH, CYCLE]. Joins the weekday cascade as steps 6 and 7.
  const [watermarkIgnited, setWatermarkIgnited] = useState(() => [false, false])
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
    // Flame activation: REVERSE order, 100ms stagger. Day 5 (tip) ignites first at t=200,
    // cascading up to day 0 (handle) at t=700. Faster than the main 220ms deactivation cascade.
    for (let step = 0; step < 6; step++) {
      const dayIdx = 5 - step
      setTimeout(() => {
        setGlowingDays(prev => { const next = [...prev]; next[dayIdx] = true; return next })
      }, 200 + step * 60)
    }
    setTimeout(() => setGlowIntensity('peak'),      1500)   // zoom-burst cascade begins (340ms per glyph, 220ms stagger)
    // Fast cascade: flame off + hot on + zoom fires at t=1500 + i*220.
    for (let i = 0; i < 6; i++) {
      const at = 1500 + i * 220
      setTimeout(() => {
        setGlowingDays(prev => { const next = [...prev]; next[i] = false; return next })
        setHotDays(prev => { const next = [...prev]; next[i] = true; return next })
      }, at)
    }
    // Slow dissipation: each inscription cools 800+i*450ms after press — day 0 holds 800ms
    // of hot, later days hold longer since hot fires staggered but cool fires further staggered.
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        setCooledDays(prev => { const next = [...prev]; next[i] = true; return next })
      }, 1500 + 1600 + i * 350)
    }
    setTimeout(() => setGlowIntensity('off'),       2940)   // last zoom cascade slot ends (1500 + 220*5 + 340)
    setTimeout(() => setStampVisible(true),         2940)   // stamp flies in after zoom cascade finishes
    // Middle-out symmetric cascade, 70ms stagger, starts t=700.
    // Step 0 (t=700): innermost pair (days 3+4) + ETCH + CYCLE ignite together.
    // Step 1 (t=770): days 2+5. Step 2 (t=840): outermost pair (days 1+6).
    // Day-4-focal cascade: ETCH/CYCLE anchored to day 4 (wi=3), radiating out symmetrically
    // through days 3+5, 2+6, then day 1 alone (no day 7 partner).
    // Step 0 — day 4 alone + ETCH + CYCLE
    setTimeout(() => {
      setWeekdaysIgnited(prev => { const next = [...prev]; next[3] = true; return next })
    }, 800)
    setTimeout(() => {
      setWatermarkIgnited(() => [true, true])
    }, 800)
    // Step 1 — days 3 + 5
    setTimeout(() => {
      setWeekdaysIgnited(prev => { const next = [...prev]; next[2] = true; next[4] = true; return next })
    }, 975)
    // Step 2 — days 2 + 6
    setTimeout(() => {
      setWeekdaysIgnited(prev => { const next = [...prev]; next[1] = true; next[5] = true; return next })
    }, 1125)
    // Step 3 — day 1 alone
    setTimeout(() => {
      setWeekdaysIgnited(prev => { const next = [...prev]; next[0] = true; return next })
    }, 1275)

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
    }, 3605)   // stamp lands (665ms after fly-in)

    setTimeout(() => play('stamp'),       3690)
    setTimeout(() => setFireActive(true), 5900)
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
        <CycleBlade days={days} dailyPlan={dailyPlan} glowingDays={glowingDays} glowIntensity={glowIntensity} hotDays={hotDays} cooledDays={cooledDays} weekdaysIgnited={weekdaysIgnited} weekdaysCooled={weekdaysCooled} />
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

      {/* Watermark — full yakiire: SVG mask carved into ETCH CYCLE letters, particle flames
          rise through the silhouettes while the button is flickering, hot-glow drop-shadow on
          the visible text. Idle: dim red; press: bright orange with particle fire. */}
      <style>{`
        @keyframes watermark-hot-hold {
          from, to {
            filter: drop-shadow(0 0 3px #fff4c9)
                    drop-shadow(0 0 7px #ffa840)
                    drop-shadow(0 0 14px rgba(255, 120, 0, 0.8))
                    drop-shadow(0 0 22px rgba(255, 80, 0, 0.4));
          }
        }
        .watermark-hot { animation: watermark-hot-hold 100ms forwards; }
        @keyframes weekday-flame-engulf {
          /* 0% — moment of ignition, small tight glow */
          0% {
            opacity: var(--engulf-opacity-start, 0.55);
            filter:
              drop-shadow(0 0 var(--engulf-glow-0, 1.5px) #ff5000)
              drop-shadow(0 0 var(--engulf-glow-0b, 3px) rgba(255, 80, 0, 0.45))
              blur(var(--engulf-blur-0, 0.2px));
          }
          /* 12% — CATCH peak (briefly brighter, still tight) */
          12% {
            opacity: 1;
            filter:
              drop-shadow(0 0 var(--engulf-glow-catch, 5px) #ff5000)
              drop-shadow(0 0 var(--engulf-glow-catch-b, 12px) rgba(255, 80, 0, 0.75))
              blur(var(--engulf-blur-catch, 0.7px));
          }
          /* 32% — wisp begins spreading */
          32% {
            opacity: 0.72;
            filter:
              drop-shadow(0 0 var(--engulf-glow-1, 7px) #ff5000)
              drop-shadow(0 0 var(--engulf-glow-1b, 18px) rgba(255, 80, 0, 0.55))
              drop-shadow(0 0 var(--engulf-glow-1c, 26px) rgba(255, 80, 0, 0.35))
              blur(var(--engulf-blur-1, 1.6px));
          }
          /* 62% — mid wisp, glow diffusing, opacity dropping */
          62% {
            opacity: 0.38;
            filter:
              drop-shadow(0 0 var(--engulf-glow-2, 10px) rgba(255, 80, 0, 0.75))
              drop-shadow(0 0 var(--engulf-glow-2b, 22px) rgba(255, 80, 0, 0.3))
              blur(var(--engulf-blur-2, 3.2px));
          }
          /* 100% — wisped away */
          100% {
            opacity: 0;
            filter:
              drop-shadow(0 0 var(--engulf-glow-3, 14px) rgba(255, 80, 0, 0.1))
              blur(var(--engulf-blur-3, 5.5px));
          }
        }
        .weekday-flame-engulf {
          animation: weekday-flame-engulf var(--engulf-dur, 260ms) cubic-bezier(0.1, 0.6, 0.35, 1) forwards;
          fill: #ff5000;
          pointer-events: none;
        }
      `}</style>
      <svg
        aria-hidden="true"
        className="fixed z-[20] pointer-events-none select-none"
        width={130} height={78}
        viewBox="0 0 130 78"
        style={{
          bottom: 'calc(20px + 128px + 40px)',
          right: '20px',
          transform: 'rotate(8deg)',
          transformOrigin: 'right bottom',
          overflow: 'visible',
        }}
      >
        <defs>
          <mask id="watermark-window" maskUnits="userSpaceOnUse" x="0" y="0" width="130" height="78">
            <rect x="0" y="0" width="130" height="78" fill="black"/>
            <text textAnchor="start"
              fontFamily='"Shippori Mincho", "Noto Serif JP", "Yu Mincho", Georgia, serif'
              fontSize="18" fontWeight="600" letterSpacing="6" fill="white">
              <tspan x="8" y="30">ETCH</tspan>
              <tspan x="8" y="62">CYCLE</tspan>
            </text>
          </mask>
        </defs>
        {/* Base text — each line rendered as its own <text> so ETCH and CYCLE can be gated
            independently against watermarkIgnited[0] and [1]. Hidden once its own line ignites
            (inscription cheat) so the particle flames are the only visible content. */}
        <text textAnchor="start"
          fontFamily='"Shippori Mincho", "Noto Serif JP", "Yu Mincho", Georgia, serif'
          fontSize="18" fontWeight="600" letterSpacing="6"
          x="8" y="30"
          className={watermarkIgnited[0] ? 'watermark-hot' : ''}
          fill='rgba(212, 24, 31, 0.65)'
          opacity={watermarkIgnited[0] ? 0 : 1}
          style={{ transition: 'opacity 0ms' }}>
          ETCH
        </text>
        {watermarkIgnited[0] && (
          <g transform="rotate(-8 38 24)">
            <text
              x="8" y="30"
              textAnchor="start"
              fontFamily='"Shippori Mincho", "Noto Serif JP", "Yu Mincho", Georgia, serif'
              fontSize="18" fontWeight="600" letterSpacing="6"
              className="weekday-flame-engulf"
              style={engulfVars(91)}>
              ETCH
            </text>
          </g>
        )}
        <text textAnchor="start"
          fontFamily='"Shippori Mincho", "Noto Serif JP", "Yu Mincho", Georgia, serif'
          fontSize="18" fontWeight="600" letterSpacing="6"
          x="8" y="62"
          className={watermarkIgnited[1] ? 'watermark-hot' : ''}
          fill='rgba(212, 24, 31, 0.65)'
          opacity={watermarkIgnited[1] ? 0 : 1}
          style={{ transition: 'opacity 0ms' }}>
          CYCLE
        </text>
        {watermarkIgnited[1] && (
          <g transform="rotate(-8 46 56)">
            <text
              x="8" y="62"
              textAnchor="start"
              fontFamily='"Shippori Mincho", "Noto Serif JP", "Yu Mincho", Georgia, serif'
              fontSize="18" fontWeight="600" letterSpacing="6"
              className="weekday-flame-engulf"
              style={engulfVars(92)}>
              CYCLE
            </text>
          </g>
        )}
        {/* Particles AFTER — clipped to letter silhouettes via the mask, paint on top of the
            void-black base so the flames show through the letter shapes. */}
        {watermarkIgnited.some(Boolean) && (
          <g mask="url(#watermark-window)">
            {(() => {
              const hash01 = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
              const PARTS = 95
              return Array.from({ length: PARTS }).map((_, i) => {
                const rX    = hash01(i * 1)
                const rDly  = hash01(i * 3 + 11)
                const rDur  = hash01(i * 5 + 17)
                const rSize = hash01(i * 11 + 23)
                const rPeak = hash01(i * 13 + 29)
                // Partition by index parity: odd → ETCH band (top), even → CYCLE band (bottom).
                // CYCLE band is deliberately thinned out (~half the particles dropped) and tuned
                // toward smaller/slower/dimmer sparks so visible dark gaps show between flashes
                // rather than a continuous orange wash.
                const isEtchBand = (i % 2 === 1)
                if (!isEtchBand && (i % 4 === 2)) return null
                if (isEtchBand && !watermarkIgnited[0]) return null
                if (!isEtchBand && !watermarkIgnited[1]) return null
                const startY = isEtchBand ? 46 : 74
                const rise   = isEtchBand ? (18 + rSize * 14) : (12 + rSize * 10)
                const xBase  = 8
                const xSpan  = isEtchBand ? 70 : 85
                const xOff   = xBase + rX * xSpan
                const delay  = rDly * 300
                const dur    = 130 + rDur * 150
                const size   = isEtchBand ? (9 + rSize * 11) : (5 + rSize * 6)
                const peakA  = isEtchBand ? (0.55 + rPeak * 0.45) : (0.40 + rPeak * 0.40)
                const peakKeyTime = isEtchBand ? 0.25 : 0.15
                return (
                  <circle key={`wm${i}`} cx={xOff} cy={startY} r={size} fill="#ff5000" opacity={0}>
                    <animateTransform attributeName="transform" type="translate"
                      values={`0 0; 0 -${rise.toFixed(0)}`}
                      dur={`${dur.toFixed(0)}ms`} begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                    <animate attributeName="opacity"
                      values={`0; ${peakA.toFixed(2)}; 0`}
                      keyTimes={`0; ${peakKeyTime}; 1`}
                      dur={`${dur.toFixed(0)}ms`} begin={`${delay.toFixed(0)}ms`} repeatCount="indefinite"/>
                  </circle>
                )
              })
            })()}
          </g>
        )}
      </svg>

      {/* ── ETCH CYCLE (fixed bottom-right CTA) ── */}
      <BeginButton
        onFire={handleBegin}
        onHover={() => play('button-hover')}
        onTriggerFlicker={() => setFlickering(true)}
        flickering={flickering}
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
          <div className="fixed inset-0 z-[9997] flex items-center justify-center pointer-events-none"
               style={{ transform: 'translate(-40px, -250px)' }}>
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

            <div style={{ transform: 'scale(0.6)' }}>
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
          </div>
        )
      })()}

      <FireFadeIn duration={900} />
      <FireTransition active={fireActive} onComplete={() => router.push('/fitness/load')} />
    </main>
  )
}
