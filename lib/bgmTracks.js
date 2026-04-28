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
    genre: 'SET 1',
  },
  {
    id: 'kami-ni-ada-nasu-mono',
    title: 'TRACK 2',
    subtitle: 'BATTLE / FOE OF THE GODS',
    src: '/sounds/bgm/kami-ni-ada-nasu-mono.mp3',
    genre: 'SET 1',
  },
  {
    id: 'smt-v-jouin-high-school',
    title: 'TRACK 3',
    subtitle: 'SMT V / JOUIN HIGH SCHOOL',
    src: '/sounds/bgm/smt-v-jouin-high-school.mp3',
    genre: 'SET 1',
  },
  {
    id: 'smt-v-doubt',
    title: 'TRACK 4',
    subtitle: 'SMT V / DOUBT',
    src: '/sounds/bgm/smt-v-doubt.mp3',
    genre: 'SET 1',
  },
  {
    id: 'smt-v-cadavers-hollow',
    title: 'TRACK 5',
    subtitle: "SMT V / CADAVER'S HOLLOW",
    src: '/sounds/bgm/smt-v-cadavers-hollow.mp3',
    genre: 'SET 1',
  },
  {
    id: 'smt-v-tokyo-dawn',
    title: 'TRACK 6',
    subtitle: 'SMT V / TOKYO — DAWN',
    src: '/sounds/bgm/smt-v-tokyo-dawn.mp3',
    genre: 'SET 1',
  },
  {
    id: 'smt-v-battle-destruction',
    title: 'TRACK 7',
    subtitle: 'SMT V / BATTLE — DESTRUCTION',
    src: '/sounds/bgm/smt-v-battle-destruction.mp3',
    genre: 'SET 1',
  },
  {
    id: 'smt-v-daat-odaiba',
    title: 'TRACK 8',
    subtitle: "SMT V / DA'AT — ODAIBA",
    src: '/sounds/bgm/smt-v-daat-odaiba.mp3',
    genre: 'SET 1',
  },
  {
    id: 'smt-v-empyrean',
    title: 'TRACK 9',
    subtitle: 'SMT V / EMPYREAN',
    src: '/sounds/bgm/smt-v-empyrean.mp3',
    genre: 'SET 1',
  },
  {
    id: 'asura-kai-shop',
    title: 'TRACK 10',
    subtitle: '阿修羅会公認の店 / ASURA-KAI SHOP',
    src: '/sounds/bgm/asura-kai-shop.mp3',
    genre: 'SET 1',
  },
  {
    id: 'normal-battle',
    title: 'TRACK 11',
    subtitle: '通常戦闘 / NORMAL BATTLE',
    src: '/sounds/bgm/normal-battle.mp3',
    genre: 'SET 1',
  },
  {
    id: 'latch-brothers-koto-stomp',
    title: 'TRACK 12',
    subtitle: 'THE LATCH BROTHERS / KOTO STOMP',
    src: '/sounds/bgm/latch-brothers-koto-stomp.mp3',
    genre: 'SET 2',
  },
  {
    id: 'prunes-rockin-the-mic-latch-remix',
    title: 'TRACK 13',
    subtitle: "THE PRUNES FT. FREESTYLE / ROCKIN' THE MIC (LATCH BROTHERS REMIX)",
    src: '/sounds/bgm/prunes-rockin-the-mic-latch-remix.mp3',
    genre: 'SET 2',
  },
  {
    id: 'bran-van-3000-the-answer-latch-remix',
    title: 'TRACK 14',
    subtitle: 'BRAN VAN 3000 / THE ANSWER (LATCH BROTHERS REMIX)',
    src: '/sounds/bgm/bran-van-3000-the-answer-latch-remix.mp3',
    genre: 'SET 2',
  },
  {
    id: 'let-mom-sleep-no-sleep-remix',
    title: 'TRACK 15',
    subtitle: 'LET MOM SLEEP (NO SLEEP REMIX)',
    src: '/sounds/bgm/let-mom-sleep-no-sleep-remix.mp3',
    genre: 'SET 2',
  },
  {
    id: 'grace-and-glory-bbmh-mix',
    title: 'TRACK 16',
    subtitle: 'GRACE AND GLORY (B.B.M.H. MIX)',
    src: '/sounds/bgm/grace-and-glory-bbmh-mix.mp3',
    genre: 'SET 2',
  },
  {
    id: 'jsrf-aisle-10',
    title: 'TRACK 17',
    subtitle: 'JET SET RADIO FUTURE / AISLE 10',
    src: '/sounds/bgm/jsrf-aisle-10.mp3',
    genre: 'SET 2',
  },
]

export const DEFAULT_BGM_TRACK_ID = 'chrono-cut-1'
export const BGM_TRACK_KEY = 'gtl-bgm-track'

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

export function getCurrentBgmTrack() {
  if (typeof window === 'undefined') {
    return BGM_TRACKS.find(t => t.id === DEFAULT_BGM_TRACK_ID) || BGM_TRACKS[0]
  }
  let id
  try { id = window.localStorage.getItem(BGM_TRACK_KEY) } catch {}
  return BGM_TRACKS.find(t => t.id === id)
    || BGM_TRACKS.find(t => t.id === DEFAULT_BGM_TRACK_ID)
    || BGM_TRACKS[0]
}
