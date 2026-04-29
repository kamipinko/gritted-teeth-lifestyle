'use client'
/*
 * LogoHalf — a half of the GTL logo emblem clipped to a yin-yang teardrop
 * shape (outer half-circle on one side, S-curve on the other). Two halves
 * (side="left" + side="right") interlock at the same coordinates to form
 * the complete circular logo. Used by every swipe-enabled button to give
 * the gesture a consistent visual: two halves on opposite sides of the
 * button, swipe pulls one all the way across to the other to fuse.
 */

export default function LogoHalf({ side, size = 40 }) {
  const cid = `logo-half-${side}`
  // Teardrop clip path. Same S-curve sub-arcs for both sides — only the
  // outer semicircle differs (sweep flag).
  const clipD = side === 'left'
    ? 'M 50,0 A 50,50 0 0,0 50,100 A 25,25 0 0,1 50,50 A 25,25 0 0,0 50,0 Z'
    : 'M 50,0 A 50,50 0 0,1 50,100 A 25,25 0 0,1 50,50 A 25,25 0 0,0 50,0 Z'
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <clipPath id={cid}>
          <path d={clipD}/>
        </clipPath>
      </defs>
      <image
        href="/logo.png"
        x="0" y="0" width="100" height="100"
        clipPath={`url(#${cid})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </svg>
  )
}
