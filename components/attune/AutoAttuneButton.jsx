'use client'
/**
 * AutoAttuneButton — prominent action shown while every workout day in
 * the cycle has zero attuned chips. After any chip exists anywhere,
 * dismisses (returns null).
 *
 * Calls autoAttuneAll() with the cycle's day→muscle map and a canonical
 * exercise selector (lib/exerciseLibrary.canonicalExerciseFor).
 */
import { autoAttuneAll, useAttunement } from '../../lib/attunement'
import { canonicalExerciseFor } from '../../lib/exerciseLibrary'

export default function AutoAttuneButton({ cycle }) {
  const state = useAttunement(cycle?.id)
  if (!cycle || !Array.isArray(cycle.days)) return null

  // Visible only while every workout day has zero chips.
  const hasAnyChip = Object.values(state || {}).some(d => (d?.chips?.length || 0) > 0)
  if (hasAnyChip) return null

  const workoutDays = cycle.days.filter(iso => (cycle.dailyPlan?.[iso] || []).length > 0)
  if (workoutDays.length === 0) return null

  const handleClick = () => {
    const dayMuscleMap = {}
    for (const iso of workoutDays) {
      const muscles = cycle.dailyPlan?.[iso] || []
      dayMuscleMap[iso] = muscles[0]
    }
    autoAttuneAll(cycle.id, dayMuscleMap, canonicalExerciseFor)
  }

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
      display: 'flex', justifyContent: 'center', zIndex: 20,
      pointerEvents: 'none',
    }}>
      <button
        type="button"
        onClick={handleClick}
        style={{
          pointerEvents: 'auto',
          background: '#d4181f',
          border: '2px solid #ff2a36',
          color: '#fff',
          padding: '0.85rem 1.5rem',
          fontFamily: '"FOT-Matisse Pro EB", Anton, Impact, sans-serif',
          fontSize: '0.9rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontWeight: 900,
          cursor: 'pointer',
          clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
          boxShadow: '4px 4px 0 #070708',
        }}
      >
        Auto-attune all
      </button>
    </div>
  )
}
