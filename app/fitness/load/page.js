'use client'
/*
 * /fitness/load — Your Cycles. The war record.
 *
 * Each cycle card has a parallelogram stamp toggle (like muscle chips).
 * Selecting a cycle stamps it active and reveals the ACTIVATE / DELETE
 * action bar fixed at the bottom. Only one cycle selected at a time.
 * DELETE goes through three confirmation stages in the bottom bar.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSound } from '../../../lib/useSound'
import FireFadeIn from '../../../components/FireFadeIn'
import FireTransition from '../../../components/FireTransition'

const MUSCLE_LABELS = {
  chest: 'CHEST', back: 'BACK', shoulders: 'SHOULDERS',
  biceps: 'BICEPS', triceps: 'TRICEPS', forearms: 'FOREARMS',
  abs: 'ABS', glutes: 'GLUTES', quads: 'QUADS',
  hamstrings: 'HAMSTRINGS', calves: 'CALVES',
}
const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

function parseDate(iso) {
  return new Date(iso + 'T12:00:00')
}
function formatDateShort(iso) {
  const d = parseDate(iso)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

const SLAB_ROTATIONS = ['-1.2deg','0.9deg','-0.7deg','1.4deg','-1deg','0.6deg','-1.5deg','1.1deg']

function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href="/fitness"
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div
        className={`absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
          ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}`}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span className={`font-display text-base leading-none transition-all duration-300
          ${hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-red'}`}>◀</span>
        <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300
          ${hovered ? 'text-gtl-paper' : 'text-gtl-chalk'}`}>RETREAT</span>
      </div>
    </Link>
  )
}

function MuscleTag({ id, index }) {
  const rot = SLAB_ROTATIONS[index % SLAB_ROTATIONS.length]
  return (
    <div
      className="px-3 py-1 bg-gtl-red border border-gtl-red-bright shrink-0"
      style={{
        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
        transform: `rotate(${rot})`,
      }}
    >
      <div className="font-display text-sm text-gtl-paper leading-none whitespace-nowrap">
        {MUSCLE_LABELS[id] || id.toUpperCase()}
      </div>
    </div>
  )
}

/* ── Parallelogram stamp toggle — same energy as muscle chips ── */
function SelectStamp({ selected, onToggle }) {
  const { play } = useSound()
  const [pressed, setPressed] = useState(false)

  const handleMouseUp = () => {
    setPressed(false)
    play(selected ? 'menu-close' : 'option-select')
    onToggle()
    // Fire stamp sound at checkmark impact (~55% through 800ms animation)
    if (!selected) setTimeout(() => play('stamp'), 440)
  }

  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setPressed(false)}
      onMouseEnter={() => play('button-hover')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMouseUp() } }}
      className="relative cursor-pointer select-none outline-none
        focus-visible:outline-2 focus-visible:outline-gtl-red focus-visible:outline-offset-2"
      style={{ transform: 'rotate(-0.5deg)' }}
      aria-pressed={selected}
      aria-label={selected ? 'Deselect cycle' : 'Select cycle'}
    >
      {/* Shadow slab */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
          background: selected ? '#8a0e13' : '#1a1a1e',
          transform: pressed ? 'translate(0,0)' : 'translate(4px, 4px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      {/* Face */}
      <div
        className="relative px-5 py-2"
        style={{
          clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
          background: pressed
            ? (selected ? '#ff2a36' : '#2a2a30')
            : (selected ? '#d4181f' : 'transparent'),
          border: `1px solid ${selected ? '#ff2a36' : '#3a3a42'}`,
          transform: pressed ? 'translate(4px, 4px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className={`font-mono text-[9px] tracking-[0.25em] uppercase leading-none whitespace-nowrap
          ${selected ? 'text-gtl-paper' : 'text-gtl-ash'}`}>
          {selected ? '◼ SELECTED' : '◻ SELECT'}
        </div>
      </div>
    </button>
  )
}

/* ── Giant checkmark slam — mounts on select, unmounts on deselect ── */
function CheckSlam() {
  return (
    <>
      <style>{`
        @keyframes check-slam {
          0%   { transform: translateY(-280px) scale(5) rotate(-20deg); opacity: 0; filter: blur(16px); }
          5%   { opacity: 1; filter: blur(8px); }
          55%  { transform: translateY(14px) scale(0.82) rotate(-13deg); opacity: 1; filter: blur(0); }
          70%  { transform: translateY(-8px) scale(1.1) rotate(-11deg); opacity: 1; }
          82%  { transform: translateY(4px) scale(0.97) rotate(-12deg); opacity: 1; }
          91%  { transform: translateY(-2px) scale(1.02) rotate(-12deg); opacity: 1; }
          100% { transform: translateY(0) scale(1) rotate(-12deg); opacity: 1; }
        }
        @keyframes check-ring {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          5%   { opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(6); opacity: 0; }
        }
      `}</style>

      {/* Shockwave ring */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          left: '50%', top: '50%',
          width: '80px', height: '80px',
          border: '3px solid #d4181f',
          animation: 'check-ring 700ms cubic-bezier(0.2, 0.8, 0.3, 1) 580ms forwards',
          opacity: 0,
        }}
        aria-hidden="true"
      />

      {/* The checkmark */}
      <div
        className="pointer-events-none select-none"
        style={{
          animation: 'check-slam 800ms cubic-bezier(0.18, 1.2, 0.35, 1) forwards',
          fontFamily: 'inherit',
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        {/* Hard shadow */}
        <div
          className="absolute font-display text-gtl-red-deep"
          style={{
            fontSize: 'clamp(8rem, 14vw, 13rem)',
            transform: 'translate(10px, 10px)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ✓
        </div>
        {/* Face */}
        <div
          className="relative font-display"
          style={{
            fontSize: 'clamp(8rem, 14vw, 13rem)',
            color: '#d4181f',
            textShadow: '0 0 40px rgba(212,24,31,0.5)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ✓
        </div>
      </div>
    </>
  )
}

/* ── Cycle dossier card — no action buttons, just info + stamp toggle ── */
function CycleCard({ cycle, index, selected, onSelect }) {
  const cardRot = index % 2 === 0 ? '-0.4deg' : '0.3deg'

  const firstDay = cycle.days?.[0]
  const lastDay  = cycle.days?.[cycle.days.length - 1]
  const plannedSessions = cycle.days?.filter(
    (iso) => (cycle.dailyPlan?.[iso] || []).length > 0
  ).length ?? 0

  const created = new Date(cycle.createdAt)
  const createdStr = `${MONTH_SHORT[created.getMonth()]} ${created.getDate()} ${created.getFullYear()}`

  return (
    <div
      className="relative bg-gtl-ink overflow-visible transition-all duration-200"
      style={{
        transform: `rotate(${cardRot})`,
        transformOrigin: 'center top',
        borderLeft: selected ? '4px solid #ff2a36' : '4px solid #d4181f',
        border: selected ? '1px solid #d4181f' : '1px solid #2a2a30',
        boxShadow: selected ? '0 0 24px rgba(212,24,31,0.25)' : 'none',
      }}
    >
      {/* Index stamp — top right */}
      <div className="absolute top-4 right-6 font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
        CYCLE / {String(index + 1).padStart(2, '0')}
      </div>

      {/* Giant checkmark — slams in on select, gone on deselect */}
      {selected && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center justify-center overflow-visible pointer-events-none">
          <CheckSlam />
        </div>
      )}

      <div className="px-8 pt-6 pb-8">
        {/* Created date + select stamp on same row */}
        <div className="flex items-center gap-6 mb-3">
          <div className="font-mono text-[9px] tracking-[0.35em] uppercase text-gtl-smoke">
            FORGED {createdStr}
          </div>
          <SelectStamp selected={selected} onToggle={onSelect} />
        </div>

        {/* Cycle name — dominant */}
        <h2
          className="font-display text-gtl-chalk leading-none mb-1"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            textShadow: '3px 3px 0 #070708',
            transform: 'rotate(-1deg)',
            transformOrigin: 'left center',
          }}
        >
          {cycle.name}
        </h2>

        {/* Date range */}
        {firstDay && lastDay && (
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red mb-5">
            {formatDateShort(firstDay)} — {formatDateShort(lastDay)}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-6 mb-6">
          <div>
            <div className="font-display text-3xl leading-none"
                 style={{ color: '#e4b022', textShadow: '2px 2px 0 #8a6612' }}>
              {String(cycle.days?.length ?? 0).padStart(2, '0')}
            </div>
            <div className="font-mono text-[8px] tracking-[0.3em] uppercase text-gtl-smoke mt-0.5">BATTLEDAYS</div>
          </div>
          <div className="w-px h-10 bg-gtl-red" style={{ transform: 'skewX(-12deg)' }} />
          <div>
            <div className="font-display text-3xl leading-none"
                 style={{ color: '#e4b022', textShadow: '2px 2px 0 #8a6612' }}>
              {String(cycle.targets?.length ?? 0).padStart(2, '0')}
            </div>
            <div className="font-mono text-[8px] tracking-[0.3em] uppercase text-gtl-smoke mt-0.5">TARGETS</div>
          </div>
          <div className="w-px h-10 bg-gtl-red" style={{ transform: 'skewX(-12deg)' }} />
          <div>
            <div className="font-display text-3xl leading-none"
                 style={{ color: '#e4b022', textShadow: '2px 2px 0 #8a6612' }}>
              {String(plannedSessions).padStart(2, '0')}
            </div>
            <div className="font-mono text-[8px] tracking-[0.3em] uppercase text-gtl-smoke mt-0.5">SESSIONS</div>
          </div>
        </div>

        {/* Red slash divider */}
        <div className="mb-5 h-px bg-gtl-red" style={{ transform: 'skewX(-8deg)' }} />

        {/* Muscle targets */}
        {cycle.targets?.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-4" style={{ overflow: 'visible' }}>
            {cycle.targets.map((id, i) => (
              <MuscleTag key={id} id={id} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ACTIVATE slab button ── */
function ActivateButton({ onActivate }) {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onActivate() }}
      onMouseLeave={() => { setPressed(false); setHovered(false) }}
      onMouseEnter={() => setHovered(true)}
      className="relative cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red"
      style={{ transform: 'rotate(-0.6deg)' }}
    >
      <div
        className="absolute inset-0 bg-gtl-red-deep"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(5px, 5px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      <div
        className="relative px-10 py-4"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          background: pressed ? '#ff2a36' : hovered ? '#e01e25' : '#d4181f',
          transform: pressed ? 'translate(5px, 5px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out',
        }}
      >
        <div className="font-display text-2xl text-gtl-paper leading-none tracking-tight">ACTIVATE</div>
      </div>
    </button>
  )
}

/* ── REVIEW / EDIT secondary button ── */
function ReviewButton({ onReview }) {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onReview() }}
      onMouseLeave={() => { setPressed(false); setHovered(false) }}
      onMouseEnter={() => setHovered(true)}
      className="relative cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-gtl-red"
      style={{ transform: 'rotate(0.5deg)' }}
    >
      <div
        className="absolute inset-0 bg-gtl-edge"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          transform: pressed ? 'translate(0,0)' : 'translate(5px, 5px)',
          transition: 'transform 80ms ease-out',
        }}
        aria-hidden="true"
      />
      <div
        className="relative px-10 py-4"
        style={{
          clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
          background: pressed ? '#2a2a30' : hovered ? '#222226' : '#1a1a1e',
          border: `1px solid ${hovered ? '#d4181f' : '#3a3a42'}`,
          transform: pressed ? 'translate(5px, 5px)' : 'translate(0,0)',
          transition: 'transform 80ms ease-out, background 80ms ease-out, border-color 200ms',
        }}
      >
        <div className={`font-display text-2xl leading-none tracking-tight transition-colors duration-200
          ${hovered ? 'text-gtl-red' : 'text-gtl-ash'}`}>
          REVIEW / EDIT
        </div>
      </div>
    </button>
  )
}

/* ── Sticky bottom action bar ── */
function BottomBar({ cycle, onActivate, onReview, onDelete }) {
  const { play } = useSound()
  const [deleteStage, setDeleteStage] = useState(0) // 0 idle · 1 first confirm · 2 cancel confirm

  // Reset delete stage whenever the selected cycle changes
  useEffect(() => { setDeleteStage(0) }, [cycle?.id])

  if (!cycle) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'rgba(7,7,8,0.97)', borderTop: '2px solid #d4181f' }}
    >
      {/* Skewed red accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gtl-red pointer-events-none"
           style={{ transform: 'skewX(-4deg)', transformOrigin: 'left center' }} />

      <div className="px-8 py-5 flex items-center gap-8 flex-wrap">

        {/* Selected cycle label */}
        <div className="flex flex-col">
          <div className="font-mono text-[8px] tracking-[0.4em] uppercase text-gtl-smoke mb-0.5">SELECTED</div>
          <div className="font-display text-xl text-gtl-chalk leading-none" style={{ transform: 'rotate(-0.5deg)' }}>
            {cycle.name}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px h-10 bg-gtl-edge self-center" style={{ transform: 'skewX(-12deg)' }} />

        {/* ACTIVATE */}
        <ActivateButton onActivate={() => { play('card-confirm'); onActivate(cycle) }} />

        {/* REVIEW / EDIT */}
        <ReviewButton onReview={() => { play('option-select'); onReview(cycle) }} />

        {/* DELETE flow */}
        <div className="flex items-center gap-4 ml-auto">
          {deleteStage === 0 && (
            <button
              type="button"
              onClick={() => { play('button-hover'); setDeleteStage(1) }}
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-smoke hover:text-gtl-red transition-colors"
            >
              DELETE
            </button>
          )}

          {deleteStage === 1 && (
            <div className="flex flex-col gap-1.5 items-end">
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-gtl-red">
                ARE YOU SURE YOU WANT TO ERASE THIS CYCLE?
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => { play('menu-close'); onDelete(cycle.id) }}
                  className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red hover:text-gtl-red-bright transition-colors"
                >
                  YES, ERASE IT
                </button>
                <button
                  type="button"
                  onClick={() => { play('button-hover'); setDeleteStage(2) }}
                  className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ash hover:text-gtl-chalk transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {deleteStage === 2 && (
            <div className="flex flex-col gap-1.5 items-end">
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-gtl-smoke">
                JUST MAKING SURE YOUR THUMB DIDN'T SLIP — DO YOU STILL WANT TO CANCEL?
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => { play('button-hover'); setDeleteStage(0) }}
                  className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ash hover:text-gtl-chalk transition-colors"
                >
                  YES, KEEP IT SAFE
                </button>
                <button
                  type="button"
                  onClick={() => { play('menu-close'); onDelete(cycle.id) }}
                  className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-red hover:text-gtl-red-bright transition-colors"
                >
                  ACTUALLY, DELETE IT
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function LoadCyclePage() {
  const router = useRouter()
  const { play } = useSound()
  const [cycles, setCycles]       = useState([])
  const [ready, setReady]         = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [fireActive, setFireActive] = useState(false)
  const [fireDest, setFireDest]     = useState('/fitness/new/summary')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gtl-cycles')
      if (raw) setCycles(JSON.parse(raw))
    } catch (_) {}
    setReady(true)
  }, [])

  const selectedCycle = cycles.find((c) => c.id === selectedId) ?? null

  const handleSelect = (id) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const loadCycleIntoStorage = (cycle) => {
    try {
      localStorage.setItem('gtl-cycle-name',    cycle.name)
      localStorage.setItem('gtl-muscle-targets', JSON.stringify(cycle.targets))
      localStorage.setItem('gtl-training-days',  JSON.stringify(cycle.days))
      localStorage.setItem('gtl-daily-plan',     JSON.stringify(cycle.dailyPlan))
    } catch (_) {}
  }

  const handleActivate = (cycle) => {
    loadCycleIntoStorage(cycle)
    try { localStorage.removeItem('gtl-editing-cycle-id') } catch (_) {}
    setFireDest('/fitness/active')
    setFireActive(true)
  }

  const handleReview = (cycle) => {
    loadCycleIntoStorage(cycle)
    try { localStorage.setItem('gtl-editing-cycle-id', cycle.id) } catch (_) {}
    setFireDest('/fitness/new')
    setFireActive(true)
  }

  const handleDelete = (id) => {
    const updated = cycles.filter((c) => c.id !== id)
    setCycles(updated)
    setSelectedId(null)
    try {
      localStorage.setItem('gtl-cycles', JSON.stringify(updated))
    } catch (_) {}
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gtl-void">

      {/* Atmospherics */}
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(122,14,20,0.18) 0%, transparent 45%, rgba(74,10,14,0.28) 100%)' }}
      />

      {/* Kanji watermark — 歴 (record/history) */}
      <div
        className="absolute -top-16 -right-24 pointer-events-none select-none"
        aria-hidden="true"
        style={{
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '52rem', lineHeight: '0.8',
          color: '#d4181f', opacity: 0.045, fontWeight: 900,
        }}
      >
        歴
      </div>

      {/* Nav */}
      <nav className="relative z-10 shrink-0 flex items-center justify-between px-8 py-5">
        <RetreatButton />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / FITNESS / LOAD CYCLE
        </div>
      </nav>

      {/* Headline */}
      <div className="relative z-10 px-8 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-0.5 w-12 bg-gtl-red" />
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-gtl-red font-bold">
            WAR RECORD
          </span>
        </div>
        <h1 className="font-display text-5xl text-gtl-chalk leading-none -rotate-1">
          YOUR
          <span className="text-gtl-red gtl-headline-shadow-soft inline-block rotate-1 ml-3">CYCLES</span>
        </h1>
      </div>

      {/* Red slash divider */}
      <div
        className="relative z-10 mx-8 mb-10 h-[2px] bg-gtl-red"
        style={{ transform: 'skewX(-6deg)', transformOrigin: 'left center' }}
      />

      {/* Cycle list */}
      <section
        className="relative z-10 px-8"
        style={{ paddingBottom: selectedCycle ? '140px' : '80px' }}
      >
        {!ready ? null : cycles.length === 0 ? (
          <div className="flex flex-col items-start gap-6 py-20">
            <div className="font-display text-4xl text-gtl-ash -rotate-1">NO CYCLES FORGED</div>
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
              Complete the new cycle flow to record your first program.
            </div>
            <Link
              href="/fitness/new"
              className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red hover:text-gtl-red-bright transition-colors"
            >
              ← FORGE YOUR FIRST CYCLE
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6" style={{ overflow: 'visible' }}>
            {cycles.map((cycle, i) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                index={i}
                selected={selectedId === cycle.id}
                onSelect={() => handleSelect(cycle.id)}
              />
            ))}

            {/* New cycle link */}
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gtl-edge" />
              <Link
                href="/fitness/new"
                className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-ash hover:text-gtl-red transition-colors"
              >
                + FORGE A NEW CYCLE
              </Link>
              <div className="h-px flex-1 bg-gtl-edge" />
            </div>
          </div>
        )}
      </section>

      {/* Sticky bottom bar — appears when a cycle is selected */}
      <BottomBar
        cycle={selectedCycle}
        onActivate={handleActivate}
        onReview={handleReview}
        onDelete={handleDelete}
      />

      <FireFadeIn duration={900} />
      <FireTransition active={fireActive} onComplete={() => router.push(fireDest)} />
    </main>
  )
}
