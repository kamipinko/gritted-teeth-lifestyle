'use client'
/**
 * SetChip — single attuned-exercise chip rendered inside a DayCell.
 *
 * Behaviors:
 *   - useDraggable from @dnd-kit/core; activation distance 8px so a
 *     pure tap never accidentally starts a drag.
 *   - Long-press (550ms, stationary) opens ChipActionMenu with
 *     Copy / Delete / Replace. If the user moves >5px before 550ms,
 *     the long-press timer cancels and dnd-kit takes the drag instead.
 *
 * Drag activation, drop targets, and consent prompts (rest-day,
 * cross-muscle) are wired at the page / DndContext level.
 */
import { useEffect, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import ChipActionMenu from './ChipActionMenu'
import { duplicateChip, deleteChip } from '../../lib/attunement'

const LONG_PRESS_MS = 550
const MOVE_CANCEL_PX = 5

export default function SetChip({ chip, cycleId, dayId, compact = false, onReplace }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const timerRef = useRef(null)
  const startRef = useRef(null)
  const longPressedRef = useRef(false)

  const interactive = !!(cycleId && dayId)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: chip?.id || 'chip-noop',
    data: { fromDayId: dayId, exerciseId: chip?.exerciseId },
    disabled: !interactive || menuOpen,
  })

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])
  useEffect(() => { if (isDragging) clearTimer() }, [isDragging])

  if (!chip) return null
  const label = chip.exerciseId || 'untitled'
  const display = compact && label.length > 14 ? label.slice(0, 13) + '…' : label

  const handlePointerDown = (e) => {
    if (!interactive) return
    longPressedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    clearTimer()
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      setMenuOpen(true)
    }, LONG_PRESS_MS)
  }
  const handlePointerMove = (e) => {
    if (!interactive || !startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clearTimer()
  }
  const handlePointerEnd = () => {
    clearTimer()
    startRef.current = null
  }
  const handleClick = (e) => {
    if (longPressedRef.current) {
      e.stopPropagation()
      e.preventDefault()
      longPressedRef.current = false
    }
  }

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? '4px 4px 0 #070708' : 'none',
      }
    : {}

  return (
    <>
      <div
        ref={setNodeRef}
        data-chip-id={chip.id}
        {...attributes}
        {...listeners}
        onPointerDown={(e) => { listeners?.onPointerDown?.(e); handlePointerDown(e) }}
        onPointerMove={handlePointerMove}
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
          cursor: interactive ? 'grab' : 'default',
          touchAction: interactive ? 'none' : 'manipulation',
          ...dragStyle,
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
