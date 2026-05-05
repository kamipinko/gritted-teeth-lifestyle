'use client'
import { useRef, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import DayCell from './DayCell'
import { useChipsForDay, isDayLocked, useIsChipDragging } from '../../lib/attunement'

const DOW_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/**
 * Build the full Sun→Sat week-aligned calendar span that contains every
 * carved day in the cycle. For a cycle that spans 9 days from a Wed to
 * a Thu, the grid covers from the prior Sun through the trailing Sat
 * (so 14 cells / 2 rows). Carved days fill their actual weekday slot;
 * non-carved days render as placeholder slots in the same grid row.
 */
function buildGridSpan(cycle) {
  if (!cycle || !Array.isArray(cycle.days) || cycle.days.length === 0) return []
  const isoToLocalDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const dates = cycle.days.map(isoToLocalDate).filter(d => !isNaN(d))
  if (dates.length === 0) return []
  dates.sort((a, b) => a - b)
  const first = dates[0]
  const last = dates[dates.length - 1]
  // Snap span to nearest Sun (back) and Sat (forward).
  const start = new Date(first); start.setDate(start.getDate() - first.getDay())
  const end = new Date(last); end.setDate(end.getDate() + (6 - last.getDay()))
  const carvedSet = new Set(cycle.days)
  const cells = []
  const cur = new Date(start)
  while (cur <= end) {
    const y = cur.getFullYear(), m = cur.getMonth() + 1, d = cur.getDate()
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      iso,
      dow: cur.getDay(),
      dayNum: d,
      isCarved: carvedSet.has(iso),
    })
    cur.setDate(cur.getDate() + 1)
  }
  return cells
}

export default function CycleCalendar({ cycle, onDayTap, onChipReplace, selectedDayIds = [], sourceDayId = null }) {
  const isChipDragging = useIsChipDragging()
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(1)

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

  const cells = buildGridSpan(cycle)
  const rowCount = Math.max(1, Math.ceil(cells.length / 7))

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky weekday header — never scaled by the pan-zoom surface */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          padding: '0.5rem 1rem 0.4rem 1rem',
          fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          color: '#a8a39a',
          textAlign: 'center',
          textTransform: 'uppercase',
          flexShrink: 0,
          background: 'transparent',
          zIndex: 5,
        }}
      >
        {DOW_HEADERS.map(d => <span key={d}>{d}</span>)}
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TransformWrapper
          ref={wrapperRef}
          initialScale={1}
          minScale={0.6}
          maxScale={2.4}
          centerOnInit
          centerZoomedOut
          limitToBounds
          wheel={{ step: 0.15 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
          panning={{ disabled: isChipDragging, velocityDisabled: false }}
          onTransformed={(_, state) => setScale(state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ padding: '0.25rem 1rem 1rem 1rem' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(48px, 1fr))',
                gridAutoRows: 'minmax(140px, auto)',
                gap: 6,
                width: 'calc(100vw - 2rem)',
              }}
            >
              {cells.map(cell => cell.isCarved ? (
                <CarvedCell
                  key={cell.iso}
                  cycleId={cycle.id}
                  dayId={cell.iso}
                  dow={cell.dow}
                  dayNum={cell.dayNum}
                  muscles={cycle.dailyPlan?.[cell.iso] || []}
                  onTap={onDayTap}
                  onChipReplace={onChipReplace}
                  isSelected={selectedDayIds.includes(cell.iso)}
                  isSource={cell.iso === sourceDayId}
                />
              ) : (
                <PlaceholderCell key={cell.iso} dow={cell.dow} dayNum={cell.dayNum} />
              ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      <div style={{
        position: 'absolute', top: 8, right: 12, zIndex: 10,
        fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
        fontSize: '0.55rem', letterSpacing: '0.18em', color: '#5a5a5e',
        textTransform: 'uppercase', pointerEvents: 'none',
      }}>
        {scale.toFixed(2)}×
      </div>
    </div>
  )
}

function CarvedCell({ cycleId, dayId, dow, dayNum, muscles, onTap, onChipReplace, isSelected, isSource }) {
  const chips = useChipsForDay(cycleId, dayId)
  const locked = isDayLocked(cycleId, dayId)
  const isRest = !muscles || muscles.length === 0
  return (
    <DayCell
      cycleId={cycleId}
      dayId={dayId}
      dow={dow}
      dayNum={dayNum}
      muscles={muscles}
      chips={chips}
      isLocked={locked}
      isRestDay={isRest}
      isSelected={isSelected}
      isSource={isSource}
      onTap={onTap}
      onChipReplace={onChipReplace}
    />
  )
}

function PlaceholderCell({ dow, dayNum }) {
  return (
    <div
      aria-hidden="true"
      style={{
        background: '#070708',
        border: '1px dashed #1f1f24',
        borderRadius: 4,
        opacity: 0.42,
        minHeight: 140,
        padding: '0.4rem 0.45rem',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
        fontSize: '0.55rem',
        letterSpacing: '0.16em',
        color: '#3a3a40',
      }}
    >
      <div>{dayNum}</div>
    </div>
  )
}
