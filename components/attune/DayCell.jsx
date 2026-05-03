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
 * Drag-drop droppability + sortable chip lists land in Step 6 (Unit 5).
 */
import SetChip from './SetChip'

// Canonical 11-muscle kanji map. Sourced from
// app/fitness/new/branded/page.js (kept inline here to avoid coupling
// the Attune feature to the branded page's module).
const MUSCLE_KANJI = {
  chest: '胸', shoulders: '肩', back: '背', forearms: '腕',
  quads: '腿', hamstrings: '裏', calves: '脛',
  biceps: '二', triceps: '三', glutes: '尻', abs: '腹',
}

function muscleKanji(muscleId) {
  return MUSCLE_KANJI[muscleId] || '·'
}

export default function DayCell({
  dayId,
  muscles = [],
  chips = [],
  isLocked = false,
  isRestDay = false,
  tier = 'far',
  onTap,
}) {
  const handleClick = () => {
    if (isLocked) return
    if (onTap) onTap(dayId)
  }

  const kanjiStack = muscles.length > 0
    ? muscles.map(muscleKanji).join('')
    : (isRestDay ? '休' : '·')

  const dimmedStyle = isLocked ? { opacity: 0.42 } : {}

  return (
    <button
      type="button"
      data-attune-day={dayId}
      onClick={handleClick}
      style={{
        position: 'relative',
        background: isRestDay ? '#0f0f12' : '#1a1a1e',
        border: `1px solid ${isLocked ? '#3a3a42' : '#2a2a30'}`,
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
      {/* Kanji header — always visible, scales with tier */}
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

      {/* Chip count badge (far) */}
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

      {/* Mid tier: first 2 chips truncated + +N more */}
      {tier === 'mid' && chips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: isLocked ? 'none' : 'auto' }}>
          {chips.slice(0, 2).map(chip => (
            <SetChip key={chip.id} chip={chip} compact />
          ))}
          {chips.length > 2 && (
            <div style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '0.08em' }}>
              +{chips.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* Near tier: full chip stack */}
      {tier === 'near' && chips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: isLocked ? 'none' : 'auto' }}>
          {chips.map(chip => (
            <SetChip key={chip.id} chip={chip} />
          ))}
        </div>
      )}

      {/* Empty state — chip-less workout day */}
      {chips.length === 0 && tier !== 'far' && !isRestDay && (
        <div style={{ fontSize: '0.6rem', color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          empty
        </div>
      )}

      {/* Lock badge */}
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
