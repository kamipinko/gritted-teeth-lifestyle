'use client'
/**
 * PickerSheet — exercise picker bottom sheet.
 *
 * Worker-A first-commit STUB. Other workers (B, C) import this for the
 * in-the-moment / replace flows; the public component shape below is
 * stable from this commit forward. Full implementation lands in Unit 3
 * (multi-day target selector + iOS PWA keyboard recipe + library query).
 *
 * Props:
 *   sourceDayId  - dayId the picker was opened from
 *   mode         - 'attune' | 'in-the-moment' | 'replace'
 *                  attune       → multi-day target selector visible
 *                  in-the-moment → single-day mode (no target selector)
 *                  replace      → single-day mode (no target selector)
 *   onConfirm    - (selectedDayIds, exerciseId) => void
 *   onClose      - () => void
 */
import { useEffect } from 'react'

export default function PickerSheet({ sourceDayId, mode, onConfirm, onClose }) {
  // Stub render — solid placeholder so other workers can mount the
  // component and verify their integration without it being null.
  // Tap anywhere on the backdrop dismisses; future Confirm wiring will
  // call onConfirm with the selected day list + exerciseId.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick exercise"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(7,7,8,0.72)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={() => onClose && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          background: '#1a1a1e',
          borderTop: '2px solid #d4181f',
          padding: '1.5rem 1rem 2rem',
          fontFamily: '"FOT-Matisse Pro EB", Anton, Impact, sans-serif',
          color: '#f1eee5',
        }}
      >
        <div style={{ fontSize: '0.7rem', letterSpacing: '0.3em', color: '#d4181f', marginBottom: '0.5rem' }}>
          PICKER · {mode?.toUpperCase() || 'ATTUNE'}
        </div>
        <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Source day: {sourceDayId || '—'}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>
          (stub — full picker lands in Unit 3)
        </div>
      </div>
    </div>
  )
}
