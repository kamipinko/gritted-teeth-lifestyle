/**
 * inspect-models.js
 *
 * Uses Playwright to load each 3D model in the browser, then reads the
 * hidden #scene-mesh-data DOM element that MuscleBody writes to. Outputs
 * a JSON file with every mesh name + world-space bounding box center/size
 * for each model — the raw data needed to build the auto-calibrator.
 *
 * Run: node inspect-models.js
 * Requires dev server at localhost:3001
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:3001/fitness/new/muscles'
const OUT_FILE = path.join(__dirname, 'mesh-data.json')
const SETTLE_MS = 5000

const MODEL_SUBTITLES = {
  anatomy: 'REFERENCE',
  goku:    'BASE',
  gokuSSJ: 'SUPER SAIYAN',
  gohan:   'TEEN',
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1400, height: 900 })

  const allData = {}

  for (const [model, subtitle] of Object.entries(MODEL_SUBTITLES)) {
    console.log(`\n── Inspecting: ${model} ──`)

    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(SETTLE_MS)

    // Click the model toggle
    const btn = page.locator('button').filter({ hasText: subtitle })
    if (await btn.count() > 0) {
      await btn.first().click()
      await page.waitForTimeout(SETTLE_MS)
    }

    // Wait for the DOM emitter to populate
    await page.waitForSelector('#scene-mesh-data', { timeout: 8000 }).catch(() => null)

    const raw = await page.$eval('#scene-mesh-data', el => el.dataset.meshes).catch(() => null)
    if (!raw) {
      console.log(`  No mesh data found — is the DOM emitter in MuscleBody?`)
      continue
    }

    const meshes = JSON.parse(raw)
    allData[model] = meshes

    console.log(`  ${meshes.length} meshes found:`)
    for (const m of meshes) {
      const c = m.center.map(v => v.toFixed(3))
      const s = m.size.map(v => v.toFixed(3))
      console.log(`    "${m.name}" — center [${c}]  size [${s}]`)
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(allData, null, 2))
  console.log(`\nSaved: ${OUT_FILE}`)

  await browser.close()
}

run().catch(e => { console.error(e); process.exit(1) })
