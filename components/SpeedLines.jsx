'use client'
/*
 * SpeedLines — many short horizontal streaks flying right-to-left, each with
 * a soft radial-gradient glow and randomized speed/delay/y-position. Adapted
 * from the CodePen "anime lines" pattern Jordan shared. Recolored to the GTL
 * red palette to match the brand.
 *
 * Render with `<SpeedLines active={...} />`. Mounts a fixed-position pool of
 * line elements that loop infinitely while active; on `active=false` it
 * fades out (250ms) and unmounts.
 */
import { useEffect, useMemo, useState } from 'react'

const LINE_COUNT = 25
const VARIANTS = [
  // {h, w, gradient} — 5 visual variants like the original
  { h: 3,  w: '100vw', g: 'radial-gradient(50% 50%, #ffd6da 50%, rgba(212,24,31,0.99) 83%, rgba(122,14,20,0.0) 100%)' },
  { h: 6,  w: '80vw',  g: 'radial-gradient(50% 50%, #ffd6da 50%, rgba(212,24,31,0.99) 83%, rgba(122,14,20,0.0) 100%)' },
  { h: 10, w: '100vw', g: 'radial-gradient(50% 50%, #ffd6da 50%, rgba(255,42,54,0.99) 83%, rgba(122,14,20,0.0) 100%)' },
  { h: 24, w: '120vw', g: 'radial-gradient(50% 50%, #ffeef0 50%, rgba(255,42,54,0.99) 83%, rgba(122,14,20,0.0) 100%)' },
  { h: 14, w: '100vw', g: 'radial-gradient(50% 50%, #ffd6da 50%, rgba(212,24,31,0.99) 83%, rgba(122,14,20,0.0) 100%)' },
]

// Deterministic PRNG so SSR + CSR produce the same line layout (no hydration
// mismatch warnings). Seeded with a constant — every mount looks the same.
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function SpeedLines({ active }) {
  const [mounted, setMounted] = useState(active)

  useEffect(() => {
    if (active) setMounted(true)
    else {
      const t = setTimeout(() => setMounted(false), 250)
      return () => clearTimeout(t)
    }
  }, [active])

  // Generate the full line pool once. Each line gets a random variant, top%,
  // duration, and a NEGATIVE delay so it starts mid-cycle at a random phase —
  // steady distribution from t=0 (no initial mount spike where all lines queue
  // up to fly at once).
  const lines = useMemo(() => {
    const rand = mulberry32(31415926)
    const out = []
    for (let i = 0; i < LINE_COUNT; i++) {
      const variantIdx = Math.floor(rand() * VARIANTS.length)
      const dur = 0.5 + rand() * 0.9     // seconds, 0.5-1.4
      out.push({
        i,
        v: VARIANTS[variantIdx],
        top: rand() * 100,                // % of viewport height
        dur,
        // Negative delay: line is pre-rolled to a random point within its own
        // cycle. So mounting at t=0, lines are already distributed across the
        // full screen, no front-loaded density spike.
        delay: -rand() * dur,
      })
    }
    return out
  }, [])

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
        @keyframes speed-line-fly {
          0%   { transform: translate3d(110vw, 0, 0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translate3d(-220vw, 0, 0); opacity: 0; }
        }
      `}</style>
      {lines.map(({ i, v, top, dur, delay }) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${top}%`,
            left: 0,
            height: `${v.h}px`,
            width: v.w,
            backgroundImage: v.g,
            animation: `speed-line-fly ${dur}s linear ${delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}
