import { getItem, setItem } from './storage'

export function logEntry(entry) {
  const log = getAllEntries()
  log.push({ ...entry, id: Date.now(), timestamp: new Date().toISOString() })
  setItem('nutrition_log', log)
}

export function getAllEntries() {
  return getItem('nutrition_log') || []
}

export function deleteEntry(id) {
  setItem('nutrition_log', getAllEntries().filter(e => e.id !== id))
}

export function getEntriesForDate(dateStr) {
  return getAllEntries().filter(e => e.timestamp && e.timestamp.startsWith(dateStr))
}

export function sumEntries(entries) {
  const macros = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  const micros = { vitamin_c: 0, iron: 0, calcium: 0 }
  for (const e of entries) {
    if (e.macros) {
      for (const k of Object.keys(macros)) macros[k] += Number(e.macros[k]) || 0
    }
    if (e.micros) {
      for (const k of Object.keys(micros)) micros[k] += Number(e.micros[k]) || 0
    }
  }
  return { macros, micros }
}

export function getDailyTotals(dateStr) {
  return sumEntries(getEntriesForDate(dateStr))
}

export function getWeekTotals() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return sumEntries(getAllEntries().filter(e => new Date(e.timestamp).getTime() >= cutoff))
}

export function getMonthTotals() {
  const prefix = new Date().toISOString().slice(0, 7)
  return sumEntries(getAllEntries().filter(e => e.timestamp && e.timestamp.startsWith(prefix)))
}

const DEFAULT_GOALS = { weightLossPerMonth: 4, dailyCalories: 1800, protein: 150, carbs: 180, fat: 60 }

export function setGoals(goals) {
  setItem('nutrition_goals', goals)
}

export function getGoals() {
  return getItem('nutrition_goals') || DEFAULT_GOALS
}
