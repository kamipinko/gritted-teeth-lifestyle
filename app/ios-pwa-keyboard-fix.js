'use client'
import { useEffect } from 'react'

/* iOS PWA standalone mode (and Chrome iOS shortcut mode) sometimes fail to
 * summon the soft keyboard when an input is tapped. The reliable fix is to
 * explicitly call focus() during the click event — iOS treats click as a
 * user-initiated gesture and summons the keyboard at that moment. */
export function IOSPWAKeyboardFix() {
  useEffect(() => {
    const handler = (e) => {
      const t = e.target
      if (!t) return
      // Walk up to find an INPUT or TEXTAREA in case the click landed on a child
      // (e.g. tapping a label or wrapping div).
      let el = t
      let depth = 0
      while (el && depth < 5) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (document.activeElement !== el) {
            el.focus()
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
