'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSound } from '../../lib/useSound'
import HeistTransition from '../../components/HeistTransition'
import RetreatButton from '../../components/RetreatButton'

function ProfileChip({ name, onSelect }) {
  const { play } = useSound()
  return (
    <button
      type="button"
      onClick={() => { play('option-select'); onSelect(name) }}
      className="relative group outline-none text-left"
    >
      {/* Hover effects gated on (hover: hover) so iOS doesn't sticky-hover on first tap. */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-200 bg-gtl-surface border border-gtl-edge [@media(hover:hover)]:group-hover:bg-gtl-red [@media(hover:hover)]:group-hover:border-transparent"
        style={{ clipPath: 'polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)' }}
        aria-hidden="true"
      />
      <div className="relative px-6 py-3 flex items-center gap-3">
        <span className="font-display text-2xl leading-none transition-colors duration-200 text-gtl-chalk [@media(hover:hover)]:group-hover:text-gtl-paper">
          {name.toUpperCase()}
        </span>
        <span className="font-display text-base leading-none transition-all duration-200 text-gtl-red [@media(hover:hover)]:group-hover:text-gtl-paper [@media(hover:hover)]:group-hover:translate-x-1">➤︎</span>
      </div>
    </button>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { play } = useSound()
  const [profiles, setProfiles] = useState([])
  const [input, setInput] = useState('')
  const [ready, setReady] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gtl-profiles')
      if (raw) setProfiles(JSON.parse(raw))
    } catch (_) {}
    setReady(true)
  }, [])

  const selectProfile = (name) => {
    try {
      localStorage.setItem('gtl-active-profile', name)
    } catch (_) {}
    setTransitioning(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = input.trim()
    if (!name) return
    try {
      const existing = JSON.parse(localStorage.getItem('gtl-profiles') || '[]')
      if (!existing.includes(name)) {
        const updated = [name, ...existing]
        localStorage.setItem('gtl-profiles', JSON.stringify(updated))
        setProfiles(updated)
      }
    } catch (_) {}
    play('option-select')
    selectProfile(name)
  }

  const trimmed = input.trim()
  const isNew = trimmed.length > 0 && !profiles.includes(trimmed)
  const isExisting = trimmed.length > 0 && profiles.includes(trimmed)

  return (
    <>
    <main className="relative min-h-screen bg-gtl-void flex flex-col overflow-hidden">
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(122,14,20,0.2) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.3) 100%)',
        }}
      />

      {/* Kanji watermark — top offset rooted at the safe-area floor so it never clips
          into the iOS Dynamic Island camera area. */}
      <div
        className="absolute -left-8 pointer-events-none select-none animate-flicker"
        aria-hidden="true"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) - 48px)',
          fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
          fontSize: '40rem',
          lineHeight: '0.8',
          color: '#ffffff',
          opacity: 0.04,
          fontWeight: 900,
        }}
      >
        名
      </div>

      {/* Content wrapper — atmospheric layers above paint full-bleed (incl. safe area);
          this wrapper holds the actual UI and pads down by the iOS top inset. */}
      <div className="relative z-10 flex-1 flex flex-col">
      {/* Nav */}
      <nav
        className="relative shrink-0 flex items-center justify-between pl-0 pr-8 pb-6"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <RetreatButton href="/" />
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
          PALACE / IDENTITY
        </div>
      </nav>

      {/* Main */}
      <section className="relative z-10 flex-1 flex flex-col justify-center px-8 pb-20 max-w-3xl mx-auto w-full">
        {/* Headline */}
        <div className="mb-14">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-16 bg-gtl-red" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red">
              IDENTITY / 01
            </span>
          </div>
          <h1 className="font-display text-[5rem] md:text-[7rem] leading-[0.9] text-gtl-chalk -rotate-1">
            WHO<br />
            <span className="text-gtl-red inline-block rotate-1">ARE YOU</span>
          </h1>
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-gtl-ash mt-6 max-w-sm">
            Your cycles, lifts, and EXP belong to you alone.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} action="/" method="post" className="mb-10">
          <div className="flex items-stretch gap-0">
            <div className="relative flex-1">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: 'polygon(0% 0%, 97% 0%, 100% 100%, 0% 100%)',
                  background: '#111115',
                  border: '1px solid #3a3a42',
                }}
                aria-hidden="true"
              />
              {/* Visible-prompt overlay — shows when input is empty. Sits inside the
                  input's slot but is a sibling div, NOT the input's placeholder. iOS
                  heuristics scan placeholder text for "name"/"email" keywords; moving
                  the prompt out of the placeholder attribute kills that signal. */}
              {input.length === 0 && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none flex items-center px-4 md:px-6 font-display text-lg md:text-2xl text-gtl-smoke tracking-wide uppercase"
                >
                  ENTER YOUR NAME
                </div>
              )}
              <input
                ref={inputRef}
                type="search"
                name="gtl-warrior-token"
                value={input}
                onChange={e => setInput(e.target.value)}
                inputMode="text"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={24}
                className="relative w-full bg-transparent font-display text-lg md:text-2xl text-gtl-chalk tracking-wide uppercase px-4 md:px-6 py-4 outline-none [&::-webkit-search-cancel-button]:hidden"
                style={{ caretColor: '#d4181f' }}
              />
            </div>
            <button
              type="submit"
              disabled={!trimmed}
              className="relative shrink-0 outline-none group"
            >
              <div
                className={`absolute inset-0 pointer-events-none transition-colors duration-200
                  ${trimmed ? 'bg-gtl-red group-hover:bg-gtl-red-bright' : 'bg-gtl-surface'}`}
                style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }}
                aria-hidden="true"
              />
              <div className="relative px-4 md:px-8 py-4 flex items-center gap-2">
                <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-200
                  ${trimmed ? 'text-gtl-paper' : 'text-gtl-ash'}`}>
                  {isNew ? 'CREATE' : isExisting ? 'ENTER' : 'ENTER'}
                </span>
                <span className={`font-display text-lg leading-none transition-colors duration-200
                  ${trimmed ? 'text-gtl-paper' : 'text-gtl-ash'}`}>➤︎</span>
              </div>
            </button>
          </div>
          {isNew && (
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-gtl-ash mt-2 pl-1">
              NEW WARRIOR — A FRESH RECORD WILL BE CREATED
            </p>
          )}
        </form>

        {/* Existing profiles */}
        {ready && profiles.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-px w-8 bg-gtl-edge" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">
                KNOWN WARRIORS
              </span>
              <div className="h-px flex-1 bg-gtl-edge" />
            </div>
            <div className="flex flex-col gap-3">
              {profiles.map(name => (
                <ProfileChip key={name} name={name} onSelect={selectProfile} />
              ))}
            </div>
          </div>
        )}
      </section>
      </div>
    </main>

    <HeistTransition
      active={transitioning}
      onComplete={() => router.push('/fitness/hub')}
    />
    </>
  )
}
