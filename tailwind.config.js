/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // P5 core palette — red, black, white, with gold as a secondary accent.
        // Naming uses "gtl" (Gritted Teeth Lifestyle) so we don't conflict with
        // tailwind defaults or Kami's earlier "brand-*" tokens, which we keep
        // around so existing pages don't break while we migrate.
        gtl: {
          // Backgrounds
          void:    '#070708', // deepest black, page background
          ink:     '#0e0e10', // primary surface
          surface: '#161618', // raised surface
          edge:    '#26262a', // borders, dividers (subtle)

          // Reds — the primary signature color
          'red-deep':  '#4a0a0e', // shadow / deep accent
          red:         '#d4181f', // primary red, P5 calling-card red
          'red-bright':'#ff2a36', // hot red for highlights, hover, glow
          blood:       '#7a0e14', // muted blood red for backgrounds

          // Off-whites & paper
          paper:       '#f4ede0', // aged paper background for calling cards
          'paper-deep':'#e6dcc6', // shadowed paper
          bone:         '#ece4d2', // warmer paper variant
          ivory:       '#f8f3e6', // brightest paper

          // Foreground white
          white:       '#ffffff', // pure white for text on dark
          chalk:       '#f1eee5', // soft white, primary body text on dark

          // Gold (used sparingly — accents only)
          gold:        '#e4b022', // signature stamp, special highlights
          'gold-deep': '#8a6612',

          // Muted / secondary text
          ash:         '#7d7d83', // muted text
          smoke:       '#4a4a4f', // very muted text
        },

        // Keep Kami's original brand-* tokens around so pages we haven't
        // migrated yet still render. We'll remove these once everything moves.
        brand: {
          dark: '#0a0a0a',
          card: '#141414',
          border: '#2a2a2a',
          accent: '#e63946',
          gold: '#f4a261',
          text: '#f1faee',
          muted: '#8a8a8a',
        }
      },
      fontFamily: {
        // Display face — used for big headlines, button labels, calling-card
        // primary text. Heavy, condensed, all-caps energy.
        display: ['Anton', 'Impact', 'sans-serif'],
        // Athletic display face — secondary headlines and ransom-note mixing.
        // Wider, more athletic feel than Anton.
        athletic: ['"Big Shoulders Display"', 'Anton', 'sans-serif'],
        // Body face — clean geometric grotesque. Used for everything that
        // isn't a display element.
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        // Numerals & stat readouts — monospace for that "instrument panel"
        // feel and so numbers don't shift width as they tick.
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // Aggressive layered shadows. P5 cards always feel like they're sitting
        // on top of something — never floating. These mimic torn paper drop
        // shadows and pinned-to-corkboard depth.
        'card-pin':  '0 1px 0 rgba(0,0,0,0.4), 0 12px 24px -8px rgba(0,0,0,0.7), 0 4px 10px -4px rgba(0,0,0,0.6)',
        'card-lift': '0 2px 0 rgba(0,0,0,0.5), 0 24px 48px -10px rgba(0,0,0,0.85), 0 8px 16px -6px rgba(0,0,0,0.7)',
        'red-glow':  '0 0 0 1px rgba(255,42,54,0.6), 0 0 24px rgba(255,42,54,0.4), 0 0 56px rgba(255,42,54,0.18)',
        'inset-edge':'inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 32px rgba(0,0,0,0.5)',
      },
      keyframes: {
        // The slash wipe — used in heist transitions
        'slash-wipe': {
          '0%':   { transform: 'translateX(-120%) skewX(-18deg)', opacity: '0' },
          '15%':  { opacity: '1' },
          '85%':  { opacity: '1' },
          '100%': { transform: 'translateX(120%) skewX(-18deg)', opacity: '0' },
        },
        // Element snap-in — used as elements assemble after a transition
        'snap-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '60%':  { opacity: '1', transform: 'translateY(-2px) scale(1.005)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Subtle pulse for calling card hover state and active buttons
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,42,54,0.5)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(255,42,54,0)' },
        },
        // Stamp impact — for insignias and confirmation marks
        'stamp': {
          '0%':   { transform: 'scale(2.5) rotate(-15deg)', opacity: '0' },
          '60%':  { transform: 'scale(0.95) rotate(-3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-2deg)', opacity: '1' },
        },
        // Per-character stamp — MEGA version. Each character starts at scale
        // 30+ (visually fills the screen) and crashes down to inline size.
        // The landing happens at ~70% of the animation; that's where the
        // sound + screen shake should be timed to fire.
        'char-stamp': {
          '0%':   { transform: 'scale(38)', opacity: '0', filter: 'blur(20px)' },
          '6%':   { transform: 'scale(34)', opacity: '1', filter: 'blur(16px)' },
          '25%':  { transform: 'scale(18)', opacity: '1', filter: 'blur(8px)' },
          '50%':  { transform: 'scale(6)',  opacity: '1', filter: 'blur(2px)' },
          '70%':  { transform: 'scale(1.5)', opacity: '1', filter: 'blur(0)' },
          '82%':  { transform: 'scale(0.82)', opacity: '1', filter: 'blur(0)' },
          '92%':  { transform: 'scale(1.06)', opacity: '1', filter: 'blur(0)' },
          '100%': { transform: 'scale(1)',  opacity: '1', filter: 'blur(0)' },
        },
        // Screen shake — applied to <main> when a character lands. Short,
        // sharp, multiple-axis jitter.
        'screen-shake': {
          '0%':   { transform: 'translate(0, 0)' },
          '10%':  { transform: 'translate(-8px, 4px)' },
          '20%':  { transform: 'translate(7px, -6px)' },
          '30%':  { transform: 'translate(-6px, -3px)' },
          '40%':  { transform: 'translate(5px, 5px)' },
          '50%':  { transform: 'translate(-4px, 2px)' },
          '60%':  { transform: 'translate(3px, -4px)' },
          '70%':  { transform: 'translate(-2px, 3px)' },
          '85%':  { transform: 'translate(1px, -1px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        // Terminal-style blinking cursor — used in the name input
        'cursor-blink': {
          '0%, 49%':   { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        // Branding animation — letters heat to white-hot, then cool through
        // yellow → orange → red → charred. Used on confirm of the name
        // input. Each letter gets a staggered animation-delay so the brand
        // sweeps left-to-right across the slot.
        'brand-letter': {
          '0%':   { color: '#f1eee5', textShadow: 'none', filter: 'brightness(1)', transform: 'scale(1)' },
          '4%':   { color: '#ffffff', textShadow: '0 0 16px #ffffff, 0 0 32px #ffe066, 0 0 64px #ff8c00', filter: 'brightness(1.8)', transform: 'scale(1.08)' },
          '12%':  { color: '#ffffff', textShadow: '0 0 30px #ffffff, 0 0 60px #ffb84d, 0 0 120px #ff6600, 0 0 200px #ff2a36', filter: 'brightness(2.4)', transform: 'scale(1.12)' },
          '25%':  { color: '#fff2a8', textShadow: '0 0 28px #ffe066, 0 0 56px #ff9500, 0 0 110px #ff4400', filter: 'brightness(2.2)', transform: 'scale(1.08)' },
          '40%':  { color: '#ffd24a', textShadow: '0 0 24px #ffc733, 0 0 48px #ff6600', filter: 'brightness(1.9)', transform: 'scale(1.04)' },
          '55%':  { color: '#ff9a1a', textShadow: '0 0 20px #ff7a00, 0 0 40px #d4181f', filter: 'brightness(1.5)', transform: 'scale(1.02)' },
          '70%':  { color: '#ff3b2a', textShadow: '0 0 14px #d4181f, 0 0 28px #7a0e14', filter: 'brightness(1.2)', transform: 'scale(1.01)' },
          '85%':  { color: '#b8151c', textShadow: '0 0 8px #7a0e14', filter: 'brightness(1.05)', transform: 'scale(1)' },
          '100%': { color: '#7a0e14', textShadow: 'none', filter: 'brightness(1)', transform: 'scale(1)' },
        },
        // Branding glow on the slot bar — parallel to letter branding
        'brand-slot': {
          '0%':   { boxShadow: 'none', background: '#ff2a36' },
          '10%':  { boxShadow: '0 0 30px #ffffff, 0 0 60px #ffe066, 0 0 120px #ff8c00', background: '#ffffff' },
          '25%':  { boxShadow: '0 0 40px #ffd24a, 0 0 80px #ff6600', background: '#ffe066' },
          '50%':  { boxShadow: '0 0 24px #ff9a1a, 0 0 48px #d4181f', background: '#ff8c00' },
          '75%':  { boxShadow: '0 0 12px #d4181f', background: '#d4181f' },
          '100%': { boxShadow: 'none', background: '#7a0e14' },
        },
        // Ignition flash — brief red pulse across the entire screen when
        // the brand fires.
        'ignition-flash': {
          '0%':   { opacity: '0' },
          '8%':   { opacity: '0.6' },
          '22%':  { opacity: '0.35' },
          '50%':  { opacity: '0.15' },
          '100%': { opacity: '0' },
        },
        // Heat ripple — expands from the center of the screen outward,
        // like the heat shockwave from a brand being struck. Used as the
        // first phase of the fire transition.
        'heat-ripple': {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '10%':  { transform: 'scale(0.4)', opacity: '1' },
          '60%':  { transform: 'scale(6)', opacity: '0.85' },
          '100%': { transform: 'scale(14)', opacity: '0' },
        },
        // Fire flames rising — a vertical gradient that starts below the
        // viewport and rises up to consume the screen. Used as the second
        // phase of the fire transition.
        'flame-rise': {
          '0%':   { transform: 'translateY(100%) scaleY(0.5)', opacity: '0' },
          '20%':  { transform: 'translateY(70%) scaleY(0.9)', opacity: '0.7' },
          '50%':  { transform: 'translateY(20%) scaleY(1.2)', opacity: '1' },
          '85%':  { transform: 'translateY(-10%) scaleY(1.4)', opacity: '1' },
          '100%': { transform: 'translateY(-30%) scaleY(1.5)', opacity: '1' },
        },
        // Flame flicker — overlays the rising fire with a rapid horizontal
        // jitter to make the flames feel alive.
        'flame-flicker': {
          '0%':   { transform: 'translateX(0) skewX(0deg)', filter: 'hue-rotate(0deg) brightness(1)' },
          '20%':  { transform: 'translateX(-6px) skewX(-2deg)', filter: 'hue-rotate(-8deg) brightness(1.1)' },
          '40%':  { transform: 'translateX(4px) skewX(1deg)', filter: 'hue-rotate(4deg) brightness(1.2)' },
          '60%':  { transform: 'translateX(-3px) skewX(-1deg)', filter: 'hue-rotate(-4deg) brightness(1.05)' },
          '80%':  { transform: 'translateX(5px) skewX(2deg)', filter: 'hue-rotate(6deg) brightness(1.15)' },
          '100%': { transform: 'translateX(0) skewX(0deg)', filter: 'hue-rotate(0deg) brightness(1)' },
        },
        // Full-screen consume — the final phase, where the fire saturates
        // everything before navigation.
        'fire-consume': {
          '0%':   { opacity: '0' },
          '30%':  { opacity: '0.4' },
          '70%':  { opacity: '0.95' },
          '100%': { opacity: '1' },
        },
        // Ash fade — the new page emerges from the fire.
        'ash-reveal': {
          '0%':   { opacity: '1', filter: 'brightness(3) contrast(0.4) sepia(0.8) hue-rotate(-20deg)' },
          '40%':  { opacity: '1', filter: 'brightness(1.5) contrast(0.8) sepia(0.3)' },
          '100%': { opacity: '1', filter: 'brightness(1) contrast(1) sepia(0)' },
        },
        // Flicker — for the kanji watermark and other atmospheric elements
        'flicker': {
          '0%, 100%': { opacity: '0.08' },
          '50%':      { opacity: '0.12' },
        },
      },
      animation: {
        'slash-wipe': 'slash-wipe 700ms cubic-bezier(0.7, 0, 0.2, 1) forwards',
        'snap-in':    'snap-in 400ms cubic-bezier(0.2, 0.9, 0.3, 1.1) forwards',
        'pulse-red':  'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'stamp':        'stamp 500ms cubic-bezier(0.2, 1.4, 0.4, 1) forwards',
        'char-stamp':   'char-stamp 480ms cubic-bezier(0.18, 1.4, 0.4, 1) forwards',
        'screen-shake': 'screen-shake 280ms cubic-bezier(0.4, 0, 0.6, 1) both',
        'cursor-blink':   'cursor-blink 1s steps(2, end) infinite',
        'brand-letter':   'brand-letter 1600ms cubic-bezier(0.3, 0, 0.4, 1) forwards',
        'brand-slot':     'brand-slot 1600ms cubic-bezier(0.3, 0, 0.4, 1) forwards',
        'ignition-flash': 'ignition-flash 1400ms cubic-bezier(0.2, 0, 0.6, 1) forwards',
        'heat-ripple':    'heat-ripple 1400ms cubic-bezier(0.2, 0.6, 0.2, 1) forwards',
        'flame-rise':     'flame-rise 1800ms cubic-bezier(0.3, 0.5, 0.3, 1) forwards',
        'flame-flicker':  'flame-flicker 180ms steps(4, end) infinite',
        'fire-consume':   'fire-consume 1800ms cubic-bezier(0.4, 0, 0.6, 1) forwards',
        'ash-reveal':     'ash-reveal 900ms cubic-bezier(0.3, 0, 0.5, 1) forwards',
        'flicker':        'flicker 4s ease-in-out infinite',
      },
      // Custom rotation values for tilted layouts
      rotate: {
        '1.5': '1.5deg',
        '2.5': '2.5deg',
        '3.5': '3.5deg',
        '5.5': '5.5deg',
      },
    },
  },
  plugins: [],
}
