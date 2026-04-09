/**
 * screenshot-models.js
 *
 * Takes screenshots of each 3D model on the muscle selection page so
 * Claude can see where hitboxes should be placed for calibration.
 *
 * Run: node screenshot-models.js
 * Requires dev server running at localhost:3001
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:3001/fitness/new/muscles'
const OUT_DIR = path.join(__dirname, 'screenshots')

const MODELS = ['anatomy', 'goku', 'gohan']
const SETTLE_MS = 4000

async function dragCanvas(page, canvas, dragX, dragY = 0) {
  const box = await canvas.boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + dragX, cy + dragY, { steps: 30 })
  await page.mouse.up()
  await page.waitForTimeout(500)
}

// Subtitles that uniquely identify each model button
const MODEL_SUBTITLES = {
  anatomy: 'REFERENCE',
  goku:    'BASE',
  gokuSSJ: 'SUPER SAIYAN',
  gohan:   'TEEN',
}

// Hard-reload the page and switch to the given model so the camera
// always starts from the clean overview position.
async function loadFresh(page, model) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)
  const subtitle = MODEL_SUBTITLES[model]
  if (subtitle) {
    // Find the button whose subtitle div contains the model's unique subtitle
    const btn = page.locator('button').filter({ hasText: subtitle })
    if (await btn.count() > 0) {
      await btn.first().click()
      await page.waitForTimeout(SETTLE_MS)
    } else {
      console.log(`  WARNING: could not find button for ${model} (subtitle: ${subtitle})`)
    }
  }
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1600, height: 900 })

  for (const model of MODELS) {
    console.log(`\n── Model: ${model} ──`)

    // Fresh page load so camera is always at overview
    await loadFresh(page, model)

    const canvasContainer = page.locator('.relative.h-\\[600px\\]').first()
    const box = await canvasContainer.boundingBox()
    const clip = { x: box.x, y: box.y, width: box.width, height: box.height }

    // ── 1. Clean front view (P5 auto-rotate camera, no debug) ────────
    await page.screenshot({ path: path.join(OUT_DIR, `${model}_1_front.png`), clip })
    console.log(`  ${model}_1_front.png`)

    // ── 2. Enable calibration mode — camera now free via OrbitControls
    await page.keyboard.press('`')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT_DIR, `${model}_2_front_debug.png`), clip })
    console.log(`  ${model}_2_front_debug.png`)

    // ── 3. Rotate 180° to see the back ───────────────────────────────
    await dragCanvas(page, canvasContainer, 300)
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(OUT_DIR, `${model}_3_back_debug.png`), clip })
    console.log(`  ${model}_3_back_debug.png`)

    // ── 4. Side view (90° from back) ─────────────────────────────────
    await dragCanvas(page, canvasContainer, -150)
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(OUT_DIR, `${model}_4_side_debug.png`), clip })
    console.log(`  ${model}_4_side_debug.png`)

    // ── 5. Tilt down to see lower body (calves/quads) ────────────────
    await dragCanvas(page, canvasContainer, 150, 120)
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(OUT_DIR, `${model}_5_lower_debug.png`), clip })
    console.log(`  ${model}_5_lower_debug.png`)
  }

  await browser.close()
  console.log(`\nDone. Screenshots in: ${OUT_DIR}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
