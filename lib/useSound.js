'use client'
/*
 * useSound — central audio hook for Gritted Teeth Lifestyle.
 *
 * Design: every interaction in the app names a logical sound (e.g.
 * "card-hover", "card-tap", "transition-slash", "button-confirm"). The
 * SOUND_MAP routes those names to actual audio files. Right now we have
 * exactly one real file (click.wav), so every name maps to it. As we
 * design real sound, we add files and update only this map — the
 * component code doesn't change.
 *
 * Browser autoplay restrictions: audio cannot play until the user has
 * interacted with the page at least once. We track that and silently
 * swallow plays until first interaction.
 *
 * Mute: respects a localStorage flag set by a global mute toggle (TBD).
 */
import { useEffect, useRef, useCallback } from 'react'

// Logical sound names → actual file paths under /public/sounds
// Add new entries here as we design real sounds. For now everything
// routes to the placeholder click.
const SOUND_MAP = {
  'card-hover':       '/sounds/click.wav',
  'card-tap':         '/sounds/click.wav',
  'card-confirm':     '/sounds/click.wav',
  'transition-slash': '/sounds/click.wav',
  'button-hover':     '/sounds/click.wav',
  'button-confirm':   '/sounds/click.wav',
  'menu-open':        '/sounds/click.wav',
  'menu-close':       '/sounds/click.wav',
  'option-select':    '/sounds/click.wav',
  'stamp':            '/sounds/stamp.wav',
  'char-stamp':       '/sounds/stamp.wav',
  'char-erase':       '/sounds/click.wav',
  'mega-transition':  '/sounds/click.wav',
  'brand-confirm':    '/sounds/click.wav',
  'camera-swoosh':    '/sounds/camera-swoosh.wav',
}

// Per-sound default volume (0..1). Tweak so different cues feel right
// even though they share a file.
const SOUND_VOLUME = {
  'card-hover':       0.20,
  'card-tap':         0.55,
  'card-confirm':     0.7,
  'transition-slash': 0.85,
  'button-hover':     0.18,
  'button-confirm':   0.7,
  'menu-open':        0.5,
  'menu-close':       0.4,
  'option-select':    0.6,
  'stamp':            1.0,
  'char-stamp':       1.0,
  'char-erase':       0.35,
  'mega-transition':  1.0,
  'brand-confirm':    1.0,
  'camera-swoosh':    0.82,
}

// Module-level state — interaction tracking is global, not per-component
let HAS_INTERACTED = false
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    HAS_INTERACTED = true
    window.removeEventListener('pointerdown', markInteracted)
    window.removeEventListener('keydown', markInteracted)
  }
  window.addEventListener('pointerdown', markInteracted, { once: true })
  window.addEventListener('keydown', markInteracted, { once: true })
}

// Module-level audio cache so we don't re-fetch the same file on every play
const audioCache = new Map()
function getAudio(src) {
  if (audioCache.has(src)) return audioCache.get(src)
  const a = new Audio(src)
  a.preload = 'auto'
  audioCache.set(src, a)
  return a
}

// Read mute state from localStorage. Defaults to unmuted.
function isMuted() {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem('gtl-muted') === '1'
  } catch {
    return false
  }
}

/**
 * useSound — returns a function `play(name)` that plays a named sound.
 * Component code calls e.g. `play('card-tap')` on a click handler.
 */
export function useSound() {
  const lastPlayedRef = useRef({})

  const play = useCallback((name) => {
    if (typeof window === 'undefined') return
    if (!HAS_INTERACTED) return
    if (isMuted()) return

    const src = SOUND_MAP[name]
    if (!src) {
      console.warn(`[useSound] unknown sound name: ${name}`)
      return
    }

    // Throttle the same sound from firing too rapidly (e.g. spammy hover).
    // Char-stamp has a much shorter throttle so fast typing still triggers
    // a stamp on every keystroke.
    const minGap = name === 'char-stamp' ? 15 : 40
    const now = performance.now()
    const last = lastPlayedRef.current[name] || 0
    if (now - last < minGap) return
    lastPlayedRef.current[name] = now

    try {
      const audio = getAudio(src)
      // Clone-and-play so overlapping triggers don't cut each other off
      const clone = audio.cloneNode()
      clone.volume = SOUND_VOLUME[name] ?? 0.5
      const p = clone.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {/* swallow autoplay rejections silently */})
      }
    } catch (e) {
      // Silently ignore — sound is non-essential
    }
  }, [])

  return { play }
}

/**
 * Convenience helper for setting/reading mute outside of components.
 */
export function setMuted(muted) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('gtl-muted', muted ? '1' : '0')
  } catch {}
}
export function getMuted() {
  return isMuted()
}
