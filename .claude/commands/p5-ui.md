# Persona 5 UI Design Skill

Apply Persona 5-style UI/UX design principles to the current task. Use the research and developer documentation below as your design bible. When implementing any UI component, animation, screen, or interaction in this project, evaluate it against these principles before writing code.

---

## Source Research

### Primary Academic Source
**"Studi Visual UI dan UX pada Gim Persona 5 Royal"**
- Journal: DIVAGATRA – Jurnal Penelitian Mahasiswa Desain (Universitas Komputer Indonesia)
- Year: 2024
- URL: https://ojs.unikom.ac.id/index.php/divagatra/article/view/12339
- ResearchGate: https://www.researchgate.net/publication/385703960_Studi_Visual_UI_dan_UX_pada_Gim_Persona_5_Royal
- Focus: Visual analysis of UI/UX design principles in Persona 5 Royal — typography, color, motion, layout

### Developer Primary Source
**"Creative method for UI in the Persona series ~ UI case examples from Persona 5"**
- Event: CEDEC + KYUSHU 2017 (Computer Entertainment Developers Conference)
- Presenters: Masayoshi Sutoh (Art Director / Lead UI Designer), Kazuhisa Wada (Director)
- Summary: https://personacentral.com/persona-5-panel-concept-development-ui/
- Focus: How Atlus built Persona 5's visual identity — concept, iteration, cultural grounding

### Supporting Sources
- **GDC 2025** — Koji Ise (Lead UI Designer, Atlus): "From Persona to Metaphor: ReFantazio — Creating a Visual Identity for a New Series"
- **Georgetown University CCTP-748 (2018)**: "Identify Cultural Reference in Persona 5's UI Design, and Why It Immerse Gaming Experience" — Peircean semiotic analysis of P5 UI — https://blogs.commons.georgetown.edu/cctp-748-spring2018/2018/05/05/identify-cultural-factors-in-persona-5s-ui-design-and-its-influence-on-gaming-experience/
- **The Game Design Forum**: "Examining JRPG UI" (PDF survey) — http://thegamedesignforum.com/features/JRPG_UI_SURVEY.pdf
- **DIVA Portal thesis**: Narrative Structure in Persona 5 — https://www.diva-portal.org/smash/get/diva2:1580898/FULLTEXT01.pdf

---

## Core Design Principles (extracted from research)

### 1. Aggressive Geometry & Diagonal Energy
- Avoid rectangles. Use parallelograms, trapezoids, angled clips (`clip-path: polygon(...)`)
- Every panel, button, and card should have at least one angled edge
- Diagonals create tension and movement — static boxes feel dead
- Tailwind: use `style={{ clipPath: 'polygon(...)' }}` or custom CSS shapes

### 2. Color System — High Contrast, Minimal Palette
- Primary: black (`#0a0a0a` / `gtl-void`), red (`#c41a1f` / `gtl-red`), white/cream (`gtl-chalk`, `gtl-paper`)
- Accent: gold (`#ffcc00`) for highlights, confirmation, and focus states
- Never use mid-tones as dominant colors — everything is either very dark or very bright
- Red is for selection, confirmation, danger, and emphasis — never decorative
- Black backgrounds make colors pop; avoid grey backgrounds

### 3. Typography — Loud Display Font + Tiny Mono Labels
- Headlines: display font, large (4xl–8xl), often rotated ±1°–3°, sometimes skewed
- UI labels: monospace, 8–11px, ALL CAPS, wide letter-spacing (`tracking-[0.3em]`)
- Never mix two display fonts — one loud, one mono, nothing else
- Numbers are always displayed in the display font at large sizes
- Text can overlap geometry — labels sit on top of colored shapes

### 4. Motion — Fast, Deliberate, Punctuated
- Transitions: 150–300ms for micro-interactions, 600–900ms for screen transitions
- Easing: ease-out for enters (things arrive fast), ease-in for exits (things leave with intention)
- Never use linear easing — it reads as mechanical, not cinematic
- Camera moves (zoom/pan) should overshoot slightly or use cubic easing for drama
- Idle animations (flicker, pulse) should be slow and subtle — 3–6s cycle

### 5. Information Hierarchy — Scannable at a Glance
- One dominant element per screen (the thing the user must act on)
- Supporting information is small, muted, and monospace
- Use thin horizontal rules, slash separators, and breadcrumb labels to structure space
- Never center-align body content — left-align creates reading flow
- Counter-rotate some elements (headline vs. label) to create dynamic tension

### 6. UI as Character — Every Element Has Personality
- Buttons feel like stamps or stickers — hard edges, no soft shadows
- Hover states should feel like the UI is responding to you, not just changing color
- Selected states should feel committed — red fill, paper text, no ambiguity
- Background decoration (kanji, numbers, lines) should be near-invisible (3–6% opacity)
- The UI should look hand-designed, not generated — use asymmetry intentionally

### 7. Camera & 3D Interaction (specific to this project's muscle selector)
- Zoom in on selection: camera should arrive at a slightly off-center angle (not straight-on)
- Alternate yaw direction between selections so consecutive views feel different
- Highlight on camera arrival, not on click — let the camera travel complete first
- Highlight should be temporary (1.5–2s) — a flash, not a state
- Auto-rotate at idle; lock camera on selection

### 8. Sound Design Philosophy (from CEDEC 2017)
- UI sounds should be short, punchy, and distinct between action types
- Click ≠ Confirm ≠ Cancel ≠ Navigate — each needs its own audio signature
- Sound reinforces the "stamp" quality of interactions

---

## How to Apply This Skill

When invoked, review the current task or the file/component provided and:

1. **Audit**: Identify any elements that violate the principles above (soft shadows, rounded corners, centered text, grey mid-tones, symmetric layouts, linear animations)
2. **Redesign**: Propose specific Tailwind classes, clip-path values, color tokens, or animation durations that bring the element into P5 style
3. **Implement**: Write or modify the code directly, referencing the principles as comments where the reasoning isn't obvious
4. **Check**: After implementation, verify the component reads as "designed by a human with strong opinions" — not AI-generated or default

If the user pastes a component or describes a screen, apply the above to improve it.
If the user says `/p5-ui [component name]`, find that component in the codebase and audit + improve it.

---

## Gritted Teeth Lifestyle — Project-Specific Implementation Reference

This section documents the *actual* tokens, patterns, and components established in this codebase. Always use these before inventing new ones.

### Color Tokens (Tailwind config)
| Token | Hex | Use |
|---|---|---|
| `gtl-void` | `#070708` | Page backgrounds |
| `gtl-ink` | `#111115` | Card/panel backgrounds |
| `gtl-surface` | `#1a1a1e` | Elevated surfaces |
| `gtl-edge` | `#3a3a42` | Borders, dividers |
| `gtl-smoke` | `#6a6a72` | Muted labels |
| `gtl-ash` | `#9a9aa2` | Secondary text |
| `gtl-chalk` | `#e8e8f0` | Primary text |
| `gtl-paper` | `#f5f0e8` | Warm white (used on red backgrounds) |
| `gtl-red` | `#d4181f` | Primary action, selection |
| `gtl-red-bright` | `#ff2a36` | Hover, active states |
| `gtl-red-deep` | `#8a0e13` | Shadow slabs |
| `gtl-blood` | `#7a0e14` | Deep red, danger |
| `gtl-gold` | `#e4b022` | Today indicator, XP, stats |

### Standard Clip Paths
```js
// Parallelogram — standard button/slab shape
clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)'

// Parallelogram wider — used for larger buttons
clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)'

// Parallelogram reverse (left-pointing)
clipPath: 'polygon(0% 0%, 96% 0%, 100% 100%, 4% 100%)'

// Torn paper (card) — bottom-right nick
clipPath: 'polygon(0% 0%, 97% 0%, 100% 5%, 100% 100%, 3% 100%, 0% 95%)'

// Nav button (skewed left)
clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'
```

### The Shadow Slab Pattern
Every red interactive button in GTL uses a two-layer stack: a dark shadow slab offset 6px right+down, and a red face on top. On press, both translate to the same position (slam effect).

```jsx
{/* Shadow */}
<div
  className="absolute inset-0 bg-gtl-red-deep"
  style={{
    clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
    transform: pressed ? 'translate(0,0)' : 'translate(6px, 6px)',
    transition: 'transform 80ms ease-out',
  }}
  aria-hidden="true"
/>
{/* Face */}
<div
  className="relative px-8 py-4"
  style={{
    clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
    background: pressed ? '#ff2a36' : '#d4181f',
    transform: pressed ? 'translate(6px, 6px)' : 'translate(0,0)',
    transition: 'transform 80ms ease-out, background 80ms ease-out',
  }}
>
  <span className="font-display text-gtl-paper">LABEL</span>
</div>
```

### Retreat / Back Button Pattern
All sub-pages have a consistent retreat button (top-left). Behavior: plays `menu-close` sound, navigates back. In edit mode, checks `gtl-back-to-edit` localStorage flag.

```jsx
function RetreatButton() {
  const { play } = useSound()
  const [hovered, setHovered] = useState(false)
  let backHref = '/previous-page'
  try { if (localStorage.getItem('gtl-back-to-edit') === '1') backHref = '/fitness/edit' } catch (_) {}
  return (
    <Link href={backHref}
      onMouseEnter={() => { setHovered(true); play('button-hover') }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => play('menu-close')}
      className="group relative inline-flex items-center"
    >
      <div className={`absolute inset-0 -inset-x-2 transition-all duration-300 ease-out
        ${hovered ? 'bg-gtl-red opacity-100' : 'bg-gtl-edge opacity-50'}`}
        style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
        aria-hidden="true" />
      <div className="relative flex items-center gap-3 px-4 py-2">
        <span className={`font-display text-base leading-none transition-all duration-300
          ${hovered ? 'text-gtl-paper -translate-x-1' : 'text-gtl-red'}`}>◀</span>
        <span className={`font-mono text-[10px] tracking-[0.3em] uppercase font-bold transition-colors duration-300
          ${hovered ? 'text-gtl-paper' : 'text-gtl-chalk'}`}>RETREAT</span>
      </div>
    </Link>
  )
}
```

### Page Structure Template
Every GTL page follows this structure:
```jsx
<main className="relative min-h-screen overflow-hidden bg-gtl-void">
  {/* Noise texture */}
  <div className="absolute inset-0 gtl-noise" />
  {/* Atmospheric gradient */}
  <div className="absolute inset-0 pointer-events-none"
    style={{ background: 'linear-gradient(135deg, rgba(122,14,20,0.2) 0%, transparent 40%, transparent 60%, rgba(74,10,14,0.3) 100%)' }} />
  {/* Kanji watermark */}
  <div className="absolute -top-12 -left-8 pointer-events-none select-none animate-flicker"
    style={{ fontFamily: '"Noto Serif JP", serif', fontSize: '40rem', lineHeight: '0.8', color: '#ffffff', opacity: 0.04, fontWeight: 900 }}>
    漢
  </div>
  {/* Nav */}
  <nav className="relative z-10 flex items-center justify-between px-8 py-6">
    <RetreatButton />
    <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-smoke">
      PALACE / SECTION / PAGE
    </div>
  </nav>
  {/* Content */}
  <section className="relative z-10 px-8 pb-20 max-w-3xl mx-auto">
    {/* Step tag */}
    <div className="flex items-center gap-4 mb-3">
      <div className="h-px w-16 bg-gtl-red" />
      <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-gtl-red">STEP / 01 / LABEL</span>
      <div className="h-px w-16 bg-gtl-red" />
    </div>
    {/* Headline */}
    <h1 className="font-display text-[5rem] md:text-[7rem] leading-[0.9] text-gtl-chalk -rotate-1">
      HEADLINE<br />
      <span className="text-gtl-red inline-block rotate-1">EMPHASIS</span>
    </h1>
  </section>
</main>
```

### Typography Rules
- `font-display` — big headlines, button labels, ransom-note letters
- `font-mono` — ALL CAPS labels, breadcrumbs, metadata (`tracking-[0.3em]` or wider)
- `font-athletic font-black` — alternate display weight for ransom-note variety
- Never use `font-sans` or `font-serif` on new GTL UI elements

### Sound Hooks — Available Sounds
All interactive elements play a sound. Use `const { play } = useSound()` and call:
- `play('button-hover')` — on mouseEnter for buttons/slabs
- `play('option-select')` — on click/confirm selection
- `play('menu-close')` — on retreat/cancel/close
- `play('card-hover')` — on hover over calling card
- `play('card-confirm')` — on calling card click
- `play('stamp')` — on major confirmation stamp
- `play('transition-slash')` — fires with HeistTransition

### Available Transition Components
- `<HeistTransition active={bool} onComplete={fn} title="TEXT" intensity="normal|mega" />` — red slash wipe for major navigation
- `<FireTransition active={bool} onComplete={fn} />` — fire wipe for cycle/fitness flow
- `<FireFadeIn duration={900} />` — fire reveal on page enter

### Key Established Components
- `components/CallingCard.jsx` — Phantom Thieves calling card (home page fitness entry)
- `components/HeistTransition.jsx` — full-screen slash animation overlay
- `components/MuscleBody.jsx` — R3F 3D muscle selector with hitbox/glow system
- `app/fitness/active/page.js` — DayFocus + ExercisePanel reference implementation
- `app/fitness/hub/page.js` — Hub/menu screen reference implementation

### Writing Voice (Gurren Lagann + Persona 5 hybrid)
- Direct, second-person: "YOUR WEAKNESS HAS BEEN NOTED"
- No hedging, no softening, no please/thank you
- Short imperatives: "MARK YOUR DAYS", "WHO ARE YOU", "FORGE A NEW CYCLE"
- Flavor text should feel earned, not generated — Joker's posture, Simon's heart
- Labels use military/heist vocabulary: PALACE, INFILTRATE, FORGE, ETCH, RETREAT, BATTLEDAY
