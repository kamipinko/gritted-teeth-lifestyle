# Claude Vision

Gives Claude eyes — screenshot and control any Windows app or browser.

## Setup (one time)

```bash
pip install pyautogui pygetwindow pillow playwright
python -m playwright install chromium
```

## Tools

### `winvision.py` — any Windows app

```bash
python claude-vision/winvision.py screenshot              # full desktop
python claude-vision/winvision.py screenshot "AppName"    # specific window
python claude-vision/winvision.py region x1 y1 x2 y2      # screen region
python claude-vision/winvision.py zoom x1 y1 x2 y2 3      # zoom in 3x
python claude-vision/winvision.py click x y
python claude-vision/winvision.py type "text"             # Unicode safe
python claude-vision/winvision.py windows                 # list open windows
python claude-vision/winvision.py drag x1 y1 x2 y2
python claude-vision/winvision.py key enter
python claude-vision/winvision.py hotkey ctrl s
```

### `browser.py` — Playwright browser (headless)

```bash
python claude-vision/browser.py open https://...
python claude-vision/browser.py screenshot
python claude-vision/browser.py click "selector or text"
python claude-vision/browser.py fill "#input" "value"
python claude-vision/browser.py eval "document.title"
python claude-vision/browser.py open https://... --headed   # visible browser
```

All screenshots save to `claude-vision/screen.png` — Claude reads it directly.

> Dev branch only — do not merge to main until stable.
