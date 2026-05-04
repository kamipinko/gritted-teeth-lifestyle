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

// Staging-event subscribers. Components mounted BEFORE their consume
// window opens (e.g., DayFocus subscribes for 'muscle' but the user
// taps to stage 'muscle' AFTER DayFocus already mounted) need a way
// to re-attempt consume when an intent gets staged. They subscribe
// here; the pointerdown handler notifies on stage.
const stageListeners = new Set()
export function subscribeStaged(fn) {
  stageListeners.add(fn)
  return () => stageListeners.delete(fn)
}
function notifyStaged(stepName) {
  for (const fn of stageListeners) {
    try { fn(stepName) } catch (_) {}
  }
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
      touchHandler: null,     // installed window touchstart fallback (iOS)
      lastFireAt: 0,          // dedup so pointerdown+touchstart for one tap fires once
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
  // Clear any leftover prefire intent from a previous interrupted chain
  // run. sessionStorage survives reloads and navigation, but `armed` does
  // not — without this clear, a stale intent from a prior session could
  // match the FIRST consume of the new chain and auto-fire a hop the user
  // didn't tap for ("predictive tap fires without me tapping").
  try { sessionStorage.removeItem(PREFIRE_KEY) } catch (_) {}
  s.armed = true
  s.hopIndex = 0
  s.inAnim = false
  s.currentStep = null
  s.lastFireAt = 0
  log('arm: chain started at hop 0 (profile, cleared any stale intent)')
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
    // Stale intent: target doesn't match what THIS destination consumes.
    // It was left over from a prior tap that staged for a different hop
    // (or for this hop on a previous chain run). Clear it so it can't
    // sit in sessionStorage waiting to match a future consume on a
    // different page — which manifested as "ACTIVATE auto-fires
    // unprovoked when navigating back to /fitness/load."
    if (intent) {
      log(`consume "${stepName}": stale intent "${intent.target}" — clearing`)
      try { sessionStorage.removeItem(PREFIRE_KEY) } catch (_) {}
    } else {
      log(`consume "${stepName}": no intent`)
    }
    return null
  }
  try { sessionStorage.removeItem(PREFIRE_KEY) } catch (_) {}
  // Advance the hop counter — consumer is about to fire the primary
  // handler for this step.
  s.hopIndex = chainIndex(stepName)
  // Eagerly open the inAnim window for this step so an extremely fast
  // follow-up tap doesn't fall into the gap between consume and the
  // primary handler's setInAnimation(stepName, true) call. Both are
  // idempotent — the primary handler's setInAnimation will be a no-op
  // when re-asserting the same state.
  s.inAnim = true
  s.currentStep = stepName
  log(`consume "${stepName}": MATCH — fire primary handler, hop=${s.hopIndex} (inAnim opened eagerly)`)
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

// iOS PWA suppresses pointerdown events during rapid-tap sequences
// (documented in the GTL project memory: feedback_ios_pwa_rapid_tap_gotchas).
// Listen for touchstart as a fallback so an iOS-suppressed pointerdown
// still triggers prefire staging. Dedup so a normal tap (which fires
// touchstart THEN pointerdown ~5-16ms apart) doesn't stage twice.
//
// 30ms window: wide enough to reliably catch the paired events for the
// same physical tap (which fire within ~16ms), tight enough to let
// genuine rapid-tap sequences through (humans cap out around ~30-50ms
// between distinct taps). Earlier 80ms window was eating the activate
// hop when the user tapped the chain very fast.
const SAME_TAP_DEDUP_MS = 30

function installPointerHandler() {
  const s = getState(); if (!s) return
  if (s.pointerHandler) return
  const fire = (clientX, clientY, sourceLabel) => {
    const now = Date.now()
    if (s.lastFireAt && (now - s.lastFireAt) < SAME_TAP_DEDUP_MS) return
    s.lastFireAt = now
    onPointerDown({ clientX, clientY, _source: sourceLabel })
  }
  const pointerHandler = (e) => fire(e.clientX, e.clientY, 'pointerdown')
  const touchHandler = (e) => {
    const t = e.touches && e.touches[0]
    if (!t) return
    fire(t.clientX, t.clientY, 'touchstart')
  }
  window.addEventListener('pointerdown', pointerHandler, { capture: true })
  window.addEventListener('touchstart',  touchHandler,   { capture: true, passive: true })
  s.pointerHandler = pointerHandler
  s.touchHandler   = touchHandler
}

function uninstallPointerHandler() {
  const s = getState(); if (!s) return
  if (s.pointerHandler) {
    window.removeEventListener('pointerdown', s.pointerHandler, { capture: true })
    s.pointerHandler = null
  }
  if (s.touchHandler) {
    window.removeEventListener('touchstart', s.touchHandler, { capture: true })
    s.touchHandler = null
  }
  s.lastFireAt = 0
}

// Canonical chain hit-zone — the shared screen rect that every chain
// button occupies (matches ACTIVE_TOP_Y=479 on /fitness/active and the
// activate-popup top:466 + py-5 + min-h:56px geometry on /fitness/load).
// Tests against this rect directly INSTEAD of bbox-querying the chain
// target elements — earlier bbox-based logic missed taps during entrance
// animations (e.g. BEGIN HERE muscle has a 380ms delay before its bbox
// reaches its settled position; a tap during that window had no element
// to match against and silently fell through to reactive-skip-only).
//
// Buttons keep their data-predictive-tap-target attributes for visual
// documentation + potential future debug use, but they are no longer
// load-bearing for the hit test.
const CANONICAL_LEFT_INSET  = 12
const CANONICAL_RIGHT_INSET = 12
const CANONICAL_TOP         = 466   // ActivatePopup top; TODAY hero centers at 479
const CANONICAL_HEIGHT      = 96    // generous: covers the 70px button + ~13px slop top/bottom

function inCanonicalHitZone(clientX, clientY) {
  if (typeof window === 'undefined') return false
  const left   = CANONICAL_LEFT_INSET
  const right  = (window.innerWidth || 0) - CANONICAL_RIGHT_INSET
  const top    = CANONICAL_TOP
  const bottom = CANONICAL_TOP + CANONICAL_HEIGHT
  return clientX >= left && clientX <= right && clientY >= top && clientY <= bottom
}

function onPointerDown(e) {
  const s = getState(); if (!s) return
  if (!s.armed || !s.inAnim) return

  // Hit-test against the canonical chain rect. Bbox-querying actual
  // chain elements was unreliable during entrance animations — the
  // canonical rect is stable regardless of what's mounted or animating.
  if (!inCanonicalHitZone(e.clientX, e.clientY)) {
    log(`${e._source || 'pointerdown'} @ (${Math.round(e.clientX)}, ${Math.round(e.clientY)}): outside canonical chain rect — reactive skip applies`)
    return
  }

  const hitName = '<canonical-zone>'
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
  // Notify any subscribers (e.g., DayFocus listening for 'muscle' stages)
  // so destinations that mounted BEFORE the staging window can re-attempt
  // consume immediately rather than waiting for a re-render.
  notifyStaged(nextStepName)

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
