# Persona 5 UI — Implementation Status

**Design principles live in `.claude/commands/p5-ui.md`** — that's Kami's research bible. Read it first for the "what and why" of every P5 decision. This doc only tracks *what's implemented in this project right now* so a fresh session can pick up without re-auditing the whole codebase.

Run `/p5-ui [component]` to invoke the audit skill against any component.

## Design direction (non-negotiable)
> P5 governs how it looks. Gurren Lagann governs what it means.

Sincere absurdity — the interface has Joker's posture but Simon's heart. Verbs come from Gurren Lagann (`FORGE CYCLE`, `PIERCE THE LIMIT`), grammar comes from P5 (torn cards, diagonal slashes, ransom-note typography, kanji watermarks).

## Design system (implemented)

- **Colors** — `tailwind.config.js` — `gtl-*` palette. Primary: `gtl-void` (near-black), `gtl-red` / `gtl-red-bright`, `gtl-chalk` / `gtl-paper`. Accent: gold (`#ffcc00` — used for focus states, including the 3D muscle glow). Surface: `gtl-ink`, `gtl-surface`, `gtl-edge`, `gtl-ash`, `gtl-smoke`.
- **Fonts** — Anton (display, loud), Big Shoulders Display (headline), Space Grotesk (body), JetBrains Mono (labels). Never mix display fonts; mono for all small UI labels with `tracking-[0.3em]`.
- **Sound** — `lib/useSound.js` with named cues (`button-hover`, `option-select`, `menu-close`, `card-confirm`, `stamp`, etc.). Only two real samples exist so far (`click`, `stamp`) — the rest are placeholders.

## Screens & components

| Screen / Component | P5 treatment | Notes |
|---|---|---|
| `app/page.js` — hideout corkboard | ✅ styled | Fitness calling card (torn P5 ransom-note); Nutrition card is Kami's untouched. |
| `app/fitness/page.js` — Choose Your Cycle | ✅ styled | NEW / LOAD / CONTINUE WITHOUT SAVING (ghost) options. |
| `app/fitness/new/page.js` — Name Your Cycle | ✅ styled | Random default cycle name, custom stamp-input, Enter-to-brand sequence, fire transition out. |
| `app/fitness/new/muscles/page.js` — Targets | ✅ styled | P5 ransom-note headline, side panel with checkbox rows, kanji watermark (肉). **Click-focus + checkbox-select separation is done.** Camera angles all use 30° alternating yaw. **Hitbox calibration is ongoing — see `CALIBRATION.md`.** |
| `app/fitness/load/page.js` | ⛔ stub | Needs P5 treatment. |
| `app/fitness/ghost/page.js` | ⛔ stub | Needs P5 treatment. |
| `app/fitness/new/branded/page.js` | ⛔ stub | Lands here after naming + targets — needs the actual cycle summary screen. |
| `app/diet/page.js` | ⛔ stub | Kami's territory per the hideout split. |
| `components/CallingCard.jsx` | ✅ styled | Torn-paper ransom note component. |
| `components/FireTransition.jsx` + `FireFadeIn.jsx` | ✅ styled | Source/destination overlay pair that hides the cut between screens. |
| `components/HeistTransition.jsx` | ⚠ unused? | Verify before touching. |
| `components/Insignia.jsx` | ✅ styled | Used in calling cards. |
| `components/MuscleBody.jsx` | ✅ styled | R3F canvas + P5 camera rig + gold glow projection. |

## Active paused items

1. **Muscle hitbox calibration** — in progress, tracked in `CALIBRATION.md`. Anatomy: chest, shoulders, biceps, triceps, forearms done; abs is next.
2. **T-pose on Goku / SSJ / Gohan** — GLBs load but idle animation isn't wired. `useAnimations` via drei, `Idle` clip name.
3. **Gurren Lagann copy pass** — most labels are tonally neutral (`NEXT`, `SELECT`, `TARGETS`). Want to audit every visible string and route through the verb vocabulary: forge, climb, pierce, ascend, ignite. Not a refactor — a line edit per file.
4. **Sound pack** — two real cues (`click`, `stamp`). Need distinct samples for hover, confirm, cancel, navigate, menu-open, menu-close, card-flip, stamp-confirm, fire-ignite.
5. **`/fitness/new/branded`** — currently a stub. The cycle summary screen (post-naming, post-targets) that burns the selected muscles into a finalized calling card needs to be designed and built.

## How to pick up P5 work in a new session

1. Have the new session read both this file and `.claude/commands/p5-ui.md`.
2. Tell it the current focus — e.g. *"continue from the Gurren Lagann copy pass — audit all strings in `app/fitness/new/muscles/page.js` against the verb vocabulary in the P5 skill."*
3. When a screen is finished, move its row in the table above from ⛔ / ⚠ to ✅ in the same commit.

Keep this file current — if we ship a new screen or move an item out of paused, update the table in the same commit so a cold-start session always sees the truth.
