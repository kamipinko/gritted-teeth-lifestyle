'use client'
import { useEffect } from 'react'

/* iOS PWA standalone mode sometimes fails to focus text inputs on tap, so the
 * software keyboard never appears. Manually focus on touchend as a workaround. */
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
    document.addEventListener('touchend', handler, { passive: true })
    return () => document.removeEventListener('touchend', handler)
  }, [])
  return null
}
