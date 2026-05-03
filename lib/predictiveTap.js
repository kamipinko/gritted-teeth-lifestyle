/**
 * predictiveTap — predictive tap-skip across the 5-button chain.
 *
 * The 5-button chain (profile → load-cycle → activate → today → muscle)
 * occupies the same screen rect on every step (per the geometry-unify
 * dispatch). When the user taps inside that shared rect during a
 * page-transition animation, this module fires the next page's
 * primary-button handler automatically — chaining the cascade forward
 * without a second tap. Tap-anywhere-else still skips reactively
 * (existing behavior, unchanged).
 *
 * State machine (module-level, window-scoped via __gtlPredictiveTap):
 *   armed     — true once the profile button has been tapped, false
 *               again after the muscle button fires (chain complete) or
 *               on a fresh profile tap (starts a new chain).
 *   hopIndex  — current position in the chain. Profile=0 starts the
 *               chain; the prefire window applies to hops 1..4.
 *   inAnim    — set true by the page during its outgoing animation,
 *               false on animation end. The hit-zone tap only counts
 *               as a prefire when inAnim is true.
 *
 * Prefire intent is staged in sessionStorage under PREFIRE_KEY so the
 * incoming page can read it synchronously on mount. Cleared on consume.
 *
 * Debugging: every decision (arm, disarm, hit, miss, prefire fired,
 * consumed) is console.log'd with a `[prefire]` prefix. Per Jordan's
 * decision (2026-05-02): no guard-bail behavior — if a guard redirects
 * the user away mid-chain, the URL change makes it visible. Bail logic
 * can be added later once the system is stable.
 */

const PREFIRE_KEY = 'gtl-predictive-tap-prefire'
const STATE_KEY   = '__gtlPredictiveTap'
// Stale-intent TTL — if the destination button doesn't mount within this
// window (e.g., user lands on /fitness/load with zero saved cycles, the
// ActivatePopup never appears, user walks away), the staged intent
// expires so a future visit doesn't unexpectedly auto-fire.
const PREFIRE_TTL_MS = 10000

// Chain step names. The cycle card on /fitness/load auto-selects on
// page render, so it's NOT a tap step — the chain skips it. Profile is
// the first tap (arms the chain); the four after it are predictive-skippable.
const CHAIN_ORDER = ['profile', 'hub-load', 'activate', 'today', 'muscle']

function chainIndex(stepName) {
  return CHAIN_ORDER.indexOf(stepName)
}

function getState() {
  if (typeof window === 'undefined') return null
  if (!window[STATE_KEY]) {
    window[STATE_KEY] = {
      armed: false,
      hopIndex: -1,           // -1 = no chain active; 0 = profile fired
      inAnim: false,
      currentStep: null,      // step name of the page currently animating
      pointerHandler: null,   // installed window pointerdown listener
    }
  }
  return window[STATE_KEY]
}

function log(...args) {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line no-console
  console.log('[prefire]', ...args)
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Called from the profile button's onClick handler. Starts a fresh chain.
 * Subsequent prefire taps inside the shared hit-zone will chain forward.
 */
export function armChain() {
  const s = getState(); if (!s) return
  s.armed = true
  s.hopIndex = 0
  log('arm: chain started at hop 0 (profile)')
  installPointerHandler()
}

/**
 * Called from the muscle button's onClick handler — the final hop. Chain
 * is complete; tear down listener and reset state.
 */
export function disarmChain(reason = 'muscle-fired') {
  const s = getState(); if (!s) return
  if (!s.armed) return
  s.armed = false
  s.hopIndex = -1
  s.inAnim = false
  s.currentStep = null
  uninstallPointerHandler()
  try { sessionStorage.removeItem(PREFIRE_KEY) } catch (_) {}
  log(`disarm: ${reason}`)
}

/**
 * Called by each chain page when its outgoing/incoming animation begins
 * and ends. The prefire window is "armed && inAnim".
 *
 *   stepName: one of 'profile' | 'load-cycle' | 'activate' | 'today' | 'muscle'
 *   active:   true on animation start, false on animation end
 */
export function setInAnimation(stepName, active) {
  const s = getState(); if (!s) return
  if (!s.armed) return
  if (chainIndex(stepName) < 0) return
  s.inAnim = !!active
  s.currentStep = active ? stepName : (s.currentStep === stepName ? null : s.currentStep)
  log(`anim ${active ? 'start' : 'end'} on step "${stepName}" (armed, hop ${s.hopIndex})`)
}

/**
 * Called by each destination page on mount. Returns the staged prefire
 * intent if the previous hop's hit-zone tap matches THIS page's step,
 * else null. Caller fires its primary button handler synchronously and
 * advances the hop.
 *
 *   stepName: this page's chain step name
 *   returns:  { exerciseId? } | null   (currently no payload; reserved
 *             for future extensions like targeting a specific cycle).
 */
export function consumePrefire(stepName) {
  if (typeof window === 'undefined') return null
  const s = getState(); if (!s) return null
  if (!s.armed) return null
  let intent = null
  try {
    const raw = sessionStorage.getItem(PREFIRE_KEY)
    intent = raw ? JSON.parse(raw) : null
  } catch (_) {}
  // TTL — drop stale intents (chain stalled, e.g., no cycles to load).
  if (intent && intent.ts && (Date.now() - intent.ts) > PREFIRE_TTL_MS) {
    log(`consume "${stepName}": intent expired (age ${Date.now() - intent.ts}ms > ${PREFIRE_TTL_MS}ms) — clearing`)
    try { sessionStorage.removeItem(PREFIRE_KEY) } catch (_) {}
    intent = null
  }
  if (!intent || intent.target !== stepName) {
    log(`consume "${stepName}": no matching intent (saw ${intent?.target || 'none'})`)
    return null
  }
  try { sessionStorage.removeItem(PREFIRE_KEY) } catch (_) {}
  // Advance the hop counter — consumer is about to fire the primary
  // handler for this step.
  s.hopIndex = chainIndex(stepName)
  log(`consume "${stepName}": MATCH — fire primary handler, hop=${s.hopIndex}`)
  return intent
}

/**
 * Convenience hook — runs consumePrefire on mount and calls primary()
 * synchronously if matched. Returns nothing; primary() owns whatever
 * navigation/state-mutation it does.
 *
 * Use from each chain page (load-cycle, activate, today, muscle):
 *
 *   usePredictivePrefire('load-cycle', () => loadCycleIntoStorage(...))
 */
export function usePredictivePrefire(stepName, primary) {
  // Lazy-import to avoid pulling React into pages that don't need it.
  // Standard React useEffect contract.
  const React = require('react')
  React.useEffect(() => {
    const intent = consumePrefire(stepName)
    if (intent && typeof primary === 'function') {
      try { primary(intent) } catch (e) { log('primary handler threw:', e) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ── Internals ───────────────────────────────────────────────────────────────

function installPointerHandler() {
  const s = getState(); if (!s) return
  if (s.pointerHandler) return
  const handler = (e) => onPointerDown(e)
  window.addEventListener('pointerdown', handler, { capture: true })
  s.pointerHandler = handler
}

function uninstallPointerHandler() {
  const s = getState(); if (!s) return
  if (!s.pointerHandler) return
  window.removeEventListener('pointerdown', s.pointerHandler, { capture: true })
  s.pointerHandler = null
}

function onPointerDown(e) {
  const s = getState(); if (!s) return
  if (!s.armed || !s.inAnim) return

  // Find every chain target on screen and test the pointer against
  // each rect. The chain only has 5 attributes total, so a small DOM
  // query per pointerdown is fine.
  const targets = document.querySelectorAll('[data-predictive-tap-target]')
  if (!targets.length) return

  let hitTarget = null
  for (const el of targets) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom) {
      hitTarget = el
      break
    }
  }

  if (!hitTarget) {
    log(`pointerdown @ (${Math.round(e.clientX)}, ${Math.round(e.clientY)}): no hit-zone match — reactive skip applies`)
    return
  }

  const hitName = hitTarget.getAttribute('data-predictive-tap-target')
  const nextStepName = nextHopAfter(s.currentStep)
  if (!nextStepName) {
    log(`hit "${hitName}" but no next hop computed (currentStep=${s.currentStep})`)
    return
  }

  // Stage the prefire intent so the destination page consumes it on mount.
  try {
    sessionStorage.setItem(PREFIRE_KEY, JSON.stringify({ target: nextStepName, ts: Date.now() }))
    log(`HIT "${hitName}" during "${s.currentStep}" anim → staged prefire for "${nextStepName}"`)
  } catch (err) {
    log('failed to stage prefire intent:', err)
  }

  // Don't preventDefault — let the existing reactive skip handler also
  // fire so the in-flight animation ends and the next page mounts. The
  // destination page's mount-time consumePrefire then fires its primary
  // handler, advancing the chain.
}

function nextHopAfter(stepName) {
  const i = chainIndex(stepName)
  if (i < 0) return null
  const next = CHAIN_ORDER[i + 1]
  return next || null
}
