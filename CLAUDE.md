# Claude Instructions — Gritted Teeth Lifestyle

## Read this first

There is an open task list for this project at `KAMI_TODO.md`. At the start of every session, read it and surface any incomplete items to the developer.

## Project overview

Next.js 14 app — two sides:
- **Fitness** (Jordan's domain): 3D muscle selector, workout cycle builder, active day-focus view
- **Diet** (Kami's domain): meal photo → macro analysis via Gemini

## Design language

All UI follows the P5 (Persona 5) visual language. Read `.claude/commands/p5-ui.md` before making any UI changes. Implementation status is tracked in `P5_UI.md`.

## Key conventions

- All localStorage keys are profile-scoped via `pk()` from `lib/storage.js`
- Profile guard: all fitness sub-pages call `useProfileGuard()` — do not remove this
- `gtl-back-to-edit` localStorage flag controls retreat/Enter navigation in edit mode
- Dev server: `npm run dev` from the project root (defaults to localhost:3000)

## Branch workflow

- Always commit to `dev` first
- Only merge to `main` when ready to deploy
