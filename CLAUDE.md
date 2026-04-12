# Gritted Teeth Lifestyle — Claude Instructions

## Vision & Control

Claude has eyes. Use them. See `EYES.md` for full docs.

**Quick reference — to see anything:**
```bash
python tools/winvision.py screenshot              # full desktop
python tools/winvision.py screenshot "AppName"    # specific window
python tools/browser.py open https://...          # browser (headless)
```
Then read `tools/screen.png` — Claude sees it directly.

**Before reporting any UI issue, take a screenshot and look at it first.**
**Before clicking coordinates, take a screenshot to confirm where things are.**

## Dev Server

Start at the beginning of every session:
```bash
npm run dev
```
Runs on `http://localhost:3000`.

## Stack

- Next.js (App Router), Tailwind CSS, Persona 5 UI style
- Diet photo tracker + fitness cycle builder
- Playwright (Node.js) for model screenshots, Python Playwright for browser automation

## Key Files

- `EYES.md` — vision system docs and setup
- `tools/winvision.py` — screenshot + control any Windows app
- `tools/browser.py` — Playwright browser automation
- `tools/screenshot-models.js` — 3D muscle model captures
- `screenshots/` — model screenshot output

## Persona 5 UI

All UI follows P5 style. See `P5_UI.md` for the design system.
