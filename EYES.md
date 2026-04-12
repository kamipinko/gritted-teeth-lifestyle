# Eyes for Claude

Gives Claude vision and control over any app on the machine — browsers, Blender, editors, the full desktop.
Two tools. Both save to `tools/screen.png`, which Claude reads directly.

---

## Setup (one time)

```bash
pip install pyautogui pygetwindow pillow playwright
python -m playwright install chromium
```

---

## Tool 1: `winvision.py` — any Windows app

```bash
# See the screen
python tools/winvision.py screenshot                   # full desktop
python tools/winvision.py screenshot "Blender"         # specific window (partial title match)
python tools/winvision.py region 0 0 800 600           # crop a region
python tools/winvision.py zoom 0 0 400 200 3           # zoom in 3x for small UI details

# Interact
python tools/winvision.py click 500 300                # left click
python tools/winvision.py rclick 500 300               # right click
python tools/winvision.py dclick 500 300               # double click
python tools/winvision.py drag 100 100 400 400         # click-drag
python tools/winvision.py scroll 500 300 -3            # scroll down 3
python tools/winvision.py type "hello world"           # type text (Unicode safe)
python tools/winvision.py key enter
python tools/winvision.py hotkey ctrl s

# Window management
python tools/winvision.py windows                      # list all open windows
python tools/winvision.py focus "Chrome"               # bring window to front
python tools/winvision.py info "Blender"               # print position/size
python tools/winvision.py wait 1.5                     # pause
```

---

## Tool 2: `browser.py` — Playwright for web pages

Headless by default. Add `--headed` to see the browser.

```bash
python tools/browser.py open https://example.com
python tools/browser.py screenshot
python tools/browser.py click "button text or CSS selector"
python tools/browser.py fill "#email" "user@example.com"
python tools/browser.py fill "#password" "secret"
python tools/browser.py press "#search" Enter
python tools/browser.py select "#dropdown" "option-value"
python tools/browser.py scroll down
python tools/browser.py eval "document.title"
python tools/browser.py text "h1"
python tools/browser.py back
python tools/browser.py reload

# Visible browser (useful for debugging)
python tools/browser.py open https://localhost:3000 --headed
```

Session state (last URL) is saved to `tools/browser_state.json` between calls.

---

## Tool 3: `screenshot-models.js` — Gritted Teeth 3D models (Node.js / Playwright)

Specific to the muscle body model — captures all angles for hitbox calibration.

```bash
npm run dev          # start dev server first
node screenshot-models.js
```

Screenshots land in `screenshots/` — front, debug wireframes, back, side, lower for each model.

### Calibration mode (in browser)
- Backtick `` ` `` — toggle calibration mode
- **T / S / R** — translate / scale / rotate hitbox gizmos
- **F12** — snapshot all hitbox positions, logs to console + downloads JSON

---

## How Claude uses these

1. Run a screenshot command
2. Claude reads `tools/screen.png` directly — no file sharing needed
3. Claude describes what it sees, identifies coordinates, suggests actions
4. Iterate: screenshot → analyze → act → screenshot

Claude can drive any visible app this way. The vision gets sharper the more we work with it.
