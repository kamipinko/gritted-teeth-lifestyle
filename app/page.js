'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CallingCard from '../components/CallingCard'
import HeistTransition from '../components/HeistTransition'
import GateScreen from '../components/GateScreen'

// Module-level singleton: bg music persists across React re-mounts (e.g. when the
// user navigates back to the home page from /fitness). Without this, the unmount
// drops the component-scoped ref but the Audio keeps looping in the browser, and
// the next mount starts a SECOND audio overlapping the first → cacophony.
let bgMusicAudio = null

function startBgMusic() {
  if (bgMusicAudio) return
  const TARGET_VOL = 0.04
  const FADE_MS = 1500

  const fadeIn = (audio) => {
    audio.volume = 0
    audio.play().catch(() => {})
    const steps = FADE_MS / 50
    const increment = TARGET_VOL / steps
    const interval = setInterval(() => {
      const next = Math.min(TARGET_VOL, audio.volume + increment)
      audio.volume = next
      if (next >= TARGET_VOL) clearInterval(interval)
    }, 50)
  }

  const audio = new Audio('/sounds/chrono-cut-1.wav')
  audio.addEventListener('ended', () => {
    audio.currentTime = 0
    fadeIn(audio)
  })
  fadeIn(audio)
  bgMusicAudio = audio
}

export default function Home() {
  const router = useRouter()
  const [entered, setEntered] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState('/fitness')

  const handleFitnessActivate = () => {
    startBgMusic()
    setTransitionTarget('/fitness')
    setTransitioning(true)
  }

  const handleNutritionActivate = () => {
    startBgMusic()
    setTransitionTarget('/diet')
    setTransitioning(true)
  }

  const handleTransitionComplete = () => {
    router.push(transitionTarget)
  }

  return (
    <>
      {/* Gate screen — sits above everything until user enters */}
      {!entered && <GateScreen onEnter={() => setEntered(true)} />}

      {/* Main content — hidden behind gate, snaps in on reveal */}
      <main
        className="relative min-h-screen bg-gtl-void overflow-hidden"
        style={{
          animation: entered ? 'gate-reveal 650ms cubic-bezier(0.3, 0, 0.4, 1) both' : 'none',
          opacity: entered ? undefined : 0,
        }}
      >
        {/* Background atmospherics */}
        <div className="absolute inset-0 gtl-noise" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 10%, rgba(74,10,14,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(122,14,20,0.3) 0%, transparent 50%)',
          }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-8 py-6">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-ash">
            HIDEOUT / 01
          </div>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
            GRITTED TEETH LIFESTYLE
          </div>
        </header>

        {/* Logo */}
        <section className="relative z-10 flex justify-center pt-6 pb-8">
          <img
            src="/logo.png"
            alt="Gritted Teeth Lifestyle"
            style={{ width: 'clamp(180px, 45vw, 320px)', height: 'clamp(180px, 45vw, 320px)', borderRadius: '50%', objectFit: 'cover' }}
          />
        </section>

        {/* Cards */}
        <section className="relative z-10 px-8 pb-20 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div className="md:translate-y-4">
              <CallingCard
                title="FITNESS"
                subtitle="TARGET / PALACE 01"
                body="YOUR WEAKNESS HAS BEEN NOTED. THE CLIMB BEGINS THE MOMENT YOU PICK UP THIS CARD."
                signOff="WITH GRITTED TEETH"
                onActivate={handleFitnessActivate}
                rotate="-rotate-2"
              />
            </div>
            <div className="md:translate-y-12">
              <CallingCard
                title="NUTRITION"
                subtitle="TARGET / PALACE 02"
                body="WHAT YOU EAT IS WHO YOU ARE. EVERY MEAL IS A CHOICE. MAKE IT COUNT."
                signOff="STAY DISCIPLINED"
                onActivate={handleNutritionActivate}
                rotate="rotate-2"
                compact
              />
            </div>
          </div>
        </section>
      </main>

      <HeistTransition
        active={transitioning}
        onComplete={handleTransitionComplete}
        title="GTL"
      />
    </>
  )
}
