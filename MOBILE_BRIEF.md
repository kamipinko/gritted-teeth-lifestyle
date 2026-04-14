# GTL Mobile Redesign Brief

> **Status: Active — this is the current priority.**
> Read this before touching any page. The goal is not to port the desktop app to mobile. The goal is to make mobile feel like it was always the intended platform.

---

## The Core Insight

This app was built desktop-first. It works on mobile, but it doesn't *land* on mobile. The exception is the fire/kanji transition, the WHO ARE YOU screen, and the CHOOSE YOUR CYCLE screen — those hit harder on mobile than on desktop. The high-DPI screen makes the clip-paths razor sharp. The full-screen typography fills the frame. The kanji watermarks look like they belong.

That's the direction. **Every screen should feel like it was designed for that moment of the phone in your hand, fire on the screen, eyes forward.**

Desktop is spatial and explorative — you see everything at once. Mobile is sequential and theatrical — each screen is one full act. Stop trying to fit desktop layouts onto a narrow screen. Design scenes.

---

## What's Already Working on Mobile — Don't Break It

- Fire/heist transition animations
- WHO ARE YOU screen (`/fitness`)
- CHOOSE YOUR CYCLE screen (`/fitness/hub`)
- DayFocus full-screen takeover
- Muscle slab tap interaction (the press-down animation)
- XP bar in the nav — reads like a game HUD on mobile, keep it

---

## What Jordan Is Handling

**Muscle selector — gacha layout.**
The 3D body model currently requires scrolling to reach the muscle buttons below it. On mobile, the model is the stage. Jordan is rebuilding this so the 3D model fills the screen and the muscle buttons float on the left and right sides — arranged anatomically, no scrolling required. Reference: gacha game UI where the character is centered and all actions live on the edges. When a muscle slab is tapped, there will be a brief theatrical flash before the ExercisePanel opens.

**Do not touch `components/MuscleBody.jsx` or the fitness flow pages.**

---

## What Kami Is Handling

See `KAMI_TODO.md` for the full task list. The mobile-specific priorities in order:

### 1. Home Page — Mobile Layout
The calling card and nutrition card stack vertically and that's fine. The problem is the space feels accidental, not designed. On mobile the calling card should dominate the fold — it's the reason you opened the app. The nutrition card should feel like a second act, something you discover. Make the scroll feel intentional, not like leftover whitespace.

### 2. Profiles Page — Bigger Touch Targets
WHO ARE YOU looks great. But the input box and ENTER button are desktop-sized on a touch screen. The ENTER button especially — hitting it should feel like slamming a key, not clicking a link. Make it wide, make it tall, give it a satisfying press state.

### 3. Theatrical Navigation Flashes
Every major navigation action should earn a brief full-screen flash. When you enter your name and hit ENTER, when you pick a cycle, when you arrive somewhere new — a half-second P5 moment before the route changes. This doesn't mean full HeistTransition every time. It can be a single frame: color flood, kanji, gone. Study how HeistTransition.jsx works and build a lighter version for navigation moments.

### 4. Breadcrumb Cleanup
The full breadcrumb trails (e.g. `PALACE / FITNESS / NEW CYCLE / SCHEDULE`) are too long for mobile and collide with the watermarks. On mobile, show only the current page label — not the full path. The context is already clear from the screen content.

### 5. Idle Button Animations (carry-over from original TODO)
Every page needs at least one button with an idle animation. On mobile specifically, these should be tap-hint patterns — a slow pulse, a breathing glow — not hover states. A user's thumb should feel drawn to the right button before they consciously decide to tap it.

---

## Design Rules for Mobile

- **One dominant element per screen.** One heading, one action, one moment. Not a grid of options fighting for attention.
- **Touch targets are minimum 48px tall.** Every interactive element. No exceptions.
- **No horizontal overflow.** If something wraps badly, cut it — don't shrink the font.
- **Watermarks stay.** They look great on mobile. Just make sure text that needs to be read has enough contrast against them.
- **Transitions are non-negotiable.** If a screen change feels like a web page loading, it's wrong.

---

## Reference

- P5 design bible: `.claude/commands/p5-ui.md`
- Implementation tracker: `P5_UI.md`
- HeistTransition source: `components/HeistTransition.jsx`
- Gacha layout reference: see Jordan
