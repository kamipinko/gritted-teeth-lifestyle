// Background music registry. Add new tracks by dropping the file into
// public/sounds/bgm/ and adding an entry below — the picker in /settings
// renders from this list, grouped by genre.

// `title` is the neutral user-facing label (TRACK N).
// `subtitle` holds the actual descriptor.
// `genre` is the section header in the picker — tracks are grouped + ordered
// by their first appearance per genre, then in registry order within.
// File names on disk are untouched.
export const BGM_TRACKS = [
  {
    id: 'chrono-cut-1',
    title: 'TRACK 1',
    subtitle: 'AMBIENT / DEFAULT',
    src: '/sounds/chrono-cut-1.wav',
    genre: 'DEMONS',
  },
  {
    id: 'kami-ni-ada-nasu-mono',
    title: 'TRACK 2',
    subtitle: 'BATTLE / FOE OF THE GODS',
    src: '/sounds/bgm/kami-ni-ada-nasu-mono.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'smt-v-jouin-high-school',
    title: 'TRACK 3',
    subtitle: 'SMT V / JOUIN HIGH SCHOOL',
    src: '/sounds/bgm/smt-v-jouin-high-school.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'smt-v-doubt',
    title: 'TRACK 4',
    subtitle: 'SMT V / DOUBT',
    src: '/sounds/bgm/smt-v-doubt.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'smt-v-cadavers-hollow',
    title: 'TRACK 5',
    subtitle: "SMT V / CADAVER'S HOLLOW",
    src: '/sounds/bgm/smt-v-cadavers-hollow.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'smt-v-tokyo-dawn',
    title: 'TRACK 6',
    subtitle: 'SMT V / TOKYO — DAWN',
    src: '/sounds/bgm/smt-v-tokyo-dawn.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'smt-v-battle-destruction',
    title: 'TRACK 7',
    subtitle: 'SMT V / BATTLE — DESTRUCTION',
    src: '/sounds/bgm/smt-v-battle-destruction.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'smt-v-daat-odaiba',
    title: 'TRACK 8',
    subtitle: "SMT V / DA'AT — ODAIBA",
    src: '/sounds/bgm/smt-v-daat-odaiba.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'smt-v-empyrean',
    title: 'TRACK 9',
    subtitle: 'SMT V / EMPYREAN',
    src: '/sounds/bgm/smt-v-empyrean.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'asura-kai-shop',
    title: 'TRACK 10',
    subtitle: '阿修羅会公認の店 / ASURA-KAI SHOP',
    src: '/sounds/bgm/asura-kai-shop.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'normal-battle',
    title: 'TRACK 11',
    subtitle: '通常戦闘 / NORMAL BATTLE',
    src: '/sounds/bgm/normal-battle.mp3',
    genre: 'DEMONS',
  },
  {
    id: 'samurai-champloo-intro',
    title: 'TRACK 12',
    subtitle: 'SAMURAI CHAMPLOO / INTRO',
    src: '/sounds/bgm/samurai-champloo-intro.mp3',
    genre: 'STREETS',
  },
  {
    id: 'latch-brothers-koto-stomp',
    title: 'TRACK 13',
    subtitle: 'THE LATCH BROTHERS / KOTO STOMP',
    src: '/sounds/bgm/latch-brothers-koto-stomp.mp3',
    genre: 'STREETS',
  },
  {
    id: 'prunes-rockin-the-mic-latch-remix',
    title: 'TRACK 14',
    subtitle: "THE PRUNES FT. FREESTYLE / ROCKIN' THE MIC (LATCH BROTHERS REMIX)",
    src: '/sounds/bgm/prunes-rockin-the-mic-latch-remix.mp3',
    genre: 'STREETS',
  },
  {
    id: 'bran-van-3000-the-answer-latch-remix',
    title: 'TRACK 15',
    subtitle: 'BRAN VAN 3000 / THE ANSWER (LATCH BROTHERS REMIX)',
    src: '/sounds/bgm/bran-van-3000-the-answer-latch-remix.mp3',
    genre: 'STREETS',
  },
  {
    id: 'let-mom-sleep-no-sleep-remix',
    title: 'TRACK 16',
    subtitle: 'LET MOM SLEEP (NO SLEEP REMIX)',
    src: '/sounds/bgm/let-mom-sleep-no-sleep-remix.mp3',
    genre: 'STREETS',
  },
  {
    id: 'grace-and-glory-bbmh-mix',
    title: 'TRACK 17',
    subtitle: 'GRACE AND GLORY (B.B.M.H. MIX)',
    src: '/sounds/bgm/grace-and-glory-bbmh-mix.mp3',
    genre: 'STREETS',
  },
  {
    id: 'jsrf-aisle-10',
    title: 'TRACK 18',
    subtitle: 'JET SET RADIO FUTURE / AISLE 10',
    src: '/sounds/bgm/jsrf-aisle-10.mp3',
    genre: 'STREETS',
  },
  {
    id: 'sneakman-toronto-mix',
    title: 'TRACK 19',
    subtitle: 'JET SET RADIO / SNEAKMAN (TORONTO MIX)',
    src: '/sounds/bgm/sneakman-toronto-mix.mp3',
    genre: 'STREETS',
  },
  {
    id: 'humming-the-bassline-ds-remix',
    title: 'TRACK 20',
    subtitle: 'HUMMING THE BASSLINE (D.S. REMIX)',
    src: '/sounds/bgm/humming-the-bassline-ds-remix.mp3',
    genre: 'STREETS',
  },
  {
    id: 'cthulhu-rise-opus-24',
    title: 'TRACK 21',
    subtitle: 'CTHULHU RISE / OPUS 24',
    src: '/sounds/bgm/cthulhu-rise-opus-24.mp3',
    genre: 'ABYSS',
  },
  {
    id: 'cthulhu-rise-opus-22',
    title: 'TRACK 22',
    subtitle: 'CTHULHU RISE / OPUS 22',
    src: '/sounds/bgm/cthulhu-rise-opus-22.mp3',
    genre: 'ABYSS',
  },
  {
    id: 'cthulhu-rise-opus-29',
    title: 'TRACK 23',
    subtitle: 'CTHULHU RISE / OPUS 29',
    src: '/sounds/bgm/cthulhu-rise-opus-29.mp3',
    genre: 'ABYSS',
  },
  {
    id: 'cthulhu-rise-opus-33',
    title: 'TRACK 24',
    subtitle: 'CTHULHU RISE / OPUS 33',
    src: '/sounds/bgm/cthulhu-rise-opus-33.mp3',
    genre: 'ABYSS',
  },
  {
    id: 'cthulhu-rise-opus-34',
    title: 'TRACK 25',
    subtitle: 'CTHULHU RISE / OPUS 34',
    src: '/sounds/bgm/cthulhu-rise-opus-34.mp3',
    genre: 'ABYSS',
  },
  {
    id: 'cthulhu-rise-opus-35',
    title: 'TRACK 26',
    subtitle: 'CTHULHU RISE / OPUS 35',
    src: '/sounds/bgm/cthulhu-rise-opus-35.mp3',
    genre: 'ABYSS',
  },
  {
    id: 'mother-3-as-you-wish',
    title: 'TRACK 27',
    subtitle: 'MOTHER 3 / AS YOU WISH',
    src: '/sounds/bgm/mother-3-as-you-wish.mp3',
    genre: 'JOURNEY',
  },
  {
    id: 'mother-3-lets-begin',
    title: 'TRACK 28',
    subtitle: "MOTHER 3 / LET'S BEGIN",
    src: '/sounds/bgm/mother-3-lets-begin.mp3',
    genre: 'JOURNEY',
  },
  {
    id: 'mother-3-f-f-fire',
    title: 'TRACK 29',
    subtitle: 'MOTHER 3 / F-F-FIRE!',
    src: '/sounds/bgm/mother-3-f-f-fire.mp3',
    genre: 'JOURNEY',
  },
  {
    id: 'track-i',
    title: 'TRACK 30',
    subtitle: 'I',
    src: '/sounds/bgm/track-i.mp3',
    genre: 'DEATHPHONKE',
  },
  {
    id: 'track-ii',
    title: 'TRACK 31',
    subtitle: 'II',
    src: '/sounds/bgm/track-ii.mp3',
    genre: 'DEATHPHONKE',
  },
]

export const DEFAULT_BGM_TRACK_ID = 'chrono-cut-1'
export const BGM_TRACK_KEY = 'gtl-bgm-track'
export const BGM_VOLUME_KEY = 'gtl-bgm-volume'
export const BGM_RANDOM_ON_LAUNCH_KEY = 'gtl-bgm-random-on-launch'

// Base ceiling — the volume the engine fades up to at 100% user multiplier.
// 0.04 lands just above subliminal so the BGM doesn't drown the SFX.
export const BGM_BASE_VOL = 0.04

// User-selected BGM volume multiplier (0..1). Default 1 = full BGM_BASE_VOL.
// Stored value is the slider's linear position; squared on read so the
// curve matches perceived loudness and feels more responsive on drag.
export function getBgmVolumeMultiplier() {
  if (typeof window === 'undefined') return 1
  try {
    const raw = window.localStorage.getItem(BGM_VOLUME_KEY)
    if (raw == null) return 1
    const n = parseFloat(raw)
    if (!Number.isFinite(n)) return 1
    const v = Math.max(0, Math.min(1, n))
    return v * v
  } catch { return 1 }
}

// Final fade-up target = base × user multiplier.
export function getBgmTargetVol() {
  return BGM_BASE_VOL * getBgmVolumeMultiplier()
}

// Random-on-launch flag — when true, a fresh BGM singleton picks a random
// track instead of honouring the stored gtl-bgm-track preference.
export function getRandomOnLaunch() {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(BGM_RANDOM_ON_LAUNCH_KEY) === '1' } catch { return false }
}

// Pick a random track id, optionally excluding the currently-active one so
// "RANDOMIZE NOW" never re-picks what's already playing.
export function getRandomTrackId(excludeId) {
  const pool = BGM_TRACKS.filter(t => t.id !== excludeId)
  const list = pool.length > 0 ? pool : BGM_TRACKS
  return list[Math.floor(Math.random() * list.length)].id
}

// Returns [{ genre, tracks: [...] }] preserving registry order.
export function getBgmTracksByGenre() {
  const seen = new Map()
  for (const track of BGM_TRACKS) {
    const g = track.genre || 'OTHER'
    if (!seen.has(g)) seen.set(g, [])
    seen.get(g).push(track)
  }
  return Array.from(seen, ([genre, tracks]) => ({ genre, tracks }))
}

// Web Audio gain pipeline for BGM. iOS PWA hardware-locks
// HTMLAudioElement.volume (audio.volume = 0.5 is silently ignored), but
// honours GainNode.gain. Routing the BGM <audio> through
// MediaElementAudioSourceNode → GainNode → destination means the volume
// slider actually controls loudness on iPhone.
//
// One MediaElementAudioSourceNode is bound to a given <audio> element for
// life — once created, the audio element no longer outputs to the default
// destination. So we always prefer this gain over audio.volume from this
// point forward. Audio element's own volume stays at 1.0; the GainNode is
// the truth.
//
// Returns null when the platform doesn't support Web Audio (very old
// browsers, some embedded WebViews) so callers can fall back to
// audio.volume gracefully.
export function getBgmGainNode() {
  if (typeof window === 'undefined') return null
  if (window.__gtlBgMusicGain) return window.__gtlBgMusicGain
  const audio = window.__gtlBgMusic
  if (!audio) return null
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  try {
    let ctx = window.__gtlBgMusicCtx
    if (!ctx) {
      ctx = new Ctor()
      window.__gtlBgMusicCtx = ctx
    }
    const source = ctx.createMediaElementSource(audio)
    const gain = ctx.createGain()
    gain.gain.value = 0
    source.connect(gain).connect(ctx.destination)
    // Audio element's own volume must stay at 1 from here on — gain is the
    // only volume-control point.
    audio.volume = 1
    window.__gtlBgMusicGain = gain
    return gain
  } catch {
    return null
  }
}

// Wake the BGM AudioContext if iOS suspended it (e.g. backgrounding).
// Caller should be inside a user-gesture stack for the resume to take.
export function resumeBgmCtx() {
  if (typeof window === 'undefined') return
  const ctx = window.__gtlBgMusicCtx
  if (ctx && ctx.state === 'suspended') {
    try { ctx.resume() } catch {}
  }
}

// Used by the home-page singleton on creation, and by settings pages to
// display "what's currently playing." Source-of-truth order:
//   1. The live picked track id on window.__gtlBgMusicTrackId, if a
//      singleton has already been created in this session. This avoids
//      re-randomizing on every call when random-on-launch is set — settings
//      UI must agree with what's actually playing.
//   2. Random pick if random-on-launch is set AND no singleton exists yet
//      (first call this session — typically the home-page IIFE).
//   3. Stored gtl-bgm-track preference.
//   4. DEFAULT_BGM_TRACK_ID.
export function getCurrentBgmTrack() {
  if (typeof window === 'undefined') {
    return BGM_TRACKS.find(t => t.id === DEFAULT_BGM_TRACK_ID) || BGM_TRACKS[0]
  }
  if (window.__gtlBgMusicTrackId) {
    const live = BGM_TRACKS.find(t => t.id === window.__gtlBgMusicTrackId)
    if (live) return live
  }
  if (getRandomOnLaunch()) {
    const id = getRandomTrackId()
    return BGM_TRACKS.find(t => t.id === id) || BGM_TRACKS[0]
  }
  let id
  try { id = window.localStorage.getItem(BGM_TRACK_KEY) } catch {}
  return BGM_TRACKS.find(t => t.id === id)
    || BGM_TRACKS.find(t => t.id === DEFAULT_BGM_TRACK_ID)
    || BGM_TRACKS[0]
}
