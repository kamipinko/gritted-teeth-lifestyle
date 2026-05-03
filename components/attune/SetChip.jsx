'use client'
/**
 * SetChip — single attuned-exercise chip rendered inside a DayCell.
 *
 * Long-press (600ms) opens ChipActionMenu with Copy / Delete / Replace.
 * Tap (no long-press) is currently a no-op — the chip is informational
 * inside the calendar; tap-to-edit lives at the day level (DayCell tap
 * opens the picker).
 *
 * useDraggable wiring lands in Step 6 (Unit 5).
 */
import { useEffect, useRef, useState } from 'react'
import ChipActionMenu from './ChipActionMenu'
import { duplicateChip, deleteChip } from '../../lib/attunement'

const LONG_PRESS_MS = 550

export default function SetChip({ chip, cycleId, dayId, compact = false, onReplace }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const timerRef = useRef(null)
  const longPressedRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])

  if (!chip) return null
  const label = chip.exerciseId || 'untitled'
  const display = compact && label.length > 14 ? label.slice(0, 13) + '…' : label

  // Long-press is opt-in: only wires up when cycleId+dayId are present
  // (i.e., the chip is rendered inside an editable cell). Read-only
  // contexts pass neither and fall back to a static render.
  const interactive = !!(cycleId && dayId)

  const handlePointerDown = (e) => {
    if (!interactive) return
    e.stopPropagation()
    longPressedRef.current = false
    clearTimer()
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      setMenuOpen(true)
    }, LONG_PRESS_MS)
  }
  const handlePointerEnd = (e) => {
    if (!interactive) return
    e.stopPropagation()
    clearTimer()
  }
  const handleClick = (e) => {
    // Swallow click after a long-press so a parent DayCell tap doesn't
    // also fire and open the picker.
    if (longPressedRef.current) {
      e.stopPropagation()
      e.preventDefault()
      longPressedRef.current = false
    }
  }

  return (
    <>
      <div
        data-chip-id={chip.id}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleClick}
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
          cursor: interactive ? 'pointer' : 'default',
          touchAction: 'manipulation',
        }}
        title={label}
      >
        {display}
      </div>
      {menuOpen && interactive && (
        <ChipActionMenu
          chipLabel={label}
          onCopy={() => duplicateChip(cycleId, dayId, chip.id)}
          onDelete={() => deleteChip(cycleId, dayId, chip.id)}
          onReplace={() => { if (onReplace) onReplace({ dayId, chipId: chip.id, fromLabel: label }) }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
