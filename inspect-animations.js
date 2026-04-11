/**
 * inspect-animations.js
 *
 * Dumps animation clip names and bone counts for each GLB model so we
 * know what's available for the T-pose fix.
 *
 * Run: node inspect-animations.js
 * Requires dev server at localhost:3001
 */
const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3001/fitness/new/muscles'
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

  for (const [model, subtitle] of Object.entries(MODEL_SUBTITLES)) {
    console.log(`\n══ ${model} ══`)

    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(SETTLE_MS)

    const btn = page.locator('button').filter({ hasText: subtitle })
    if (await btn.count() > 0) {
      await btn.first().click()
      await page.waitForTimeout(SETTLE_MS)
    }

    // Read the anim-data element written by ModelDisplay
    const raw = await page.$eval('#scene-anim-data', el => el.dataset.info).catch(() => null)
    if (!raw) {
      console.log('  No anim data — emitter not yet wired for this model')
      continue
    }

    const info = JSON.parse(raw)
    console.log(`  Animations (${info.animations.length}):`)
    for (const a of info.animations) {
      console.log(`    "${a.name}"  duration=${a.duration.toFixed(2)}s  tracks=${a.tracks}`)
    }
    console.log(`  Bones (${info.bones.length}): ${info.bones.slice(0, 8).join(', ')}${info.bones.length > 8 ? ' ...' : ''}`)
    console.log(`  SkinnedMeshes: ${info.skinnedMeshes}`)
  }

  await browser.close()
}

run().catch(e => { console.error(e); process.exit(1) })
