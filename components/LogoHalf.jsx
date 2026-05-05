'use client'
/*
 * Stencil + black-target swipe affordance. Used by every swipe-enabled
 * button to give the gesture a consistent visual:
 * - LogoStencil: the GTL logo with its black background removed (red text +
 *   white teeth + red perimeter on transparent), rendered as /logo-stencil.png
 * - LogoTarget: a solid black filled circle, the docking destination.
 *
 * At idle the stencil floats on the red button background looking incomplete
 * (red text barely visible against red bg). When swiped onto the black target
 * (or the target onto the stencil), the black circle slots in behind the
 * stencil and the complete brand emblem is revealed.
 *
 * Idle sparkle: three ✦ glints twinkle in/out across the teeth row at
 * staggered offsets while the swipe affordance is at rest. Pass `paused`
 * to freeze them during the entrance roll-in or while the user is mid-swipe
 * (callers gate `paused` on `!entranceDone || dragX !== 0`).
 *
 * (Filename kept as LogoHalf.jsx for git history; the older "two halves of
 * a yin-yang" pattern was replaced with stencil-on-target.)
 */

const SPARKLES = [
  { left: '30%', top: '58%', delay: '0s',    dur: '1.8s' },
  { left: '52%', top: '62%', delay: '0.6s',  dur: '2.3s' },
  { left: '72%', top: '58%', delay: '1.15s', dur: '2.6s' },
]

export function LogoStencil({ size = 44, paused = false }) {
  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes gtl-tooth-sparkle {
          0%, 100% { transform: translate(-50%, -50%) scale(0);   opacity: 0; }
          45%      { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
          55%      { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }
      `}</style>
      <img
        src="/logo-stencil.png"
        alt=""
        width={size}
        height={size}
        style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}
        draggable={false}
      />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            // Translate-origin offset is handled inside the keyframe so the
            // ✦ stays centered on its anchor point through the scale.
            color: '#fff',
            fontSize: `${Math.max(8, Math.round(size * 0.18))}px`,
            lineHeight: 1,
            textShadow: '0 0 4px rgba(255,255,255,0.65)',
            pointerEvents: 'none',
            transformOrigin: 'center center',
            animation: paused
              ? 'none'
              : `gtl-tooth-sparkle ${s.dur} ease-in-out ${s.delay} infinite`,
            opacity: 0,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}

export function LogoTarget({ size = 44 }) {
  // Slightly LARGER than the stencil's bounding box so the black disc covers
  // the entire transparent inner area (the perimeter red text in the stencil
  // sits at the very edge of the bounding box; a target smaller than the box
  // leaves a sliver of red button background showing through near the edges).
  const inner = Math.round(size * 1.08)
  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
      {/* Inner disc absolutely centered. Avoids flex-shrink stretching it
          into a tall oval when inner > size on the main axis. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${inner}px`,
          height: `${inner}px`,
          marginLeft: `${-inner / 2}px`,
          marginTop:  `${-inner / 2}px`,
          borderRadius: '50%',
          background: '#070708',
        }}
      />
    </div>
  )
}

// Default export kept for any existing single-import sites; defaults to stencil.
export default LogoStencil
