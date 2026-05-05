'use client'
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
  const movedRef = useRef(false)
  const longPressedRef = useRef(false)

  const interactive = !!(cycleId && dayId)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: chip?.id || 'chip-noop',
    data: { fromDayId: dayId, exerciseId: chip?.exerciseId },
    disabled: !interactive || menuOpen,
  })

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }
  useEffect(() => () => clearTimer(), [])
  useEffect(() => { if (isDragging) clearTimer() }, [isDragging])

  if (!chip) return null
  const label = chip.exerciseId || 'untitled'
  const display = compact && label.length > 14 ? label.slice(0, 13) + '…' : label

  const handlePointerDown = (e) => {
    if (!interactive) return
    longPressedRef.current = false
    movedRef.current = false
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
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) { movedRef.current = true; clearTimer() }
  }
  const handlePointerEnd = () => { clearTimer(); startRef.current = null }
  const handleClick = (e) => {
    e.stopPropagation()
    if (longPressedRef.current) {
      e.preventDefault()
      longPressedRef.current = false
      return
    }
    if (movedRef.current || isDragging) return
    if (!interactive) return
    setMenuOpen(true)
  }

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? '4px 4px 0 #070708' : 'none',
      }
    : {}

  const stop = (e) => { e.stopPropagation(); e.preventDefault() }

  const copyHandler = (e) => { stop(e); duplicateChip(cycleId, dayId, chip.id) }
  const deleteHandler = (e) => { stop(e); deleteChip(cycleId, dayId, chip.id) }
  const replaceHandler = (e) => { stop(e); if (onReplace) onReplace({ dayId, chipId: chip.id, fromLabel: label }) }

  const iconBtnStyle = {
    background: 'transparent',
    border: 'none',
    color: '#a8a39a',
    fontSize: '0.6rem',
    lineHeight: 1,
    padding: '1px 2px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

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
          padding: '3px 3px 3px 5px',
          display: 'flex', alignItems: 'center', gap: 2,
          fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
          fontSize: '0.6rem',
          letterSpacing: '0.04em',
          color: '#d8d2c2',
          textTransform: 'uppercase',
          cursor: interactive ? 'pointer' : 'default',
          touchAction: interactive ? 'none' : 'manipulation',
          minWidth: 0,
          alignItems: 'flex-start',
          ...dragStyle,
        }}
        title={label}
      >
        <span style={{
          flex: 1, minWidth: 0,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: 1.2,
        }}>
          {label}
        </span>
        {interactive && (
          <span style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
            <button type="button" aria-label="copy" title="Copy" onPointerDown={stop} onClick={copyHandler} style={iconBtnStyle}>⎘</button>
            <button type="button" aria-label="replace" title="Replace" onPointerDown={stop} onClick={replaceHandler} style={iconBtnStyle}>⇄</button>
            <button type="button" aria-label="delete" title="Delete" onPointerDown={stop} onClick={deleteHandler} style={iconBtnStyle}>✕</button>
          </span>
        )}
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
