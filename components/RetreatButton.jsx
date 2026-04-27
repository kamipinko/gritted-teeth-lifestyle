'use client'
import Link from 'next/link'
import { useSound } from '../lib/useSound'

/**
 * Canonical RetreatButton — same look on every page.
 * Default href is `/fitness/hub` (the most common back-target);
 * pages that need a different back-target pass `href` explicitly.
 */
export default function RetreatButton({ href = '/fitness/hub' }) {
  const { play } = useSound()

  return (
    <Link
      href={href}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      {/* Clip-path slash bg — visible at idle, brightens on hover (hover-capable devices only) */}
      <div
        className="absolute inset-0 -inset-x-2 pointer-events-none transition-all duration-300 ease-out bg-gtl-edge opacity-50 [@media(hover:hover)]:group-hover:bg-gtl-red [@media(hover:hover)]:group-hover:opacity-100"
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span className="font-display text-base leading-none transition-all duration-300 text-gtl-red [@media(hover:hover)]:group-hover:text-gtl-paper [@media(hover:hover)]:group-hover:-translate-x-1">◀︎</span>
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300 text-gtl-chalk [@media(hover:hover)]:group-hover:text-gtl-paper">RETREAT</span>
      </div>
    </Link>
  )
}
