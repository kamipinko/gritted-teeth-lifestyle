'use client'
/*
 * MuscleBody — loads one of four GLB models and overlays muscle hitboxes.
 *
 * Camera behavior is Persona 5-style:
 *   - Auto-rotates slowly at the overview when nothing is selected
 *   - Clicking a muscle zooms and pans the camera to that body part
 *   - Switching muscles zooms out to overview first, then pans in to the new one
 *   - Clicking the background zooms back out to overview
 *   - No bubble overlays — selected muscles glow with additive blending
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Center, OrbitControls, TransformControls } from '@react-three/drei'
import { Suspense, useRef, useState, useMemo, useEffect, useLayoutEffect } from 'react'
import * as THREE from 'three'

// Preload all four models so switching between them is instant
useGLTF.preload('/models/goku.glb')
useGLTF.preload('/models/super_saiyan_goku.glb')
useGLTF.preload('/models/gohan.glb')
useGLTF.preload('/models/muscle_body.glb')

const TARGET_HEIGHT = 4.0

// Debug overlay — toggled at runtime with the backtick (`) key.
// When on: colored wireframe gizmos + OrbitControls replace the P5 camera.
// F12 snapshots all current hitbox transforms to console (code-paste format
// + JSON training record).
// Default off — no source change needed to enter calibration mode.

const MODELS = {
  goku: {
    path: '/models/goku.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    // Auto-calibrated from goku bounding box (H=5.379 W=4.880 D=1.447, scale=0.7437).
    // NOTE: Goku is in a fighting pose, not T-pose, so X spread is wider than ideal.
    // Y and Z positions are correct. X will need tuning once T-pose is fixed.
    hitboxes: [
      { group: 'chest',      position: [-0.399, 1.052,  0.511], rotation: [0, 0, 0],      scale: [0.390, 0.140, 0.296] },
      { group: 'chest',      position: [ 0.399, 1.052,  0.511], rotation: [0, 0, 0],      scale: [0.390, 0.140, 0.296] },
      { group: 'shoulders',  position: [-0.907, 1.174,  0.000], rotation: [0, 0, -0.724], scale: [0.581, 0.100, 0.430] },
      { group: 'shoulders',  position: [ 0.907, 1.174,  0.000], rotation: [0, 0,  0.724], scale: [0.581, 0.100, 0.430] },
      { group: 'biceps',     position: [-1.052, 0.810,  0.000], rotation: [0, 0, 0],      scale: [0.263, 0.210, 0.215] },
      { group: 'biceps',     position: [ 1.052, 0.810,  0.000], rotation: [0, 0, 0],      scale: [0.263, 0.210, 0.215] },
      { group: 'triceps',    position: [-1.107, 0.840, -0.457], rotation: [0, 0, 0],      scale: [0.181, 0.190, 0.215] },
      { group: 'triceps',    position: [ 1.107, 0.840, -0.457], rotation: [0, 0, 0],      scale: [0.181, 0.190, 0.215] },
      { group: 'forearms',   position: [-1.361, 0.332, -0.108], rotation: [0, 0, 0],      scale: [0.218, 0.260, 0.323] },
      { group: 'forearms',   position: [ 1.361, 0.332, -0.108], rotation: [0, 0, 0],      scale: [0.218, 0.260, 0.323] },
      { group: 'abs',        position: [-0.181, 0.450,  0.511], rotation: [0, 0, 0],      scale: [0.218, 0.250, 0.242] },
      { group: 'abs',        position: [ 0.181, 0.450,  0.511], rotation: [0, 0, 0],      scale: [0.218, 0.250, 0.242] },
      { group: 'glutes',     position: [-0.327,-0.200, -0.484], rotation: [0, 0, 0],      scale: [0.272, 0.160, 0.296] },
      { group: 'glutes',     position: [ 0.327,-0.200, -0.484], rotation: [0, 0, 0],      scale: [0.272, 0.160, 0.296] },
      { group: 'quads',      position: [-0.290,-0.620,  0.323], rotation: [0, 0, 0],      scale: [0.236, 0.250, 0.296] },
      { group: 'quads',      position: [ 0.290,-0.620,  0.323], rotation: [0, 0, 0],      scale: [0.236, 0.250, 0.296] },
      { group: 'hamstrings', position: [-0.290,-0.620, -0.377], rotation: [0, 0, 0],      scale: [0.218, 0.250, 0.269] },
      { group: 'hamstrings', position: [ 0.290,-0.620, -0.377], rotation: [0, 0, 0],      scale: [0.218, 0.250, 0.269] },
      { group: 'calves',     position: [-0.236,-1.200, -0.215], rotation: [0, 0, 0],      scale: [0.172, 0.230, 0.258] },
      { group: 'calves',     position: [ 0.236,-1.200, -0.215], rotation: [0, 0, 0],      scale: [0.172, 0.230, 0.258] },
    ],
  },
  gokuSSJ: {
    path: '/models/super_saiyan_goku.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    // Auto-calibrated from gokuSSJ bounding box (H=110.117 W=27.855, scale=0.0363).
    // This GLB was stored way off-origin — Center component re-centers it at runtime.
    hitboxes: [
      { group: 'chest',      position: [-0.111, 1.052,  0.546], rotation: [0, 0, 0],      scale: [0.109, 0.140, 0.316] },
      { group: 'chest',      position: [ 0.111, 1.052,  0.546], rotation: [0, 0, 0],      scale: [0.109, 0.140, 0.316] },
      { group: 'shoulders',  position: [-0.253, 1.174,  0.000], rotation: [0, 0, -0.724], scale: [0.162, 0.100, 0.460] },
      { group: 'shoulders',  position: [ 0.253, 1.174,  0.000], rotation: [0, 0,  0.724], scale: [0.162, 0.100, 0.460] },
      { group: 'biceps',     position: [-0.293, 0.810,  0.000], rotation: [0, 0, 0],      scale: [0.073, 0.210, 0.230] },
      { group: 'biceps',     position: [ 0.293, 0.810,  0.000], rotation: [0, 0, 0],      scale: [0.073, 0.210, 0.230] },
      { group: 'triceps',    position: [-0.309, 0.840, -0.489], rotation: [0, 0, 0],      scale: [0.051, 0.190, 0.230] },
      { group: 'triceps',    position: [ 0.309, 0.840, -0.489], rotation: [0, 0, 0],      scale: [0.051, 0.190, 0.230] },
      { group: 'forearms',   position: [-0.379, 0.332, -0.115], rotation: [0, 0, 0],      scale: [0.061, 0.260, 0.345] },
      { group: 'forearms',   position: [ 0.379, 0.332, -0.115], rotation: [0, 0, 0],      scale: [0.061, 0.260, 0.345] },
      { group: 'abs',        position: [-0.051, 0.450,  0.546], rotation: [0, 0, 0],      scale: [0.061, 0.250, 0.259] },
      { group: 'abs',        position: [ 0.051, 0.450,  0.546], rotation: [0, 0, 0],      scale: [0.061, 0.250, 0.259] },
      { group: 'glutes',     position: [-0.091,-0.200, -0.518], rotation: [0, 0, 0],      scale: [0.076, 0.160, 0.316] },
      { group: 'glutes',     position: [ 0.091,-0.200, -0.518], rotation: [0, 0, 0],      scale: [0.076, 0.160, 0.316] },
      { group: 'quads',      position: [-0.081,-0.620,  0.345], rotation: [0, 0, 0],      scale: [0.066, 0.250, 0.316] },
      { group: 'quads',      position: [ 0.081,-0.620,  0.345], rotation: [0, 0, 0],      scale: [0.066, 0.250, 0.316] },
      { group: 'hamstrings', position: [-0.081,-0.620, -0.403], rotation: [0, 0, 0],      scale: [0.061, 0.250, 0.288] },
      { group: 'hamstrings', position: [ 0.081,-0.620, -0.403], rotation: [0, 0, 0],      scale: [0.061, 0.250, 0.288] },
      { group: 'calves',     position: [-0.066,-1.200, -0.230], rotation: [0, 0, 0],      scale: [0.048, 0.230, 0.276] },
      { group: 'calves',     position: [ 0.066,-1.200, -0.230], rotation: [0, 0, 0],      scale: [0.048, 0.230, 0.276] },
    ],
  },
  gohan: {
    path: '/models/gohan.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    // Auto-calibrated from gohan bounding box (H=5.162 W=4.565 D=1.191, scale=0.7749).
    hitboxes: [
      { group: 'chest',      position: [-0.389, 1.052,  0.438], rotation: [0, 0, 0],      scale: [0.380, 0.140, 0.254] },
      { group: 'chest',      position: [ 0.389, 1.052,  0.438], rotation: [0, 0, 0],      scale: [0.380, 0.140, 0.254] },
      { group: 'shoulders',  position: [-0.884, 1.174,  0.000], rotation: [0, 0, -0.724], scale: [0.566, 0.100, 0.369] },
      { group: 'shoulders',  position: [ 0.884, 1.174,  0.000], rotation: [0, 0,  0.724], scale: [0.566, 0.100, 0.369] },
      { group: 'biceps',     position: [-1.026, 0.810,  0.000], rotation: [0, 0, 0],      scale: [0.256, 0.210, 0.185] },
      { group: 'biceps',     position: [ 1.026, 0.810,  0.000], rotation: [0, 0, 0],      scale: [0.256, 0.210, 0.185] },
      { group: 'triceps',    position: [-1.079, 0.840, -0.392], rotation: [0, 0, 0],      scale: [0.177, 0.190, 0.185] },
      { group: 'triceps',    position: [ 1.079, 0.840, -0.392], rotation: [0, 0, 0],      scale: [0.177, 0.190, 0.185] },
      { group: 'forearms',   position: [-1.327, 0.332, -0.092], rotation: [0, 0, 0],      scale: [0.212, 0.260, 0.277] },
      { group: 'forearms',   position: [ 1.327, 0.332, -0.092], rotation: [0, 0, 0],      scale: [0.212, 0.260, 0.277] },
      { group: 'abs',        position: [-0.177, 0.450,  0.438], rotation: [0, 0, 0],      scale: [0.212, 0.250, 0.208] },
      { group: 'abs',        position: [ 0.177, 0.450,  0.438], rotation: [0, 0, 0],      scale: [0.212, 0.250, 0.208] },
      { group: 'glutes',     position: [-0.318,-0.200, -0.415], rotation: [0, 0, 0],      scale: [0.265, 0.160, 0.254] },
      { group: 'glutes',     position: [ 0.318,-0.200, -0.415], rotation: [0, 0, 0],      scale: [0.265, 0.160, 0.254] },
      { group: 'quads',      position: [-0.283,-0.620,  0.277], rotation: [0, 0, 0],      scale: [0.230, 0.250, 0.254] },
      { group: 'quads',      position: [ 0.283,-0.620,  0.277], rotation: [0, 0, 0],      scale: [0.230, 0.250, 0.254] },
      { group: 'hamstrings', position: [-0.283,-0.620, -0.323], rotation: [0, 0, 0],      scale: [0.212, 0.250, 0.231] },
      { group: 'hamstrings', position: [ 0.283,-0.620, -0.323], rotation: [0, 0, 0],      scale: [0.212, 0.250, 0.231] },
      { group: 'calves',     position: [-0.230,-1.200, -0.185], rotation: [0, 0, 0],      scale: [0.168, 0.230, 0.221] },
      { group: 'calves',     position: [ 0.230,-1.200, -0.185], rotation: [0, 0, 0],      scale: [0.168, 0.230, 0.221] },
    ],
  },
  anatomy: {
    path: '/models/muscle_body.glb',
    rotationY: 0,
    scaleMult: 1.0,
    // Calibrated from scratch against the actual anatomy GLB — do NOT
    // use buildStandardHitboxes, its Goku proportions don't map here.
    // Adding one muscle group at a time; debug wireframes are on.
    hitboxes: [
      // CHEST — calibrated against the anatomy GLB.
      { group: 'chest', position: [-0.226, 1.051, 0.166], rotation: [-0.554, 0, 0], scale: [0.217, 0.138, 0.108] },
      { group: 'chest', position: [ 0.226, 1.051, 0.166], rotation: [-0.554, 0, 0], scale: [0.217, 0.138, 0.108] },
      // SHOULDERS — calibrated against the anatomy GLB.
      { group: 'shoulders', position: [-0.501, 1.173, -0.171], rotation: [0.056,  0.097,  0.724], scale: [0.323, 0.091, -0.151] },
      { group: 'shoulders', position: [ 0.539, 1.173, -0.171], rotation: [0.056, -0.097, -0.724], scale: [0.323, 0.091, -0.151] },
      // BICEPS — calibrated against the anatomy GLB.
      { group: 'biceps', position: [-0.582, 0.809, -0.006], rotation: [0.323, -0.137, -0.348], scale: [0.145, 0.203, 0.079] },
      { group: 'biceps', position: [ 0.582, 0.809, -0.006], rotation: [0.323,  0.137,  0.348], scale: [0.145, 0.203, 0.079] },
      // TRICEPS — calibrated against the anatomy GLB.
      { group: 'triceps', position: [-0.614, 0.839, -0.334], rotation: [-0.185,  0.191, -0.399], scale: [0.099, 0.183, -0.080] },
      { group: 'triceps', position: [ 0.614, 0.839, -0.334], rotation: [-0.185, -0.191,  0.399], scale: [0.099, 0.183, -0.080] },
      // FOREARMS — calibrated against the anatomy GLB.
      { group: 'forearms', position: [-0.751, 0.143, -0.045], rotation: [-0.565, -0.093, -0.105], scale: [0.120, 0.258, 0.120] },
      { group: 'forearms', position: [ 0.751, 0.143, -0.045], rotation: [-0.565,  0.093,  0.105], scale: [0.120, 0.258, 0.120] },
      // ABS — calibrated against the anatomy GLB.
      { group: 'abs', position: [ 0, 0.501, 0.24], rotation: [0, 0, 0], scale: [0.198, 0.289, 0.062] },
      { group: 'abs', position: [ 0, 0.501, 0.24], rotation: [0, 0, 0], scale: [0.198, 0.289, 0.062] },
      // GLUTES — placeholder (visual estimate — drag to refine)
      { group: 'glutes', position: [-0.18, -0.20, -0.170], rotation: [0, 0, 0], scale: [0.150, 0.150, 0.110] },
      { group: 'glutes', position: [ 0.18, -0.20, -0.170], rotation: [0, 0, 0], scale: [0.150, 0.150, 0.110] },
      // QUADS — placeholder (visual estimate — drag to refine)
      { group: 'quads', position: [-0.16, -0.62, 0.120], rotation: [0, 0, 0], scale: [0.130, 0.240, 0.110] },
      { group: 'quads', position: [ 0.16, -0.62, 0.120], rotation: [0, 0, 0], scale: [0.130, 0.240, 0.110] },
      // HAMSTRINGS — placeholder (visual estimate — drag to refine)
      { group: 'hamstrings', position: [-0.16, -0.62, -0.145], rotation: [0, 0, 0], scale: [0.120, 0.240, 0.100] },
      { group: 'hamstrings', position: [ 0.16, -0.62, -0.145], rotation: [0, 0, 0], scale: [0.120, 0.240, 0.100] },
      // CALVES — placeholder (visual estimate — drag to refine)
      { group: 'calves', position: [-0.13, -1.20, -0.075], rotation: [0, 0, 0], scale: [0.095, 0.220, 0.095] },
      { group: 'calves', position: [ 0.13, -1.20, -0.075], rotation: [0, 0, 0], scale: [0.095, 0.220, 0.095] },
    ],
  },
}

function buildStandardHitboxes({ bodyScale = 1.0 }) {
  const s = bodyScale
  return [
    // CHEST
    { group: 'chest', position: [-0.45 * s, 1.6 * s, 0.55 * s], scale: [0.55 * s, 0.4 * s, 0.32 * s] },
    { group: 'chest', position: [ 0.45 * s, 1.6 * s, 0.55 * s], scale: [0.55 * s, 0.4 * s, 0.32 * s] },

    // SHOULDERS
    { group: 'shoulders', position: [-1.15 * s, 1.85 * s, 0.05 * s], scale: [0.45 * s, 0.42 * s, 0.45 * s] },
    { group: 'shoulders', position: [ 1.15 * s, 1.85 * s, 0.05 * s], scale: [0.45 * s, 0.42 * s, 0.45 * s] },

    // BICEPS
    { group: 'biceps', position: [-1.25 * s, 1.4 * s, 0.35 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },
    { group: 'biceps', position: [ 1.25 * s, 1.4 * s, 0.35 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },

    // TRICEPS
    { group: 'triceps', position: [-1.25 * s, 1.4 * s, -0.3 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },
    { group: 'triceps', position: [ 1.25 * s, 1.4 * s, -0.3 * s], scale: [0.3 * s, 0.5 * s, 0.28 * s] },

    // FOREARMS
    { group: 'forearms', position: [-1.55 * s, 0.45 * s, 0.15 * s], scale: [0.27 * s, 0.45 * s, 0.27 * s] },
    { group: 'forearms', position: [ 1.55 * s, 0.45 * s, 0.15 * s], scale: [0.27 * s, 0.45 * s, 0.27 * s] },

    // ABS
    { group: 'abs', shape: 'box', position: [-0.2 * s, 1.0 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [ 0.2 * s, 1.0 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [-0.2 * s, 0.65 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [ 0.2 * s, 0.65 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [-0.2 * s, 0.3 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },
    { group: 'abs', shape: 'box', position: [ 0.2 * s, 0.3 * s, 0.55 * s], scale: [0.18 * s, 0.16 * s, 0.16 * s] },

    // GLUTES
    { group: 'glutes', position: [-0.32 * s, -0.4 * s, -0.45 * s], scale: [0.4 * s, 0.38 * s, 0.32 * s] },
    { group: 'glutes', position: [ 0.32 * s, -0.4 * s, -0.45 * s], scale: [0.4 * s, 0.38 * s, 0.32 * s] },

    // QUADS
    { group: 'quads', position: [-0.4 * s, -1.05 * s, 0.4 * s], scale: [0.36 * s, 0.6 * s, 0.3 * s] },
    { group: 'quads', position: [ 0.4 * s, -1.05 * s, 0.4 * s], scale: [0.36 * s, 0.6 * s, 0.3 * s] },

    // HAMSTRINGS
    { group: 'hamstrings', position: [-0.4 * s, -1.05 * s, -0.4 * s], scale: [0.34 * s, 0.6 * s, 0.28 * s] },
    { group: 'hamstrings', position: [ 0.4 * s, -1.05 * s, -0.4 * s], scale: [0.34 * s, 0.6 * s, 0.28 * s] },

    // CALVES
    { group: 'calves', position: [-0.42 * s, -2.55 * s, -0.3 * s], scale: [0.3 * s, 0.55 * s, 0.27 * s] },
    { group: 'calves', position: [ 0.42 * s, -2.55 * s, -0.3 * s], scale: [0.3 * s, 0.55 * s, 0.27 * s] },
  ]
}

// ── Camera positions derived from hitbox centers ────────────────────
// All muscle cameras use the same cinematic framing:
//   • 30° yaw off the straight-on axis (alternating left/right per muscle
//     so consecutive selections never feel repetitive)
//   • slight upward pitch so the camera looks down at the target
//   • pulled in closer than the overview for drama
// The overview camera (no selection) stays centered and unangled.
const OVERVIEW_CAM = { pos: [0, 0.6, 8], target: [0, 0.6, 0] }

const DIST_CLOSE = 2.4                        // radial distance from target
const YAW_OFFSET = DIST_CLOSE * Math.sin(Math.PI / 6)  // sin(30°) ≈ 1.20
const YAW_DEPTH  = DIST_CLOSE * Math.cos(Math.PI / 6)  // cos(30°) ≈ 2.08
const PITCH_LIFT = 0.25                       // camera sits slightly above target

// Sign convention: positive yaw pushes the camera toward +X for front
// muscles and toward +X for back muscles too (so the viewer's right stays
// consistent across sides). The alternation happens in the table below.
const MUSCLE_CAMERA = {
  // Front-facing muscles → camera comes from +Z, alternating yaw
  chest:      { target: [0,  1.60,  0.55], pos: [ YAW_OFFSET,  1.60 + PITCH_LIFT,  0.55 + YAW_DEPTH] },
  shoulders:  { target: [0,  1.85,  0.05], pos: [-YAW_OFFSET,  1.85 + PITCH_LIFT,  0.05 + YAW_DEPTH] },
  biceps:     { target: [0,  1.40,  0.35], pos: [ YAW_OFFSET,  1.40 + PITCH_LIFT,  0.35 + YAW_DEPTH] },
  forearms:   { target: [0,  0.90,  0.15], pos: [-YAW_OFFSET,  0.90 + PITCH_LIFT,  0.15 + YAW_DEPTH] },
  abs:        { target: [0,  1.00,  0.55], pos: [ YAW_OFFSET,  1.00 + PITCH_LIFT,  0.55 + YAW_DEPTH] },
  quads:      { target: [0, -0.50,  0.40], pos: [-YAW_OFFSET, -0.50 + PITCH_LIFT,  0.40 + YAW_DEPTH] },
  // Back-facing muscles → camera comes from -Z, alternating yaw
  triceps:    { target: [0,  1.40, -0.30], pos: [ YAW_OFFSET,  1.40 + PITCH_LIFT, -0.30 - YAW_DEPTH] },
  glutes:     { target: [0,  0.10, -0.45], pos: [-YAW_OFFSET,  0.10 + PITCH_LIFT, -0.45 - YAW_DEPTH] },
  hamstrings: { target: [0, -0.50, -0.40], pos: [ YAW_OFFSET, -0.50 + PITCH_LIFT, -0.40 - YAW_DEPTH] },
  calves:     { target: [0, -1.40, -0.30], pos: [-YAW_OFFSET, -1.40 + PITCH_LIFT, -0.30 - YAW_DEPTH] },
}

// ── Muscle centers (same as MUSCLE_CAMERA targets) ──────────────────
// Used to position the focus point light directly on the 3D geometry.
const MUSCLE_CENTERS = Object.fromEntries(
  Object.entries(MUSCLE_CAMERA).map(([k, v]) => [k, v.target])
)

// ── Per-model glow position fixes ────────────────────────────────────
// The click hitboxes are calibrated for Goku's proportions. For models
// whose limbs sit in slightly different places, add a per-muscle Y
// (or X/Z) offset here so the projected glow lines up with the actual
// anatomy. Only the glow is offset — clickable hitboxes are untouched.
const GLOW_OFFSETS = {
  anatomy: {
    quads:      [0, 0.55, 0],
    glutes:     [0, 0.50, 0],
    hamstrings: [0, 0.55, 0],
    calves:     [0, 0.40, 0],
    forearms:   [0, 0.20, 0],
  },
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ── Persona 5 Camera Rig ───────────────────────────────────────────
// Replaces OrbitControls entirely. Handles all camera movement:
//   • Auto-rotate when at overview (no selection)
//   • Zoom in on new selection
//   • Zoom out → pan in when switching muscles
//   • Zoom out on dismiss
function CameraRig({ focusGroup, onSettled }) {
  const { camera } = useThree()

  // Continuously interpolated camera state (so we always know where we are mid-animation)
  const camPos    = useRef(new THREE.Vector3(...OVERVIEW_CAM.pos))
  const camTarget = useRef(new THREE.Vector3(...OVERVIEW_CAM.target))

  const animFrom = useRef({
    pos:    new THREE.Vector3(...OVERVIEW_CAM.pos),
    target: new THREE.Vector3(...OVERVIEW_CAM.target),
  })
  const animTo = useRef({
    pos:    new THREE.Vector3(...OVERVIEW_CAM.pos),
    target: new THREE.Vector3(...OVERVIEW_CAM.target),
  })

  // 'idle' | 'out' | 'in'
  const phase         = useRef('idle')
  const progress      = useRef(1)
  const prevFocus     = useRef(null)
  const pendingGroup  = useRef(null)
  const autoRotAngle  = useRef(Math.atan2(OVERVIEW_CAM.pos[0], OVERVIEW_CAM.pos[2]))

  useEffect(() => {
    const prev = prevFocus.current
    prevFocus.current = focusGroup
    if (focusGroup === prev) return

    // Snapshot current interpolated camera as the animation start point
    animFrom.current.pos.copy(camPos.current)
    animFrom.current.target.copy(camTarget.current)
    progress.current = 0

    if (!focusGroup) {
      // Dismissed — zoom out to overview
      animTo.current.pos.set(...OVERVIEW_CAM.pos)
      animTo.current.target.set(...OVERVIEW_CAM.target)
      phase.current = 'out'
      pendingGroup.current = null
    } else if (prev) {
      // Switching muscles — zoom out first, pendingGroup triggers zoom-in after
      animTo.current.pos.set(...OVERVIEW_CAM.pos)
      animTo.current.target.set(...OVERVIEW_CAM.target)
      phase.current = 'out'
      pendingGroup.current = focusGroup
    } else {
      // First selection from overview — zoom in directly
      const cfg = MUSCLE_CAMERA[focusGroup] || OVERVIEW_CAM
      animTo.current.pos.set(...cfg.pos)
      animTo.current.target.set(...cfg.target)
      phase.current = 'in'
      pendingGroup.current = null
    }
  }, [focusGroup])

  useFrame((_, delta) => {
    const SPEED = 1.4 // full animation in ~0.7 s

    if (phase.current !== 'idle') {
      progress.current = Math.min(1, progress.current + delta * SPEED)
      const t = easeInOutCubic(progress.current)

      camPos.current.lerpVectors(animFrom.current.pos, animTo.current.pos, t)
      camTarget.current.lerpVectors(animFrom.current.target, animTo.current.target, t)

      camera.position.copy(camPos.current)
      camera.lookAt(camTarget.current)

      if (progress.current >= 1) {
        if (phase.current === 'out' && pendingGroup.current) {
          // Phase 1 (zoom-out) done — start phase 2 (zoom-in to pending group)
          animFrom.current.pos.copy(camPos.current)
          animFrom.current.target.copy(camTarget.current)
          const cfg = MUSCLE_CAMERA[pendingGroup.current] || OVERVIEW_CAM
          animTo.current.pos.set(...cfg.pos)
          animTo.current.target.set(...cfg.target)
          phase.current = 'in'
          progress.current = 0
          pendingGroup.current = null
        } else {
          phase.current = 'idle'
          // Sync autoRotAngle so the slow rotation resumes from the right angle
          autoRotAngle.current = Math.atan2(camPos.current.x, camPos.current.z)
          // Tell the scene the camera has landed — highlight can now fire.
          // Only signal a settled focus group; dismiss clears via useEffect.
          if (onSettled && focusGroup) onSettled(focusGroup)
        }
      }
    } else if (!focusGroup) {
      // Idle, no selection — slow auto-rotate around the model
      autoRotAngle.current += delta * 0.25
      const r = Math.sqrt(
        OVERVIEW_CAM.pos[0] ** 2 + OVERVIEW_CAM.pos[2] ** 2
      )
      const x = Math.sin(autoRotAngle.current) * r
      const z = Math.cos(autoRotAngle.current) * r
      camPos.current.set(x, OVERVIEW_CAM.pos[1], z)
      camera.position.copy(camPos.current)
      camera.lookAt(camTarget.current)
    }
  })

  return null
}

// ── Hitbox — pure invisible click zone, no visual shape ────────────
// Opacity is always 0. The gold highlight comes from FocusLight below.
// Clicking a hitbox only focuses the camera on that muscle — selection
// for training is handled separately via the checkbox in the side panel.
function Hitbox({ group, position, scale, rotation, shape = 'sphere', onFocus }) {
  return (
    <mesh
      position={position}
      rotation={rotation || [0, 0, 0]}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        onFocus(group)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {shape === 'box'
        ? <boxGeometry args={[1, 1, 1]} />
        : <sphereGeometry args={[1, 16, 16]} />
      }
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// ── Glow Flash — projects the hitbox shapes of the focused muscle onto
// the body using an inverted-depth additive trick.
//
// Instead of a single sphere at the muscle's center, we render each
// hitbox belonging to the focused group as its own volumetric glow. The
// hitboxes already encode muscle shape and placement (chest is 2 wide
// boxes, biceps are 2 oblong capsules, abs is a 6-pack of small cubes,
// etc.) so this gives an anatomically accurate highlight for free.
//
// How the projection works:
//   depthFunc = GreaterDepth → pass only where existing depth < our depth,
//                               i.e. where the body is in front of the volume
//   side      = BackSide     → render the inner wall of each volume, giving
//                               one additive contribution per covered pixel
//   additive + no depth write → color adds to the body, never occludes
//
// Result: the body's pixels get tinted gold *exactly* within the union of
// the hitbox volumes for that muscle, and nowhere else.
//
// Keyed off `settledGroup` so the flash only appears after the camera has
// landed. Pulses for 1.5 s then fades out over 0.5 s.
function GlowFlash({ settledGroup, hitboxes, modelKey }) {
  const groupRef = useRef()
  const focusTime = useRef(null)

  useEffect(() => {
    focusTime.current = settledGroup ? Date.now() : null
  }, [settledGroup])

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    if (!focusTime.current) {
      g.visible = false
      return
    }
    g.visible = true

    const elapsed = (Date.now() - focusTime.current) / 1000
    const TOTAL      = 2.0
    const FADE_START = 1.5

    let envelope = 1.0
    if (elapsed >= TOTAL) {
      envelope = 0
    } else if (elapsed >= FADE_START) {
      envelope = 1 - (elapsed - FADE_START) / (TOTAL - FADE_START)
    }

    // Opacity pulses while lit, then fades cleanly. Walk the group's
    // children so every hitbox-derived volume shares the same envelope.
    const opPulse = elapsed < FADE_START
      ? (0.75 + Math.sin(Date.now() * 0.009) * 0.25)
      : 1
    const op = 0.85 * envelope * opPulse
    g.traverse((obj) => {
      if (obj.material) obj.material.opacity = op
    })
  })

  if (!settledGroup) return null
  const groupBoxes = hitboxes.filter((h) => h.group === settledGroup)
  if (groupBoxes.length === 0) return null

  // XY inflation keeps the muscle silhouette mostly honest, but we blow
  // up Z aggressively so every glow volume definitely punches all the
  // way through the body surface — otherwise the GreaterDepth trick has
  // nothing to draw against and the highlight vanishes on thin models.
  const INFLATE_XY = 1.20
  const INFLATE_Z  = 3.0

  const offsets = GLOW_OFFSETS[modelKey] || {}
  const muscleOffset = offsets[settledGroup] || [0, 0, 0]

  return (
    <group ref={groupRef}>
      {groupBoxes.map((h, i) => {
        // Negative scale components flip the geometry's face winding,
        // which inverts BackSide ↔ FrontSide and breaks the two-pass
        // depth logic. Spheres and boxes are visually symmetric, so we
        // always use the absolute magnitude for the glow volume.
        const absX = Math.abs(h.scale[0])
        const absY = Math.abs(h.scale[1])
        const absZ = Math.abs(h.scale[2])
        const scale = [absX * INFLATE_XY, absY * INFLATE_XY, absZ * INFLATE_Z]
        const position = [
          h.position[0] + muscleOffset[0],
          h.position[1] + muscleOffset[1],
          h.position[2] + muscleOffset[2],
        ]
        // Three-pass stencil-masked projection, using 2 bits of stencil:
        //   bit 0 = "gold already drawn at this pixel" — persists across
        //           all volumes in the frame so overlapping volumes can't
        //           double-brighten the same pixel.
        //   bit 1 = "body is in front of this volume's front face" —
        //           per-volume, cleared after Pass 3.
        //
        //   Pass 1 (front face, GreaterDepth, colorWrite off):
        //     Set bit 1 where the body is closer to camera than the
        //     volume's front face. These pixels are NOT inside the
        //     sphere volume and must be skipped by Pass 2.
        //
        //   Pass 2 (back face, GreaterDepth, stencil == 0b00):
        //     Draw gold + set bit 0 where stencil is clean (body inside
        //     sphere AND no previous volume already drew here). The
        //     Increment op plus writeMask=0b01 toggles bit 0 to 1 on
        //     successful draw, leaving bit 1 alone.
        //
        //   Pass 3 (front face, depthTest off, writeMask=0b10):
        //     Clear bit 1 everywhere the volume's silhouette covers so
        //     the next volume's Pass 1 gets a fresh obstruction mask.
        //     Bit 0 (the drawn marker) is left intact.
        const renderGeom = () => h.shape === 'box'
          ? <boxGeometry args={[1, 1, 1]} />
          : <sphereGeometry args={[1, 24, 24]} />
        const rotation = h.rotation || [0, 0, 0]
        const baseRO = 1000 + i * 3
        return (
          <group key={`${settledGroup}-${i}`}>
            {/* Pass 1 — mark bit 1 where body is in front of front face.
                `transparent` forces this into the same render phase as
                the gold pass so renderOrder is actually honored. */}
            <mesh
              position={position}
              rotation={rotation}
              scale={scale}
              renderOrder={baseRO}
            >
              {renderGeom()}
              <meshBasicMaterial
                transparent
                opacity={0}
                colorWrite={false}
                depthWrite={false}
                depthTest
                depthFunc={THREE.GreaterDepth}
                side={THREE.FrontSide}
                stencilWrite
                stencilWriteMask={0b10}
                stencilFunc={THREE.AlwaysStencilFunc}
                stencilRef={0b10}
                stencilFail={THREE.KeepStencilOp}
                stencilZFail={THREE.KeepStencilOp}
                stencilZPass={THREE.ReplaceStencilOp}
              />
            </mesh>

            {/* Pass 2 — draw gold + set bit 0 where stencil is 0b00 */}
            <mesh
              position={position}
              rotation={rotation}
              scale={scale}
              renderOrder={baseRO + 1}
            >
              {renderGeom()}
              <meshBasicMaterial
                color="#ffcc00"
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                depthTest
                depthFunc={THREE.GreaterDepth}
                side={THREE.BackSide}
                toneMapped={false}
                stencilWrite
                stencilWriteMask={0b01}
                stencilFunc={THREE.EqualStencilFunc}
                stencilRef={0b00}
                stencilFail={THREE.KeepStencilOp}
                stencilZFail={THREE.KeepStencilOp}
                stencilZPass={THREE.IncrementStencilOp}
              />
            </mesh>

            {/* Pass 3 — clear bit 1 so the next volume starts clean.
                Also marked transparent so it renders after Pass 2. */}
            <mesh
              position={position}
              rotation={rotation}
              scale={scale}
              renderOrder={baseRO + 2}
            >
              {renderGeom()}
              <meshBasicMaterial
                transparent
                opacity={0}
                colorWrite={false}
                depthWrite={false}
                depthTest={false}
                side={THREE.FrontSide}
                stencilWrite
                stencilWriteMask={0b10}
                stencilFunc={THREE.AlwaysStencilFunc}
                stencilRef={0b00}
                stencilFail={THREE.ReplaceStencilOp}
                stencilZFail={THREE.ReplaceStencilOp}
                stencilZPass={THREE.ReplaceStencilOp}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ── The displayed model ─────────────────────────────────────────────
function ModelDisplay({ modelKey }) {
  const config = MODELS[modelKey] || MODELS.goku
  const { scene } = useGLTF(config.path)
  const cloned = useMemo(() => scene.clone(true), [scene])

  const normalizedScale = useMemo(() => {
    cloned.updateMatrixWorld(true)
    const box = new THREE.Box3()
    let first = true
    cloned.traverse((obj) => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        const meshBox = new THREE.Box3().setFromObject(obj)
        if (first) { box.copy(meshBox); first = false }
        else { box.union(meshBox) }
      }
    })
    if (first) return 1
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim === 0) return 1
    return (TARGET_HEIGHT / maxDim) * (config.scaleMult ?? 1)
  }, [cloned, config.scaleMult])

  // ── DOM emitter — writes mesh geometry into a hidden element so
  // Playwright (and the auto-calibrator) can read exact world-space
  // positions without guessing from pixels.
  useEffect(() => {
    const fmt = (v) => Math.round(v * 1000) / 1000
    const meshData = []

    cloned.updateMatrixWorld(true)
    cloned.traverse((obj) => {
      if (!obj.isMesh && !obj.isSkinnedMesh) return
      const box = new THREE.Box3().setFromObject(obj)
      const center = new THREE.Vector3()
      const size   = new THREE.Vector3()
      box.getCenter(center)
      box.getSize(size)
      // Multiply by normalizedScale so values match hitbox coordinate space
      meshData.push({
        name:   obj.name || '(unnamed)',
        center: [fmt(center.x * normalizedScale), fmt(center.y * normalizedScale), fmt(center.z * normalizedScale)],
        size:   [fmt(size.x   * normalizedScale), fmt(size.y   * normalizedScale), fmt(size.z   * normalizedScale)],
      })
    })

    // Also include the current hitbox config so Playwright can diff them
    const hitboxes = (MODELS[modelKey] || MODELS.goku).hitboxes

    let el = document.getElementById('scene-mesh-data')
    if (!el) {
      el = document.createElement('div')
      el.id = 'scene-mesh-data'
      el.style.display = 'none'
      document.body.appendChild(el)
    }
    el.dataset.model   = modelKey
    el.dataset.meshes  = JSON.stringify(meshData)
    el.dataset.hitboxes = JSON.stringify(hitboxes)
  }, [cloned, normalizedScale, modelKey])

  return (
    <Center disableY={false}>
      <primitive
        object={cloned}
        scale={normalizedScale}
        rotation={[0, config.rotationY, 0]}
      />
    </Center>
  )
}

// ── Debug Hitbox Overlay ────────────────────────────────────────────
// Renders every hitbox for the current model as a colored wireframe so
// calibration mismatches are visible at a glance. Each muscle group gets
// its own color. Purely visual — click handling is still done by the
// regular invisible Hitbox meshes.
const DEBUG_GROUP_COLORS = {
  chest:      '#ff3344',
  shoulders:  '#ff8800',
  biceps:     '#ffcc00',
  triceps:    '#88ff00',
  forearms:   '#00ff88',
  abs:        '#00ffff',
  glutes:     '#0088ff',
  quads:      '#4400ff',
  hamstrings: '#aa00ff',
  calves:     '#ff00aa',
}

// Each debug hitbox is rendered as a draggable wireframe with its own
// TransformControls gizmo attached directly to the mesh (not wrapping
// it, which would move an outer group and give misleading values).
// Keyboard:
//   T → translate mode
//   S → scale mode
// Every drag logs the mesh's real, final position+scale to the console
// so you can copy the values straight back into the hitbox array.
function DebugHitbox({ hitbox, index, mode, logTransform, registerReporter }) {
  // Ref callback sets state on mount so the TransformControls can be
  // rendered on the next pass with `object={mesh}` pointing at the mesh.
  const [mesh, setMesh] = useState(null)
  const meshRef = useRef(null)

  useEffect(() => {
    if (!registerReporter) return
    const reporter = {
      group: hitbox.group,
      getTransforms: () => {
        const m = meshRef.current
        if (!m) return []
        const fmt = (v) => Number(v.toFixed(3))
        return [{
          position: [fmt(m.position.x), fmt(m.position.y), fmt(m.position.z)],
          rotation: [fmt(m.rotation.x), fmt(m.rotation.y), fmt(m.rotation.z)],
          scale:    [fmt(m.scale.x),    fmt(m.scale.y),    fmt(m.scale.z)],
        }]
      },
    }
    return registerReporter(reporter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <mesh
        ref={(el) => { meshRef.current = el; setMesh(el) }}
        position={hitbox.position}
        rotation={hitbox.rotation || [0, 0, 0]}
        scale={hitbox.scale}
      >
        {hitbox.shape === 'box'
          ? <boxGeometry args={[1, 1, 1]} />
          : <sphereGeometry args={[1, 16, 16]} />
        }
        <meshBasicMaterial
          color={DEBUG_GROUP_COLORS[hitbox.group] || '#ffffff'}
          wireframe
          transparent
          opacity={0.7}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>
      {mesh && (
        <TransformControls
          object={mesh}
          mode={mode}
          size={0.5}
          onObjectChange={() => logTransform(index, hitbox.group, mesh)}
        />
      )}
    </>
  )
}

// Tandem pair: two mirror-symmetric hitboxes (left + right) controlled
// by a single TransformControls gizmo attached to an invisible anchor
// at the pair's center.
//
// Position + scale move both spheres together (the right one is just
// the mirror of the left across X=0 plus the anchor's own X position).
// Rotation is applied to each sphere INDEPENDENTLY with a YZ-mirror on
// the right sphere so the two tilt symmetrically outward — e.g. rotating
// around the Z axis makes the left pec lean outward to the left and the
// right pec lean outward to the right, instead of both tilting the same
// absolute direction. The X rotation axis is shared (it's the mirror's
// fixed axis), while Y and Z are negated on the right sphere.
function DebugTandemPair({ hitboxes, group, indices, mode, registerReporter }) {
  const anchorRef = useRef(null)
  const [anchor, setAnchor] = useState(null)
  const leftRef  = useRef()
  const rightRef = useRef()

  // Initial center of the pair (Y/Z taken from either, X from midpoint)
  const cx = (hitboxes[0].position[0] + hitboxes[1].position[0]) / 2
  const cy = (hitboxes[0].position[1] + hitboxes[1].position[1]) / 2
  const cz = (hitboxes[0].position[2] + hitboxes[1].position[2]) / 2

  // Half-spread on X — each sphere sits at ±dx * anchor.scale.x from the
  // anchor's center after a translate + scale.
  const dx = Math.abs(hitboxes[0].position[0] - cx)

  const localScale    = hitboxes[0].scale
  const initialRot    = hitboxes[0].rotation || [0, 0, 0]

  // Set the anchor's initial transform once on mount. Doing this via an
  // effect (rather than declarative `position`/`rotation` props) prevents
  // React from re-applying those props on every re-render — which would
  // otherwise snap the anchor back to its starting transform every time
  // the user presses T/S/R to switch modes, clobbering the drag.
  useLayoutEffect(() => {
    if (!anchorRef.current) return
    anchorRef.current.position.set(cx, cy, cz)
    anchorRef.current.rotation.set(initialRot[0], initialRot[1], initialRot[2])
    setAnchor(anchorRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Store resolvePair in a ref so the reporter always reads the latest closure.
  const resolvePairRef = useRef(null)

  // Register this pair so F12 can snapshot it.
  useEffect(() => {
    if (!registerReporter) return
    const reporter = {
      group,
      getTransforms: () => {
        const fn = resolvePairRef.current
        if (!fn) return []
        const result = fn()
        if (!result) return []
        const fmt = (v) => Number(v.toFixed(3))
        const fmtArr = (arr) => arr.map(fmt)
        return [
          { position: fmtArr(result.left.position),  rotation: fmtArr(result.left.rotation),  scale: fmtArr(result.left.scale)  },
          { position: fmtArr(result.right.position), rotation: fmtArr(result.right.rotation), scale: fmtArr(result.right.scale) },
        ]
      },
    }
    return registerReporter(reporter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Compute each sphere's world transform from the anchor, with mirror
  // semantics: translate-X adjusts the spread symmetrically, translate
  // Y/Z moves both together, scale and (Y/Z) rotation are mirrored.
  // Shared helper so the live render and the copy-paste logger stay in
  // sync on the formula. Assigned to resolvePairRef each render so the
  // F12 reporter always captures the latest closure (anchor state etc).
  const resolvePair = () => {
    const gp = anchor.position
    const gs = anchor.scale
    const ge = anchor.rotation

    // xOffsetFromCenter = how far the gizmo has been dragged away from
    // the pair's original X midpoint. Positive = dragged right → bring
    // spheres inward. Negative = dragged left → push outward.
    const xOffsetFromCenter = gp.x - cx
    const currentDx = Math.max(0, dx * gs.x - xOffsetFromCenter)

    const sx = localScale[0] * gs.x
    const sy = localScale[1] * gs.y
    const sz = localScale[2] * gs.z

    return {
      left: {
        position: [cx - currentDx, gp.y, gp.z],
        rotation: [ge.x, ge.y, ge.z],
        scale:    [sx, sy, sz],
      },
      right: {
        position: [cx + currentDx, gp.y, gp.z],
        rotation: [ge.x, -ge.y, -ge.z],
        scale:    [sx, sy, sz],
      },
    }
  }

  // Keep the ref current on every render so the F12 reporter sees the
  // latest version (closes over the current `anchor` state value).
  resolvePairRef.current = anchor ? resolvePair : null

  useFrame(() => {
    if (!anchor || !leftRef.current || !rightRef.current) return
    const { left, right } = resolvePair()
    leftRef.current.position.set(...left.position)
    leftRef.current.rotation.set(...left.rotation)
    leftRef.current.scale.set(...left.scale)
    rightRef.current.position.set(...right.position)
    rightRef.current.rotation.set(...right.rotation)
    rightRef.current.scale.set(...right.scale)
  })

  const onChange = () => {
    if (!anchor) return
    const { left, right } = resolvePair()
    const fmt = (v) => Number(v.toFixed(3))
    const fmtArr = (arr) => `[${fmt(arr[0])}, ${fmt(arr[1])}, ${fmt(arr[2])}]`

    // eslint-disable-next-line no-console
    console.log(
      `[${group} #${indices[0]}] position: ${fmtArr(left.position)} rotation: ${fmtArr(left.rotation)} scale: ${fmtArr(left.scale)}`
    )
    // eslint-disable-next-line no-console
    console.log(
      `[${group} #${indices[1]}] position: ${fmtArr(right.position)} rotation: ${fmtArr(right.rotation)} scale: ${fmtArr(right.scale)}`
    )
  }

  const Geom = ({ shape }) => shape === 'box'
    ? <boxGeometry args={[1, 1, 1]} />
    : <sphereGeometry args={[1, 16, 16]} />

  const WireMat = () => (
    <meshBasicMaterial
      color={DEBUG_GROUP_COLORS[group] || '#ffffff'}
      wireframe
      transparent
      opacity={0.7}
      depthTest={false}
      toneMapped={false}
    />
  )

  return (
    <>
      {/* Invisible anchor — the TransformControls target. Its transform
          is the "virtual parent" state; the two visible spheres derive
          their transforms from it every frame (with mirroring on Y/Z
          rotation for the right sphere). Position/rotation are set
          imperatively in useLayoutEffect above, NOT as React props. */}
      <mesh ref={anchorRef} visible={false}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
      </mesh>

      <mesh ref={leftRef}>
        <Geom shape={hitboxes[0].shape} />
        <WireMat />
      </mesh>
      <mesh ref={rightRef}>
        <Geom shape={hitboxes[1].shape} />
        <WireMat />
      </mesh>

      {anchor && (
        <TransformControls
          object={anchor}
          mode={mode}
          size={0.5}
          onObjectChange={onChange}
        />
      )}
    </>
  )
}

function DebugHitboxes({ hitboxes, modelKey }) {
  const [mode, setMode] = useState('translate')
  const reportersRef = useRef([])

  // Returns an unregister function — called by the child on unmount.
  const registerReporter = (reporter) => {
    reportersRef.current.push(reporter)
    return () => {
      const idx = reportersRef.current.indexOf(reporter)
      if (idx >= 0) reportersRef.current.splice(idx, 1)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase()
      if (k === 't') setMode('translate')
      else if (k === 's') setMode('scale')
      else if (k === 'r') setMode('rotate')
      else if (e.key === 'F12') {
        e.preventDefault()

        // Collect all current transforms from every registered gizmo.
        const byGroup = {}
        for (const reporter of reportersRef.current) {
          const transforms = reporter.getTransforms()
          if (!transforms.length) continue
          if (!byGroup[reporter.group]) byGroup[reporter.group] = []
          byGroup[reporter.group].push(...transforms)
        }

        // ── Code-paste format ─────────────────────────────────────────
        const fmtVal = (v) => Number(v.toFixed(3))
        const fmtArr = (arr) => `[${arr.map(fmtVal).join(', ')}]`

        // eslint-disable-next-line no-console
        console.group(`%c[F12 Calibration Snapshot] model: ${modelKey}`, 'color:#ffcc00;font-weight:bold')
        for (const [group, transforms] of Object.entries(byGroup)) {
          transforms.forEach((t, idx) => {
            // eslint-disable-next-line no-console
            console.log(
              `  { group: '${group}', position: ${fmtArr(t.position)}, rotation: ${fmtArr(t.rotation)}, scale: ${fmtArr(t.scale)} },`
            )
          })
        }
        // eslint-disable-next-line no-console
        console.groupEnd()

        // ── Training data JSON ────────────────────────────────────────
        const trainingRecord = {
          model: modelKey,
          timestamp: new Date().toISOString(),
          hitboxes: byGroup,
        }
        // eslint-disable-next-line no-console
        console.log('%c[Training Record JSON]', 'color:#00ffcc;font-weight:bold', JSON.stringify(trainingRecord, null, 2))

        // Also write to a downloadable file so we can accumulate training data.
        const blob = new Blob([JSON.stringify(trainingRecord, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `calibration_${modelKey}_${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modelKey])

  const logTransform = (i, group, obj) => {
    const p = obj.position
    const r = obj.rotation
    const s = obj.scale
    const fmt = (v) => Number(v.toFixed(3))
    // eslint-disable-next-line no-console
    console.log(
      `[${group} #${i}]`,
      `position: [${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.z)}]`,
      `rotation: [${fmt(r.x)}, ${fmt(r.y)}, ${fmt(r.z)}]`,
      `scale: [${fmt(s.x)}, ${fmt(s.y)}, ${fmt(s.z)}]`
    )
  }

  // Group hitboxes by muscle group name; pairs of two render as a single
  // tandem gizmo, everything else as individual gizmos.
  const grouped = {}
  hitboxes.forEach((h, i) => {
    if (!grouped[h.group]) grouped[h.group] = []
    grouped[h.group].push({ hitbox: h, index: i })
  })

  return (
    <group>
      {Object.entries(grouped).map(([groupName, entries]) => {
        if (entries.length === 2) {
          return (
            <DebugTandemPair
              key={`tandem-${groupName}`}
              group={groupName}
              hitboxes={entries.map((e) => e.hitbox)}
              indices={entries.map((e) => e.index)}
              mode={mode}
              registerReporter={registerReporter}
            />
          )
        }
        return entries.map(({ hitbox, index }) => (
          <DebugHitbox
            key={`dbg-${index}`}
            hitbox={hitbox}
            index={index}
            mode={mode}
            logTransform={logTransform}
            registerReporter={registerReporter}
          />
        ))
      })}
    </group>
  )
}

// ── Large background plane — click anywhere to dismiss focus ────────
function BackgroundPlane({ onDismiss }) {
  return (
    <mesh
      position={[0, 0, -10]}
      onClick={(e) => {
        e.stopPropagation()
        onDismiss()
      }}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function SceneContent({ modelKey, focusedGroup, onFocus, debugMode }) {
  const config = MODELS[modelKey] || MODELS.goku

  // `settledGroup` lags `focusedGroup` by the camera animation duration —
  // it only becomes non-null once CameraRig finishes easing into the muscle.
  // This is what the gold highlight light keys off of, so the flash appears
  // only after the camera has landed.
  const [settledGroup, setSettledGroup] = useState(null)

  // Any time the desired focus changes, clear the highlight immediately so
  // it can't leak across the animation. CameraRig will re-set it on landing.
  useEffect(() => {
    setSettledGroup(null)
  }, [focusedGroup])

  return (
    <group>
      {/* Base lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 3, -4]} intensity={0.7} color="#ff6644" />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#ffaa66" />
      <pointLight position={[0, -2, 4]} intensity={0.4} color="#4488ff" />

      {/* Gold additive glow — fires only after the camera settles */}
      <GlowFlash
        settledGroup={settledGroup}
        hitboxes={config.hitboxes}
        modelKey={modelKey}
      />

      {/* Background click-to-dismiss plane */}
      <BackgroundPlane onDismiss={() => onFocus(null)} />

      <Suspense fallback={null}>
        <ModelDisplay key={modelKey} modelKey={modelKey} />
      </Suspense>

      {/* Debug wireframe overlay for hitbox calibration */}
      {debugMode && <DebugHitboxes hitboxes={config.hitboxes} modelKey={modelKey} />}

      {/* Hitboxes — invisible click zones only, no visual shape */}
      {config.hitboxes.map((h, i) => (
        <Hitbox
          key={`${modelKey}-${h.group}-${i}`}
          group={h.group}
          position={h.position}
          rotation={h.rotation}
          scale={h.scale}
          shape={h.shape}
          onFocus={onFocus}
        />
      ))}

      {/* Calibration mode: free orbit + no auto camera. Production: P5 camera rig. */}
      {debugMode ? (
        <OrbitControls makeDefault enableDamping={false} />
      ) : (
        <CameraRig focusGroup={focusedGroup} onSettled={setSettledGroup} />
      )}
    </group>
  )
}

export default function MuscleBody({ onFocus, focusedGroup, modelKey = 'goku' }) {
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '`') setDebugMode((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: OVERVIEW_CAM.pos, fov: 45 }}
        shadows={false}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, stencil: true }}
      >
        <SceneContent
          modelKey={modelKey}
          focusedGroup={focusedGroup}
          onFocus={onFocus}
          debugMode={debugMode}
        />
      </Canvas>

      {/* Calibration HUD — visible when debug mode is on */}
      {debugMode && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'rgba(0,0,0,0.75)',
          border: '1px solid #ffcc00',
          color: '#ffcc00',
          fontFamily: 'monospace',
          fontSize: 11,
          padding: '6px 10px',
          borderRadius: 4,
          pointerEvents: 'none',
          lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 2 }}>CALIBRATION MODE — {modelKey}</div>
          <div>T = translate &nbsp; S = scale &nbsp; R = rotate</div>
          <div>F12 = snapshot all hitboxes → console + JSON download</div>
          <div style={{ color: '#aaa' }}>` (backtick) to exit</div>
        </div>
      )}

      {/* Subtle indicator when debug mode is off */}
      {!debugMode && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 10,
          color: 'rgba(255,255,255,0.18)',
          fontFamily: 'monospace',
          fontSize: 10,
          pointerEvents: 'none',
        }}>
          ` = calibration mode
        </div>
      )}
    </div>
  )
}
