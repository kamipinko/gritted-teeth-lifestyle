"""
browser.py — Playwright browser automation for Claude
======================================================
Full Playwright-powered browser control. Headless by default; use --headed for visible browser.

COMMANDS:
  open URL [--headed]              Open URL, screenshot result
  screenshot                       Screenshot current page
  click "selector"                 Click element (CSS selector or text)
  fill "selector" "text"           Type into input field
  select "selector" "value"        Select dropdown option
  check "selector"                 Check/uncheck checkbox
  hover "selector"                 Hover over element
  press "selector" "key"           Press key on element (e.g. Enter, Tab)
  wait "selector"                  Wait for element to appear
  waitfor seconds                  Wait N seconds
  scroll "selector"|down|up        Scroll to element or direction
  eval "js"                        Run JavaScript and print result
  text "selector"                  Get text content of element
  attr "selector" "attribute"      Get attribute value
  title                            Get page title
  url                              Get current URL
  back                             Navigate back
  forward                          Navigate forward
  reload                           Reload page
  close                            Close browser

OPTIONS:
  --headed                         Run browser in visible (headed) mode
  --page PATH                      Load from local file path

STATE: Browser session persists via /tmp/browser_state.json between calls
       when using --session flag.
OUTPUT: screenshots saved to tools/screen.png
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path

import os as _os
_HERE = _os.path.dirname(_os.path.abspath(__file__))
SCREENSHOT_PATH = _os.path.join(_HERE, "screen.png")
STATE_PATH = _os.path.join(_HERE, "browser_state.json")

# Parse global flags before command
def parse_flags(args):
    headed = "--headed" in args
    args = [a for a in args if a != "--headed"]
    return args, headed


def save_state(page):
    state = {
        "url": page.url,
        "title": page.title(),
    }
    with open(STATE_PATH, "w") as f:
        json.dump(state, f)


def run(args_raw):
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

    args, headed = parse_flags(args_raw)

    if not args:
        print(__doc__)
        sys.exit(0)

    cmd = args[0].lower()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not headed)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
            ignore_https_errors=True,
        )
        page = context.new_page()

        # Restore session URL if continuing
        if cmd != "open" and os.path.exists(STATE_PATH):
            with open(STATE_PATH) as f:
                state = json.load(f)
            url = state.get("url")
            if url and url != "about:blank":
                page.goto(url, wait_until="domcontentloaded")

        def snap(label=""):
            page.screenshot(path=SCREENSHOT_PATH)
            size = Path(SCREENSHOT_PATH).stat().st_size
            save_state(page)
            msg = f"Screenshot saved ({size} bytes): {SCREENSHOT_PATH}"
            if label:
                msg = f"{label}  |  {msg}"
            print(msg)

        def resolve(selector):
            """Try selector as CSS first, then as visible text."""
            return selector

        try:
            if cmd == "open":
                url = args[1] if len(args) > 1 else "about:blank"
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                print(f"Opened: {page.url}")
                print(f"Title : {page.title()}")
                snap()

            elif cmd == "screenshot":
                snap()

            elif cmd == "click":
                sel = args[1]
                # Try text match if selector looks like plain text
                try:
                    page.locator(sel).first.click(timeout=5000)
                except Exception:
                    page.get_by_text(sel, exact=False).first.click(timeout=5000)
                print(f"Clicked: {sel}")
                page.wait_for_load_state("domcontentloaded")
                snap(f"After click: {sel}")

            elif cmd == "fill":
                sel, text = args[1], args[2]
                page.locator(sel).first.fill(text)
                print(f"Filled '{sel}' with: {text}")
                snap()

            elif cmd == "select":
                sel, value = args[1], args[2]
                page.locator(sel).first.select_option(value)
                print(f"Selected '{value}' in {sel}")
                snap()

            elif cmd == "check":
                sel = args[1]
                page.locator(sel).first.click()
                print(f"Toggled: {sel}")
                snap()

            elif cmd == "hover":
                sel = args[1]
                page.locator(sel).first.hover()
                print(f"Hovered: {sel}")
                snap()

            elif cmd == "press":
                sel, key = args[1], args[2]
                page.locator(sel).first.press(key)
                print(f"Pressed {key} on: {sel}")
                snap()

            elif cmd == "wait":
                sel = args[1]
                timeout = float(args[2]) * 1000 if len(args) > 2 else 10000
                page.locator(sel).first.wait_for(state="visible", timeout=timeout)
                print(f"Element visible: {sel}")
                snap()

            elif cmd == "waitfor":
                secs = float(args[1]) if len(args) > 1 else 1.0
                time.sleep(secs)
                print(f"Waited {secs}s")
                snap()

            elif cmd == "scroll":
                target = args[1] if len(args) > 1 else "down"
                if target == "down":
                    page.keyboard.press("End")
                elif target == "up":
                    page.keyboard.press("Home")
                else:
                    page.locator(target).first.scroll_into_view_if_needed()
                print(f"Scrolled: {target}")
                snap()

            elif cmd == "eval":
                js = " ".join(args[1:])
                result = page.evaluate(js)
                print(f"Result: {result}")
                snap()

            elif cmd == "text":
                sel = args[1]
                text = page.locator(sel).first.inner_text()
                print(f"Text: {text}")

            elif cmd == "attr":
                sel, attr = args[1], args[2]
                val = page.locator(sel).first.get_attribute(attr)
                print(f"Attribute '{attr}': {val}")

            elif cmd == "title":
                print(f"Title: {page.title()}")

            elif cmd == "url":
                print(f"URL: {page.url}")

            elif cmd == "back":
                page.go_back(wait_until="domcontentloaded")
                print(f"Back -> {page.url}")
                snap()

            elif cmd == "forward":
                page.go_forward(wait_until="domcontentloaded")
                print(f"Forward -> {page.url}")
                snap()

            elif cmd == "reload":
                page.reload(wait_until="domcontentloaded")
                print(f"Reloaded: {page.url}")
                snap()

            elif cmd == "close":
                save_state(page)
                print("Browser closed.")

            else:
                print(f"Unknown command: {cmd}")
                print(__doc__)
                sys.exit(1)

        except PWTimeout as e:
            print(f"TIMEOUT: {e}")
            snap("Timeout state")
            sys.exit(1)
        except Exception as e:
            print(f"ERROR: {e}")
            try:
                snap("Error state")
            except Exception:
                pass
            sys.exit(1)
        finally:
            try:
                save_state(page)
            except Exception:
                pass
            browser.close()


if __name__ == "__main__":
    run(sys.argv[1:])
