import Link from 'next/link'

export default function LoadCyclePage() {
  return (
    <main className="relative min-h-screen bg-gtl-void flex flex-col items-center justify-center px-8">
      <div className="absolute inset-0 gtl-noise" />
      <div className="relative z-10 text-center max-w-lg">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red mb-4">
          PALACE / FITNESS / LOAD CYCLE
        </div>
        <h1 className="font-display text-7xl text-gtl-chalk leading-none -rotate-1 mb-6">
          STUB
        </h1>
        <p className="font-mono text-xs tracking-wide uppercase text-gtl-ash mb-10">
          The active-cycle view goes here in the next slice. For now this is
          intentionally empty.
        </p>
        <Link
          href="/fitness"
          className="inline-block font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-ash hover:text-gtl-red transition-colors"
        >
          ← RETURN
        </Link>
      </div>
    </main>
  )
}
