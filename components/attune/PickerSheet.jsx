'use client'
/**
 * PickerSheet — exercise picker bottom sheet.
 *
 * mode='attune'        → multi-day target SELECTION lives on the calendar
 *                        (lifted to the page). The picker just shows the
 *                        count and confirms one exercise across all
 *                        currently-selected days. No internal day chips.
 * mode='in-the-moment' → single-day mode (log-set screen, Worker C)
 * mode='replace'       → single-day mode (chip Replace action, Step 5)
 *
 * Picker is muscle-locked to the source day's first muscle.
 *
 * Search uses iOS PWA keyboard recipe: form with action='.' + method,
 * input with inputMode + enterKeyHint. (The global IOSPWAKeyboardFix
 * already handles the el.click() leg of the recipe.)
 *
 * Backdrop is bottom-anchored only — the calendar above the sheet stays
 * interactive so the user can tap days to add/remove targets while the
 * picker stays open.
 *
 * Props:
 *   sourceDayId      - the source (first) selected day; used for muscle lock
 *   selectedDayIds   - all currently-selected days (attune mode); the
 *                      sheet shows the count + applies confirm to all
 *   mode             - 'attune' | 'in-the-moment' | 'replace'
 *   cycle            - { id, days, dailyPlan } — needed for muscle lookup
 *   onConfirm        - (exerciseId) => void
 *   onClose          - () => void
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { searchExercises } from '../../lib/exerciseLibrary'

// Single-character equipment indicator. Lowercase 'b' for bodyweight to
// differentiate from barbell. Falls back to '·' when an exercise has no
// equipment field (pre-data-pipeline fixture data).
const EQUIPMENT_GLYPH = {
  barbell:    'B',
  dumbbell:   'D',
  cable:      'C',
  machine:    'M',
  bodyweight: 'b',
  kettlebell: 'K',
  band:       'R',
  other:      '·',
}

export default function PickerSheet({
  sourceDayId,
  selectedDayIds,
  mode = 'attune',
  cycle,
  onConfirm,
  onClose,
}) {
  const [query, setQuery] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)
  const inputRef = useRef(null)

  const sourceMuscle = useMemo(() => {
    if (!cycle || !sourceDayId) return null
    const m = cycle?.dailyPlan?.[sourceDayId] || []
    return m[0] || null
  }, [cycle, sourceDayId])

  const exercises = useMemo(
    () => searchExercises(sourceMuscle, query),
    [sourceMuscle, query],
  )

  // sr-only input scrollIntoView fallback (per memory:
  // feedback_ios_pwa_sr_only_input_scroll). Not strictly needed since
  // the input is on-screen, but harmless and keeps the recipe complete.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handler = () => {
      try { el.scrollIntoView({ block: 'end' }) } catch (_) {}
    }
    el.addEventListener('focus', handler)
    return () => el.removeEventListener('focus', handler)
  }, [])

  const targetCount = mode === 'attune'
    ? (selectedDayIds?.length || (sourceDayId ? 1 : 0))
    : (sourceDayId ? 1 : 0)
  const canConfirm = selectedExerciseId != null && targetCount > 0

  const commit = () => {
    if (!canConfirm) return
    if (onConfirm) onConfirm(selectedExerciseId)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Pick exercise"
      style={{
        // Bottom-anchored sheet ONLY — no full-bleed backdrop. Calendar
        // above stays tappable so the user can add/remove target days
        // while the picker is open.
        position: 'fixed', left: 0, right: 0, bottom: 0,
        zIndex: 100,
        display: 'flex', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: 430,
          maxHeight: '70vh',
          background: '#1a1a1e',
          borderTop: '2px solid #d4181f',
          padding: '1rem 1rem calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          fontFamily: 'var(--font-display, Anton, sans-serif)',
          color: '#f1eee5',
          display: 'flex', flexDirection: 'column', gap: '0.6rem',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header — mode + muscle lock + selected-day count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.3em', color: '#d4181f' }}>
            PICKER · {mode.toUpperCase()}
            {sourceMuscle && <> · LOCKED: {sourceMuscle.toUpperCase()}</>}
            {mode === 'attune' && targetCount > 0 && (
              <> · {targetCount} DAY{targetCount === 1 ? '' : 'S'}</>
            )}
          </div>
          <button
            type="button"
            onClick={() => onClose && onClose()}
            style={{
              background: 'none', border: 'none', color: '#888',
              fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer',
              padding: '0 0.25rem', letterSpacing: '0.1em',
            }}
            aria-label="close picker"
          >
            ✕
          </button>
        </div>

        {mode === 'attune' && (
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.25em', color: '#888',
            textTransform: 'uppercase',
          }}>
            tap days on the calendar to add or remove targets
          </div>
        )}

        {/* Search input — iOS PWA keyboard recipe */}
        <form
          action="."
          method="get"
          onSubmit={(e) => e.preventDefault()}
          style={{ margin: 0 }}
        >
          <input
            ref={inputRef}
            type="search"
            name="gtl-attune-picker-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={sourceMuscle ? `search ${sourceMuscle} exercises…` : 'search exercises…'}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            style={{
              width: '100%',
              background: '#0f0f12',
              border: '1px solid #2a2a30',
              borderLeft: '2px solid #d4181f',
              padding: '0.55rem 0.7rem',
              color: '#f1eee5',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              outline: 'none',
            }}
          />
        </form>

        {/* Exercise list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 4,
            minHeight: 80, maxHeight: '38vh',
          }}
        >
          {!sourceMuscle && (
            <div style={{ color: '#888', fontSize: '0.75rem', padding: '0.5rem' }}>
              No muscle assigned to this day. Assign one on the schedule first.
            </div>
          )}
          {sourceMuscle && exercises.length === 0 && (
            <div style={{ color: '#888', fontSize: '0.75rem', padding: '0.5rem' }}>
              No matches.
            </div>
          )}
          {exercises.map((ex) => {
            const selected = ex.id === selectedExerciseId
            const glyph = EQUIPMENT_GLYPH[ex.equipment] || '·'
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExerciseId(ex.id)}
                style={{
                  textAlign: 'left',
                  background: selected ? '#d4181f' : '#0f0f12',
                  color: selected ? '#fff' : '#d8d2c2',
                  border: `1px solid ${selected ? '#ff2a36' : '#2a2a30'}`,
                  borderLeft: `2px solid ${selected ? '#fff' : '#d4181f'}`,
                  padding: '0.55rem 0.7rem',
                  fontFamily: 'inherit',
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ex.label}
                </span>
                <span
                  aria-hidden="true"
                  title={ex.equipment || ''}
                  style={{
                    flexShrink: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    lineHeight: 1,
                    padding: '3px 6px',
                    background: selected ? 'rgba(0,0,0,0.35)' : '#2a2a30',
                    color: selected ? '#fff' : '#9b9486',
                    clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                  }}
                >
                  {glyph}
                </span>
              </button>
            )
          })}
        </div>

        {/* Confirm */}
        <button
          type="button"
          disabled={!canConfirm}
          onClick={commit}
          style={{
            background: canConfirm ? '#d4181f' : '#2a2a30',
            color: canConfirm ? '#fff' : '#666',
            border: `1px solid ${canConfirm ? '#ff2a36' : '#2a2a30'}`,
            padding: '0.7rem 1rem',
            fontFamily: 'inherit',
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: canConfirm ? 'pointer' : 'default',
            clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
          }}
        >
          {canConfirm
            ? `Attune ${targetCount > 1 ? `× ${targetCount} days` : ''}`
            : 'Pick an exercise'}
        </button>
      </div>
    </div>
  )
}
