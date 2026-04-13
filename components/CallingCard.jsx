'use client'
/*
 * CallingCard — the iconic Phantom Thieves calling card, translated into a
 * tappable home-page artifact for entering a section of Gritted Teeth
 * Lifestyle.
 *
 * Visual: torn aged paper, mixed ransom-note typography, slight tilt, drop
 * shadow, decorative tape strip pinning it to the page, an Insignia stamp
 * in the corner. Hover behavior is intentionally dramatic — the card
 * straightens out, scales up, lifts, glows red, and reveals an "ARMED"
 * indicator. Tap triggers the heist transition.
 *
 * The card is INTENTIONALLY anti-uniform — different letters of the title
 * use different fonts and weights. This is the heart of the calling-card
 * aesthetic and must not be smoothed out.
 */
import { useState } from 'react'
import Insignia from './Insignia'
import { useSound } from '../lib/useSound'

/**
 * Render the title as a sequence of letters with deliberately mismatched
 * fonts/weights/colors/rotations to evoke a ransom-note pasting.
 */
function RansomTitle({ text }) {
  const recipes = [
    { font: 'font-display',  size: 'text-6xl', tilt: '-rotate-2',     bg: 'bg-gtl-ink',  color: 'text-gtl-paper', pad: 'px-2 py-0' },
    { font: 'font-athletic font-black', size: 'text-7xl', tilt: 'rotate-1',  bg: 'bg-gtl-paper', color: 'text-gtl-ink',  pad: 'px-1 py-0' },
    { font: 'font-display',  size: 'text-5xl', tilt: 'rotate-3',      bg: 'bg-gtl-red',  color: 'text-gtl-paper', pad: 'px-2 py-0' },
    { font: 'font-athletic font-black', size: 'text-6xl', tilt: '-rotate-1', bg: 'bg-gtl-paper', color: 'text-gtl-ink',  pad: 'px-1 py-0' },
    { font: 'font-display',  size: 'text-7xl', tilt: 'rotate-2',      bg: 'bg-gtl-ink',  color: 'text-gtl-red',   pad: 'px-2 py-0' },
    { font: 'font-athletic font-black', size: 'text-6xl', tilt: '-rotate-3', bg: 'bg-gtl-paper', color: 'text-gtl-ink',  pad: 'px-1 py-0' },
    { font: 'font-display',  size: 'text-6xl', tilt: 'rotate-1',      bg: 'bg-gtl-red',  color: 'text-gtl-paper', pad: 'px-2 py-0' },
  ]
  const letters = text.toUpperCase().split('')
  return (
    <div className="flex flex-wrap items-end gap-x-1 leading-none">
      {letters.map((letter, i) => {
        const r = recipes[i % recipes.length]
        return (
          <span
            key={i}
            className={`inline-block ${r.font} ${r.size} ${r.tilt} ${r.bg} ${r.color} ${r.pad}`}
            style={{
              transform: `translateY(${(i % 3) - 1}px) ${r.tilt.replace('-rotate-', 'rotate(-').replace('rotate-', 'rotate(')}deg)`,
            }}
          >
            {letter}
          </span>
        )
      })}
    </div>
  )
}

export default function CallingCard({
  title = 'FITNESS',
  subtitle = 'TARGET ACQUIRED',
  body = 'YOUR WEAKNESS HAS BEEN NOTED. THE CLIMB BEGINS THE MOMENT YOU PICK UP THIS CARD.',
  signOff = 'WITH GRITTED TEETH',
  onActivate,
  rotate = '-rotate-2',
}) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)

  const handleClick = (e) => {
    e.preventDefault()
    play('card-confirm')
    if (onActivate) {
      setTimeout(() => onActivate(), 60)
    }
  }

  // When hovered, the wrapper rotation snaps to 0 — the card "responds"
  // to the user's attention by straightening up like it's been called on.
  const wrapperRotate = hovered ? 'rotate-0' : rotate

  return (
    <div
      className={`
        relative ${wrapperRotate}
        transition-all duration-300 ease-out
        ${hovered ? 'scale-[1.04] -translate-y-2' : 'scale-100'}
      `}
      style={{ transformOrigin: 'center center' }}
    >
      {/* Idle red glow ring — pulses gently to telegraph interactivity */}
      <div
        className={`
          absolute -inset-2 pointer-events-none
          transition-opacity duration-500
          ${hovered ? 'opacity-100' : 'opacity-40'}
        `}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,42,54,0.25) 0%, transparent 70%)',
          filter: 'blur(20px)',
          animation: hovered ? 'none' : 'pulse-red 2.4s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Tape strip pinning the card */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 -top-3 z-30 gtl-tape h-6 w-28 shadow-md
          transition-transform duration-300 ease-out
          ${hovered ? 'rotate-0 scale-110' : 'rotate-2'}
        `}
        style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
        aria-hidden="true"
      />

      {/* The card itself */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => { setHovered(true); play('card-hover') }}
        onMouseLeave={() => setHovered(false)}
        className={`
          group relative block w-full text-left
          gtl-paper gtl-paper-noise
          gtl-clip-torn
          transition-all duration-300 ease-out
          gtl-focus-card
          ${hovered ? 'shadow-card-lift' : 'shadow-card-pin'}
        `}
        style={{
          padding: '2.5rem 2.25rem 2rem',
          minHeight: '24rem',
        }}
      >
        {/* Decorative red corner stripes — grow and brighten on hover */}
        <div
          className={`
            absolute top-0 left-0 bg-gtl-red
            transition-all duration-300 ease-out
            ${hovered ? 'w-32 h-3 bg-gtl-red-bright' : 'w-20 h-2'}
          `}
          aria-hidden="true"
        />
        <div
          className={`
            absolute top-0 left-0 bg-gtl-red
            transition-all duration-300 ease-out
            ${hovered ? 'w-3 h-32 bg-gtl-red-bright' : 'w-2 h-20'}
          `}
          aria-hidden="true"
        />
        <div
          className={`
            absolute bottom-0 right-0 bg-gtl-red
            transition-all duration-300 ease-out
            ${hovered ? 'w-32 h-3 bg-gtl-red-bright' : 'w-20 h-2'}
          `}
          aria-hidden="true"
        />
        <div
          className={`
            absolute bottom-0 right-0 bg-gtl-red
            transition-all duration-300 ease-out
            ${hovered ? 'w-3 h-32 bg-gtl-red-bright' : 'w-2 h-20'}
          `}
          aria-hidden="true"
        />

        {/* Subtitle / classification line */}
        <div className="relative flex items-center gap-3 mb-4">
          <div
            className={`
              h-0.5 bg-gtl-ink transition-all duration-300
              ${hovered ? 'w-14 bg-gtl-red' : 'w-8'}
            `}
          />
          <span
            className={`
              font-mono text-[10px] tracking-[0.3em] uppercase
              transition-colors duration-300
              ${hovered ? 'text-gtl-red' : 'text-gtl-ink/70'}
            `}
          >
            {subtitle}
          </span>
          <div
            className={`
              h-0.5 flex-1 transition-colors duration-300
              ${hovered ? 'bg-gtl-red' : 'bg-gtl-ink'}
            `}
          />
        </div>

        {/* Ransom-note title */}
        <div className="relative mb-6">
          <RansomTitle text={title} />
        </div>

        {/* Slash divider — grows on hover */}
        <div
          className={`
            relative my-5 h-1.5 gtl-slash transition-all duration-300 ease-out
            ${hovered ? 'w-full bg-gtl-red-bright' : 'w-3/4'}
          `}
          aria-hidden="true"
        />

        {/* Body text — typewriter / faux-stamped declaration */}
        <p className="relative font-mono text-xs leading-relaxed tracking-wide text-gtl-ink/85 uppercase max-w-sm">
          {body}
        </p>

        {/* Bottom row: sign-off + insignia */}
        <div className="relative mt-8 flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ink/60">
              Sincerely,
            </span>
            <span
              className={`
                font-display text-2xl leading-none mt-1
                transition-all duration-300
                ${hovered ? 'text-gtl-red-bright translate-x-1' : 'text-gtl-red'}
              `}
            >
              {signOff}
            </span>
          </div>

          {/* Logo — rotates harder on hover, almost like it's reacting */}
          <div className="relative shrink-0">
            <img
              src="/logo.png"
              alt="Gritted Teeth"
              className={`rounded-full transition-all duration-500 ease-out ${hovered ? '-rotate-[55deg] scale-110 opacity-100' : '-rotate-45 opacity-90'}`}
              style={{ width: 80, height: 80, objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* "ARMED" tag — appears bottom-left on hover, stamped on top of the card */}
        <div
          className={`
            absolute bottom-6 left-6 pointer-events-none
            transition-all duration-300 ease-out
            ${hovered ? 'opacity-100 -translate-y-0 -rotate-6' : 'opacity-0 translate-y-2 rotate-0'}
          `}
        >
          <div className="bg-gtl-red text-gtl-paper font-display text-xs tracking-[0.2em] px-3 py-1 shadow-lg">
            ▸ INFILTRATE
          </div>
        </div>

        {/* Hover overlay — red wash, much stronger now */}
        <div
          className={`
            absolute inset-0 pointer-events-none transition-opacity duration-300
            ${hovered ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            background: 'linear-gradient(135deg, rgba(212,24,31,0.18) 0%, rgba(212,24,31,0.05) 50%, transparent 80%)',
            mixBlendMode: 'multiply',
          }}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
