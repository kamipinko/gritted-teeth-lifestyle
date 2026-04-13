'use client'
/*
 * Home page — the hideout. Two cards on a corkboard:
 *   1. Fitness — replaced with a Phantom Thieves calling card
 *   2. Nutrition — Kami's original card, untouched per current scope
 *
 * Tapping the Fitness calling card triggers the heist transition and
 * navigates to /fitness.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CallingCard from '../components/CallingCard'
import HeistTransition from '../components/HeistTransition'

export default function Home() {
  const router = useRouter()
  const [transitioning, setTransitioning] = useState(false)

  const handleFitnessActivate = () => {
    setTransitioning(true)
  }

  const handleTransitionComplete = () => {
    router.push('/fitness')
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

            {/* Nutrition — Kami's original card, preserved per scope */}
            <div className="md:translate-y-12">
              <Link href="/diet">
                <div className="group bg-brand-card border border-brand-border rounded-2xl p-8 cursor-pointer hover:border-brand-accent transition-all duration-300 hover:scale-[1.02]">
                  <div className="text-4xl mb-4">🥗</div>
                  <h2 className="text-2xl font-bold mb-2">Nutrition</h2>
                  <p className="text-brand-muted text-sm leading-relaxed">
                    Snap photos of your meals. Track macros and micronutrients. Get weekly diet advice tailored to your goals.
                  </p>
                  <div className="mt-6 text-brand-accent text-sm font-semibold group-hover:translate-x-1 transition-transform">
                    Start tracking →
                  </div>
                </div>
              </Link>
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
