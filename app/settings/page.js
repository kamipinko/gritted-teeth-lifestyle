'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RetreatButton from '../../components/RetreatButton'
import { useSound } from '../../lib/useSound'

const KEY_SFX_VOLUME   = 'gtl-sfx-volume'
const KEY_BG_MUSIC_ON  = 'gtl-bg-music-on'
const KEY_HAPTICS_ON   = 'gtl-haptics-on'

function readNumber(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    const n = parseFloat(raw)
    return Number.isFinite(n) ? n : fallback
  } catch { return fallback }
}
function readFlag(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    return raw === '1'
  } catch { return fallback }
}
function writeRaw(key, value) {
  try { window.localStorage.setItem(key, value) } catch {}
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="group w-full flex items-center justify-between gap-4 px-5 py-4 bg-gtl-surface border border-gtl-edge [@media(hover:hover)]:hover:border-gtl-red transition-colors duration-200 outline-none"
      style={{ clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)' }}
    >
      <span className="font-mono text-[11px] tracking-[0.3em] uppercase font-bold text-gtl-chalk [@media(hover:hover)]:group-hover:text-gtl-paper transition-colors duration-200">
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold px-3 py-1 transition-colors duration-200
          ${value ? 'bg-gtl-red text-gtl-paper' : 'bg-gtl-void text-gtl-ash border border-gtl-edge'}`}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
      >
        {value ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}

function VolumeSlider({ value, onChange, onPreview }) {
  return (
    <div className="bg-gtl-surface border border-gtl-edge px-5 py-4" style={{ clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] tracking-[0.3em] uppercase font-bold text-gtl-chalk">SFX VOLUME</span>
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
        onMouseUp={onPreview}
        onTouchEnd={onPreview}
        className="w-full accent-gtl-red"
        aria-label="SFX volume"
      />
    </div>
  )
}

function DangerButton({ label, armedLabel, onConfirm }) {
  const [armed, setArmed] = useState(false)
  const { play } = useSound()
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])

  const handleClick = () => {
    if (!armed) {
      setArmed(true)
      play('menu-open')
      return
    }
    play('brand-confirm')
    onConfirm()
    setArmed(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group w-full flex items-center justify-between gap-4 px-5 py-4 border transition-colors duration-200 outline-none
        ${armed ? 'bg-gtl-red border-transparent' : 'bg-gtl-surface border-gtl-edge [@media(hover:hover)]:hover:border-gtl-red'}`}
      style={{ clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)' }}
    >
      <span className={`font-mono text-[11px] tracking-[0.3em] uppercase font-bold transition-colors duration-200
        ${armed ? 'text-gtl-paper' : 'text-gtl-chalk [@media(hover:hover)]:group-hover:text-gtl-red'}`}>
        {armed ? armedLabel : label}
      </span>
      <span aria-hidden="true" className={`font-display text-base leading-none transition-colors duration-200
        ${armed ? 'text-gtl-paper' : 'text-gtl-red'}`}>
        {armed ? '✕' : '➤︎'}
      </span>
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { play } = useSound()
  const [ready, setReady] = useState(false)
  const [activeProfile, setActiveProfile] = useState(null)
  const [sfxVolume, setSfxVolume] = useState(1)
  const [bgMusicOn, setBgMusicOn] = useState(true)
  const [hapticsOn, setHapticsOn] = useState(true)

  useEffect(() => {
    setActiveProfile(typeof window !== 'undefined' ? (localStorage.getItem('gtl-active-profile') || null) : null)
    setSfxVolume(readNumber(KEY_SFX_VOLUME, 1))
    setBgMusicOn(readFlag(KEY_BG_MUSIC_ON, true))
    setHapticsOn(readFlag(KEY_HAPTICS_ON, true))
    setReady(true)
  }, [])

  const handleSfxVolume = (v) => {
    setSfxVolume(v)
    writeRaw(KEY_SFX_VOLUME, String(v))
  }
  const previewSfx = () => play('card-confirm')

  const handleBgMusic = (next) => {
    setBgMusicOn(next)
    writeRaw(KEY_BG_MUSIC_ON, next ? '1' : '0')
    if (typeof window !== 'undefined' && window.__gtlBgMusic) {
      const a = window.__gtlBgMusic
      // Always cut any prior fade-in interval so toggling rapidly doesn't
      // leave a stale interval cranking volume back up after we paused.
      if (window.__gtlBgMusicFadeInterval) {
        clearInterval(window.__gtlBgMusicFadeInterval)
        window.__gtlBgMusicFadeInterval = null
      }
      // Reset volume to 0 too — if anything later plays the singleton (a
      // stale primeBgMusic race on a fresh launch, etc.), it stays silent.
      try { a.pause(); a.currentTime = 0; if (!next) a.volume = 0 } catch {}
      if (next) {
        // Restart from the top with the same fade-in shape used on the home
        // page's GateScreen tap (TARGET_VOL = 0.04, FADE_MS = 1500).
        a.volume = 0
        const playPromise = a.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            try { a.load(); a.play().catch(() => {}) } catch {}
          })
        }
        const TARGET_VOL = 0.04
        const FADE_MS = 1500
        const steps = FADE_MS / 50
        const increment = TARGET_VOL / steps
        window.__gtlBgMusicFadeInterval = setInterval(() => {
          const v = Math.min(TARGET_VOL, a.volume + increment)
          a.volume = v
          if (v >= TARGET_VOL) {
            clearInterval(window.__gtlBgMusicFadeInterval)
            window.__gtlBgMusicFadeInterval = null
          }
        }, 50)
      }
    }
    play(next ? 'option-select' : 'menu-close')
  }

  const handleHaptics = (next) => {
    setHapticsOn(next)
    writeRaw(KEY_HAPTICS_ON, next ? '1' : '0')
    if (next && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(40) } catch {}
    }
    play(next ? 'option-select' : 'menu-close')
  }

  // Wipe all keys scoped to the active profile (`gtl-${profile}-*`).
  const resetActiveProfileData = () => {
    if (typeof window === 'undefined') return
    const profile = localStorage.getItem('gtl-active-profile')
    if (!profile) return
    const prefix = `gtl-${profile}-`
    const toRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) toRemove.push(k)
    }
    toRemove.forEach(k => localStorage.removeItem(k))
  }

  // Remove the active profile from the roster, drop its scoped keys, then send
  // the user back to /fitness so they re-pick or create.
  const deleteActiveProfile = () => {
    if (typeof window === 'undefined') return
    const profile = localStorage.getItem('gtl-active-profile')
    resetActiveProfileData()
    if (profile) {
      try {
        const raw = localStorage.getItem('gtl-profiles')
        const list = raw ? JSON.parse(raw) : []
        const next = list.filter(n => n !== profile)
        localStorage.setItem('gtl-profiles', JSON.stringify(next))
      } catch {}
    }
    try { localStorage.removeItem('gtl-active-profile') } catch {}
    router.replace('/fitness')
  }

  return (
    <main className="relative min-h-screen bg-gtl-void flex flex-col overflow-hidden">
      <div className="absolute inset-0 gtl-noise pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(122,14,20,0.2) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.3) 100%)',
        }}
      />

      <div
        className="absolute -right-8 pointer-events-none select-none animate-flicker"
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
        設
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <nav
          className="relative shrink-0 flex items-center justify-between pl-0 pr-8 pb-6"
          style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
        >
          <RetreatButton href="/fitness/hub" />
        </nav>

        <section className="relative z-10 flex-1 flex flex-col px-8 pt-2 pb-12 max-w-3xl mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-16 bg-gtl-red" />
              <span className="font-matisse text-[10px] tracking-[0.3em] uppercase text-gtl-red">
                CONFIG
              </span>
            </div>
            <h1 className="font-matisse text-[5rem] md:text-[7rem] leading-[0.9] text-gtl-chalk -rotate-1">
              SETT<br />
              <span className="text-gtl-red inline-block rotate-1">INGS</span>
            </h1>
            {activeProfile && (
              <p className="font-matisse text-xs tracking-[0.25em] uppercase text-gtl-ash mt-3">
                ACTIVE WARRIOR — <span className="text-gtl-chalk">{activeProfile}</span>
              </p>
            )}
          </div>

          {/* AUDIO */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-8 bg-gtl-edge" />
              <span className="font-matisse text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">AUDIO</span>
              <div className="h-px flex-1 bg-gtl-edge" />
            </div>
            <div className="flex flex-col gap-3">
              {ready && <VolumeSlider value={sfxVolume} onChange={handleSfxVolume} onPreview={previewSfx} />}
              {ready && <Toggle label="BACKGROUND MUSIC" value={bgMusicOn} onChange={handleBgMusic} />}
            </div>
          </div>

          {/* HAPTICS */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-8 bg-gtl-edge" />
              <span className="font-matisse text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">HAPTICS</span>
              <div className="h-px flex-1 bg-gtl-edge" />
            </div>
            {ready && <Toggle label="VIBRATION" value={hapticsOn} onChange={handleHaptics} />}
          </div>

          {/* DANGER */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-8 bg-gtl-red" />
              <span className="font-matisse text-[9px] tracking-[0.4em] uppercase text-gtl-red">DANGER ZONE</span>
              <div className="h-px flex-1 bg-gtl-red" />
            </div>
            <p className="font-matisse text-[10px] tracking-[0.25em] uppercase text-gtl-ash mb-3">
              TAP ONCE TO ARM · TAP AGAIN TO CONFIRM
            </p>
            <div className="flex flex-col gap-3">
              <DangerButton
                label="RESET PROFILE DATA"
                armedLabel="TAP AGAIN — WIPES CYCLES + LOGS"
                onConfirm={resetActiveProfileData}
              />
              <DangerButton
                label="DELETE PROFILE"
                armedLabel="TAP AGAIN — REMOVES WARRIOR ENTIRELY"
                onConfirm={deleteActiveProfile}
              />
            </div>
            {!activeProfile && (
              <p className="font-matisse text-[9px] tracking-[0.3em] uppercase text-gtl-smoke mt-3">
                NO ACTIVE WARRIOR — RETURN TO IDENTITY
              </p>
            )}
          </div>

          {/* CREDITS */}
          <div className="mt-auto">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px w-8 bg-gtl-edge" />
              <span className="font-matisse text-[9px] tracking-[0.4em] uppercase text-gtl-smoke">CREDITS</span>
              <div className="h-px flex-1 bg-gtl-edge" />
            </div>
            <div className="bg-gtl-surface border border-gtl-edge px-5 py-4" style={{ clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)' }}>
              <p className="font-matisse text-2xl text-gtl-chalk leading-tight mb-2">GRITTED TEETH LIFESTYLE</p>
              <p className="font-matisse text-[10px] tracking-[0.25em] uppercase text-gtl-ash leading-relaxed">
                BUILT BY JORDAN HILLMAN<br />
                WITH ALEXANDER THUKU<br />
                INSPIRED BY PERSONA 5 + GURREN LAGANN<br />
                FORGED WITH GRITTED TEETH
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
