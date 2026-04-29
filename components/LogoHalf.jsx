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
