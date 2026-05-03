'use client'
/**
 * DayCell — single carved-day cell on the Attune calendar.
 *
 * Tiered rendering by zoomTier:
 *   far  — muscle kanji (centered) + chip-count badge in corner
 *   mid  — kanji header + first 2 chips truncated + "+N more"
 *   near — kanji header + full sortable chip stack
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

export default function DayCell({
  cycleId,
  dayId,
  muscles = [],
  chips = [],
  isLocked = false,
  isRestDay = false,
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

  const dimmedStyle = isLocked ? { opacity: 0.42 } : {}
  const overOutline = isOver
    ? (isLocked
        ? '2px solid #ff2a36'
        : '2px solid #f1eee5')
    : null

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-attune-day={dayId}
      onClick={handleClick}
      style={{
        position: 'relative',
        background: isRestDay ? '#0f0f12' : '#1a1a1e',
        border: overOutline || `1px solid ${isLocked ? '#3a3a42' : '#2a2a30'}`,
        borderRadius: 4,
        padding: tier === 'far' ? '0.5rem' : '0.6rem 0.55rem',
        textAlign: 'left',
        color: '#f1eee5',
        fontFamily: 'inherit',
        cursor: isLocked ? 'default' : 'pointer',
        minHeight: tier === 'far' ? 84 : tier === 'mid' ? 132 : 200,
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        ...dimmedStyle,
      }}
    >
      <div
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: tier === 'far' ? '1.8rem' : '1.4rem',
          color: isRestDay ? '#5a5a5e' : '#d4181f',
          lineHeight: 1, textAlign: tier === 'far' ? 'center' : 'left',
        }}
        aria-hidden="true"
      >
        {kanjiStack}
      </div>

      {tier === 'far' && chips.length > 0 && (
        <div
          style={{
            position: 'absolute', top: 6, right: 8,
            fontFamily: '"FOT-Matisse Pro EB", monospace',
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
