'use client'
/**
 * PredictiveTapDebugOverlay — tiny floating panel showing the last few
 * [prefire] decisions. Lets us read what the chain is doing on iOS PWA
 * where the dev console isn't reachable.
 *
 * Visibility: enabled when localStorage 'gtl-prefire-debug' === '1'.
 * To toggle on iOS PWA without a console, do a 4-tap pattern in the
 * very-top-left corner (top:0-40px, left:0-40px) — the corner tap zone
 * watches for 4 quick taps and flips the flag.
 *
 * Mounted once in the root layout. Cheap when disabled (no listeners,
 * no DOM). Pointer-events:none on the panel so it never blocks taps.
 */
import { useEffect, useRef, useState } from 'react'
import { subscribeLogs, getRecentLogs } from '../lib/predictiveTap'

const FLAG_KEY = 'gtl-prefire-debug'
const TOGGLE_TAPS = 4
const TOGGLE_WINDOW_MS = 1500
const TOGGLE_CORNER_PX = 40

export default function PredictiveTapDebugOverlay() {
  const [enabled, setEnabled] = useState(false)
  const [, force] = useState(0)
  const tapTimesRef = useRef([])

  // Read flag on mount (and whenever it changes via the corner toggle).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { setEnabled(localStorage.getItem(FLAG_KEY) === '1') } catch (_) {}
  }, [])

  // 4-tap corner toggle — works whether the overlay is currently visible
  // or not, so it's the only way to enable it from inside an iOS PWA.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e) => {
      if (e.clientX > TOGGLE_CORNER_PX || e.clientY > TOGGLE_CORNER_PX) {
        tapTimesRef.current = []
        return
      }
      const now = Date.now()
      tapTimesRef.current = tapTimesRef.current.filter(t => now - t < TOGGLE_WINDOW_MS)
      tapTimesRef.current.push(now)
      if (tapTimesRef.current.length >= TOGGLE_TAPS) {
        tapTimesRef.current = []
        const next = !enabled
        try { localStorage.setItem(FLAG_KEY, next ? '1' : '0') } catch (_) {}
        setEnabled(next)
      }
    }
    window.addEventListener('pointerdown', handler, { capture: true })
    return () => window.removeEventListener('pointerdown', handler, { capture: true })
  }, [enabled])

  // Subscribe to log pushes so the panel re-renders on each new entry.
  useEffect(() => {
    if (!enabled) return
    return subscribeLogs(() => force((n) => n + 1))
  }, [enabled])

  if (!enabled) return null

  const logs = getRecentLogs()

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 4px)',
        right: 4,
        zIndex: 99999,
        maxWidth: 280,
        background: 'rgba(7,7,8,0.85)',
        border: '1px solid rgba(212,24,31,0.5)',
        padding: '4px 6px',
        fontFamily: 'var(--font-mono, ui-monospace, "Courier New", monospace)',
        fontSize: 9,
        lineHeight: 1.25,
        color: '#a8a39a',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      <div style={{ color: '#d4181f', fontWeight: 700 }}>[prefire]</div>
      {logs.map((entry, i) => {
        const t = new Date(entry.ts)
        const stamp = `${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}.${String(t.getMilliseconds()).padStart(3,'0')}`
        return (
          <div key={i} style={{ color: i === logs.length - 1 ? '#f1eee5' : '#a8a39a' }}>
            <span style={{ color: '#5a5a5e' }}>{stamp}</span> {entry.line}
          </div>
        )
      })}
    </div>
  )
}
