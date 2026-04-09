# Muscle Hitbox Calibration — Handoff

Ongoing work: calibrating per-muscle hitboxes in `components/MuscleBody.jsx` so the gold glow projects cleanly onto the actual muscle surface of each 3D model.

## Status

Calibration is being done **one muscle group at a time against the `anatomy` model first**, then we'll replicate for Goku / Super Saiyan / Gohan (they share `buildStandardHitboxes`, but Jordan removed that for `anatomy` and is defining its hitboxes from scratch).

### Anatomy model — `MODELS.anatomy.hitboxes`
- [x] chest (2 spheres, tilted)
- [x] shoulders (2 spheres, mirrored rotation)
- [x] biceps (2 spheres, mirrored rotation)
- [x] triceps (2 spheres, mirrored rotation)
- [x] forearms (2 spheres, mirrored rotation)
- [ ] **abs** ← next
- [ ] glutes
- [ ] quads
- [ ] hamstrings
- [ ] calves

### Goku / SSJ Goku / Gohan
Still using `buildStandardHitboxes({ bodyScale: 1.0 })`. Revisit after anatomy is fully calibrated — Goku's proportions are mostly fine, just a few camera-target tweaks already applied.

## How to calibrate the next muscle

1. **Flip `DEBUG_HITBOXES = true`** at the top of `components/MuscleBody.jsx`.
2. Add two starting spheres to `MODELS.anatomy.hitboxes` as a placeholder (tandem pair rendering auto-detects pairs of 2 per group).
3. Reload the page and switch to the anatomy model. You'll see a colored wireframe gizmo for the new muscle.
4. Drag it into place:
   - **T** key → translate mode. Translate-X symmetrically brings the pair together / spreads apart; Y and Z move both together.
   - **S** key → scale mode.
   - **R** key → rotate mode. Tandem pairs apply rotation with mirrored Y/Z so shoulders/pecs tilt symmetrically outward.
5. Every drag logs `[muscle #idx] position: [...] rotation: [...] scale: [...]` to the browser console — both halves of the pair on each frame.
6. Paste the last complete pair of log lines to me and I'll lock the numbers into the hitbox literal.
7. **Flip `DEBUG_HITBOXES = false`** and reload to verify the gold glow.
8. If it's off, flip debug back on (values stay put) and drag again from the current position.

## Architecture notes for the glow

- **Three-pass stencil-masked projection** in `GlowFlash`:
  - Pass 1 (FrontSide, `GreaterDepth`, colorWrite off) marks stencil bit 1 where the body is in front of the volume's front face.
  - Pass 2 (BackSide, `GreaterDepth`, stencil == 0, additive gold) draws gold exactly where the body surface is *inside* the sphere volume, and sets bit 0 as an "already drawn" marker so overlapping volumes never double-brighten the same pixel.
  - Pass 3 (FrontSide, depth off) clears bit 1 so the next volume's Pass 1 starts clean. Bit 0 persists across all volumes in the frame.
- All three passes are marked `transparent: true` so they render in a single phase in `renderOrder` sequence (otherwise the opaque-before-transparent split runs Pass 3 before Pass 2 and wipes the stencil early).
- Canvas requests `gl={{ stencil: true }}`.
- Glow scale uses `Math.abs(...)` of each axis so negative scale components (valid for visually symmetric shapes) don't flip face winding and break the depth logic.
- Hitboxes carry an optional `rotation` field, applied in the click hitbox, the glow volume, and the debug wireframe.

## Debug gizmo notes

- Tandem pair uses an **invisible anchor** `Object3D` as the `TransformControls` target. The two visible spheres derive their transforms from the anchor every frame via `useFrame`, with mirrored Y/Z rotation on the right sphere.
- Anchor's initial transform is set **once** in `useLayoutEffect` — NOT via declarative `position`/`rotation` props — otherwise React re-applies props on every re-render (which happens on every T/S/R keypress) and snaps the drag back to its starting position.
- Per-hitbox `TransformControls` attaches imperatively via `object` ref, so the logged values are the actual mesh transforms.

## Paused / related
- Hitbox Y offsets per-model live in `GLOW_OFFSETS`, but for the anatomy model the hitboxes are being defined in raw world space instead of relying on offsets — simpler and less fragile.
- Goku GLB has an unused "Idle" animation (`useAnimations`) — the T-pose fix is still paused.
