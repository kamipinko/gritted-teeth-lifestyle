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
import { useGLTF, Center } from '@react-three/drei'
import { Suspense, useRef, useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'

// Preload all four models so switching between them is instant
useGLTF.preload('/models/goku.glb')
useGLTF.preload('/models/super_saiyan_goku.glb')
useGLTF.preload('/models/gohan.glb')
useGLTF.preload('/models/muscle_body.glb')

const TARGET_HEIGHT = 4.0

const MODELS = {
  goku: {
    path: '/models/goku.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
  },
  gokuSSJ: {
    path: '/models/super_saiyan_goku.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
  },
  gohan: {
    path: '/models/gohan.glb',
    rotationY: Math.PI,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
  },
  anatomy: {
    path: '/models/muscle_body.glb',
    rotationY: 0,
    scaleMult: 1.0,
    hitboxes: buildStandardHitboxes({ bodyScale: 1.0 }),
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

// ── Camera positions per muscle group ──────────────────────────────
// Closer zoom than before — each pos is tuned to frame the muscle tightly.
const OVERVIEW_CAM = { pos: [0, 0.6, 8], target: [0, 0.6, 0] }
const MUSCLE_CAMERA = {
  chest:      { pos: [0,    1.60,  2.6],  target: [0,    1.60,  0] },
  shoulders:  { pos: [0,    1.85,  3.0],  target: [0,    1.85,  0] },
  biceps:     { pos: [1.5,  1.40,  2.4],  target: [0.3,  1.40,  0] },
  triceps:    { pos: [0,    1.40, -3.2],  target: [0,    1.40,  0] },
  forearms:   { pos: [1.8,  0.50,  2.4],  target: [0.4,  0.50,  0] },
  abs:        { pos: [0,    0.65,  2.6],  target: [0,    0.65,  0] },
  glutes:     { pos: [0,   -0.40, -3.8],  target: [0,   -0.40,  0] },
  quads:      { pos: [0,   -1.05,  2.8],  target: [0,   -1.05,  0] },
  hamstrings: { pos: [0,   -1.05, -3.5],  target: [0,   -1.05,  0] },
  calves:     { pos: [0,   -2.00,  3.0],  target: [0,   -2.00,  0] },
}

// ── World-space center of each muscle group ─────────────────────────
// Used to position the red focus point light on the actual 3D geometry.
const MUSCLE_CENTERS = {
  chest:      [0,     1.60,   0.55],
  shoulders:  [0,     1.85,   0.05],
  biceps:     [0,     1.40,   0.35],
  triceps:    [0,     1.40,  -0.30],
  forearms:   [0,     0.45,   0.15],
  abs:        [0,     0.65,   0.55],
  glutes:     [0,    -0.40,  -0.45],
  quads:      [0,    -1.05,   0.40],
  hamstrings: [0,    -1.05,  -0.40],
  calves:     [0,    -2.55,  -0.30],
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
function CameraRig({ focusGroup }) {
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
// onToggle is handleHitboxClick which already calls handleFocus internally —
// do NOT call onFocus here or it double-fires and cancels the camera animation.
function Hitbox({ group, position, scale, shape = 'sphere', onToggle }) {
  return (
    <mesh
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(group)
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

// ── Focus Light — gold point light at selected muscle centers ────────
// Casts colored light directly onto 3D model geometry. Gold (#ffcc00)
// contrasts sharply against the red/orange Dragon Ball models.
// Focused muscle gets a bright pulsing light; others get a dimmer steady glow.
function FocusLight({ selected, focusedGroup }) {
  const focusedLightRef = useRef()

  useFrame(() => {
    if (!focusedLightRef.current) return
    const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.35
    focusedLightRef.current.intensity = 28 * pulse
  })

  return (
    <>
      {Array.from(selected).map((groupId) => {
        const center = MUSCLE_CENTERS[groupId]
        if (!center) return null
        const isFocused = focusedGroup === groupId
        return (
          <pointLight
            key={groupId}
            ref={isFocused ? focusedLightRef : undefined}
            position={[center[0], center[1], center[2] + 1.2]}
            color="#ffcc00"
            intensity={isFocused ? 28 : 8}
            distance={5.0}
            decay={2}
          />
        )
      })}
    </>
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

function SceneContent({ modelKey, selected, focusedGroup, onToggle, onFocus }) {
  const config = MODELS[modelKey] || MODELS.goku

  return (
    <group>
      {/* Base lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 3, -4]} intensity={0.7} color="#ff6644" />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#ffaa66" />
      <pointLight position={[0, -2, 4]} intensity={0.4} color="#4488ff" />

      {/* Red point lights at selected muscle centers — the actual highlight */}
      <FocusLight selected={selected} focusedGroup={focusedGroup} />

      {/* Background click-to-dismiss plane */}
      <BackgroundPlane onDismiss={() => onFocus(null)} />

      <Suspense fallback={null}>
        <ModelDisplay key={modelKey} modelKey={modelKey} />
      </Suspense>

      {/* Hitboxes — invisible click zones only, no visual shape */}
      {config.hitboxes.map((h, i) => (
        <Hitbox
          key={`${modelKey}-${h.group}-${i}`}
          group={h.group}
          position={h.position}
          scale={h.scale}
          shape={h.shape}
          onToggle={onToggle}
        />
      ))}

      {/* Persona 5 camera rig — drives all camera movement */}
      <CameraRig focusGroup={focusedGroup} />
    </group>
  )
}

export default function MuscleBody({ selected, onToggle, onFocus, focusedGroup, modelKey = 'goku' }) {
  return (
    <Canvas
      camera={{ position: OVERVIEW_CAM.pos, fov: 45 }}
      shadows={false}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <SceneContent
        modelKey={modelKey}
        selected={selected}
        focusedGroup={focusedGroup}
        onToggle={onToggle}
        onFocus={onFocus}
      />
    </Canvas>
  )
}
