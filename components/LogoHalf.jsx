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
 * (Filename kept as LogoHalf.jsx for git history; the older "two halves of
 * a yin-yang" pattern was replaced with stencil-on-target.)
 */

export function LogoStencil({ size = 44 }) {
  return (
    <img
      src="/logo-stencil.png"
      alt=""
      width={size}
      height={size}
      style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}
      draggable={false}
    />
  )
}

export function LogoTarget({ size = 44 }) {
  // Slightly smaller than the stencil's bounding box so the black disc tucks
  // in cleanly under the stencil's red border ring instead of poking past it.
  const inner = Math.round(size * 0.92)
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: `${inner}px`,
          height: `${inner}px`,
          borderRadius: '50%',
          background: '#070708',
          boxShadow: '0 0 10px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,80,90,0.25)',
        }}
      />
    </div>
  )
}

// Default export kept for any existing single-import sites; defaults to stencil.
export default LogoStencil
