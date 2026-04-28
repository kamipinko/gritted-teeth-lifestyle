'use client'
import { useEffect } from 'react'

/* iOS PWA standalone-mode soft-keyboard bug. Documented working PWAs (Twitter,
 * Mastodon clients) summon the keyboard fine, so the bug isn't absolute — we
 * try el.click() instead of el.focus() because WebKit treats click() as a
 * stronger user-gesture signal for keyboard summoning. */
export function IOSPWAKeyboardFix() {
  useEffect(() => {
    const handler = (e) => {
      const t = e.target
      if (!t) return
      let el = t
      let depth = 0
      while (el && depth < 5) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (document.activeElement !== el) {
            el.click()
          }
          break
        }
        el = el.parentElement
        depth++
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
  return null
}
