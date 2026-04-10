/**
 * auto-calibrate.js
 *
 * Computes muscle hitbox positions for any T-pose 3D model using
 * anatomical proportion constants derived from the hand-calibrated
 * anatomy model (our ground truth).
 *
 * The anatomy model hitboxes are pinned at these normalized Y positions
 * (model normalized to TARGET_HEIGHT = 4.0, centered at Y=0):
 *   shoulders  1.173   (≈ +58.7% from center)
 *   chest      1.051   (≈ +52.6%)
 *   biceps     0.809   (≈ +40.5%)
 *   triceps    0.839   (≈ +42.0%)
 *   forearms   0.332   (≈ +16.6%)
 *   abs        0.450   (≈ +22.5%)  ← refined estimate
 *   glutes    -0.200   (≈ -10.0%)
 *   quads     -0.620   (≈ -31.0%)
 *   hamstrings-0.620   (≈ -31.0%)
 *   calves    -1.200   (≈ -60.0%)
 *
 * For a model of height H centered at Yc, the position of each muscle
 * is:  Y = Yc + proportion * (H / 2)
 *
 * X spread and Z depth scale with body width and depth respectively.
 *
 * Usage:
 *   const hitboxes = autoCalibrate(boundingBox, modelKey)
 *   // boundingBox: { min: {x,y,z}, max: {x,y,z} } in normalized world space
 *
 * Run: node auto-calibrate.js   (prints hitboxes for each model from mesh-data.json)
 */

// Proportion constants derived from anatomy calibration.
// pY  = Y position as fraction of half-height from center (signed)
// pX  = half X-spread as fraction of half-width
// pZf = Z position (front) as fraction of half-depth (positive = front)
// pZb = Z position (back)  as fraction of half-depth (negative = back)
// sx/sy/sz = scale as fraction of body half-width/half-height/half-depth
const MUSCLE_PROPORTIONS = {
  chest: {
    pY:  0.526, pX: 0.22, pZf:  0.95,
    sx: 0.215, sy: 0.070, sz: 0.55,
    paired: true, side: 'front',
  },
  shoulders: {
    pY:  0.587, pX: 0.50, pZf:  0.00,
    sx: 0.320, sy: 0.050, sz: 0.80,
    paired: true, side: 'both',
    rotZ: 0.724,  // tilt outward
  },
  biceps: {
    pY:  0.405, pX: 0.58, pZf:  0.00,
    sx: 0.145, sy: 0.105, sz: 0.40,
    paired: true, side: 'both',
  },
  triceps: {
    pY:  0.420, pX: 0.61, pZb: -0.85,
    sx: 0.100, sy: 0.095, sz: 0.40,
    paired: true, side: 'back',
  },
  forearms: {
    pY:  0.166, pX: 0.75, pZb: -0.20,
    sx: 0.120, sy: 0.130, sz: 0.60,
    paired: true, side: 'both',
  },
  abs: {
    pY:  0.225, pX: 0.10, pZf:  0.95,
    sx: 0.120, sy: 0.125, sz: 0.45,
    paired: true, side: 'front',
  },
  glutes: {
    pY: -0.100, pX: 0.18, pZb: -0.90,
    sx: 0.150, sy: 0.080, sz: 0.55,
    paired: true, side: 'back',
  },
  quads: {
    pY: -0.310, pX: 0.16, pZf:  0.60,
    sx: 0.130, sy: 0.125, sz: 0.55,
    paired: true, side: 'front',
  },
  hamstrings: {
    pY: -0.310, pX: 0.16, pZb: -0.70,
    sx: 0.120, sy: 0.125, sz: 0.50,
    paired: true, side: 'back',
  },
  calves: {
    pY: -0.600, pX: 0.13, pZb: -0.40,
    sx: 0.095, sy: 0.115, sz: 0.48,
    paired: true, side: 'back',
  },
  // Proportions derived from anatomy hand-calibrated hitboxes:
  //   anatomy: position [-0.226, 0.900, -0.260], scale [0.220, 0.300, 0.110]
  //   anatomy hW=0.841, hH=2.0, hD=0.364
  //   pX = 0.226/0.841 = 0.269, pY = 0.900/2.0 = 0.450, pZb = -0.260/0.364 = -0.714
  //   sx = 0.220/0.841 = 0.261, sy = 0.300/2.0 = 0.150, sz = 0.110/0.364 = 0.302
  back: {
    pY:  0.450, pX: 0.27, pZb: -0.70,
    sx: 0.26, sy: 0.15, sz: 0.30,
    paired: true, side: 'back',
  },
}

/**
 * Given a model's body bounding box (already in normalized world space,
 * e.g. after normalizedScale has been applied), returns a full hitbox
 * array in the same format as MODELS[key].hitboxes.
 *
 * @param {{ min: {x,y,z}, max: {x,y,z} }} bbox
 * @returns {Array} hitbox objects
 */
function autoCalibrate(bbox) {
  const H  = bbox.max.y - bbox.min.y   // full height
  const W  = bbox.max.x - bbox.min.x   // full width
  const D  = bbox.max.z - bbox.min.z   // full depth
  const Yc = (bbox.max.y + bbox.min.y) / 2  // Y center
  const Xc = (bbox.max.x + bbox.min.x) / 2  // X center (should be ~0)
  const Zc = (bbox.max.z + bbox.min.z) / 2  // Z center (should be ~0)

  const hH = H / 2  // half-height
  const hW = W / 2  // half-width
  const hD = D / 2  // half-depth

  const fmt = (v) => Math.round(v * 1000) / 1000

  const hitboxes = []

  for (const [group, p] of Object.entries(MUSCLE_PROPORTIONS)) {
    const y   = fmt(Yc + p.pY * hH)
    const xR  = fmt(Xc + p.pX * hW)   // right side
    const xL  = fmt(Xc - p.pX * hW)   // left side (mirror)
    const z   = fmt(Zc + (p.pZf ?? p.pZb ?? 0) * hD)

    const sx = fmt(p.sx * hW)
    const sy = fmt(p.sy * hH)
    const sz = fmt(p.sz * hD)

    const rotZ = p.rotZ ?? 0

    // Left hitbox
    hitboxes.push({
      group,
      position: [xL, y, z],
      rotation: [0, 0, -rotZ],
      scale:    [sx, sy, sz],
    })
    // Right hitbox (mirror X rotation sign)
    hitboxes.push({
      group,
      position: [xR, y, z],
      rotation: [0, 0, rotZ],
      scale:    [sx, sy, sz],
    })
  }

  return hitboxes
}

// ── Compute bbox and hitboxes for a model from mesh-data ─────────────
function computeForModel(meshes) {
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const m of meshes) {
    const [cx, cy, cz] = m.center
    const [sx, sy, sz] = m.size
    minX = Math.min(minX, cx - sx/2); maxX = Math.max(maxX, cx + sx/2)
    minY = Math.min(minY, cy - sy/2); maxY = Math.max(maxY, cy + sy/2)
    minZ = Math.min(minZ, cz - sz/2); maxZ = Math.max(maxZ, cz + sz/2)
  }
  const rawH = maxY - minY
  const rawW = maxX - minX
  const rawD = maxZ - minZ
  const maxDim = Math.max(rawH, rawW, rawD)
  const scale = maxDim > 0 ? 4.0 / maxDim : 1
  const Yc_raw = (minY + maxY) / 2
  const Xc_raw = (minX + maxX) / 2
  const Zc_raw = (minZ + maxZ) / 2
  const bbox = {
    min: { x: (minX - Xc_raw) * scale, y: (minY - Yc_raw) * scale, z: (minZ - Zc_raw) * scale },
    max: { x: (maxX - Xc_raw) * scale, y: (maxY - Yc_raw) * scale, z: (maxZ - Zc_raw) * scale },
  }
  return { bbox, scale, rawH, rawW, rawD }
}

// ── Patch hitboxes for a model in MuscleBody.jsx ──────────────────────
// Replaces the hitboxes: [...] array for the given model key in place.
function patchMuscleBody(modelKey, hitboxes, filePath) {
  const fs = require('fs')
  let src = fs.readFileSync(filePath, 'utf8')

  // Format the hitbox lines as JSX-compatible JS
  const lines = hitboxes.map((h) => {
    const p = h.position.map(v => v.toFixed(3))
    const s = h.scale.map(v => v.toFixed(3))
    const rotZ = h.rotation[2]
    const rotLine = h.rotation.every(v => v === 0)
      ? `rotation: [0, 0, 0]`
      : `rotation: [${h.rotation.map(v => v.toFixed(3))}]`
    return `      { group: '${h.group}', position: [${p}], ${rotLine}, scale: [${s}] },`
  })
  const newArray = `[\n${lines.join('\n')}\n    ]`

  // Find the model's hitboxes block: look for the model key, then hitboxes: [
  // Use a stateful search so we match balanced brackets.
  const modelStart = src.indexOf(`  ${modelKey}: {`)
  if (modelStart === -1) {
    console.error(`  ERROR: model key "${modelKey}" not found in ${filePath}`)
    return false
  }

  const hbLabel = 'hitboxes: ['
  const hbStart = src.indexOf(hbLabel, modelStart)
  if (hbStart === -1) {
    console.error(`  ERROR: hitboxes array not found for ${modelKey}`)
    return false
  }

  // Walk forward from '[' to find matching ']'
  let depth = 0
  let i = hbStart + hbLabel.length - 1  // at the '['
  while (i < src.length) {
    if (src[i] === '[') depth++
    else if (src[i] === ']') { depth--; if (depth === 0) break }
    i++
  }
  if (depth !== 0) {
    console.error(`  ERROR: unbalanced brackets for ${modelKey} hitboxes`)
    return false
  }

  const before = src.slice(0, hbStart + hbLabel.length - 1)
  const after  = src.slice(i + 1)
  src = before + newArray + after

  fs.writeFileSync(filePath, src, 'utf8')
  return true
}

// ── CLI: run against mesh-data.json to preview hitboxes for each model ──
// Flags:
//   --apply=modelKey   patch the named model's hitboxes into MuscleBody.jsx
//                      (can repeat: --apply=gokuSSJ --apply=gohan)
//   --muscle-body=path  path to MuscleBody.jsx (default: ./components/MuscleBody.jsx)
if (require.main === module) {
  const fs   = require('fs')
  const path = require('path')

  const args = process.argv.slice(2)
  const applyModels = args
    .filter(a => a.startsWith('--apply='))
    .map(a => a.slice('--apply='.length))
  const mbFlag = args.find(a => a.startsWith('--muscle-body='))
  const mbPath = mbFlag
    ? mbFlag.slice('--muscle-body='.length)
    : path.join(__dirname, 'components', 'MuscleBody.jsx')

  const meshData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'mesh-data.json'), 'utf8')
  )

  for (const [model, meshes] of Object.entries(meshData)) {
    console.log(`\n══════════════════════════════`)
    console.log(`Model: ${model}`)

    const { bbox, scale, rawH, rawW, rawD } = computeForModel(meshes)

    console.log(`  Raw bounds: H=${rawH.toFixed(3)} W=${rawW.toFixed(3)} D=${rawD.toFixed(3)}`)
    console.log(`  normalizedScale: ${scale.toFixed(4)}`)
    console.log(`  Normalized bounds: Y [${bbox.min.y.toFixed(2)}, ${bbox.max.y.toFixed(2)}]`)

    const hitboxes = autoCalibrate(bbox)

    console.log(`\n  // Auto-calibrated hitboxes for ${model}:`)
    for (const h of hitboxes) {
      const p = h.position.map(v => v.toFixed(3))
      const r = h.rotation.map(v => v.toFixed(3))
      const s = h.scale.map(v => v.toFixed(3))
      console.log(`  { group: '${h.group}', position: [${p}], rotation: [${r}], scale: [${s}] },`)
    }

    if (applyModels.includes(model)) {
      process.stdout.write(`\n  Patching ${model} in MuscleBody.jsx... `)
      const ok = patchMuscleBody(model, hitboxes, mbPath)
      console.log(ok ? 'done.' : 'FAILED.')
    }
  }

  if (applyModels.length > 0) {
    console.log(`\nApplied: ${applyModels.join(', ')} → ${mbPath}`)
  }
}

module.exports = { autoCalibrate }
