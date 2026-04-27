'use client'
import { useEffect } from 'react'

/* iOS only summons the soft keyboard when focus() is called DURING the user
 * gesture (touchstart) — touchend is too late, and iOS shows a paste callout
 * instead. Move the manual focus into touchstart so the keyboard opens. */
export function IOSPWAKeyboardFix() {
  useEffect(() => {
    const handler = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
        if (document.activeElement !== t) {
          t.focus()
        }
      }
    }
    document.addEventListener('touchstart', handler, { passive: true })
    return () => document.removeEventListener('touchstart', handler)
  }, [])
  return null
}
