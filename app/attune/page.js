'use client'
/**
 * /attune — Attune Movements page.
 *
 * Renders the active cycle as a pinch-zoomable calendar of carved
 * day cells. Tap a day → picker. Long-press a chip → ChipActionMenu
 * (Copy / Delete / Replace). Drag a chip onto another day → move,
 * with consent prompts for rest-day or cross-muscle drops.
 *
 * Reads carved days + muscle assignments from the existing cycle
 * store (lib/storage.js → pk()-keyed localStorage). Attunement chips
 * read/write through lib/attunement.js.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { pk } from '../../lib/storage'
import RetreatButton from '../../components/RetreatButton'
import CycleCalendar from '../../components/attune/CycleCalendar'
import PickerSheet from '../../components/attune/PickerSheet'
import ReplaceCascadeModal from '../../components/attune/ReplaceCascadeModal'
import DropPromptModal from '../../components/attune/DropPromptModal'
import {
  addChip, replaceExercise, moveChip,
  convertRestDay, addMuscleToDay,
  setIsChipDragging,
} from '../../lib/attunement'

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

/**
 * Cross-store write: the schedule/CARVE source of truth is the cycle
 * record inside pk('cycles'). When a drop converts a rest day to a
 * workout day (or adds a muscle to an existing day), update the cycle
 * record AND update the in-memory cycle state so the calendar re-renders.
 */
function persistCycleMuscleAssignment(cycle, dayId, muscle) {
  if (!cycle || !dayId || !muscle) return cycle
  const nextDailyPlan = { ...(cycle.dailyPlan || {}) }
  const existing = nextDailyPlan[dayId] || []
  if (!existing.includes(muscle)) {
    nextDailyPlan[dayId] = [...existing, muscle]
  }
  const nextCycle = { ...cycle, dailyPlan: nextDailyPlan }
  try {
    const raw = localStorage.getItem(pk('cycles'))
    const cycles = raw ? JSON.parse(raw) : []
    const updated = cycles.map(c => c.id === nextCycle.id ? nextCycle : c)
    localStorage.setItem(pk('cycles'), JSON.stringify(updated))
    // Also keep the loose pk('daily-plan') mirror in sync if it's used.
    localStorage.setItem(pk('daily-plan'), JSON.stringify(nextDailyPlan))
  } catch (_) {}
  return nextCycle
}

function muscleOfExercise(exerciseId, cycle, fromDayId) {
  // Source-of-truth muscle for the chip = the source day's first muscle.
  // (Picker is muscle-locked at attune time, so this matches the chip's
  // actual classification without a library lookup.)
  return cycle?.dailyPlan?.[fromDayId]?.[0] || null
}

export default function AttunePage() {
  const router = useRouter()
  const [cycle, setCycle] = useState(null)
  const [pickerDayId, setPickerDayId] = useState(null)
  // Replace flow: { dayId, chipId, fromLabel, newExerciseId? }
  const [replaceContext, setReplaceContext] = useState(null)
  // Drop prompt: { variant: 'rest' | 'cross-muscle', muscle, fromDayId, chipId, toDayId }
  const [dropPrompt, setDropPrompt] = useState(null)

  useEffect(() => {
    setCycle(loadActiveCycle())
  }, [])

  // ── Picker (attune flow) ────────────────────────────────────────────────
  const handleDayTap = (dayId) => {
    if (!cycle) return
    if (replaceContext) return
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

  // ── Chip → Replace (Unit 4) ─────────────────────────────────────────────
  const handleChipReplace = ({ dayId, chipId, fromLabel }) => {
    setReplaceContext({ dayId, chipId, fromLabel })
  }
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

  // ── Drag-and-drop (Unit 5) ──────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragStart = () => {
    setIsChipDragging(true)
  }

  const handleDragEnd = (event) => {
    setIsChipDragging(false)
    if (!cycle) return
    const { active, over } = event
    if (!active || !over) return
    const fromDayId = active.data?.current?.fromDayId
    const exerciseId = active.data?.current?.exerciseId
    const chipId = active.id
    const toDayId = over.data?.current?.dayId
    const toIsLocked = !!over.data?.current?.isLocked
    const toMuscles = over.data?.current?.muscles || []
    const toIsRest = !!over.data?.current?.isRestDay
    if (!fromDayId || !toDayId) return
    if (fromDayId === toDayId) return  // same-cell drop is no-op
    if (toIsLocked) {
      // R: drop on locked completed day → rejected. The chip animates
      // back to source automatically because no state mutation occurred.
      return
    }
    const chipMuscle = muscleOfExercise(exerciseId, cycle, fromDayId)
    if (toIsRest) {
      setDropPrompt({
        variant: 'rest', muscle: chipMuscle,
        fromDayId, chipId, toDayId,
      })
      return
    }
    if (chipMuscle && !toMuscles.includes(chipMuscle)) {
      setDropPrompt({
        variant: 'cross-muscle', muscle: chipMuscle,
        fromDayId, chipId, toDayId,
      })
      return
    }
    // Matching-muscle drop → silent move.
    moveChip(cycle.id, fromDayId, chipId, toDayId)
  }

  const handleDragCancel = () => setIsChipDragging(false)

  const handleDropPromptConfirm = () => {
    if (!cycle || !dropPrompt) { setDropPrompt(null); return }
    const { variant, muscle, fromDayId, chipId, toDayId } = dropPrompt
    if (variant === 'rest') {
      const nextCycle = persistCycleMuscleAssignment(cycle, toDayId, muscle)
      setCycle(nextCycle)
      convertRestDay(cycle.id, toDayId, muscle)
    } else if (variant === 'cross-muscle') {
      const nextCycle = persistCycleMuscleAssignment(cycle, toDayId, muscle)
      setCycle(nextCycle)
      addMuscleToDay(cycle.id, toDayId, muscle)
    }
    moveChip(cycle.id, fromDayId, chipId, toDayId)
    setDropPrompt(null)
  }
  const handleDropPromptCancel = () => setDropPrompt(null)

  const replacePickerOpen = !!(replaceContext && !replaceContext.newExerciseId)
  const cascadeOpen       = !!(replaceContext && replaceContext.newExerciseId)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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

        {pickerDayId && !replaceContext && (
          <PickerSheet
            sourceDayId={pickerDayId}
            mode="attune"
            cycle={cycle}
            onConfirm={handleAttuneConfirm}
            onClose={() => setPickerDayId(null)}
          />
        )}

        {replacePickerOpen && (
          <PickerSheet
            sourceDayId={replaceContext.dayId}
            mode="replace"
            cycle={cycle}
            onConfirm={handleReplacePick}
            onClose={() => setReplaceContext(null)}
          />
        )}

        {cascadeOpen && (
          <ReplaceCascadeModal
            fromLabel={replaceContext.fromLabel}
            toLabel={replaceContext.newExerciseId}
            onPick={handleCascadePick}
            onClose={() => setReplaceContext(null)}
          />
        )}

        {dropPrompt && (
          <DropPromptModal
            variant={dropPrompt.variant}
            muscle={dropPrompt.muscle}
            onConfirm={handleDropPromptConfirm}
            onCancel={handleDropPromptCancel}
          />
        )}
      </main>
    </DndContext>
  )
}
