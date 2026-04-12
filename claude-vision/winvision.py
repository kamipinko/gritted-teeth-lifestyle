"""
winvision.py — Windows desktop vision + control tool for Claude
===============================================================
Gives Claude sight and control over any Windows app.

COMMANDS:
  screenshot [WindowTitle]          Full screen or specific window
  region x1 y1 x2 y2               Capture a specific screen region
  zoom x1 y1 x2 y2 [scale]         Crop + enlarge a region (default scale=3)
  crop x1 y1 x2 y2                 Crop from last screenshot (relative coords)
  click x y                        Left-click
  rclick x y                       Right-click
  dclick x y                       Double-click
  move x y                         Move mouse (no click)
  drag x1 y1 x2 y2 [duration]      Click-drag from (x1,y1) to (x2,y2)
  scroll x y amount                Scroll at position (positive=up, negative=down)
  type "text"                      Type text (Unicode safe via clipboard)
  paste "text"                     Set clipboard and press Ctrl+V
  hotkey ctrl c                    Press key combo (e.g. hotkey ctrl s)
  key enter                        Press a single key
  wait seconds                     Sleep for N seconds
  windows                          List all open window titles
  focus WindowTitle                Bring window to front
  info WindowTitle                 Print window position/size

OUTPUT: all screenshots saved to tools/screen.png
"""

import sys
import time
import subprocess
import pyautogui
import pygetwindow as gw
from PIL import ImageGrab, Image

import os
_HERE = os.path.dirname(os.path.abspath(__file__))
SCREENSHOT_PATH = os.path.join(_HERE, "screen.png")

pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.1

# Target width Claude can read clearly. 4K -> 1920 cuts each pixel to half,
# making text readable. Zoom/crop commands bypass this to preserve their upscale.
CLAUDE_MAX_WIDTH = 1920


# ── Resize helper ──────────────────────────────────────────────────────────────

def _normalize(img, max_width=CLAUDE_MAX_WIDTH):
    """Downscale wide images so Claude can read them clearly. Never upscales."""
    if img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    return img


def _save(img, label="", normalize=True):
    if normalize:
        orig = img.size
        img = _normalize(img)
        if img.size != orig:
            print(f"Resized: {orig} to {img.size}  (normalized for Claude)")
    img.save(SCREENSHOT_PATH)
    msg = f"Saved: {SCREENSHOT_PATH}  ({img.size[0]}x{img.size[1]})"
    print(f"{label}  {msg}" if label else msg)
    return img


# ── Screenshot helpers ─────────────────────────────────────────────────────────

def screenshot(window_title=None):
    if window_title:
        matches = gw.getWindowsWithTitle(window_title)
        if not matches:
            print(f"ERROR: No window found matching '{window_title}'")
            print("Run: python winvision.py windows")
            sys.exit(1)
        win = matches[0]
        try:
            win.activate()
            time.sleep(0.4)
        except Exception:
            pass
        bbox = (win.left, win.top, win.right, win.bottom)
        img = ImageGrab.grab(bbox=bbox)
        print(f"Window '{win.title}' at {bbox}  raw={img.size}")
    else:
        img = ImageGrab.grab()
        print(f"Full screen raw: {img.size}")

    return _save(img)


def region(x1, y1, x2, y2):
    """Capture a specific rectangle of the screen."""
    img = ImageGrab.grab(bbox=(x1, y1, x2, y2))
    print(f"Region ({x1},{y1})->({x2},{y2})  raw={img.size}")
    return _save(img)


def zoom(x1, y1, x2, y2, scale=3):
    """Capture a screen region and scale it up for readability. Skips normalization."""
    img = ImageGrab.grab(bbox=(x1, y1, x2, y2))
    new_size = (img.width * scale, img.height * scale)
    img = img.resize(new_size, Image.NEAREST)
    # Zoom is intentionally upscaled — don't normalize back down
    return _save(img, label=f"Zoom {scale}x  ({x1},{y1})->({x2},{y2})", normalize=False)


def crop(x1, y1, x2, y2, scale=2):
    """Crop from the last saved screenshot (pixel coords in that image) and upscale."""
    try:
        img = Image.open(SCREENSHOT_PATH)
    except FileNotFoundError:
        print("ERROR: No screenshot saved yet. Run 'screenshot' first.")
        sys.exit(1)
    cropped = img.crop((x1, y1, x2, y2))
    new_size = (cropped.width * scale, cropped.height * scale)
    cropped = cropped.resize(new_size, Image.LANCZOS)
    # Crop is intentionally upscaled — don't normalize back down
    _save(cropped, label=f"Crop ({x1},{y1})->({x2},{y2}) scaled {scale}x", normalize=False)


# ── Window helpers ─────────────────────────────────────────────────────────────

def list_windows():
    wins = gw.getAllTitles()
    visible = [t for t in wins if t.strip()]
    print(f"Open windows ({len(visible)}):")
    for t in sorted(visible):
        safe = t.encode('ascii', errors='replace').decode('ascii')
        print(f"  {safe}")


def focus_window(title):
    matches = gw.getWindowsWithTitle(title)
    if not matches:
        print(f"ERROR: No window matching '{title}'")
        sys.exit(1)
    win = matches[0]
    win.activate()
    print(f"Focused: '{win.title}'")


def window_info(title):
    matches = gw.getWindowsWithTitle(title)
    if not matches:
        print(f"ERROR: No window matching '{title}'")
        sys.exit(1)
    win = matches[0]
    print(f"Title : {win.title}")
    print(f"Pos   : left={win.left}  top={win.top}")
    print(f"Size  : {win.width} x {win.height}")
    print(f"Box   : ({win.left},{win.top}) to ({win.right},{win.bottom})")


# ── Clipboard helper ──────────────────────────────────────────────────────────

def _set_clipboard(text):
    """Set clipboard text using PowerShell (handles Unicode)."""
    escaped = text.replace("'", "''")
    subprocess.run(
        ["powershell", "-Command", f"Set-Clipboard -Value '{escaped}'"],
        check=True, capture_output=True
    )


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1].lower()

    if cmd == "screenshot":
        title = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else None
        screenshot(title)

    elif cmd == "region":
        x1, y1, x2, y2 = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
        region(x1, y1, x2, y2)

    elif cmd == "zoom":
        x1, y1, x2, y2 = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
        scale = int(sys.argv[6]) if len(sys.argv) > 6 else 3
        zoom(x1, y1, x2, y2, scale)

    elif cmd == "crop":
        x1, y1, x2, y2 = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
        scale = int(sys.argv[6]) if len(sys.argv) > 6 else 2
        crop(x1, y1, x2, y2, scale)

    elif cmd == "click":
        x, y = int(sys.argv[2]), int(sys.argv[3])
        pyautogui.click(x, y)
        print(f"Clicked ({x},{y})")

    elif cmd == "rclick":
        x, y = int(sys.argv[2]), int(sys.argv[3])
        pyautogui.rightClick(x, y)
        print(f"Right-clicked ({x},{y})")

    elif cmd == "dclick":
        x, y = int(sys.argv[2]), int(sys.argv[3])
        pyautogui.doubleClick(x, y)
        print(f"Double-clicked ({x},{y})")

    elif cmd == "move":
        x, y = int(sys.argv[2]), int(sys.argv[3])
        pyautogui.moveTo(x, y)
        print(f"Moved to ({x},{y})")

    elif cmd == "scroll":
        x, y, amount = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
        pyautogui.scroll(amount, x=x, y=y)
        print(f"Scrolled {amount} at ({x},{y})")

    elif cmd == "drag":
        x1, y1, x2, y2 = int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
        duration = float(sys.argv[6]) if len(sys.argv) > 6 else 0.3
        pyautogui.moveTo(x1, y1)
        pyautogui.dragTo(x2, y2, duration=duration, button='left')
        print(f"Dragged ({x1},{y1}) -> ({x2},{y2}) over {duration}s")

    elif cmd == "type":
        text = " ".join(sys.argv[2:])
        # Use clipboard for Unicode safety
        _set_clipboard(text)
        pyautogui.hotkey('ctrl', 'v')
        print(f"Typed (via clipboard): {text}")

    elif cmd == "paste":
        text = " ".join(sys.argv[2:])
        _set_clipboard(text)
        pyautogui.hotkey('ctrl', 'v')
        print(f"Pasted: {text}")

    elif cmd == "hotkey":
        keys = sys.argv[2:]
        pyautogui.hotkey(*keys)
        print(f"Hotkey: {'+'.join(keys)}")

    elif cmd == "key":
        key = sys.argv[2]
        pyautogui.press(key)
        print(f"Pressed: {key}")

    elif cmd == "wait":
        secs = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
        time.sleep(secs)
        print(f"Waited {secs}s")

    elif cmd == "windows":
        list_windows()

    elif cmd == "focus":
        title = " ".join(sys.argv[2:])
        focus_window(title)

    elif cmd == "info":
        title = " ".join(sys.argv[2:])
        window_info(title)

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
