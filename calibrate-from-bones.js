/**
 * calibrate-from-bones.js
 *
 * Reads Mixamo bone world positions (in Center-adjusted normalized space)
 * from the live page and derives accurate hitbox positions for each model.
 *
 * Run: node calibrate-from-bones.js
 * Requires dev server at localhost:3001
 */
const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3001/fitness/new/muscles'
const SETTLE_MS = 5000

const MODEL_SUBTITLES = {
  goku:    'BASE',
  gokuSSJ: 'SUPER SAIYAN',
  gohan:   'TEEN',
}

// Mixamo bone → muscle group mapping.
// Each entry: { bone(s) to average for center, pX multiplier for paired spread }
const BONE_TO_HITBOX = {
  // Bone name(s) to average for Y reference, side label
  shoulders: {
    left:  'mixamorigLeftShoulder',
    right: 'mixamorigRightShoulder',
  },
  biceps: {
    left:  'mixamorigLeftArm',      // upper arm bone
    right: 'mixamorigRightArm',
  },
  triceps: {
    left:  'mixamorigLeftArm',
    right: 'mixamorigRightArm',
  },
  forearms: {
    left:  'mixamorigLeftForeArm',
    right: 'mixamorigRightForeArm',
  },
  chest: {
    // Chest is on the torso — use Spine2 (upper chest) as Y reference,
    // push it forward (Z+) and spread it laterally from spine width
    center: 'mixamorigSpine2',
  },
  abs: {
    center: 'mixamorigSpine1',
  },
  glutes: {
    center: 'mixamorigHips',
  },
  quads: {
    left:  'mixamorigLeftUpLeg',
    right: 'mixamorigRightUpLeg',
  },
  hamstrings: {
    left:  'mixamorigLeftUpLeg',
    right: 'mixamorigRightUpLeg',
  },
  calves: {
    left:  'mixamorigLeftLeg',
    right: 'mixamorigRightLeg',
  },
}

// Scale multipliers applied to bone spread to determine hitbox scale
// These were tuned on the anatomy model and should be consistent.
const SCALE_PROPORTIONS = {
  chest:      { sx: 0.215, sy: 0.070, sz: 0.55 },
  shoulders:  { sx: 0.320, sy: 0.050, sz: 0.80, rotZ: 0.724 },
  biceps:     { sx: 0.145, sy: 0.105, sz: 0.40 },
  triceps:    { sx: 0.100, sy: 0.095, sz: 0.40 },
  forearms:   { sx: 0.120, sy: 0.130, sz: 0.60 },
  abs:        { sx: 0.120, sy: 0.125, sz: 0.45 },
  glutes:     { sx: 0.150, sy: 0.080, sz: 0.55 },
  quads:      { sx: 0.130, sy: 0.125, sz: 0.55 },
  hamstrings: { sx: 0.120, sy: 0.125, sz: 0.50 },
  calves:     { sx: 0.095, sy: 0.115, sz: 0.48 },
}

// Z offsets for front/back positioning (as fraction of body depth)
// These are world-space offsets we add to the bone Z position
const Z_NUDGE = {
  chest:      +0.45,  // push forward
  shoulders:   0.00,  // centered Z
  biceps:      0.00,
  triceps:    -0.30,  // push back
  forearms:    0.00,
  abs:        +0.35,  // push forward
  glutes:     -0.40,  // push back
  quads:      +0.25,  // push front
  hamstrings: -0.30,  // push back
  calves:     -0.20,  // push back
}

function fmt(v) { return Math.round(v * 1000) / 1000 }

// Build base-name lookup: strip trailing _NNN suffix that Blender/exporters add
function buildBoneIndex(rawBones) {
  const idx = {}
  for (const [name, pos] of Object.entries(rawBones)) {
    const base = name.replace(/_\d+$/, '')
    idx[base] = pos
  }
  return idx
}

function deriveHitboxes(rawBones, modelKey) {
  const bones = buildBoneIndex(rawBones)
  const hitboxes = []

  // We'll estimate body half-width from the shoulder bone X spread
  const lSh = bones['mixamorigLeftShoulder']
  const rSh = bones['mixamorigRightShoulder']
  const halfW = lSh && rSh ? Math.abs(rSh[0] - lSh[0]) / 2 : 1.0
  const halfH = 2.0  // always 2 (normalized to ±2)

  for (const [group, mapping] of Object.entries(BONE_TO_HITBOX)) {
    const sp = SCALE_PROPORTIONS[group]
    const sx = fmt(sp.sx * halfW * 2)
    const sy = fmt(sp.sy * halfH * 2)
    const sz = fmt(sp.sz * 0.6)   // approximate depth
    const rotZ = sp.rotZ ?? 0

    if (mapping.center) {
      // Body-centered hitbox (chest, abs, glutes)
      const b = bones[mapping.center]
      if (!b) { console.log(`  MISSING bone: ${mapping.center}`); continue }
      const y = fmt(b[1])
      const z = fmt(b[2] + Z_NUDGE[group])

      // Paired left/right
      const xOff = fmt(halfW * 0.20)
      hitboxes.push({ group, position: [-xOff, y, z], rotation: [0, 0, 0], scale: [sx, sy, sz] })
      hitboxes.push({ group, position: [ xOff, y, z], rotation: [0, 0, 0], scale: [sx, sy, sz] })

    } else {
      // Paired arm/leg hitboxes using left/right bone positions
      const lb = bones[mapping.left]
      const rb = bones[mapping.right]
      if (!lb || !rb) { console.log(`  MISSING bone: ${mapping.left} / ${mapping.right}`); continue }

      const y  = fmt((lb[1] + rb[1]) / 2)
      const z  = fmt(((lb[2] + rb[2]) / 2) + Z_NUDGE[group])
      const xL = fmt(lb[0])
      const xR = fmt(rb[0])

      hitboxes.push({ group, position: [xL, y, z], rotation: [0, 0, -rotZ], scale: [sx, sy, sz] })
      hitboxes.push({ group, position: [xR, y, z], rotation: [0, 0,  rotZ], scale: [sx, sy, sz] })
    }
  }

  return hitboxes
}

async function readBones(page, model) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)

  const subtitle = MODEL_SUBTITLES[model]
  if (subtitle) {
    const btn = page.locator('button').filter({ hasText: subtitle })
    if (await btn.count() > 0) {
      await btn.first().click()
      await page.waitForTimeout(SETTLE_MS)
    }
  }

  await page.waitForSelector('#scene-mesh-data', { timeout: 8000 }).catch(() => null)
  const raw = await page.$eval('#scene-mesh-data', el => el.dataset.bonePositions).catch(() => null)
  if (!raw) { console.log(`  No bone data for ${model}`); return null }
  return JSON.parse(raw)
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1400, height: 900 })

  for (const model of Object.keys(MODEL_SUBTITLES)) {
    console.log(`\n══ ${model} ══`)
    const bones = await readBones(page, model)
    if (!bones) continue

    // Print key bone positions (strip suffixes for display)
    const KEY_BONES = [
      'mixamorigHips', 'mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2',
      'mixamorigLeftShoulder', 'mixamorigRightShoulder',
      'mixamorigLeftArm', 'mixamorigRightArm',
      'mixamorigLeftForeArm', 'mixamorigRightForeArm',
      'mixamorigLeftUpLeg', 'mixamorigRightUpLeg',
      'mixamorigLeftLeg', 'mixamorigRightLeg',
    ]
    const boneIdx = buildBoneIndex(bones)
    console.log('  Key bone positions (Center-adjusted normalized):')
    for (const name of KEY_BONES) {
      const pos = boneIdx[name]
      if (pos) {
        const p = pos.map(v => v.toFixed(3))
        console.log(`    ${name.replace('mixamorig', '')}:  [${p}]`)
      } else {
        console.log(`    ${name.replace('mixamorig', '')}:  (not found)`)
      }
    }

    const hitboxes = deriveHitboxes(bones, model)
    console.log(`\n  // Bone-derived hitboxes for ${model}:`)
    for (const h of hitboxes) {
      const p = h.position.map(v => v.toFixed(3))
      const r = h.rotation.map(v => v.toFixed(3))
      const s = h.scale.map(v => v.toFixed(3))
      console.log(`  { group: '${h.group}', position: [${p}], rotation: [${r}], scale: [${s}] },`)
    }
  }

  await browser.close()
}

run().catch(e => { console.error(e); process.exit(1) })
