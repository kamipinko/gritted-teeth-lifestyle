'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CallingCard from '../components/CallingCard'
import HeistTransition from '../components/HeistTransition'

export default function Home() {
  const router = useRouter()
  const [transitioning, setTransitioning] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState('/fitness')

  const handleFitnessActivate = () => {
    setTransitionTarget('/fitness')
    setTransitioning(true)
  }

  const handleNutritionActivate = () => {
    setTransitionTarget('/diet')
    setTransitioning(true)
  }

  const handleTransitionComplete = () => {
    router.push(transitionTarget)
  }

  return (
    <>
      <main className="relative min-h-screen bg-gtl-void overflow-hidden">
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

        {/* Cards / corkboard */}
        <section className="relative z-10 px-8 pb-20 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            {/* Fitness — calling card */}
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

            {/* Nutrition — matching calling card */}
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

      {/* Heist transition overlay — sits above everything */}
      <HeistTransition
        active={transitioning}
        onComplete={handleTransitionComplete}
        title="GTL"
      />
    </>
  )
}
