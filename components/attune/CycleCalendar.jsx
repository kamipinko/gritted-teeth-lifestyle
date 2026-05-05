'use client'
import { useRef, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import DayCell from './DayCell'
import { useChipsForDay, isDayLocked, useIsChipDragging } from '../../lib/attunement'

const DOW_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function isoToLocalDate(iso) {
  if (!iso || typeof iso !== 'string') return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/**
 * Bucket carved days by weekday (0=Sun .. 6=Sat). Each bucket is sorted
 * chronologically. Skipped weeks within a column collapse — no placeholders.
 */
function bucketByWeekday(cycle) {
  const buckets = [[], [], [], [], [], [], []]
  if (!cycle || !Array.isArray(cycle.days)) return buckets
  for (const iso of cycle.days) {
    const d = isoToLocalDate(iso)
    if (!d) continue
    buckets[d.getDay()].push({ iso, dayNum: d.getDate(), date: d })
  }
  for (const b of buckets) b.sort((a, c) => a.date - c.date)
  return buckets
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

  const buckets = bucketByWeekday(cycle)

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky DOW header — sits outside the TransformWrapper so it doesn't scale with zoom. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          padding: '0.5rem 0.75rem 0.4rem 0.75rem',
          fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          color: '#a8a39a',
          textAlign: 'center',
          textTransform: 'uppercase',
          flexShrink: 0,
          borderBottom: '1px solid #1f1f24',
          background: '#0a0a0c',
          zIndex: 5,
        }}
      >
        {DOW_HEADERS.map(d => <span key={d}>{d}</span>)}
      </div>

      {/* Pan-zoom surface. At scale 1 panning still works as 1-finger vertical scroll. */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TransformWrapper
          ref={wrapperRef}
          initialScale={1}
          minScale={1}
          maxScale={3}
          centerOnInit={false}
          centerZoomedOut={false}
          limitToBounds
          wheel={{ step: 0.15 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
          panning={{ disabled: isChipDragging, velocityDisabled: false }}
          onTransformed={(_, state) => setScale(state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', padding: '0.5rem 0.75rem 7rem 0.75rem' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                width: '100%',
                alignItems: 'start',
              }}
            >
              {buckets.map((bucket, dow) => (
                <div
                  key={dow}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                    minHeight: 60,
                  }}
                >
                  {bucket.map(({ iso, dayNum }) => (
                    <CarvedBlock
                      key={iso}
                      cycleId={cycle.id}
                      dayId={iso}
                      dayNum={dayNum}
                      muscles={cycle.dailyPlan?.[iso] || []}
                      onTap={onDayTap}
                      onChipReplace={onChipReplace}
                      isSelected={selectedDayIds.includes(iso)}
                      isSource={iso === sourceDayId}
                    />
                  ))}
                </div>
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

function CarvedBlock({ cycleId, dayId, dayNum, muscles, onTap, onChipReplace, isSelected, isSource }) {
  const chips = useChipsForDay(cycleId, dayId)
  const locked = isDayLocked(cycleId, dayId)
  const isRest = !muscles || muscles.length === 0
  return (
    <DayCell
      cycleId={cycleId}
      dayId={dayId}
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
