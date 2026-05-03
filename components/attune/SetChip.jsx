'use client'
/**
 * SetChip — single attuned-exercise chip rendered inside a DayCell.
 *
 * Stub-level rendering — exercise label is sourced via lib/exerciseLibrary
 * lookup in Step 4 (Unit 3). For now displays the exerciseId verbatim
 * (truncated at compact tier) so the calendar shows real chip identity
 * during early integration.
 *
 * useDraggable wiring lands in Step 6 (Unit 5).
 * Long-press → ChipActionMenu wiring lands in Step 5 (Unit 4).
 */
export default function SetChip({ chip, compact = false }) {
  if (!chip) return null
  const label = chip.exerciseId || 'untitled'
  const display = compact && label.length > 14 ? label.slice(0, 13) + '…' : label
  return (
    <div
      data-chip-id={chip.id}
      style={{
        background: '#0f0f12',
        border: '1px solid #2a2a30',
        borderLeft: '2px solid #d4181f',
        padding: compact ? '3px 6px' : '5px 8px',
        fontFamily: '"FOT-Matisse Pro EB", monospace',
        fontSize: compact ? '0.65rem' : '0.75rem',
        letterSpacing: '0.06em',
        color: '#d8d2c2',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={label}
    >
      {display}
    </div>
  )
}
