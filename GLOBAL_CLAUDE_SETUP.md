# Global Claude Vision Setup

Gets Claude seeing your screen in every project automatically — no per-project config needed.

## Step 1 — Clone the vision tools

```bash
git clone https://github.com/Gritted-Teeth-Lifestyle/claude-vision.git ~/claude-vision
```

Pick a permanent home for it. `~/claude-vision` works on Mac/Linux.
On Windows: `C:\Users\<YourName>\claude-vision`

## Step 2 — Install dependencies (one time)

```bash
pip install pyautogui pygetwindow pillow playwright
python -m playwright install chromium
```

## Step 3 — Create your global CLAUDE.md

This file is loaded by every Claude instance automatically, in every project.

**Mac/Linux:** `~/.claude/CLAUDE.md`
**Windows:** `C:\Users\<YourName>\.claude\CLAUDE.md`

Paste this in, replacing `<path>` with wherever you cloned it:

```markdown
# Global Claude Instructions

## Vision & Control

Claude has eyes. Use them.

Tools live at: <path>/claude-vision

To see anything:
python <path>/claude-vision/winvision.py screenshot
python <path>/claude-vision/winvision.py screenshot "AppName"
python <path>/claude-vision/browser.py open https://...

Then read <path>/claude-vision/screen.png.

### Rules
- Before reporting any UI issue, take a screenshot and look first
- Before clicking coordinates, take a screenshot to confirm position
- Use browser.py for web pages, winvision.py for desktop apps
- Use record to capture motion: python winvision.py record "AppName" 2 4
```

## Done

Every Claude session from this point on has vision. No per-project setup needed.

## Keeping tools updated

```bash
cd ~/claude-vision
git pull
```

---

## Quick reference

```bash
# Desktop apps
python winvision.py screenshot                  # full screen
python winvision.py screenshot "AppName"        # specific window
python winvision.py region x1 y1 x2 y2          # crop region
python winvision.py zoom x1 y1 x2 y2 3          # zoom in 3x
python winvision.py record "AppName" 2 4        # motion — 2fps for 4s

# Browser
python browser.py open https://...
python browser.py click "selector"
python browser.py fill "#input" "value"
python browser.py screenshot
```
