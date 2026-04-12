# Mobile UI Testing Skill

Test and fix the Gritted Teeth Lifestyle app's mobile UI using Playwright via browser.py.

**Mobile is the primary target.** Desktop is secondary. When there is a conflict between mobile and desktop layout, favor mobile.

---

## Setup

Dev server must be running:
```bash
npm run dev
```

Vision tool:
```
C:\Users\Jordan\claudesandbox\claude-vision\browser.py
```

---

## How to Screenshot a Page

```bash
# Basic mobile screenshot
python C:\Users\Jordan\claudesandbox\claude-vision\browser.py open http://localhost:3000/PAGE --mobile --wait 2

# Full page (scrollable content)
python C:\Users\Jordan\claudesandbox\claude-vision\browser.py open http://localhost:3000/PAGE --mobile --fullpage --wait 2

# Pages that require a profile (most fitness pages)
python C:\Users\Jordan\claudesandbox\claude-vision\browser.py open http://localhost:3000/PAGE --mobile --fullpage --wait 2 --ls gtl-active-profile=Jordan
```

---

## Page Routes & localStorage Required

| Page | Route | localStorage needed |
|------|-------|-------------------|
| Home | `/` | none |
| Profile | `/fitness` | none |
| Hub | `/fitness/hub` | `gtl-active-profile=NAME` |
| Name Cycle | `/fitness/new` | `gtl-active-profile=NAME` |
| Muscles | `/fitness/new/muscles` | `gtl-active-profile=NAME` |
| Calendar | `/fitness/new/branded` | `gtl-active-profile=NAME` |
| Plan | `/fitness/new/plan` | `gtl-active-profile=NAME` |
| Summary | `/fitness/new/summary` | `gtl-active-profile=NAME` |
| Load | `/fitness/load` | `gtl-active-profile=NAME` |
| Active | `/fitness/active` | `gtl-active-profile=NAME` |

---

## Testing Workflow

1. Screenshot each page at mobile viewport (390x844, iPhone 14)
2. Look for: text overflow, clipped content, elements too small to tap, broken layouts
3. Fix issues using `md:` breakpoints — mobile-first, desktop as enhancement
4. Re-screenshot to verify
5. Push fixes to `dev`

## Common Issues to Watch For

- Text cut off by polygon `clip-path` edges — add right margin/padding
- Flex rows too wide — reduce padding, font size, or hide decorative elements on mobile with `hidden md:block`
- Font sizes too large — use `clamp()` or responsive sizes like `text-4xl md:text-6xl`
- Buttons too small to tap — minimum 44px touch target
- Fire/heist transition animations covering content — use `--wait 2` to let them clear

## Responsive Approach

- **Mobile first**: base styles are mobile, `md:` adds desktop enhancements
- Never break desktop to fix mobile — use `md:` prefix to restore desktop behavior
- Tailwind breakpoint: `md` = 768px
