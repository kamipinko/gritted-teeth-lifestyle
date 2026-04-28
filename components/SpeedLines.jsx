'use client'
/*
 * SpeedLines — horizontal manga-style speed dashes.
 *
 * Multiple rows of alternating black/white dashes that scroll horizontally
 * at varied speeds to indicate motion / speed / "we're moving fast." Used
 * during the quick-forge auto-progression so the user sees the chain is
 * actively flying through pages, not stuck.
 *
 * Subtle by default (low opacity, non-blocking pointer-events). Render with
 * `<SpeedLines active={someFlag} />` and it'll auto-mount/unmount.
 */
import { useEffect, useState } from 'react'

const ROWS = [
  // {top%, height-px, duration-ms, direction (1 right→left, -1 left→right), opacity}
  { top: 8,  h: 4, dur: 700,  dir: -1, op: 0.85 },
  { top: 18, h: 2, dur: 480,  dir: -1, op: 0.7  },
  { top: 28, h: 6, dur: 900,  dir: -1, op: 0.95 },
  { top: 40, h: 3, dur: 520,  dir: -1, op: 0.6  },
  { top: 55, h: 5, dur: 820,  dir: -1, op: 0.9  },
  { top: 67, h: 2, dur: 440,  dir: -1, op: 0.55 },
  { top: 78, h: 4, dur: 760,  dir: -1, op: 0.8  },
  { top: 88, h: 3, dur: 600,  dir: -1, op: 0.65 },
]

export default function SpeedLines({ active }) {
  const [mounted, setMounted] = useState(active)

  useEffect(() => {
    if (active) setMounted(true)
    else {
      // Brief fade-out before unmount so the dashes don't pop off
      const t = setTimeout(() => setMounted(false), 250)
      return () => clearTimeout(t)
    }
  }, [active])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{
        opacity: active ? 1 : 0,
        transition: 'opacity 250ms ease-out',
        mixBlendMode: 'screen',
      }}
    >
      <style>{`
        @keyframes speed-line-l {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      {ROWS.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${r.top}%`,
            left: 0,
            height: `${r.h}px`,
            width: '300vw',
            // Repeating dashes — pattern of alternating white and black/transparent
            backgroundImage: i % 3 === 0
              ? 'repeating-linear-gradient(90deg, rgba(255,255,255,0.95) 0px, rgba(255,255,255,0.95) 60px, transparent 60px, transparent 110px)'
              : i % 3 === 1
              ? 'repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 32px, transparent 32px, transparent 84px)'
              : 'repeating-linear-gradient(90deg, rgba(20,20,20,0.85) 0px, rgba(20,20,20,0.85) 48px, transparent 48px, transparent 96px)',
            animation: `speed-line-l ${r.dur}ms linear infinite`,
            animationDelay: `${i * 60}ms`,
            opacity: r.op,
            filter: r.h <= 2 ? 'blur(0.5px)' : 'none',
          }}
        />
      ))}
    </div>
  )
}
