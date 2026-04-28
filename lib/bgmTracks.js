// Background music registry. Add new tracks by dropping the file into
// public/sounds/bgm/ and adding an entry below — the picker in /settings
// renders from this list and the home page reads the selected one.

export const BGM_TRACKS = [
  {
    id: 'chrono-cut-1',
    title: 'CHRONO CUT',
    subtitle: 'AMBIENT / DEFAULT',
    src: '/sounds/chrono-cut-1.wav',
  },
  {
    id: 'kami-ni-ada-nasu-mono',
    title: '神に仇成すもの',
    subtitle: 'HE WHO STANDS AGAINST GODS / P5',
    src: '/sounds/bgm/kami-ni-ada-nasu-mono.mp3',
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
