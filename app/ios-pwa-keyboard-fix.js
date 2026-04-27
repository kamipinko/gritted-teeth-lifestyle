'use client'
import { useEffect } from 'react'

/* iOS PWA standalone mode (apple-mobile-web-app-capable + display:standalone)
 * has a long-standing bug where calling .focus() succeeds but the soft
 * keyboard refuses to appear. The most aggressive documented workaround is
 * to immediately follow .focus() with setSelectionRange — that nudges iOS
 * to treat the focus as user-initiated and summon the keyboard. */
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
            el.focus()
            if (el.setSelectionRange && el.value !== undefined && el.type !== 'number') {
              try {
                const pos = el.value.length
                el.setSelectionRange(pos, pos)
              } catch (_) {
                // Some input types (e.g. email) reject setSelectionRange — ignore.
              }
            }
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
