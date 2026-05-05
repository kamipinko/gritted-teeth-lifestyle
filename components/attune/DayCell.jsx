'use client'
import { useDroppable } from '@dnd-kit/core'
import SetChip from './SetChip'

const MUSCLE_KANJI = {
  chest: '胸', shoulders: '肩', back: '背', forearms: '腕',
  quads: '腿', hamstrings: '裏', calves: '脛',
  biceps: '二', triceps: '三', glutes: '尻', abs: '腹',
}
const MUSCLE_LABEL = {
  chest: 'CHEST', shoulders: 'SHOULDERS', back: 'BACK', forearms: 'FOREARMS',
  quads: 'QUADS', hamstrings: 'HAMSTRINGS', calves: 'CALVES',
  biceps: 'BICEPS', triceps: 'TRICEPS', glutes: 'GLUTES', abs: 'ABS',
}

const DOW_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function muscleKanji(id) { return MUSCLE_KANJI[id] || '·' }
function muscleLabel(id) { return MUSCLE_LABEL[id] || '' }

export default function DayCell({
  cycleId,
  dayId,
  dow,
  dayNum,
  muscles = [],
  chips = [],
  isLocked = false,
  isRestDay = false,
  isSelected = false,
  isSource = false,
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

  const kanjiStack = muscles.length > 0 ? muscles.map(muscleKanji).join('') : (isRestDay ? '休' : '·')
  const labelStack = muscles.length > 0 ? muscles.map(muscleLabel).filter(Boolean).join(' · ') : (isRestDay ? 'REST' : '')

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
        padding: '0.45rem 0.45rem 0.55rem 0.45rem',
        textAlign: 'left',
        color: '#f1eee5',
        fontFamily: 'inherit',
        cursor: isLocked ? 'default' : 'pointer',
        minHeight: 140,
        display: 'flex', flexDirection: 'column', gap: '0.25rem',
        boxShadow: isSelected ? '0 0 0 1px rgba(212,24,31,0.55)' : 'none',
        opacity: isLocked ? 0.42 : 1,
      }}
    >
      {/* Header: DOW left (with star inline if source), day number right */}
      <div
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
          fontSize: '0.55rem', letterSpacing: '0.16em', lineHeight: 1,
          color: isRestDay ? '#5a5a5e' : '#a8a39a',
        }}
      >
        <span>
          {isSource && <span style={{ color: '#d4181f', marginRight: 3 }}>★</span>}
          {DOW_SHORT[dow] || ''}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display, Anton, sans-serif)',
            fontSize: '0.95rem',
            letterSpacing: 0,
            color: isRestDay ? '#5a5a5e' : '#f1eee5',
          }}
        >
          {dayNum}
        </span>
      </div>

      {/* Kanji + English label paired */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span
          style={{
            fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
            fontSize: '1.4rem',
            color: isRestDay ? '#5a5a5e' : '#d4181f',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {kanjiStack}
        </span>
        {labelStack && (
          <span
            style={{
              fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
              fontSize: '0.5rem',
              letterSpacing: '0.16em',
              color: isRestDay ? '#5a5a5e' : '#a8a39a',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {labelStack}
          </span>
        )}
      </div>

      {/* Chip stack — ALWAYS visible (no tier gating). One chip per row. */}
      {chips.length > 0 && (
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            pointerEvents: isLocked ? 'none' : 'auto',
            marginTop: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {chips.map(chip => (
            <SetChip
              key={chip.id}
              chip={chip}
              cycleId={isLocked ? null : cycleId}
              dayId={isLocked ? null : dayId}
              onReplace={onChipReplace}
              compact
            />
          ))}
        </div>
      )}

      {chips.length === 0 && !isRestDay && !isLocked && (
        <div style={{
          fontSize: '0.55rem',
          color: '#666',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginTop: 'auto',
          paddingTop: 4,
        }}>
          tap to attune
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
