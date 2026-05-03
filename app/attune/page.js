'use client'
/**
 * /attune — Attune Movements page.
 *
 * Renders the active cycle as a pinch-zoomable calendar of carved
 * day cells. Tap a day → picker. Long-press a chip → ChipActionMenu
 * (Copy / Delete / Replace). Drag a chip → cross-day move (Step 6 /
 * Unit 5). Auto-attune button + exit guard + onboarding popup land
 * in Step 7 (Unit 6 page-side).
 *
 * Reads carved days + muscle assignments from the existing cycle
 * store (lib/storage.js → pk()-keyed localStorage). Attunement chips
 * read/write through lib/attunement.js.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { pk } from '../../lib/storage'
import RetreatButton from '../../components/RetreatButton'
import CycleCalendar from '../../components/attune/CycleCalendar'
import PickerSheet from '../../components/attune/PickerSheet'
import ReplaceCascadeModal from '../../components/attune/ReplaceCascadeModal'
import { addChip, replaceExercise } from '../../lib/attunement'

function loadActiveCycle() {
  if (typeof window === 'undefined') return null
  try {
    const cycleId = localStorage.getItem(pk('active-cycle-id'))
    if (!cycleId) return null
    const raw = localStorage.getItem(pk('cycles'))
    const cycles = raw ? JSON.parse(raw) : []
    return cycles.find((c) => c.id === cycleId) || null
  } catch (_) {
    return null
  }
}

export default function AttunePage() {
  const router = useRouter()
  const [cycle, setCycle] = useState(null)
  // Picker for the attune flow (tap a day → pick + multi-day target).
  const [pickerDayId, setPickerDayId] = useState(null)
  // Replace flow: chip long-press → Replace → opens picker in
  // mode='replace' against the same source day. After exercise pick,
  // cascadeContext is set and ReplaceCascadeModal opens.
  // Shape: { dayId, chipId, fromLabel, newExerciseId? }
  const [replaceContext, setReplaceContext] = useState(null)

  useEffect(() => {
    setCycle(loadActiveCycle())
  }, [])

  const handleDayTap = (dayId) => {
    if (!cycle) return
    if (replaceContext) return  // chip-replace flow owns the picker right now
    const muscles = cycle.dailyPlan?.[dayId] || []
    if (muscles.length === 0) return
    setPickerDayId(dayId)
  }

  const handleAttuneConfirm = (selectedDayIds, exerciseId) => {
    if (!cycle || !exerciseId) { setPickerDayId(null); return }
    for (const dayId of (selectedDayIds || [pickerDayId])) {
      addChip(cycle.id, dayId, exerciseId)
    }
    setPickerDayId(null)
  }

  // Chip → Replace
  const handleChipReplace = ({ dayId, chipId, fromLabel }) => {
    setReplaceContext({ dayId, chipId, fromLabel })
  }

  // Picker (in replace mode) confirms a new exercise → cascade modal opens.
  const handleReplacePick = (_dayIds, newExerciseId) => {
    if (!replaceContext || !newExerciseId) { setReplaceContext(null); return }
    setReplaceContext((prev) => prev ? { ...prev, newExerciseId } : null)
  }

  const handleCascadePick = (scope) => {
    if (!cycle || !replaceContext?.newExerciseId) { setReplaceContext(null); return }
    replaceExercise(cycle.id, scope, {
      dayId: replaceContext.dayId,
      chipId: replaceContext.chipId,
      newExerciseId: replaceContext.newExerciseId,
    })
    setReplaceContext(null)
  }

  // Decide which picker (if any) is active and what its props look like.
  const replacePickerOpen = !!(replaceContext && !replaceContext.newExerciseId)
  const cascadeOpen       = !!(replaceContext && replaceContext.newExerciseId)

  return (
    <main
      className="relative bg-gtl-void"
      style={{
        minHeight: '100%', height: '100dvh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, rgba(80,10,10,0.10) 0%, transparent 55%, rgba(20,20,20,0.32) 100%)' }} />

      <div className="relative z-10 flex flex-col" style={{ flex: 1, minHeight: 0 }}>
        <nav
          className="relative shrink-0 flex items-center gap-4 pl-0 pr-8 pb-3"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <RetreatButton href="/fitness" />
          <div className="w-px self-stretch bg-gtl-edge" style={{ transform: 'skewX(-12deg)' }} />
          <div className="flex flex-col gap-0.5">
            <div className="font-mono text-[10px] tracking-[0.5em] uppercase text-gtl-red/60">
              ATTUNE MOVEMENTS
            </div>
            <h1
              className="font-display text-gtl-chalk leading-none"
              style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)' }}
            >
              {cycle?.name || 'NO CYCLE'}
            </h1>
          </div>
        </nav>

        <div className="relative z-10 mx-8 mb-2 h-[2px] shrink-0"
             style={{ background: '#d4181f', transform: 'skewX(-6deg)', transformOrigin: 'left center' }} />

        <CycleCalendar
          cycle={cycle}
          onDayTap={handleDayTap}
          onChipReplace={handleChipReplace}
        />
      </div>

      {/* Attune-flow picker */}
      {pickerDayId && !replaceContext && (
        <PickerSheet
          sourceDayId={pickerDayId}
          mode="attune"
          cycle={cycle}
          onConfirm={handleAttuneConfirm}
          onClose={() => setPickerDayId(null)}
        />
      )}

      {/* Replace-flow picker (single-day, no multi-day selector) */}
      {replacePickerOpen && (
        <PickerSheet
          sourceDayId={replaceContext.dayId}
          mode="replace"
          cycle={cycle}
          onConfirm={handleReplacePick}
          onClose={() => setReplaceContext(null)}
        />
      )}

      {/* Cascade scope modal (after replace picker confirms) */}
      {cascadeOpen && (
        <ReplaceCascadeModal
          fromLabel={replaceContext.fromLabel}
          toLabel={replaceContext.newExerciseId}
          onPick={handleCascadePick}
          onClose={() => setReplaceContext(null)}
        />
      )}
    </main>
  )
}
