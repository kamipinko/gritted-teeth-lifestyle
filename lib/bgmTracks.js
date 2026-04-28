// Background music registry. Add new tracks by dropping the file into
// public/sounds/bgm/ and adding an entry below — the picker in /settings
// renders from this list and the home page reads the selected one.

// `title` is the user-facing label in /settings — Jordan wants neutral
// TRACK 1 / TRACK 2 numbering rather than song names. `subtitle` holds the
// real descriptor for reference. File names on disk are untouched.
export const BGM_TRACKS = [
  {
    id: 'chrono-cut-1',
    title: 'TRACK 1',
    subtitle: 'AMBIENT / DEFAULT',
    src: '/sounds/chrono-cut-1.wav',
  },
  {
    id: 'kami-ni-ada-nasu-mono',
    title: 'TRACK 2',
    subtitle: 'BATTLE / FOE OF THE GODS',
    src: '/sounds/bgm/kami-ni-ada-nasu-mono.mp3',
  },
  {
    id: 'smt-v-jouin-high-school',
    title: 'TRACK 3',
    subtitle: 'SMT V / JOUIN HIGH SCHOOL',
    src: '/sounds/bgm/smt-v-jouin-high-school.mp3',
  },
  {
    id: 'smt-v-doubt',
    title: 'TRACK 4',
    subtitle: 'SMT V / DOUBT',
    src: '/sounds/bgm/smt-v-doubt.mp3',
  },
  {
    id: 'smt-v-cadavers-hollow',
    title: 'TRACK 5',
    subtitle: "SMT V / CADAVER'S HOLLOW",
    src: '/sounds/bgm/smt-v-cadavers-hollow.mp3',
  },
]

export const DEFAULT_BGM_TRACK_ID = 'chrono-cut-1'
export const BGM_TRACK_KEY = 'gtl-bgm-track'

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
