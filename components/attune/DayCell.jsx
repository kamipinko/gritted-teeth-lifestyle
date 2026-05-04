'use client'
/**
 * DayCell — single carved-day cell on the Attune calendar.
 *
 * Tiered rendering by zoomTier:
 *   far  — DOW + day number header, kanji centered, English label below,
 *          chip-count badge bottom-left
 *   mid  — same header + kanji + label + first 2 chips truncated + "+N more"
 *   near — same header + kanji + label + full sortable chip stack
 *
 * Locked (completed) days render dimmed with a lock badge and disable
 * chip operations via pointer-events: none on the chip stack.
 *
 * useDroppable wraps the cell so chips dragged from another day land
 * here. Drop logic (rest-day prompt, cross-muscle prompt, locked
 * rejection) lives at the page level.
 */
import { useDroppable } from '@dnd-kit/core'
import SetChip from './SetChip'

const MUSCLE_KANJI = {
  chest: '胸', shoulders: '肩', back: '背', forearms: '腕',
  quads: '腿', hamstrings: '裏', calves: '脛',
  biceps: '二', triceps: '三', glutes: '尻', abs: '腹',
}

function muscleKanji(muscleId) {
  return MUSCLE_KANJI[muscleId] || '·'
}

const MUSCLE_LABEL = {
  chest: 'CHEST', shoulders: 'SHOULDERS', back: 'BACK', forearms: 'FOREARMS',
  quads: 'QUADS', hamstrings: 'HAMSTRINGS', calves: 'CALVES',
  biceps: 'BICEPS', triceps: 'TRICEPS', glutes: 'GLUTES', abs: 'ABS',
}

function muscleLabel(muscleId) {
  return MUSCLE_LABEL[muscleId] || ''
}

export default function DayCell({
  cycleId,
  dayId,
  muscles = [],
  chips = [],
  isLocked = false,
  isRestDay = false,
  isSelected = false,
  isSource = false,
  tier = 'far',
  onTap,
  onChipReplace,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dayId}`,
    data: { dayId, muscles, isLocked, isRestDay },
  })

  const handleClick = () => {
    if (isLocked) return
    if (onTap) onTap(dayId)
  }

  const kanjiStack = muscles.length > 0
    ? muscles.map(muscleKanji).join('')
    : (isRestDay ? '休' : '·')

  // dayId is an ISO date string like "2026-05-04". Build a local-tz Date so
  // getDay() / getDate() match the user's calendar day, not UTC.
  const _d = (() => {
    if (!dayId || typeof dayId !== 'string') return null
    const [y, m, d] = dayId.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  })()
  const dowLabel = _d ? ['SUN','MON','TUE','WED','THU','FRI','SAT'][_d.getDay()] : ''
  const dayNum = _d ? _d.getDate() : ''
  const labels = muscles.map(muscleLabel).filter(Boolean)
  const labelText = labels.length > 0 ? labels.join(' · ') : (isRestDay ? 'REST' : '')

  const dimmedStyle = isLocked ? { opacity: 0.42 } : {}
  // Border priority: drag-over > selected (red ring) > default
  let border = `1px solid ${isLocked ? '#3a3a42' : '#2a2a30'}`
  if (isSelected) border = '2px solid #d4181f'
  if (isOver)      border = isLocked ? '2px solid #ff2a36' : '2px solid #f1eee5'

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-attune-day={dayId}
      data-attune-selected={isSelected ? '1' : '0'}
      data-attune-source={isSource ? '1' : '0'}
      onClick={handleClick}
      style={{
        position: 'relative',
        background: isRestDay ? '#0f0f12' : '#1a1a1e',
        border,
        borderRadius: 4,
        padding: tier === 'far' ? '0.5rem' : '0.6rem 0.55rem',
        textAlign: 'left',
        color: '#f1eee5',
        fontFamily: 'inherit',
        cursor: isLocked ? 'default' : 'pointer',
        minHeight: tier === 'far' ? 100 : tier === 'mid' ? 132 : 200,
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        boxShadow: isSelected ? '0 0 0 1px rgba(212,24,31,0.55)' : 'none',
        ...dimmedStyle,
      }}
    >
      {/* Header row: DOW left, day number right */}
      <div
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
          fontSize: '0.62rem', letterSpacing: '0.18em',
          color: isRestDay ? '#5a5a5e' : '#a8a39a',
          lineHeight: 1,
        }}
      >
        <span>
          {isSource && <span style={{ color: '#d4181f', marginRight: 4 }}>★</span>}
          {dowLabel}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display, Anton, sans-serif)',
            fontSize: tier === 'far' ? '1rem' : '0.9rem',
            letterSpacing: 0,
            color: isRestDay ? '#5a5a5e' : '#f1eee5',
          }}
        >
          {dayNum}
        </span>
      </div>

      {/* Kanji — slightly smaller at far tier than before to make room for header + label */}
      <div
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: tier === 'far' ? '1.5rem' : '1.4rem',
          color: isRestDay ? '#5a5a5e' : '#d4181f',
          lineHeight: 1,
          textAlign: tier === 'far' ? 'center' : 'left',
          marginTop: tier === 'far' ? '0.1rem' : 0,
        }}
        aria-hidden="true"
      >
        {kanjiStack}
      </div>

      {/* English label paired with kanji */}
      {labelText && (
        <div
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
            fontSize: tier === 'far' ? '0.55rem' : '0.62rem',
            letterSpacing: '0.18em',
            color: isRestDay ? '#5a5a5e' : '#a8a39a',
            textAlign: tier === 'far' ? 'center' : 'left',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {labelText}
        </div>
      )}

      {/* Chip count badge — moved from top-right to bottom-left at far tier */}
      {tier === 'far' && chips.length > 0 && (
        <div
          style={{
            position: 'absolute', bottom: 6, left: 6,
            fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
            fontSize: '0.65rem',
            color: '#f1eee5',
            background: '#d4181f',
            borderRadius: 2,
            padding: '1px 5px',
            letterSpacing: '0.05em',
          }}
        >
          {chips.length}
        </div>
      )}

      {tier === 'mid' && chips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: isLocked ? 'none' : 'auto' }}>
          {chips.slice(0, 2).map(chip => (
            <SetChip
              key={chip.id}
              chip={chip}
              cycleId={isLocked ? null : cycleId}
              dayId={isLocked ? null : dayId}
              onReplace={onChipReplace}
              compact
            />
          ))}
          {chips.length > 2 && (
            <div style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '0.08em' }}>
              +{chips.length - 2} more
            </div>
          )}
        </div>
      )}

      {tier === 'near' && chips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: isLocked ? 'none' : 'auto' }}>
          {chips.map(chip => (
            <SetChip
              key={chip.id}
              chip={chip}
              cycleId={isLocked ? null : cycleId}
              dayId={isLocked ? null : dayId}
              onReplace={onChipReplace}
            />
          ))}
        </div>
      )}

      {chips.length === 0 && tier !== 'far' && !isRestDay && (
        <div style={{ fontSize: '0.6rem', color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          empty
        </div>
      )}

      {isLocked && (
        <div
          style={{
            position: 'absolute', bottom: 4, right: 6,
            fontSize: '0.7rem', color: '#888',
          }}
          aria-label="day completed"
          title="day completed"
        >
          🔒
        </div>
      )}
    </button>
  )
}
