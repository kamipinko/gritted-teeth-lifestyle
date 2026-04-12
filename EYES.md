# Eyes for Claude

Gives Claude vision into the 3D muscle models so it can help calibrate hitboxes.

## Setup (one time)

```bash
npm install
npx playwright install chromium
```

## Usage

Make sure the dev server is running first:

```bash
npm run dev
```

Then in a second terminal:

```bash
node screenshot-models.js
```

Screenshots land in `screenshots/` — front, debug (hitbox wireframes), back, side, and lower views for each model. Share them with Claude and it can tell you exactly what needs adjusting.

## What it captures

| File | What you see |
|---|---|
| `{model}_1_front.png` | Clean model, P5 camera angle |
| `{model}_2_front_debug.png` | Hitbox wireframes overlaid, front |
| `{model}_3_back_debug.png` | Rotated 180° — back of model |
| `{model}_4_side_debug.png` | Side profile |
| `{model}_5_lower_debug.png` | Tilted down — legs/calves |

## Calibration mode (in browser)

- Press `` ` `` (backtick) to toggle calibration mode on/off
- **T** = translate, **S** = scale, **R** = rotate the gizmos
- **F12** = snapshot all hitbox positions → logs to console + downloads JSON
- Paste the console output to Claude and it locks the numbers into the code
