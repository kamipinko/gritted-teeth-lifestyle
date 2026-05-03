/**
 * Attunement store — chips assigned to days within an active cycle.
 *
 * Shape (per cycle):
 *   Record<dayId, DayAttunement>
 *   DayAttunement = { chips: SetChip[], completedAt?: ISOString }
 *   SetChip       = { id: string, exerciseId: string, addedAt: ISOString }
 *
 * Persistence: profile-scoped localStorage via pk(`attunement-${cycleId}`).
 *
 * Worker-A first-commit shape: types + selectors are real; mutating actions
 * are stubs that update state and persist, leaving deeper choreography
 * (atomic cascade replace, drag/drop choreography) to subsequent units.
 *
 * Other workers depend on this module's exports being stable from this
 * commit forward — selectors and the PickerSheet component shape.
 */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { pk } from './storage'

// ── Subscription store ──────────────────────────────────────────────────────

const listeners = new Set()
function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function notify() {
  for (const fn of listeners) {
    try { fn() } catch (_) {}
  }
}

// Module-level isChipDragging flag — Step 5 will wire <TransformWrapper>
// panning.disabled to read this during drag.
let _isChipDragging = false
export function getIsChipDragging() { return _isChipDragging }
export function setIsChipDragging(v) {
  if (_isChipDragging === v) return
  _isChipDragging = !!v
  notify()
}

// ── Storage I/O ─────────────────────────────────────────────────────────────

function storageKey(cycleId) {
  return pk(`attunement-${cycleId}`)
}

function readState(cycleId) {
  if (typeof window === 'undefined' || !cycleId) return {}
  try {
    const raw = localStorage.getItem(storageKey(cycleId))
    return raw ? JSON.parse(raw) : {}
  } catch (_) {
    return {}
  }
}

function writeState(cycleId, state) {
  if (typeof window === 'undefined' || !cycleId) return
  try {
    localStorage.setItem(storageKey(cycleId), JSON.stringify(state))
  } catch (_) {}
  notify()
}

// ── ID helper ───────────────────────────────────────────────────────────────

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID() } catch (_) {}
  }
  return `chip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// ── Selectors (real — other workers depend on these) ────────────────────────

export function chipsForDay(cycleId, dayId) {
  const state = readState(cycleId)
  return state[dayId]?.chips || []
}

export function isDayLocked(cycleId, dayId) {
  const state = readState(cycleId)
  return !!state[dayId]?.completedAt
}

/**
 * Count carved workout days that have zero chips.
 * Caller passes the day list (the cycle's carved days) — store doesn't
 * own the carved-days source-of-truth; the schedule/CARVE store does.
 */
export function emptyDayCount(cycleId, workoutDayIds = []) {
  const state = readState(cycleId)
  let n = 0
  for (const dayId of workoutDayIds) {
    if (!(state[dayId]?.chips?.length > 0)) n++
  }
  return n
}

// ── Actions (stubbed initially; expanded in subsequent units) ───────────────

export function addChip(cycleId, dayId, exerciseId) {
  if (!cycleId || !dayId || !exerciseId) return null
  const state = readState(cycleId)
  const day = state[dayId] || { chips: [] }
  if (day.completedAt) return null
  const chip = { id: uuid(), exerciseId, addedAt: new Date().toISOString() }
  state[dayId] = { ...day, chips: [...(day.chips || []), chip] }
  writeState(cycleId, state)
  return chip
}

export function duplicateChip(cycleId, dayId, chipId) {
  const state = readState(cycleId)
  const day = state[dayId]
  if (!day || day.completedAt) return null
  const idx = day.chips.findIndex(c => c.id === chipId)
  if (idx < 0) return null
  const source = day.chips[idx]
  const copy = { id: uuid(), exerciseId: source.exerciseId, addedAt: new Date().toISOString() }
  const nextChips = [...day.chips.slice(0, idx + 1), copy, ...day.chips.slice(idx + 1)]
  state[dayId] = { ...day, chips: nextChips }
  writeState(cycleId, state)
  return copy
}

export function deleteChip(cycleId, dayId, chipId) {
  const state = readState(cycleId)
  const day = state[dayId]
  if (!day || day.completedAt) return false
  const next = day.chips.filter(c => c.id !== chipId)
  if (next.length === day.chips.length) return false
  state[dayId] = { ...day, chips: next }
  writeState(cycleId, state)
  return true
}

/**
 * Atomic cascade replace.
 * scope = 'chip' | 'day' | 'cycle'
 *   'chip'  → only the targeted chip's exerciseId is rewritten
 *   'day'   → every chip on dayId whose exerciseId matches the source's is rewritten
 *   'cycle' → every chip across all days whose exerciseId matches is rewritten
 *
 * Single store update per call; never iterate-and-write across awaits.
 */
export function replaceExercise(cycleId, scope, { dayId, chipId, newExerciseId }) {
  const state = readState(cycleId)
  const sourceDay = state[dayId]
  const sourceChip = sourceDay?.chips?.find(c => c.id === chipId)
  if (!sourceChip || !newExerciseId) return false
  const sourceExerciseId = sourceChip.exerciseId
  const nextState = {}
  for (const [dId, day] of Object.entries(state)) {
    if (day.completedAt) { nextState[dId] = day; continue }
    if (scope === 'chip') {
      if (dId === dayId) {
        nextState[dId] = {
          ...day,
          chips: day.chips.map(c => c.id === chipId ? { ...c, exerciseId: newExerciseId } : c),
        }
      } else {
        nextState[dId] = day
      }
    } else if (scope === 'day') {
      if (dId === dayId) {
        nextState[dId] = {
          ...day,
          chips: day.chips.map(c => c.exerciseId === sourceExerciseId ? { ...c, exerciseId: newExerciseId } : c),
        }
      } else {
        nextState[dId] = day
      }
    } else if (scope === 'cycle') {
      nextState[dId] = {
        ...day,
        chips: day.chips.map(c => c.exerciseId === sourceExerciseId ? { ...c, exerciseId: newExerciseId } : c),
      }
    } else {
      nextState[dId] = day
    }
  }
  writeState(cycleId, nextState)
  return true
}

/**
 * Move a chip from one day to another. Drag-drop choreography (consent
 * prompts, isChipDragging gating) lives at the call site in Unit 5 — this
 * action is the atomic state mutation only.
 */
export function moveChip(cycleId, fromDayId, chipId, toDayId) {
  if (fromDayId === toDayId) return false
  const state = readState(cycleId)
  const fromDay = state[fromDayId]
  const toDay = state[toDayId]
  if (!fromDay || toDay?.completedAt || fromDay.completedAt) return false
  const chip = fromDay.chips.find(c => c.id === chipId)
  if (!chip) return false
  state[fromDayId] = { ...fromDay, chips: fromDay.chips.filter(c => c.id !== chipId) }
  state[toDayId] = { ...(toDay || { chips: [] }), chips: [...((toDay || {}).chips || []), chip] }
  writeState(cycleId, state)
  return true
}

/**
 * Convert a rest day to a workout day. The CARVE/schedule store owns the
 * actual day-type and muscle-assignment fields — this action is a thin
 * marker the schedule store reacts to. Implementer in Unit 5 wires the
 * cross-store call.
 */
export function convertRestDay(cycleId, dayId, _muscle) {
  const state = readState(cycleId)
  if (!state[dayId]) state[dayId] = { chips: [] }
  writeState(cycleId, state)
  return true
}

/**
 * Add a muscle to a day's training (for cross-muscle drag-drop). Same
 * cross-store contract as convertRestDay — schedule store owns the
 * muscles array; this is the attunement-side ack.
 */
export function addMuscleToDay(cycleId, dayId, _muscle) {
  const state = readState(cycleId)
  if (!state[dayId]) state[dayId] = { chips: [] }
  writeState(cycleId, state)
  return true
}

/**
 * Auto-attune one canonical exercise per muscle per workout day.
 * Caller supplies the day→muscle map and a canonical-exercise selector
 * (Unit 6 wires to the express path's auto-pick if it exists, otherwise
 * a thin deterministic mapping).
 */
export function autoAttuneAll(cycleId, dayMuscleMap, canonicalExerciseFor) {
  if (typeof canonicalExerciseFor !== 'function') return false
  const state = readState(cycleId)
  for (const [dayId, muscle] of Object.entries(dayMuscleMap || {})) {
    if (state[dayId]?.completedAt) continue
    if (state[dayId]?.chips?.length > 0) continue
    if (!muscle) continue
    const exerciseId = canonicalExerciseFor(muscle)
    if (!exerciseId) continue
    const chip = { id: uuid(), exerciseId, addedAt: new Date().toISOString() }
    state[dayId] = { ...(state[dayId] || { chips: [] }), chips: [chip] }
  }
  writeState(cycleId, state)
  return true
}

// ── React hooks ─────────────────────────────────────────────────────────────

/**
 * Subscribe to the full attunement state for a cycle. Returns the
 * Record<dayId, DayAttunement> shape.
 */
export function useAttunement(cycleId) {
  const getSnapshot = () => readState(cycleId)
  const getServerSnapshot = () => ({})
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Subscribe to a single day's chip array.
 */
export function useChipsForDay(cycleId, dayId) {
  const state = useAttunement(cycleId)
  return state[dayId]?.chips || []
}

/**
 * Subscribe to the global isChipDragging flag.
 */
export function useIsChipDragging() {
  return useSyncExternalStore(subscribe, getIsChipDragging, () => false)
}
