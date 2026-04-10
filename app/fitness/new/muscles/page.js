'use client'
/*
 * /fitness/new/muscles — muscle selection screen.
 *
 * The user has just survived the fire transition from the naming screen.
 * They land here staring at a rotatable 3D stylized humanoid rendered by
 * R3F. Each of the 10 muscle groups (chest, biceps, triceps, shoulders,
 * forearms, abs, quads, hamstrings, glutes, calves) is a clickable mesh.
 * Clicking toggles that group's selection.
 *
 * Right-side panel lists all 10 groups with their current state. The
 * user can select from zero to all 10.
 *
 * Forward navigation deferred — RETREAT is the only exit for now.
 */
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSound } from '../../../../lib/useSound'
import FireFadeIn from '../../../../components/FireFadeIn'

// R3F is client-only and touches `window`; dynamic import with ssr: false
// avoids hydration errors.
const MuscleBody = dynamic(() => import('../../../../components/MuscleBody'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-ash animate-flicker">
        LOADING VESSEL…
      </div>
    </div>
  ),
})

const MUSCLE_GROUPS = [
  { id: 'chest',      label: 'CHEST',      region: 'UPPER' },
  { id: 'shoulders',  label: 'SHOULDERS',  region: 'UPPER' },
  { id: 'biceps',     label: 'BICEPS',     region: 'ARMS'  },
  { id: 'triceps',    label: 'TRICEPS',    region: 'ARMS'  },
  { id: 'forearms',   label: 'FOREARMS',   region: 'ARMS'  },
  { id: 'abs',        label: 'ABS',        region: 'CORE'  },
  { id: 'glutes',     label: 'GLUTES',     region: 'LOWER' },
  { id: 'quads',      label: 'QUADS',      region: 'LOWER' },
  { id: 'hamstrings', label: 'HAMSTRINGS', region: 'LOWER' },
  { id: 'calves',     label: 'CALVES',     region: 'LOWER' },
]

// Available 3D models the user can switch between
const MODEL_OPTIONS = [
  { id: 'anatomy',  label: 'ANATOMY',   subtitle: 'REFERENCE'   },
  { id: 'goku',     label: 'GOKU',      subtitle: 'BASE'        },
  { id: 'gokuSSJ',  label: 'GOKU',      subtitle: 'SUPER SAIYAN' },
  { id: 'gohan',    label: 'GOHAN',     subtitle: 'TEEN'         },
]

function RetreatButton({ href = '/fitness/new' }) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div
        className={`
          absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}
        `}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span
          className={`font-display text-base leading-none transition-all duration-300 ${
            hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-red translate-x-0'
          }`}
        >
          ◀
        </span>
        <span
          className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300 ${
            hovered ? 'text-gtl-paper' : 'text-gtl-chalk'
          }`}
        >
          RETREAT
        </span>
      </div>
    </Link>
  )
}

/**
 * A single row in the right-side muscle list.
 *
 * Clicking the row focuses the camera on that muscle — only one muscle
 * can be focused at a time (handled by `handleFocus` upstream). Selection
 * for training is a separate action via the checkbox on the left of the
 * row; the checkbox stops propagation so it never affects focus.
 */
function MuscleRow({ group, selected, focusedGroup, onToggle, onFocus, stampRevision = 0, index = 0, onStamp }) {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  const [isStamping, setIsStamping] = useState(false)
  const [isWobbling, setIsWobbling] = useState(false)
  const prevRevisionRef = useRef(0)
  const onStampRef = useRef(onStamp)
  useEffect(() => { onStampRef.current = onStamp }, [onStamp])

  useEffect(() => {
    if (stampRevision > prevRevisionRef.current) {
      prevRevisionRef.current = stampRevision
      const startDelay = index * 500
      const t = setTimeout(() => {
        setIsStamping(true)
        setTimeout(() => {
          if (onStampRef.current) onStampRef.current()
          setIsWobbling(true)
          setTimeout(() => setIsWobbling(false), 400)
        }, 740)
        setTimeout(() => setIsStamping(false), 1050)
      }, startDelay)
      return () => clearTimeout(t)
    }
  }, [stampRevision, index])
  const isSelected = selected.has(group.id)
  const isFocused = focusedGroup === group.id

  const handleRowClick = () => {
    play('option-select')
    onFocus(group.id)
  }

  const handleCheckboxClick = (e) => {
    e.stopPropagation()
    play('option-select')
    if (!isSelected) {
      setIsStamping(true)
      setTimeout(() => {
        onToggle(group.id)
        if (onStampRef.current) onStampRef.current()
        setIsWobbling(true)
        setTimeout(() => setIsWobbling(false), 400)
      }, 740)
      setTimeout(() => setIsStamping(false), 1050)
    } else {
      onToggle(group.id)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleRowClick()
        }
      }}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer
        transition-all duration-200 ease-out outline-none
        ${isWobbling ? 'animate-row-wobble' : ''}
        ${isFocused
          ? 'bg-gtl-red/25'
          : isSelected
          ? 'bg-gtl-red/10'
          : hovered
          ? 'bg-gtl-surface'
          : 'bg-transparent'}
      `}
    >
      {/* Left marker — slash-shape indicator, tracks focus state */}
      <div
        className={`
          w-1 h-8 transition-all duration-200
          ${isFocused
            ? 'bg-gtl-red-bright'
            : isSelected
            ? 'bg-gtl-red/80'
            : hovered
            ? 'bg-gtl-red/60'
            : 'bg-gtl-edge'}
        `}
        style={{ clipPath: 'polygon(0 10%, 100% 0, 100% 90%, 0 100%)' }}
      />

      {/* P5-styled checkbox — independent of focus, toggles selection only */}
      <div
        role="checkbox"
        aria-checked={isSelected}
        aria-label={`Select ${group.label}`}
        tabIndex={-1}
        onClick={handleCheckboxClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCheckboxClick(e)
          }
        }}
        className={`
          relative w-5 h-5 shrink-0 flex items-center justify-center border-2
          transition-colors duration-150
          ${isStamping ? 'animate-checkbox-stamp' : ''}
          ${isSelected
            ? 'bg-gtl-red-bright border-gtl-red-bright shadow-red-glow'
            : 'bg-gtl-ink border-gtl-edge hover:border-gtl-red'}
        `}
        style={{
          clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)',
          transformOrigin: 'center center',
        }}
      >
        {isSelected && (
          <span className="font-display text-gtl-paper text-sm leading-none -rotate-12 select-none">
            ✕
          </span>
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div
          className={`
            font-display text-xl leading-none transition-colors duration-200
            ${isFocused
              ? 'text-gtl-red-bright'
              : isSelected || hovered
              ? 'text-gtl-chalk'
              : 'text-gtl-ash'}
          `}
        >
          {group.label}
        </div>
        <div className="font-mono text-[8px] tracking-[0.3em] uppercase text-gtl-smoke mt-0.5">
          {group.region}
        </div>
      </div>

      {/* Focus indicator — only visible for the currently focused row */}
      <div
        className={`
          font-mono text-[10px] tracking-[0.2em] font-bold transition-opacity duration-200
          ${isFocused ? 'opacity-100 text-gtl-red-bright' : 'opacity-0'}
        `}
      >
        ◉ FOCUS
      </div>
    </div>
  )
}

/**
 * ModelToggle — a row of P5-styled buttons for switching between the
 * available 3D models. Active one is red and filled.
 */
function ModelToggle({ value, onChange }) {
  const { play } = useSound()
  return (
    <div className="flex items-stretch gap-2">
      {MODEL_OPTIONS.map((opt) => {
        const isActive = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => { play('option-select'); onChange(opt.id) }}
            onMouseEnter={() => play('button-hover')}
            className={`
              group relative px-4 py-2 text-left transition-all duration-200
              border
              ${isActive
                ? 'bg-gtl-red border-gtl-red-bright shadow-red-glow'
                : 'bg-gtl-ink/60 border-gtl-edge hover:border-gtl-red'
              }
            `}
            style={{ clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
          >
            <div
              className={`
                font-display text-sm leading-none
                ${isActive ? 'text-gtl-paper' : 'text-gtl-chalk'}
              `}
            >
              {opt.label}
            </div>
            <div
              className={`
                font-mono text-[8px] tracking-[0.3em] uppercase mt-1
                ${isActive ? 'text-gtl-paper/80' : 'text-gtl-ash'}
              `}
            >
              {opt.subtitle}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function MusclesPage() {
  const [selected, setSelected] = useState(() => new Set())
  const [focusedGroup, setFocusedGroup] = useState(null)
  const [modelKey, setModelKey] = useState('goku')
  const [stampRevision, setStampRevision] = useState(0)
  const { play } = useSound()
  const mainRef = useRef(null)

  const handleStamp = () => {
    play('stamp')
    if (mainRef.current) {
      mainRef.current.animate(
        [
          { transform: 'translate(0, 0)' },
          { transform: 'translate(-8px, 5px)' },
          { transform: 'translate(7px, -6px)' },
          { transform: 'translate(-5px, -3px)' },
          { transform: 'translate(4px, 4px)' },
          { transform: 'translate(-2px, 2px)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }
      )
    }
  }

  // Toggle selection state
  const toggle = (id) => {
    play('option-select')
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Camera focus — clicking a hitbox or row sets focus (zooms in); clicking
  // the same muscle again, or clicking the background, clears focus. Only one
  // muscle is ever focused at a time — setting a new one replaces the previous.
  // Selection is a separate concern, handled by the checkbox in MuscleRow.
  const handleFocus = (id) => {
    setFocusedGroup((prev) => (prev === id ? null : id))
  }

  const clearAll = () => {
    play('menu-close')
    setSelected(new Set())
  }

  const selectAll = () => {
    play('card-confirm')
    setSelected(new Set())
    setStampRevision((r) => r + 1)
    MUSCLE_GROUPS.forEach((g, i) => {
      setTimeout(() => {
        setSelected((prev) => new Set([...prev, g.id]))
      }, i * 500 + 740)
    })
  }

  const count = selected.size

  return (
    <main ref={mainRef} className="relative min-h-screen overflow-hidden bg-gtl-void">
      {/* Background atmospherics */}
      <div className="absolute inset-0 gtl-noise" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(122,14,20,0.30) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.40) 100%)',
        }}
      />

      {/* Kanji watermark — 肉 ("flesh/muscle") */}
      <div
        className="absolute -top-12 -left-16 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '46rem',
          lineHeight: '0.8',
          color: '#ffffff',
          opacity: 0.045,
          fontWeight: 900,
        }}
      >
        肉
      </div>

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <RetreatButton />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / NEW CYCLE / TARGETS
        </div>
      </nav>

      {/* Headline */}
      <section className="relative z-10 px-8 pt-4 pb-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-3">
          <div className="h-0.5 w-16 bg-gtl-red" />
          <span className="font-mono text-xs tracking-[0.4em] uppercase text-gtl-red font-bold">
            STEP / 02 / TARGETS
          </span>
          <div className="h-0.5 w-16 bg-gtl-red" />
        </div>
        <h1 className="font-display text-6xl md:text-7xl text-gtl-chalk leading-none -rotate-1">
          MARK YOUR
          <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-2 ml-4">
            TARGETS
          </span>
        </h1>
        <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-gtl-ash mt-4 max-w-xl">
          Click the muscles you intend to train. Rotate the vessel to inspect
          every angle.
        </p>
      </section>

      {/* Main content — 3D body + side panel */}
      <section className="relative z-10 px-8 pb-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* 3D body canvas column */}
        <div className="flex flex-col gap-4">
          {/* Model toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gtl-red" />
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red">
                SPECIMEN
              </span>
            </div>
            <ModelToggle value={modelKey} onChange={setModelKey} />
          </div>

        {/* 3D body canvas */}
        <div className="relative h-[600px] bg-gtl-ink/60 border border-gtl-edge">
          {/* Corner marks */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gtl-red" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gtl-red" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gtl-red" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gtl-red" aria-hidden="true" />

          {/* Corner labels */}
          <div className="absolute top-2 left-10 font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red/70">
            SPECIMEN / 01
          </div>
          <div className="absolute top-2 right-10 font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red/70">
            VIEW / ORBIT
          </div>
          <div className="absolute bottom-2 left-10 font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ash/70">
            DRAG TO ROTATE
          </div>
          <div className="absolute bottom-2 right-10 font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ash/70">
            SCROLL TO ZOOM
          </div>

          <Suspense fallback={<div className="w-full h-full flex items-center justify-center font-mono text-gtl-ash">LOADING…</div>}>
            <MuscleBody
              onFocus={handleFocus}
              focusedGroup={focusedGroup}
              modelKey={modelKey}
            />
          </Suspense>
        </div>
        </div>

        {/* Side panel — muscle list */}
        <aside className="relative">
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red">
                TARGET LIST
              </div>
              <div className="font-display text-3xl text-gtl-chalk leading-none mt-1">
                {String(count).padStart(2, '0')} / 10
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={selectAll}
                className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-ash hover:text-gtl-red-bright transition-colors px-2 py-1 border border-gtl-edge hover:border-gtl-red"
              >
                ALL
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="font-mono text-[9px] tracking-[0.2em] uppercase text-gtl-ash hover:text-gtl-red-bright transition-colors px-2 py-1 border border-gtl-edge hover:border-gtl-red"
              >
                NONE
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-0.5 bg-gtl-red mb-2" />

          {/* Muscle rows */}
          <div className="flex flex-col gap-0.5">
            {MUSCLE_GROUPS.map((group, i) => (
              <MuscleRow
                key={group.id}
                group={group}
                selected={selected}
                focusedGroup={focusedGroup}
                onToggle={toggle}
                onFocus={handleFocus}
                stampRevision={stampRevision}
                index={i}
                onStamp={handleStamp}
              />
            ))}
          </div>

          {/* Footer count */}
          <div className="mt-6 px-1 flex items-center justify-between">
            <div className="h-px flex-1 bg-gtl-edge" />
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-smoke px-3">
              {count === 0
                ? 'NO TARGETS'
                : count === 10
                ? 'FULL BODY'
                : `${count} TARGET${count === 1 ? '' : 'S'}`}
            </div>
            <div className="h-px flex-1 bg-gtl-edge" />
          </div>
        </aside>
      </section>

      {/* Footer slash */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center gap-4 px-8">
        <div className="h-px flex-1 bg-gtl-edge" />
        <div className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
          GRITTED TEETH LIFESTYLE / FITNESS PALACE / TARGETING
        </div>
        <div className="h-px flex-1 bg-gtl-edge" />
      </div>

      {/* Fire fade-in — picks up where FireTransition left off so the
          source-to-destination cut feels continuous. */}
      <FireFadeIn duration={900} />
    </main>
  )
}
