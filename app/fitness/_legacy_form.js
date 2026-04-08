'use client'
import { useState } from 'react'
import Link from 'next/link'

const GOALS = ['Build Muscle', 'Lose Fat', 'Improve Endurance', 'General Fitness']
const DAYS = [2, 3, 4, 5, 6]
const WEEKS = [4, 6, 8, 12]

export default function FitnessPage() {
  const [form, setForm] = useState({ goal: '', daysPerWeek: 3, weeks: 8, equipment: '' })
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generatePlan() {
    setLoading(true)
    try {
      const res = await fetch('/api/fitness/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setPlan(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <Link href="/" className="text-brand-muted text-sm hover:text-white mb-8 block">← Back</Link>

      <h1 className="text-3xl font-black mb-1">Fitness Planner</h1>
      <p className="text-brand-muted text-sm mb-10">Tell us your schedule — we'll build your cycle</p>

      {/* Form */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 mb-6 space-y-6">
        {/* Goal */}
        <div>
          <label className="text-sm font-semibold block mb-3">Your Goal</label>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(g => (
              <button
                key={g}
                onClick={() => setForm(f => ({ ...f, goal: g }))}
                className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                  form.goal === g
                    ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                    : 'border-brand-border text-brand-muted hover:border-brand-gold'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Days per week */}
        <div>
          <label className="text-sm font-semibold block mb-3">Days per Week</label>
          <div className="flex gap-3">
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setForm(f => ({ ...f, daysPerWeek: d }))}
                className={`w-12 h-12 rounded-xl text-sm font-bold border transition-all ${
                  form.daysPerWeek === d
                    ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                    : 'border-brand-border text-brand-muted hover:border-brand-gold'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Program length */}
        <div>
          <label className="text-sm font-semibold block mb-3">Program Length</label>
          <div className="flex gap-3">
            {WEEKS.map(w => (
              <button
                key={w}
                onClick={() => setForm(f => ({ ...f, weeks: w }))}
                className={`px-4 h-12 rounded-xl text-sm font-bold border transition-all ${
                  form.weeks === w
                    ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                    : 'border-brand-border text-brand-muted hover:border-brand-gold'
                }`}
              >
                {w}w
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="text-sm font-semibold block mb-2">Available Equipment</label>
          <input
            type="text"
            placeholder="e.g. dumbbells, barbell, pull-up bar, gym access..."
            value={form.equipment}
            onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
            className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-gold"
          />
        </div>

        <button
          onClick={generatePlan}
          disabled={!form.goal || loading}
          className="w-full bg-brand-gold hover:bg-yellow-500 text-black font-black py-3 rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? 'Building your plan...' : 'Generate My Cycle'}
        </button>
      </div>

      {/* Plan Output */}
      {plan && (
        <div className="space-y-4">
          <h2 className="text-xl font-black">Your {form.weeks}-Week Cycle</h2>
          {plan.weeks && plan.weeks.map((week, wi) => (
            <div key={wi} className="bg-brand-card border border-brand-border rounded-2xl p-6">
              <h3 className="font-bold text-brand-gold mb-4">Week {wi + 1}</h3>
              <div className="space-y-4">
                {week.days && week.days.map((day, di) => (
                  <div key={di}>
                    <p className="text-sm font-semibold mb-2">{day.name}</p>
                    <div className="space-y-2">
                      {day.exercises && day.exercises.map((ex, ei) => (
                        <div key={ei} className="flex items-center justify-between bg-brand-dark rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{ex.name}</p>
                            <p className="text-xs text-brand-muted">{ex.sets} sets × {ex.reps}</p>
                          </div>
                          {ex.youtubeId && (
                            <a
                              href={`https://www.youtube.com/watch?v=${ex.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors"
                            >
                              ▶ Watch
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
