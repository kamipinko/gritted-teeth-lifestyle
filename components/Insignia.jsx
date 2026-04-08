/*
 * Insignia — the Gritted Teeth Lifestyle mark.
 *
 * This is a placeholder mark we'll redesign once the visual system is
 * proven out. For now it's a stylized clenched-jaw / drill silhouette
 * built as inline SVG so it scales perfectly and inherits color via
 * `currentColor`.
 *
 * Used on calling cards as a stamped wax-seal-style signature, and
 * eventually on victory screens, the home page header, and anywhere the
 * brand needs to assert itself.
 */
export default function Insignia({ className = '', size = 64 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle
        cx="50" cy="50" r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        cx="50" cy="50" r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 4"
      />

      {/* Inner triangle / drill point */}
      <path
        d="M50 18 L78 70 L22 70 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="miter"
      />

      {/* Vertical drill line */}
      <line
        x1="50" y1="32" x2="50" y2="82"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* Teeth — three jagged shapes along the bottom */}
      <path
        d="M30 70 L34 78 L38 70 L42 78 L46 70 L50 78 L54 70 L58 78 L62 70 L66 78 L70 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />

      {/* Two diagonal slashes intersecting the triangle, very subtle */}
      <line
        x1="20" y1="40" x2="80" y2="60"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.4"
      />
      <line
        x1="20" y1="60" x2="80" y2="40"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.4"
      />
    </svg>
  )
}
