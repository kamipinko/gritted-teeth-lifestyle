import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black tracking-tight mb-3">
          GRITTED TEETH
        </h1>
        <p className="text-brand-muted text-lg tracking-widest uppercase">Lifestyle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Diet Branch */}
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

        {/* Fitness Branch */}
        <Link href="/fitness">
          <div className="group bg-brand-card border border-brand-border rounded-2xl p-8 cursor-pointer hover:border-brand-gold transition-all duration-300 hover:scale-[1.02]">
            <div className="text-4xl mb-4">💪</div>
            <h2 className="text-2xl font-bold mb-2">Fitness</h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Tell us your schedule and goals. Get a custom workout cycle with YouTube guides for every exercise.
            </p>
            <div className="mt-6 text-brand-gold text-sm font-semibold group-hover:translate-x-1 transition-transform">
              Build your plan →
            </div>
          </div>
        </Link>
      </div>
    </main>
  )
}
