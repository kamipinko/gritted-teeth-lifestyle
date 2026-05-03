/**
 * Exercise library — read-only catalog of curated exercises keyed by
 * primary muscle.
 *
 * Source-of-truth dataset for the Attune feature picker. Mirrors the
 * inline EXERCISES constant in app/fitness/active/page.js so chip
 * exerciseId values stay compatible with the existing log-set screen.
 *
 * Surface (per the Attune plan, Unit 3):
 *   exercisesByMuscle(muscleId) → Exercise[]
 *   Exercise = { id, label, muscle }
 *
 * Curated content remains out-of-scope for this feature — the Attune
 * page only consumes; expansion / tagging lives in a separate effort.
 */

const EXERCISES_BY_MUSCLE = {
  chest:      ['BARBELL BENCH PRESS', 'INCLINE DUMBBELL PRESS', 'DUMBBELL FLY', 'CABLE CROSSOVER'],
  back:       ['DEADLIFT', 'PULL-UP', 'BARBELL ROW', 'LAT PULLDOWN'],
  shoulders:  ['OVERHEAD PRESS', 'LATERAL RAISE', 'REAR DELT FLY', 'ARNOLD PRESS'],
  biceps:     ['BARBELL CURL', 'DUMBBELL CURL', 'HAMMER CURL', 'PREACHER CURL'],
  triceps:    ['CLOSE-GRIP BENCH PRESS', 'SKULL CRUSHER', 'TRICEP PUSHDOWN', 'OVERHEAD EXTENSION'],
  forearms:   ['WRIST CURL', 'REVERSE WRIST CURL', 'HAMMER CURL', 'FARMER CARRY'],
  abs:        ['CRUNCH', 'PLANK', 'HANGING LEG RAISE', 'AB WHEEL ROLLOUT'],
  glutes:     ['HIP THRUST', 'SQUAT', 'ROMANIAN DEADLIFT', 'BULGARIAN SPLIT SQUAT'],
  quads:      ['SQUAT', 'LEG PRESS', 'LEG EXTENSION', 'HACK SQUAT'],
  hamstrings: ['ROMANIAN DEADLIFT', 'LEG CURL', 'NORDIC CURL', 'GLUTE-HAM RAISE'],
  calves:     ['STANDING CALF RAISE', 'SEATED CALF RAISE', 'DONKEY CALF RAISE', 'LEG PRESS CALF RAISE'],
}

function toExercise(label, muscle) {
  // exerciseId is the label string. Stable, human-readable, and matches
  // the existing log-set screen's per-muscle ex- storage shape.
  return { id: label, label, muscle }
}

export function exercisesByMuscle(muscleId) {
  const labels = EXERCISES_BY_MUSCLE[muscleId] || []
  return labels.map((label) => toExercise(label, muscleId))
}

/**
 * Auto-attune canonical exercise per muscle — first entry from each
 * muscle's list. Deterministic; used by autoAttuneAll until / unless
 * the express path's auto-pick is shared.
 */
export function canonicalExerciseFor(muscleId) {
  const labels = EXERCISES_BY_MUSCLE[muscleId] || []
  return labels[0] || null
}

/**
 * Fuzzy search across all exercises. Used by the picker's search input.
 * Filters first by muscle, then by case-insensitive substring match
 * against the label.
 */
export function searchExercises(muscleId, query) {
  const all = exercisesByMuscle(muscleId)
  if (!query) return all
  const q = query.trim().toLowerCase()
  if (!q) return all
  return all.filter((ex) => ex.label.toLowerCase().includes(q))
}
