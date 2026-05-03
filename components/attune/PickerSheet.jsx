'use client'
/**
 * PickerSheet — exercise picker bottom sheet.
 *
 * mode='attune'        → multi-day target selector visible (Attune page)
 * mode='in-the-moment' → single-day mode (log-set screen, Worker C)
 * mode='replace'       → single-day mode (chip Replace action, Step 5)
 *
 * Picker is muscle-locked to the source day's first muscle. Multi-day
 * target selector (attune mode only) lists every other carved day whose
 * dailyPlan muscle matches the source — toggleable, source pinned.
 *
 * Search uses iOS PWA keyboard recipe: form with action='.' + method,
 * input with inputMode + enterKeyHint. (The global IOSPWAKeyboardFix
 * already handles the el.click() leg of the recipe.)
 *
 * Props:
 *   sourceDayId  - dayId the picker was opened from
 *   mode         - 'attune' | 'in-the-moment' | 'replace'
 *   cycle        - { id, days, dailyPlan } — required for attune mode's
 *                  multi-day target selector; ignored otherwise
 *   onConfirm    - (selectedDayIds, exerciseId) => void
 *   onClose      - () => void
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { searchExercises } from '../../lib/exerciseLibrary'

export default function PickerSheet({ sourceDayId, mode = 'attune', cycle, onConfirm, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)
  const [selectedDayIds, setSelectedDayIds] = useState(() => sourceDayId ? [sourceDayId] : [])
  const inputRef = useRef(null)

  // Source day's primary muscle — first in dailyPlan[sourceDayId].
  const sourceMuscle = useMemo(() => {
    if (!cycle || !sourceDayId) return null
    const m = cycle?.dailyPlan?.[sourceDayId] || []
    return m[0] || null
  }, [cycle, sourceDayId])

  // Matching-muscle peer days (attune mode only).
  const peerDays = useMemo(() => {
    if (mode !== 'attune' || !cycle || !sourceMuscle) return []
    return (cycle.days || []).filter((iso) => {
      if (iso === sourceDayId) return false
      const m = cycle.dailyPlan?.[iso] || []
      return m.includes(sourceMuscle)
    })
  }, [cycle, sourceDayId, sourceMuscle, mode])

  const exercises = useMemo(
    () => searchExercises(sourceMuscle, query),
    [sourceMuscle, query],
  )

  // Body scroll lock for the modal lifetime.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

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

  const toggleTargetDay = (dayId) => {
    if (dayId === sourceDayId) return  // source is pinned
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    )
  }

  const canConfirm = selectedExerciseId != null && selectedDayIds.length > 0

  const commit = () => {
    if (!canConfirm) return
    if (onConfirm) onConfirm(selectedDayIds, selectedExerciseId)
  }

  const showMultiDay = mode === 'attune' && peerDays.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick exercise"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(7,7,8,0.78)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={() => onClose && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          maxHeight: '88vh',
          background: '#1a1a1e',
          borderTop: '2px solid #d4181f',
          padding: '1rem 1rem calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          fontFamily: '"FOT-Matisse Pro EB", Anton, Impact, sans-serif',
          color: '#f1eee5',
          display: 'flex', flexDirection: 'column', gap: '0.6rem',
        }}
      >
        {/* Header — mode + source-day + muscle lock */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.3em', color: '#d4181f' }}>
            PICKER · {mode.toUpperCase()}
            {sourceMuscle && <> · LOCKED: {sourceMuscle.toUpperCase()}</>}
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

        {/* Multi-day target selector (attune mode only) */}
        {showMultiDay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '0.55rem', letterSpacing: '0.25em', color: '#888', textTransform: 'uppercase' }}>
              ALSO ATTUNE TO
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <DayChip iso={sourceDayId} pinned active />
              {peerDays.map((iso) => (
                <DayChip
                  key={iso}
                  iso={iso}
                  active={selectedDayIds.includes(iso)}
                  onToggle={() => toggleTargetDay(iso)}
                />
              ))}
            </div>
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
                }}
              >
                {ex.label}
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
            ? `Attune ${selectedDayIds.length > 1 ? `× ${selectedDayIds.length} days` : ''}`
            : 'Pick an exercise'}
        </button>
      </div>
    </div>
  )
}

function DayChip({ iso, pinned = false, active = false, onToggle }) {
  // Render the iso as MM/DD for compactness.
  const label = iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}` : '—'
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pinned}
      style={{
        background: active ? '#d4181f' : '#0f0f12',
        color: active ? '#fff' : '#888',
        border: `1px solid ${active ? '#ff2a36' : '#2a2a30'}`,
        padding: '0.3rem 0.5rem',
        fontFamily: 'inherit',
        fontSize: '0.65rem',
        letterSpacing: '0.1em',
        cursor: pinned ? 'default' : 'pointer',
        opacity: pinned ? 0.85 : 1,
      }}
      aria-pressed={active}
      aria-label={pinned ? `source day ${label} (pinned)` : `toggle ${label}`}
    >
      {label}{pinned && ' ★'}
    </button>
  )
}
