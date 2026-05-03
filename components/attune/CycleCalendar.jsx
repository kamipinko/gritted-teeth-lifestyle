'use client'
/**
 * CycleCalendar — pan-zoom surface that renders all carved days of the
 * active cycle as a CSS grid of DayCells.
 *
 * Pan/zoom: react-zoom-pan-pinch's <TransformWrapper>. Fit-to-viewport
 * on mount via initialScale calculation against the carved-day count.
 * panning.disabled is wired to attunementStore.isChipDragging in Step 6.
 *
 * Day cell tier is computed per-render from the wrapper's current scale
 * and passed down to DayCell so each cell branches its rendering.
 */
import { useEffect, useRef, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import DayCell from './DayCell'
import { useChipsForDay, isDayLocked, useIsChipDragging } from '../../lib/attunement'
import { zoomTier } from '../../lib/zoomTier'

/**
 * cycle: { id, days: ISO[], dailyPlan: Record<iso, muscleId[]> }
 * Day is a "rest day" iff dailyPlan[iso] is missing or empty.
 */
export default function CycleCalendar({ cycle, onDayTap, onChipReplace, selectedDayIds = [], sourceDayId = null }) {
  const [scale, setScale] = useState(0.6)
  const isChipDragging = useIsChipDragging()
  const wrapperRef = useRef(null)

  if (!cycle || !Array.isArray(cycle.days) || cycle.days.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#666', fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
        letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.75rem',
      }}>
        no carved days · attune nothing
      </div>
    )
  }

  const tier = zoomTier(scale)
  const nDays = cycle.days.length
  // 7-column grid mirrors the existing CARVE / branded calendar idiom.
  // Cell width is derived from viewport at min zoom so all carved days
  // fit at far tier without horizontal scroll.
  const cols = Math.min(7, nDays)

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <TransformWrapper
        ref={wrapperRef}
        initialScale={0.6}
        minScale={0.4}
        maxScale={2.4}
        centerOnInit
        centerZoomedOut
        limitToBounds
        wheel={{ step: 0.15 }}
        pinch={{ step: 5 }}
        panning={{ disabled: isChipDragging, velocityDisabled: false }}
        onTransformed={(_, state) => setScale(state.scale)}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ padding: '1.5rem 1rem' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, minmax(108px, 1fr))`,
              gap: 6,
              minWidth: cols * 108,
            }}
          >
            {cycle.days.map((iso) => (
              <CalendarCell
                key={iso}
                cycleId={cycle.id}
                dayId={iso}
                muscles={cycle.dailyPlan?.[iso] || []}
                tier={tier}
                onTap={onDayTap}
                onChipReplace={onChipReplace}
                isSelected={selectedDayIds.includes(iso)}
                isSource={iso === sourceDayId}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Tier indicator — atmospheric debug stripe at top-right while
          the user pinches across thresholds. Removable once visual
          tiering feels intentional. */}
      <div style={{
        position: 'absolute', top: 8, right: 12, zIndex: 10,
        fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
        fontSize: '0.6rem', letterSpacing: '0.2em', color: '#5a5a5e',
        textTransform: 'uppercase', pointerEvents: 'none',
      }}>
        {tier} · {scale.toFixed(2)}×
      </div>
    </div>
  )
}

function CalendarCell({ cycleId, dayId, muscles, tier, onTap, onChipReplace, isSelected, isSource }) {
  const chips = useChipsForDay(cycleId, dayId)
  const locked = isDayLocked(cycleId, dayId)
  const isRest = !muscles || muscles.length === 0
  return (
    <DayCell
      cycleId={cycleId}
      dayId={dayId}
      muscles={muscles}
      chips={chips}
      isLocked={locked}
      isRestDay={isRest}
      isSelected={isSelected}
      isSource={isSource}
      tier={tier}
      onTap={onTap}
      onChipReplace={onChipReplace}
    />
  )
}
